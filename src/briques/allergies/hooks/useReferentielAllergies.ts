// src/briques/allergies/hooks/useReferentielAllergies.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";

import type {
  AllergieCategorie,
  AllergieDefinition,
  ModificationAllergieDefinitionInput,
  NouvelleAllergieDefinitionInput,
} from "../modele/allergie.types";
import { allergiesApi } from "../api/allergies.api";

export function useReferentielAllergies() {
  const notif = useNotifier();
  const [definitions, setDefinitions] = useState<AllergieDefinition[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState<AllergieCategorie | "toutes">(
    "toutes",
  );
  const [filtreActif, setFiltreActif] = useState<"tous" | "actifs" | "inactifs">(
    "tous",
  );

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setDefinitions(await allergiesApi.listerDefinitions());
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger le référentiel.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  const creer = useCallback(
    async (input: NouvelleAllergieDefinitionInput): Promise<boolean> => {
      try {
        const creee = await allergiesApi.creerDefinition(input);
        setDefinitions((prev) => [...prev, creee]);
        notif.succes(`Substance « ${creee.libelle} » enregistrée.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la création."));
        return false;
      }
    },
    [notif],
  );

  const modifier = useCallback(
    async (
      id: number,
      input: ModificationAllergieDefinitionInput,
    ): Promise<boolean> => {
      try {
        const maj = await allergiesApi.modifierDefinition(id, input);
        setDefinitions((prev) => prev.map((d) => (d.id === id ? maj : d)));
        notif.succes(`Substance « ${maj.libelle} » mise à jour.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la modification."));
        return false;
      }
    },
    [notif],
  );

  const basculerActivation = useCallback(
    async (def: AllergieDefinition) => {
      try {
        const maj = await allergiesApi.changerActivationDefinition(
          def.id,
          !def.actif,
        );
        setDefinitions((prev) => prev.map((d) => (d.id === def.id ? maj : d)));
        notif.info(
          maj.actif
            ? `« ${maj.libelle} » activée.`
            : `« ${maj.libelle} » désactivée.`,
        );
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec du changement d'activation."));
      }
    },
    [notif],
  );

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return definitions.filter((d) => {
      if (filtreActif === "actifs" && !d.actif) return false;
      if (filtreActif === "inactifs" && d.actif) return false;
      if (filtreCategorie !== "toutes" && d.categorie !== filtreCategorie) return false;
      if (!q) return true;
      return (
        d.code.toLowerCase().includes(q) || d.libelle.toLowerCase().includes(q)
      );
    });
  }, [definitions, recherche, filtreCategorie, filtreActif]);

  return {
    definitions: filtrees,
    definitionsToutes: definitions,
    chargement,
    erreur,
    recherche,
    setRecherche,
    filtreCategorie,
    setFiltreCategorie,
    filtreActif,
    setFiltreActif,
    recharger,
    creer,
    modifier,
    basculerActivation,
  };
}