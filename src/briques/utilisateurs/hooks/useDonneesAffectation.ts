/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { messageErreur } from "@/noyau/utils/erreur";
import { affectationsApi } from "@/briques/affectations/api/affectations.api";
import type {
  AffectationPersonnel,
  OptionServiceSite,
  OptionSite,
} from "@/briques/affectations/modele/affectation.types";

/**
 * Charge sites, services (avec leur domaine) et affectations existantes.
 * Le chargement se déclenche à chaque passage de `actif` à `true`
 * (ouverture du tiroir), pour ne jamais afficher de données périmées.
 */
export function useDonneesAffectation(actif: boolean) {
  const [affectations, setAffectations] = useState<AffectationPersonnel[]>([]);
  const [optionsServices, setOptionsServices] = useState<OptionServiceSite[]>([]);
  const [optionsSites, setOptionsSites] = useState<OptionSite[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const d = await affectationsApi.listerDonnees();
      setAffectations(d.affectations);
      setOptionsServices(d.optionsServices);
      setOptionsSites(d.optionsSites);
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de charger les services et les affectations."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (actif) void recharger();
  }, [actif, recharger]);

  return { affectations, optionsServices, optionsSites, chargement, erreur, recharger };
}