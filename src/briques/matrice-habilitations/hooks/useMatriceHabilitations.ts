/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { catalogueActesApi } from "@/briques/catalogue-actes/api/catalogue-actes.api";
import { diagnosticDefinitionApi } from "@/briques/diagnostic-definitions/api/diagnostic-definition.api";
import { messageErreur } from "@/noyau/utils/erreur";
import type { ActeMedical } from "@/briques/catalogue-actes/modele/catalogue-actes.types";
import type { DiagnosticDefinition } from "@/briques/diagnostic-definitions/modele/diagnostic-definition.types";
import type { HabilitationInput } from "@/noyau/referentiels/habilitations";

export interface CibleRef {
  type: "acte" | "diagnostic";
  id: number;
}

export function useMatriceHabilitations() {
  const [actes, setActes] = useState<ActeMedical[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticDefinition[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [actesData, diagsData] = await Promise.all([
        catalogueActesApi.listerActes(),
        diagnosticDefinitionApi.listerDefinitions(),
      ]);
      setActes(actesData);
      setDiagnostics(diagsData);
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de charger les données d'habilitations."));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  /**
   * Remplace l'ensemble des habilitations d'une cible.
   * - acte → PATCH /acte_definitions/{id}
   * - diagnostic → PATCH /diagnostic_definitions/{id}
   */
  const definirHabilitations = useCallback(
    async (
      cible: CibleRef,
      habilitations: HabilitationInput[],
    ): Promise<boolean> => {
      try {
        if (cible.type === "acte") {
          const acte = await catalogueActesApi.modifierActe(cible.id, { habilitations });
          setActes((prev) => prev.map((a) => (a.id === acte.id ? acte : a)));
        } else {
          const diag = await diagnosticDefinitionApi.modifierDefinition(cible.id, {
            habilitations,
          });
          setDiagnostics((prev) => prev.map((d) => (d.id === diag.id ? diag : d)));
        }
        return true;
      } catch (err) {
        setErreur(messageErreur(err, "Échec de l'enregistrement des habilitations."));
        return false;
      }
    },
    [],
  );

  return { actes, diagnostics, chargement, erreur, recharger, definirHabilitations };
}