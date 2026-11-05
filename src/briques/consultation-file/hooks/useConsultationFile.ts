/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { consultationFileApi } from "../api/consultation-file.api";
import {
  PatientFileMedecin,
  ConsultationEnCours,
  RendezVousDuJourMedecin,
} from "../modele/consultation-file.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

const INTERVALLE_SONDAGE_MS = 15000;

export function useConsultationFile() {
  const [fileAttente, setFileAttente] = useState<PatientFileMedecin[]>([]);
  const [patientEnCours, setPatientEnCours] = useState<ConsultationEnCours | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVousDuJourMedecin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [appelEnCours, setAppelEnCours] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [derniereSync, setDerniereSync] = useState<Date | null>(null);

  const chargerDonnees = useCallback(async () => {
    try {
      setErreur(null);
      const [file, enCours, rdv] = await Promise.all([
        consultationFileApi.obtenirFileAttente().catch(() => []),
        consultationFileApi.obtenirPatientEnCours().catch(() => null),
        consultationFileApi.obtenirRendezVousDuJour().catch(() => []),
      ]);
      setFileAttente(file);
      setPatientEnCours(enCours);
      setRendezVous(rdv);
      setDerniereSync(new Date());
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerDonnees();
    const intervalle = setInterval(chargerDonnees, INTERVALLE_SONDAGE_MS);
    return () => clearInterval(intervalle);
  }, [chargerDonnees]);

  const prendreEnCharge = async (aiguillageId: number, typeEncounterId: number) => {
    setAppelEnCours(aiguillageId);
    try {
      const res = await consultationFileApi.prendreEnCharge(aiguillageId, typeEncounterId);
      await chargerDonnees();
      return res;
    } finally {
      setAppelEnCours(null);
    }
  };

  const appeler = async (aiguillageId: number) => {
    setAppelEnCours(aiguillageId);
    try {
      const res = await consultationFileApi.appelerPatient(aiguillageId);
      await chargerDonnees();
      return res;
    } finally {
      setAppelEnCours(null);
    }
  };

  return {
    fileAttente,
    patientEnCours,
    rendezVous,
    chargement,
    appelEnCours,
    erreur,
    derniereSync,
    prendreEnCharge,
    appeler,
    rafraichir: chargerDonnees,
  };
}