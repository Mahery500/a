// src/briques/allergies/hooks/useAllergiesActives.ts
import { useEffect, useMemo, useState } from "react";
import { allergiesApi } from "../api/allergies.api";
import type { Allergie } from "../modele/allergie.types";

export function useAllergiesActives(patientId: number | null | undefined) {
  const [allergies, setAllergies] = useState<Allergie[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setAllergies([]);
      setChargement(false);
      return;
    }
    let annule = false;
    setChargement(true);
    allergiesApi
      .lister(patientId, true) // actifsUniquement
      .then((liste) => {
        if (!annule) setAllergies(liste);
      })
      .catch(() => {
        if (!annule) setAllergies([]);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [patientId]);

  /** Libellés prêts pour l'affichage ("Pénicilline", "Arachide"…) */
  const libelles = useMemo(
    () =>
      allergies.map(
        (a) =>
          a.allergieDefinitionLibelle ??
          a.principeActifLibelle ??
          `Allergie #${a.id}`,
      ),
    [allergies],
  );

  /** Allergies à criticité élevée — pour le bandeau d'alerte. */
  const critiques = useMemo(
    () => allergies.filter((a) => a.criticalite === "high"),
    [allergies],
  );

  return { allergies, libelles, critiques, chargement };
}