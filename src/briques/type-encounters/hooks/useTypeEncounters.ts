/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import {
  TypeEncounter,
  NouveauTypeEncounterInput,
  ModificationTypeEncounterInput,
} from "../modele/type-encounter.types";
import { typeEncounterApi } from "../api/type-encounter.api";

export type FiltreAffectation = "tous" | "non_affectes";

export function useTypeEncounters() {
  const notif = useNotifier();

  const [types, setTypes] = useState<TypeEncounter[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtreActif, setFiltreActif] = useState<"tous" | "actifs" | "inactifs">("tous");
  const [filtreAffectation, setFiltreAffectation] = useState<FiltreAffectation>("tous");
  const [filtreTypeServiceId, setFiltreTypeServiceId] = useState<number | "tous">("tous");

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const liste = await typeEncounterApi.lister();
      setTypes(liste);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger les types de prise en charge.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const typesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return types.filter((t) => {
      if (filtreActif === "actifs" && !t.actif) return false;
      if (filtreActif === "inactifs" && t.actif) return false;
      if (filtreAffectation === "non_affectes" && t.typeServiceIds.length > 0) return false;
      if (filtreTypeServiceId !== "tous" && !t.typeServiceIds.includes(filtreTypeServiceId)) {
        return false;
      }
      if (q) {
        return (
          t.code.toLowerCase().includes(q) ||
          t.libelle.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [types, recherche, filtreActif, filtreAffectation, filtreTypeServiceId]);

  /** Renvoie le type créé (utile pour enchaîner la sauvegarde des services). */
  const creer = useCallback(
    async (saisie: NouveauTypeEncounterInput): Promise<TypeEncounter | null> => {
      try {
        const cree = await typeEncounterApi.creer(saisie);
        setTypes((prev) =>
          [...prev, cree].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        notif.succes(`Type « ${cree.libelle} » créé.`);
        return cree;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la création du type de prise en charge."));
        return null;
      }
    },
    [notif],
  );

  const modifier = useCallback(
    async (id: number, saisie: ModificationTypeEncounterInput): Promise<boolean> => {
      try {
        const maj = await typeEncounterApi.modifier(id, saisie);
        setTypes((prev) =>
          prev
            .map((t) => (t.id === id ? maj : t))
            .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        notif.succes(`Type « ${maj.libelle} » mis à jour.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la mise à jour."));
        return false;
      }
    },
    [notif],
  );

  const basculerActivation = useCallback(
    async (type: TypeEncounter): Promise<boolean> => {
      const cible = !type.actif;
      try {
        const maj = await typeEncounterApi.changerActivation(type.id, cible);
        setTypes((prev) => prev.map((t) => (t.id === type.id ? maj : t)));
        notif.info(
          cible ? `Type « ${maj.libelle} » activé.` : `Type « ${maj.libelle} » désactivé.`,
        );
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Impossible de changer le statut."));
        return false;
      }
    },
    [notif],
  );

  const definirTypesService = useCallback(
    async (id: number, typeServiceIds: number[]): Promise<boolean> => {
      try {
        const maj = await typeEncounterApi.definirTypesService(id, typeServiceIds);
        setTypes((prev) => prev.map((t) => (t.id === id ? maj : t)));
        notif.succes(
          typeServiceIds.length === 0
            ? `« ${maj.libelle} » n'est plus autorisé dans aucun type de service.`
            : `« ${maj.libelle} » : ${typeServiceIds.length} type(s) de service autorisé(s).`,
        );
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l'affectation des types de service."));
        return false;
      }
    },
    [notif],
  );

  const stats = useMemo(() => {
    const total = types.length;
    const actifs = types.filter((t) => t.actif).length;
    const avecAffectation = types.filter((t) => t.typeServiceIds.length > 0).length;
    return {
      total,
      actifs,
      inactifs: total - actifs,
      avecAffectation,
      sansAffectation: total - avecAffectation,
    };
  }, [types]);

  return {
    types: typesFiltres,
    typesTous: types,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    filtreActif,
    setFiltreActif,
    filtreAffectation,
    setFiltreAffectation,
    filtreTypeServiceId,
    setFiltreTypeServiceId,
    recharger,
    creer,
    modifier,
    basculerActivation,
    definirTypesService,
  };
}