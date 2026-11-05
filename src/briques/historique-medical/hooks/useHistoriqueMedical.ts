/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { historiqueMedicalApi } from "../api/historique-medical.api";
import type { HistoriqueMedicalPatientApiOutput } from "../api/historique-medical.contrats";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useHistoriqueMedical(patientId?: number | null, limit = 10) {
  const [page, setPage] = useState(1);
  const [donnees, setDonnees] = useState<HistoriqueMedicalPatientApiOutput | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Nouveau patient : on repart de la page 1.
  useEffect(() => {
    setPage(1);
  }, [patientId]);

  useEffect(() => {
    if (!patientId) {
      setDonnees(null);
      return;
    }

    let annule = false;
    setChargement(true);
    setErreur(null);

    historiqueMedicalApi
      .recuperer(patientId, page, limit)
      .then((res) => {
        if (!annule) setDonnees(res);
      })
      .catch((err) => {
        if (!annule) setErreur(extraireMessageErreur(err));
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [patientId, page, limit, version]);

  const totalPages = donnees ? Math.max(1, Math.ceil(donnees.total / donnees.limit)) : 1;

  const rafraichir = useCallback(() => setVersion((v) => v + 1), []);

  return {
    donnees,
    chargement,
    erreur,
    page,
    totalPages,
    pagePrecedente: () => setPage((p) => Math.max(1, p - 1)),
    pageSuivante: () => setPage((p) => Math.min(totalPages, p + 1)),
    rafraichir,
  };
}