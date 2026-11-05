/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import {
  PatientFiche,
  CompleterFicheInput,
  RattacherAgentInput,
  EntrepriseOption,
} from "../modele/patient.types";
import { patientsApi } from "../api/patients.api";

export function usePatients() {
  const notif = useNotifier();

  const [patients, setPatients] = useState<PatientFiche[]>([]);
  const [entreprises, setEntreprises] = useState<EntrepriseOption[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres
  const [recherche, setRecherche] = useState<string>("");
  const [filtreEntrepriseId, setFiltreEntrepriseId] = useState<number | "tous">("tous");
  const [filtreAffiliation, setFiltreAffiliation] = useState<
    "tous" | "agents" | "ayantsDroit" | "simples"
  >("tous");

  // Chargement des entreprises (référentiel). L'erreur n'est plus avalée en silence.
  const chargerEntreprises = useCallback(async () => {
    try {
      const liste = await patientsApi.listerEntreprises();
      setEntreprises(liste);
    } catch (err) {
      console.error("Chargement des entreprises impossible :", err);
      notif.erreur(messageErreur(err, "Impossible de charger la liste des entreprises."));
    }
  }, [notif]);

  useEffect(() => {
    chargerEntreprises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chargerPatients = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const entrepriseParam = filtreEntrepriseId !== "tous" ? filtreEntrepriseId : undefined;
      const liste = await patientsApi.lister(recherche.trim() || undefined, entrepriseParam);
      setPatients(liste);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger les dossiers patients.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [recherche, filtreEntrepriseId, notif]);

  // Chargement déclenché lors du changement de filtre ou au montage
  useEffect(() => {
    const minuterie = setTimeout(() => {
      chargerPatients();
    }, 300);
    return () => clearTimeout(minuterie);
  }, [chargerPatients]);

  // Bouton « Rafraîchir » : recharge aussi les entreprises (nouvelle entreprise créée entre-temps)
  const recharger = useCallback(async () => {
    await Promise.all([chargerEntreprises(), chargerPatients()]);
  }, [chargerEntreprises, chargerPatients]);

  // Filtrage d'affiliation et entreprise en mémoire
  const patientsFiltres = useMemo(() => {
    return patients.filter((p) => {
      if (filtreEntrepriseId !== "tous" && p.idEntreprise !== filtreEntrepriseId) return false;
      if (filtreAffiliation === "agents" && p.statut !== "Agent") return false;
      if (filtreAffiliation === "ayantsDroit" && (!p.statut || p.statut === "Agent")) return false;
      if (filtreAffiliation === "simples" && p.statut) return false;
      return true;
    });
  }, [patients, filtreEntrepriseId, filtreAffiliation]);

  const completerFiche = useCallback(
    async (id: string, saisie: CompleterFicheInput): Promise<boolean> => {
      try {
        const patientMisAJour = await patientsApi.completerFiche(id, saisie);
        setPatients((prev) => prev.map((p) => (p.id === id ? patientMisAJour : p)));
        notif.succes(`Fiche de ${patientMisAJour.prenom} ${patientMisAJour.nom} complétée.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la complétion de la fiche patient."));
        return false;
      }
    },
    [notif],
  );

  const importerExcel = useCallback(
    async (fichier: File, idEntreprise: number): Promise<boolean> => {
      try {
        const resultat = await patientsApi.importerExcel(fichier, idEntreprise);
        notif.succes(resultat.message);
        await chargerPatients();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l'importation du fichier Excel."));
        return false;
      }
    },
    [notif, chargerPatients],
  );

  const rattacherAgent = useCallback(
    async (saisie: RattacherAgentInput): Promise<boolean> => {
      try {
        await patientsApi.rattacherAgent(saisie);
        notif.succes("Statut salarié attribué avec succès.");
        await chargerPatients();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l'attribution du statut salarié."));
        return false;
      }
    },
    [notif, chargerPatients],
  );

  const stats = useMemo(() => {
    const total = patients.length;
    const agents = patients.filter((p) => p.statut === "Agent").length;
    const ayantsDroit = patients.filter((p) => p.statut && p.statut !== "Agent").length;
    const simples = total - agents - ayantsDroit;
    return { total, agents, ayantsDroit, simples };
  }, [patients]);

  return {
    patients: patientsFiltres,
    patientsTous: patients,
    entreprises,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    filtreEntrepriseId,
    setFiltreEntrepriseId,
    filtreAffiliation,
    setFiltreAffiliation,
    recharger,
    completerFiche,
    importerExcel,
    rattacherAgent,
  };
}
