/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { infirmerieHistoriqueApi } from "../api/infirmerie-historique.api";
import { ActeHistorique, FiltresHistorique } from "../modele/infirmerie-historique.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useInfirmerieHistorique(filtresInitiaux: FiltresHistorique = {}) {
  const [items, setItems] = useState<ActeHistorique[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtres, setFiltres] = useState<FiltresHistorique>(filtresInitiaux);

  const chargerPage = useCallback(
    async (numPage: number, filtresAppliques: FiltresHistorique, accumuler = false) => {
      setChargement(true);
      setErreur(null);
      try {
        const res = await infirmerieHistoriqueApi.listerHistorique(filtresAppliques, numPage, 20);
        if (accumuler) {
          setItems((prev) => [...prev, ...res]);
        } else {
          setItems(res);
        }
        setHasMore(res.length === 20);
        setPage(numPage);
      } catch (err) {
        setErreur(extraireMessageErreur(err));
      } finally {
        setChargement(false);
      }
    },
    [],
  );

  useEffect(() => {
    chargerPage(1, filtres, false);
  }, [filtres, chargerPage]);

  const appliquerFiltres = (nouveauxFiltres: FiltresHistorique) => {
    setFiltres(nouveauxFiltres);
  };

  const chargerPlus = () => {
    if (!chargement && hasMore) {
      chargerPage(page + 1, filtres, true);
    }
  };

  return {
    items,
    chargement,
    hasMore,
    erreur,
    filtres,
    appliquerFiltres,
    chargerPlus,
    rafraichir: () => chargerPage(1, filtres, false),
  };
}
