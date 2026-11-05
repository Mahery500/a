/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { stockAjustementsApi } from "../api/stock-ajustements.api";
import {
  MotifAjustement,
  LigneInventaireStock,
  RegularisationStockInput,
} from "../modele/stock-ajustements.types";
import { messageErreur } from "@/noyau/utils";

export function useStockAjustements() {
  const [lignesInventaire, setLignesInventaire] = useState<LigneInventaireStock[]>([]);
  const [motifs, setMotifs] = useState<MotifAjustement[]>([]);
  const [typesMouvement, setTypesMouvement] = useState<
    { id: number; libelle: string; sens: number }[]
  >([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [lignes, mList, types] = await Promise.all([
        stockAjustementsApi.listerLignesInventaire(),
        stockAjustementsApi.listerMotifs(),
        stockAjustementsApi.listerTypesMouvement(),
      ]);
      setLignesInventaire(lignes);
      setMotifs(mList);
      setTypesMouvement(types);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const creerMotif = async (libelle: string) => {
    try {
      const nouveau = await stockAjustementsApi.creerMotif({ libelle });
      setMotifs((prev) => [...prev, nouveau]);
      return nouveau;
    } catch (e) {
      throw new Error(messageErreur(e));
    }
  };

  const supprimerMotif = async (id: number) => {
    try {
      await stockAjustementsApi.supprimerMotif(id);
      setMotifs((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      throw new Error(messageErreur(e));
    }
  };

  const regulariser = async (input: RegularisationStockInput) => {
    try {
      await stockAjustementsApi.regulariserStock(input);
      await charger();
    } catch (e) {
      throw new Error(messageErreur(e));
    }
  };

  return {
    lignesInventaire,
    motifs,
    typesMouvement,
    chargement,
    erreur,
    actualiser: charger,
    creerMotif,
    supprimerMotif,
    regulariser,
  };
}
