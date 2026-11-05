/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { habilitationsApi } from "./habilitations.api";
import type { CorpsMedicalOption, SpecialiteOption } from "./habilitations.types";

// Cache module : les listes changent très rarement, et les deux formulaires
// (actes + diagnostics) les demandent tous les deux. On évite deux fetches
// identiques quand l'admin navigue entre les onglets.
let cache: Promise<{ corpsMedicaux: CorpsMedicalOption[]; specialites: SpecialiteOption[] }> | null =
  null;

function charger(): Promise<{ corpsMedicaux: CorpsMedicalOption[]; specialites: SpecialiteOption[] }> {
  if (!cache) {
    cache = Promise.all([
      habilitationsApi.listerCorpsMedicaux(),
      habilitationsApi.listerSpecialites(),
    ])
      .then(([corpsMedicaux, specialites]) => ({ corpsMedicaux, specialites }))
      .catch((err) => {
        cache = null; // permet un retry au prochain appel
        throw err;
      });
  }
  return cache;
}

export function invaliderCacheHabilitations(): void {
  cache = null;
}

export function useReferentielsHabilitations() {
  const [corpsMedicaux, setCorpsMedicaux] = useState<CorpsMedicalOption[]>([]);
  const [specialites, setSpecialites] = useState<SpecialiteOption[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    charger()
      .then(({ corpsMedicaux, specialites }) => {
        if (!actif) return;
        setCorpsMedicaux(corpsMedicaux);
        setSpecialites(specialites);
        setErreur(null);
      })
      .catch(() => {
        if (!actif) return;
        setErreur("Impossible de charger les référentiels corps médicaux / spécialités.");
      })
      .finally(() => {
        if (actif) setChargement(false);
      });
    return () => {
      actif = false;
    };
  }, []);

  return { corpsMedicaux, specialites, chargement, erreur };
}