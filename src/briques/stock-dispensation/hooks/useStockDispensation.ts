/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { stockDispensationApi } from "../api/stock-dispensation.api";
import {
  PatientOptionDispensation,
  ProduitOptionDispensation,
  DispensationInput,
} from "../modele/stock-dispensation.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useStockDispensation(siteIdActif?: number | null) {
  const [patients, setPatients] = useState<PatientOptionDispensation[]>([]);
  const [produits, setProduits] = useState<ProduitOptionDispensation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [dispensationEnCours, setDispensationEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerDonnees = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [pats, prods] = await Promise.all([
        stockDispensationApi.listerPatients(),
        stockDispensationApi.listerProduitsDisponibles(siteIdActif),
      ]);
      setPatients(pats);
      setProduits(prods);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [siteIdActif]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const dispenser = async (input: Omit<DispensationInput, "siteId"> & { siteId?: number }) => {
    const targetSiteId = input.siteId || siteIdActif;
    if (!targetSiteId) {
      throw new Error("Veuillez sélectionner un site de stockage actif.");
    }
    setDispensationEnCours(true);
    setErreur(null);
    try {
      const res = await stockDispensationApi.enregistrerDispensation({
        ...input,
        siteId: targetSiteId,
      });
      await chargerDonnees();
      return res;
    } catch (err) {
      setErreur(extraireMessageErreur(err));
      throw err;
    } finally {
      setDispensationEnCours(false);
    }
  };

  return {
    patients,
    produits,
    chargement,
    dispensationEnCours,
    erreur,
    dispenser,
    rafraichir: chargerDonnees,
  };
}
