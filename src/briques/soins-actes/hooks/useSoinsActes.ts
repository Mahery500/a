/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { soinsActesApi } from "../api/soins-actes.api";
import {
  ActeSaisiItem,
  ActeDemandeItem,
  DefinitionActeCatalogue,
  StatutActe,
} from "../modele/soin-acte.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useSoinsActes(encounterId?: number | null, patientId?: number | null) {
  const [actesSaisis, setActesSaisis] = useState<ActeSaisiItem[]>([]);
  const [actesDemandes, setActesDemandes] = useState<ActeDemandeItem[]>([]);
  const [catalogueRealisable, setCatalogueRealisable] = useState<DefinitionActeCatalogue[]>([]);
  const [chargement, setChargement] = useState(false);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerDonnees = useCallback(async () => {
    if (!encounterId) {
      setActesSaisis([]);
      setActesDemandes([]);
      setCatalogueRealisable([]);
      return;
    }

    setChargement(true);
    setErreur(null);
    try {
      const [saisis, demandes, catalogue] = await Promise.all([
        soinsActesApi.listerActesEncounter(encounterId),
        soinsActesApi.listerActesAFaire(patientId || undefined),
        soinsActesApi.listerCatalogueRealisable(encounterId),
      ]);

      setActesSaisis(saisis);
      setActesDemandes(demandes);
      setCatalogueRealisable(catalogue);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [encounterId, patientId]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const saisirActeLibre = async (
    acteDefinitionId: number,
    statut: StatutActe,
    commentaire?: string,
  ) => {
    if (!encounterId) throw new Error("Aucun dossier de soin actif.");
    setActionEnCours(true);
    try {
      const res = await soinsActesApi.saisirActe({
        encounterId,
        acteDefinitionId,
        statut,
        commentaire: commentaire || null,
      });
      await chargerDonnees();
      return res;
    } finally {
      setActionEnCours(false);
    }
  };

  const executerActeDemande = async (
    ligneDemande: ActeDemandeItem,
    statut: StatutActe,
    commentaire?: string,
  ) => {
    if (!encounterId) throw new Error("Aucun dossier de soin actif.");
    setActionEnCours(true);
    try {
      const res = await soinsActesApi.saisirActe({
        encounterId,
        acteDefinitionId: ligneDemande.acteDefinitionId,
        ligneDemandeId: ligneDemande.id,
        statut,
        commentaire: commentaire || null,
      });
      await chargerDonnees();
      return res;
    } finally {
      setActionEnCours(false);
    }
  };

  const changerStatut = async (acteId: number, statut: StatutActe) => {
    setActionEnCours(true);
    try {
      const res = await soinsActesApi.changerStatut(acteId, statut);
      await chargerDonnees();
      return res;
    } finally {
      setActionEnCours(false);
    }
  };

  const ajouterObservation = async (
    acteId: number,
    obs: { observationDefinitionId: number; valeur: string; interpretation?: string | null },
  ) => {
    setActionEnCours(true);
    try {
      const res = await soinsActesApi.ajouterObservation(acteId, obs);
      await chargerDonnees();
      return res;
    } finally {
      setActionEnCours(false);
    }
  };

  const ajouterResultat = async (
    acteId: number,
    resInput: {
      type: string;
      conclusion?: string | null;
      resultat?: string;
      interpretation?: string | null;
    },
  ) => {
    setActionEnCours(true);
    try {
      const payload = {
        type: resInput.type,
        conclusion: resInput.conclusion ?? resInput.resultat ?? null,
        interpretation: resInput.interpretation ?? null,
      };
      const res = await soinsActesApi.ajouterResultat(acteId, payload);
      await chargerDonnees();
      return res;
    } finally {
      setActionEnCours(false);
    }
  };

  const terminerPriseEnCharge = async (forcer = false) => {
    if (!encounterId) throw new Error("Aucun dossier actif.");
    setActionEnCours(true);
    try {
      return await soinsActesApi.terminerEncounter(encounterId, forcer);
    } finally {
      setActionEnCours(false);
    }
  };
  const orienterPatient = async (serviceId: number) => {
    if (!encounterId) throw new Error("Aucun dossier actif.");
    setActionEnCours(true);
    try {
      await soinsActesApi.orienterPatient(encounterId, serviceId);
      await chargerDonnees();
    } finally {
      setActionEnCours(false);
    }
  };

  // ... et dans le return :

  return {
    actesSaisis,
    actesDemandes,
    catalogueRealisable,
    chargement,
    actionEnCours,
    erreur,
    saisirActeLibre,
    executerActeDemande,
    changerStatut,
    ajouterObservation,
    ajouterResultat,
    terminerPriseEnCharge,
    orienterPatient,
    rafraichir: chargerDonnees,
  };
}
