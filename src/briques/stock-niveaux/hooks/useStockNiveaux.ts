/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { stockNiveauxApi } from "../api/stock-niveaux.api";
import { LigneNiveauStock, SiteStock } from "../modele/stock-niveaux.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useStockNiveaux(siteIdFiltre?: number | null) {
  const [stocks, setStocks] = useState<LigneNiveauStock[]>([]);
  const [sites, setSites] = useState<SiteStock[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerStocks = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [niveaux, sitesList] = await Promise.all([
        stockNiveauxApi.listerNiveauxStock(),
        stockNiveauxApi.listerSitesStock().catch(() => []),
      ]);
      setStocks(niveaux);
      setSites(sitesList);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerStocks();
  }, [chargerStocks]);

  const stocksFiltresParSite = siteIdFiltre
    ? stocks.filter((s) => s.siteId === siteIdFiltre)
    : stocks;

  const nbRuptures = stocksFiltresParSite.filter((s) => s.statut === "rupture").length;
  const nbCritiques = stocksFiltresParSite.filter((s) => s.statut === "critique").length;
  const quantiteTotale = stocksFiltresParSite.reduce((acc, curr) => acc + curr.quantite, 0);

  return {
    stocks: stocksFiltresParSite,
    sites,
    nbRuptures,
    nbCritiques,
    quantiteTotale,
    chargement,
    erreur,
    rafraichir: chargerStocks,
  };
}
