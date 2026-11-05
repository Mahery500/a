/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from "react";
import { catalogueActesApi } from "@/briques/catalogue-actes/api/catalogue-actes.api";
import { diagnosticDefinitionApi } from "@/briques/diagnostic-definitions/api/diagnostic-definition.api";
import type { ActeMedical } from "@/briques/catalogue-actes/modele/catalogue-actes.types";
import type { DiagnosticDefinition } from "@/briques/diagnostic-definitions/modele/diagnostic-definition.types";

/**
 * Renvoie, pour chaque corps médical et chaque spécialité,
 * le nombre d'actes + diagnostics qui les référencent dans leurs habilitations actives.
 *
 * Un acte qui référence 2 fois « MEDECIN » (cardio + généraliste) compte pour 1.
 * C'est la même convention que la colonne « Utilisation » des maquettes
 * (« 12 habilitations » pour MEDECIN).
 */
export function useUtilisationHabilitations() {
  const [actes, setActes] = useState<ActeMedical[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticDefinition[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let annule = false;
    Promise.all([
      catalogueActesApi.listerActes().catch(() => [] as ActeMedical[]),
      diagnosticDefinitionApi.listerDefinitions().catch(() => [] as DiagnosticDefinition[]),
    ]).then(([a, d]) => {
      if (annule) return;
      setActes(a);
      setDiagnostics(d);
      setChargement(false);
    });
    return () => {
      annule = true;
    };
  }, []);

  const { usageCorps, usageSpecialite } = useMemo(() => {
    const usageCorps = new Map<string, number>();
    const usageSpecialite = new Map<string, number>();

    [...actes, ...diagnostics].forEach((x) => {
      const codesCorps = new Set<string>();
      const codesSpec = new Set<string>();
      (x.habilitations ?? []).forEach((h) => {
        if (h.actif === false) return;
        if (h.corpsMedicalCode) codesCorps.add(h.corpsMedicalCode);
        if (h.specialiteCode) codesSpec.add(h.specialiteCode);
      });
      codesCorps.forEach((c) => usageCorps.set(c, (usageCorps.get(c) ?? 0) + 1));
      codesSpec.forEach((c) => usageSpecialite.set(c, (usageSpecialite.get(c) ?? 0) + 1));
    });

    return { usageCorps, usageSpecialite };
  }, [actes, diagnostics]);

  return { usageCorps, usageSpecialite, chargement };
}