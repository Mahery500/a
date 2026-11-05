/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { infirmerieFileApi } from "../api/infirmerie-file.api";
import {
  PatientFileAttente,
  PatientEnCours,
  RendezVousDuJour,
  ActeAFaire,
  PriseEnChargeResultat,
} from "../modele/infirmerie-file.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useInfirmerieFile() {
  const [fileAttente, setFileAttente] = useState<PatientFileAttente[]>([]);
  const [patientEnCours, setPatientEnCours] = useState<PatientEnCours | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVousDuJour[]>([]);
  const [actesAFaire, setActesAFaire] = useState<ActeAFaire[]>([]);
  const [actesUrgents, setActesUrgents] = useState<ActeAFaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<number | null>(null);
  const [derniereSync, setDerniereSync] = useState<Date | null>(null);

  const chargerDonnees = useCallback(async () => {
    try {
      setErreur(null);
      // undefined = échec réseau (on ne touche à rien) ; null = réponse valide "aucun patient"
      const [file, enCoursResult, rdv, aFaire, urgents] = await Promise.all([
        infirmerieFileApi.obtenirFileAttente().catch(() => []),
        infirmerieFileApi.obtenirPatientEnCours().catch(() => undefined),
        infirmerieFileApi.obtenirRendezVousDuJour().catch(() => []),
        infirmerieFileApi.obtenirActesAFaire().catch(() => []),
        infirmerieFileApi.obtenirActesAFaire(true).catch(() => []),
      ]);

      setFileAttente(file);

      if (enCoursResult === undefined) {
        // Échec réseau : on garde l'état courant, on ne fait pas de bêtise.
      } else if (enCoursResult?.enCours && enCoursResult.patientId && enCoursResult.encounterId) {
        setPatientEnCours(enCoursResult);
      } else {
        // Le serveur dit explicitement : pas de patient en cours → on écrase.
        setPatientEnCours(null);
      }

      setRendezVous(rdv);
      setActesAFaire(aFaire);
      setActesUrgents(urgents);
      setDerniereSync(new Date());
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
    const intervalle = setInterval(chargerDonnees, 15000);
    return () => clearInterval(intervalle);
  }, [chargerDonnees]);

  /**
   * Prend en charge un patient depuis la file d'attente du service.
   * Le type de prise en charge est choisi dans le tiroir avant l'appel.
   */
  const prendreEnCharge = async (
    aiguillageId: number,
    typeEncounterId: number,
  ): Promise<PriseEnChargeResultat> => {
    setActionEnCours(aiguillageId);
    try {
      const patientTrouve = fileAttente.find((f) => f.aiguillageId === aiguillageId);

      const res = await infirmerieFileApi.prendreEnCharge(aiguillageId, typeEncounterId);

      const patientImmediat: PatientEnCours = {
        enCours: true,
        aiguillageId: res.aiguillageId,
        encounterId: res.encounterId,
        ticketId: res.ticketId,
        numTicket: res.numTicket,
        patientId: res.patientId,
        patientNom: patientTrouve?.patientNom || `Patient #${res.patientId}`,
        debut: new Date().toISOString(),
        dureeMinutes: 0,
      };

      setPatientEnCours(patientImmediat);
      setFileAttente((prev) => prev.filter((f) => f.aiguillageId !== aiguillageId));

      await chargerDonnees();
      return res;
    } finally {
      setActionEnCours(null);
    }
  };

  const libererPatientEnCours = useCallback(() => {
    setPatientEnCours(null);
    try {
      localStorage.removeItem("asina_infirmerie_patient_actif");
    } catch {
      // ignore
    }
  }, []);

  const rdvArrives = rendezVous.filter(
    (r) => r.etat === "ARRIVE" || r.etat === "EN_ATTENTE" || r.etat === "EN_COURS",
  ).length;

  const prochainPatient = fileAttente.length > 0 ? fileAttente[0] : null;

  const appeler = useCallback(
    async (aiguillageId: number) => {
      setActionEnCours(aiguillageId);
      try {
        const res = await infirmerieFileApi.appelerPatient(aiguillageId);
        await chargerDonnees();
        return res;
      } finally {
        setActionEnCours(null);
      }
    },
    [chargerDonnees],
  );

  return {
    fileAttente,
    patientEnCours,
    prochainPatient,
    rendezVous,
    rdvArrives,
    actesAFaire,
    actesUrgents,
    chargement,
    erreur,
    actionEnCours,
    derniereSync,
    prendreEnCharge,
    libererPatientEnCours,
    rafraichir: chargerDonnees,
    appeler,
  };
}