/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { constatApi } from "../api/constat.api";
import type {
  ConstatEnregistre,
  DefinitionConstat,
  NouveauConstatInput,
} from "../modele/constat.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useConstats(encounterId: number | null | undefined) {
  const [constats, setConstats] = useState<ConstatEnregistre[]>([]);
  const [definitions, setDefinitions] = useState<DefinitionConstat[]>([]);
  const [chargement, setChargement] = useState(false);
  const [chargementDefs, setChargementDefs] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [inclureInactifs, setInclureInactifs] = useState(false);

  const chargerConstats = useCallback(async () => {
    if (!encounterId) {
      setConstats([]);
      return;
    }
    setChargement(true);
    setErreur(null);
    try {
      const liste = await constatApi.lister(encounterId, !inclureInactifs);
      setConstats(liste);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [encounterId, inclureInactifs]);

  const chargerDefinitions = useCallback(async () => {
    setChargementDefs(true);
    try {
      setDefinitions(await constatApi.listerDefinitionsConstats());
    } catch (err) {
      // Non bloquant : la liste des constats déjà saisis reste utilisable
      console.error("Chargement des définitions de constats impossible :", err);
    } finally {
      setChargementDefs(false);
    }
  }, []);

  useEffect(() => {
    void chargerConstats();
  }, [chargerConstats]);

  useEffect(() => {
    void chargerDefinitions();
  }, [chargerDefinitions]);

  const ajouter = useCallback(
    async (input: NouveauConstatInput): Promise<ConstatEnregistre> => {
      if (!encounterId) throw new Error("Aucune prise en charge active.");
      setEnregistrement(true);
      setErreur(null);
      try {
        const constat = await constatApi.creer(encounterId, input);
        await chargerConstats();
        return constat;
      } catch (err) {
        setErreur(extraireMessageErreur(err));
        throw err;
      } finally {
        setEnregistrement(false);
      }
    },
    [encounterId, chargerConstats],
  );

  return {
    constats,
    definitions,
    chargement,
    chargementDefs,
    enregistrement,
    erreur,
    inclureInactifs,
    setInclureInactifs,
    ajouter,
    rafraichir: chargerConstats,
    rafraichirDefinitions: chargerDefinitions,
  };
}