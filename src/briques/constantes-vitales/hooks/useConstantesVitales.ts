/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { constantesVitalesApi } from "../api/constante-vitale.api";
import {
  ActeConstanteOption,
  ChampObservationMoule,
  MesureObservation,
  AlerteVigilance,
  evaluerAlertesCliniques,
} from "../modele/constante-vitale.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useConstantesVitales(encounterId?: number | null) {
  // Liste des actes de constantes (catégorie 3)
  const [actesConstantes, setActesConstantes] = useState<ActeConstanteOption[]>([]);
  const [acteSelectionneId, setActeSelectionneId] = useState<number | null>(null);

  // Moule des observations de l'acte sélectionné
  const [mouleObservations, setMouleObservations] = useState<ChampObservationMoule[]>([]);
  const [chargementMoule, setChargementMoule] = useState(false);

  // Valeurs saisies par champ d'observation (observationDefinitionId -> valeur)
  const [valeursSaisies, setValeursSaisies] = useState<Record<number, string>>({});
  const [interpretationsSaisies, setInterpretationsSaisies] = useState<Record<number, string>>({});

  // Historique des observations déjà enregistrées pour cet encounter
  const [observationsHistorique, setObservationsHistorique] = useState<MesureObservation[]>([]);

  const [chargement, setChargement] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // 1. Charger les actes de constantes et les observations existantes de l'encounter
  const chargerActesEtHistorique = useCallback(async () => {
    if (!encounterId) {
      setActesConstantes([]);
      setObservationsHistorique([]);
      setActeSelectionneId(null);
      return;
    }

    setChargement(true);
    setErreur(null);
    try {
      const [actes, obsHistorique] = await Promise.all([
        constantesVitalesApi.listerActesConstantes(encounterId),
        constantesVitalesApi.listerObservationsEncounter(encounterId),
      ]);

      setActesConstantes(actes);
      setObservationsHistorique(obsHistorique);

      // Présélectionner le premier acte si aucun n'est sélectionné
      if (actes.length > 0) {
        setActeSelectionneId((prev) =>
          prev && actes.some((a) => a.id === prev) ? prev : actes[0].id,
        );
      } else {
        setActeSelectionneId(null);
      }
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [encounterId]);

  useEffect(() => {
    chargerActesEtHistorique();
  }, [chargerActesEtHistorique]);

  // 2. Charger le moule des observations dès qu'un acte est sélectionné
  useEffect(() => {
    if (!acteSelectionneId) {
      setMouleObservations([]);
      return;
    }

    let actif = true;
    const chargerMoule = async () => {
      setChargementMoule(true);
      try {
        const champs = await constantesVitalesApi.obtenirObservationsMoule(acteSelectionneId);
        if (actif) {
          setMouleObservations(champs);
          // Réinitialiser la saisie pour le nouvel acte
          setValeursSaisies({});
          setInterpretationsSaisies({});
        }
      } catch (err) {
        if (actif) {
          setErreur(extraireMessageErreur(err));
        }
      } finally {
        if (actif) {
          setChargementMoule(false);
        }
      }
    };

    chargerMoule();
    return () => {
      actif = false;
    };
  }, [acteSelectionneId]);

  const setValeurObservation = useCallback((observationId: number, valeur: string) => {
    setValeursSaisies((prev) => ({
      ...prev,
      [observationId]: valeur,
    }));
  }, []);

  const setInterpretationObservation = useCallback(
    (observationId: number, interpretation: string) => {
      setInterpretationsSaisies((prev) => ({
        ...prev,
        [observationId]: interpretation,
      }));
    },
    [],
  );

  const reinitialiserSaisie = useCallback(() => {
    setValeursSaisies({});
    setInterpretationsSaisies({});
  }, []);

  // 3. Soumettre les observations renseignées (permet les prises partielles)
  const soumettre = async (marquerRealise = true) => {
    if (!encounterId) {
      throw new Error("Aucun dossier de soin actif pour ce patient.");
    }
    if (!acteSelectionneId) {
      throw new Error("Veuillez sélectionner un acte de constantes.");
    }

    // Récupérer uniquement les observations ayant une valeur non vide
    const observationsAEnvoyer = Object.entries(valeursSaisies)
      .filter(([, val]) => val !== undefined && val !== null && String(val).trim() !== "")
      .map(([obsIdStr, val]) => ({
        observationDefinitionId: Number(obsIdStr),
        valeur: String(val).trim(),
        interpretation: interpretationsSaisies[Number(obsIdStr)]?.trim() || undefined,
      }));

    if (observationsAEnvoyer.length === 0) {
      throw new Error("Veuillez renseigner au moins une valeur de constante vitale.");
    }

    setSauvegardeEnCours(true);
    setErreur(null);
    try {
      const ajouts = await constantesVitalesApi.enregistrerConstantes({
        encounterId,
        acteDefinitionId: acteSelectionneId,
        observations: observationsAEnvoyer,
        marquerRealise,
      });

      // Rafraîchir l'historique des observations
      const majHistorique = await constantesVitalesApi.listerObservationsEncounter(encounterId);
      setObservationsHistorique(majHistorique);

      // Vider les champs saisis avec succès
      reinitialiserSaisie();

      return ajouts;
    } catch (err) {
      const msg = extraireMessageErreur(err);
      setErreur(msg);
      throw err;
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  // Calcul des alertes cliniques sur les valeurs saisies ou historiques
  const alertesActives = useMemo(() => {
    // Extraire les valeurs pour TA, Temp, FC, SpO2
    const trouverValeur = (codePartiel: string): string | undefined => {
      // 1. Chercher dans les valeurs en cours de saisie
      const champ = mouleObservations.find((c) => c.code.toUpperCase().includes(codePartiel));
      if (champ && valeursSaisies[champ.observationId]) {
        return valeursSaisies[champ.observationId];
      }
      // 2. Sinon chercher dans la dernière valeur historique
      const obsH = observationsHistorique
        .slice()
        .reverse()
        .find((o) => o.code.toUpperCase().includes(codePartiel));
      return obsH?.valeur;
    };

    return evaluerAlertesCliniques({
      ta: trouverValeur("TA"),
      temp: trouverValeur("TEMP"),
      fc: trouverValeur("FC") || trouverValeur("POULS"),
      spo2: trouverValeur("SPO2") || trouverValeur("SAT"),
    });
  }, [valeursSaisies, mouleObservations, observationsHistorique]);

  return {
    actesConstantes,
    acteSelectionneId,
    setActeSelectionneId,
    mouleObservations,
    chargementMoule,
    valeursSaisies,
    interpretationsSaisies,
    setValeurObservation,
    setInterpretationObservation,
    observationsHistorique,
    chargement,
    sauvegardeEnCours,
    erreur,
    soumettre,
    reinitialiserSaisie,
    alertesActives,
    rafraichir: chargerActesEtHistorique,
  };
}
