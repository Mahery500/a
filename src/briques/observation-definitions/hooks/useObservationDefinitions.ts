/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import {
  abonnerCodeSystemsChanges,
  notifierCodeSystemsChanges,
} from "@/noyau/referentiels/codeSystemsEvents";
import { useCategoriesObservations } from "@/briques/categorie-observations";
import {
  ObservationDefinition,
  UniteMesure,
  CodeSysteme,
  NouvelleObservationDefinitionInput,
  ModificationObservationDefinitionInput,
  NouvelleUniteInput,
  NouveauCodeSystemeInput,
  CodificationItem,
} from "../modele/observation-definition.types";
import { observationDefinitionApi } from "../api/observation-definition.api";

export function useObservationDefinitions() {
  const notif = useNotifier();

  // --- Catégories : déléguées à la brique dédiée (source de vérité) ------
  const categoriesHook = useCategoriesObservations();

  const [definitions, setDefinitions] = useState<ObservationDefinition[]>([]);
  const [unites, setUnites] = useState<UniteMesure[]>([]);
  const [codeSystems, setCodeSystems] = useState<CodeSysteme[]>([]);

  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres
  const [recherche, setRecherche] = useState<string>("");
  const [filtreType, setFiltreType] = useState<"tous" | "numerique" | "texte">("tous");
  const [filtreActif, setFiltreActif] = useState<"tous" | "actifs" | "inactifs">("tous");
  const [filtreCategorie, setFiltreCategorie] = useState<string>("toutes");

  const rechargerCodeSystems = useCallback(async () => {
    try {
      const liste = await observationDefinitionApi.listerCodeSystems().catch(() => []);
      setCodeSystems(liste);
    } catch {
      // silencieux : un rafraîchissement raté ne doit pas bloquer l'écran
    }
  }, []);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [defsData, unitesData, csData] = await Promise.all([
        observationDefinitionApi.listerDefinitions(),
        observationDefinitionApi.listerUnites(),
        observationDefinitionApi.listerCodeSystems(),
      ]);
      setDefinitions(defsData);
      setUnites(unitesData);
      setCodeSystems(csData);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger les définitions d'observations.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  // Synchronisation inter-modules (le catalogue d'actes peut créer/activer des terminologies)
  useEffect(() => {
    return abonnerCodeSystemsChanges(() => {
      rechargerCodeSystems();
    });
  }, [rechargerCodeSystems]);

  const definitionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return definitions.filter((def) => {
      if (filtreType !== "tous" && def.typeValeur !== filtreType) return false;
      if (filtreActif === "actifs" && !def.actif) return false;
      if (filtreActif === "inactifs" && def.actif) return false;
      if (filtreCategorie !== "toutes" && def.categorie.code !== filtreCategorie) return false;

      if (q) {
        const correspondCode = def.code.toLowerCase().includes(q);
        const correspondLibelle = def.libelle.toLowerCase().includes(q);
        const correspondUnite = (def.uniteCode || "").toLowerCase().includes(q);
        const correspondCategorie = def.categorie.libelle.toLowerCase().includes(q);
        const correspondCodif = def.codifications.some(
          (c) => c.code.toLowerCase().includes(q) || c.codeSystem.toLowerCase().includes(q),
        );
        if (
          !correspondCode &&
          !correspondLibelle &&
          !correspondUnite &&
          !correspondCategorie &&
          !correspondCodif
        ) {
          return false;
        }
      }
      return true;
    });
  }, [definitions, recherche, filtreType, filtreActif, filtreCategorie]);

  const creerDefinition = useCallback(
    async (saisie: NouvelleObservationDefinitionInput): Promise<boolean> => {
      try {
        const nouvelle = await observationDefinitionApi.creerDefinition(saisie);
        setDefinitions((prev) =>
          [nouvelle, ...prev].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        notif.succes(`Observation « ${nouvelle.libelle} » (${nouvelle.code}) créée avec succès.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la création de la définition d’observation."));
        return false;
      }
    },
    [notif],
  );

  const modifierDefinition = useCallback(
    async (id: number, saisie: ModificationObservationDefinitionInput): Promise<boolean> => {
      try {
        const modifiee = await observationDefinitionApi.modifierDefinition(id, saisie);
        setDefinitions((prev) => prev.map((d) => (d.id === id ? modifiee : d)));
        notif.succes(`Observation « ${modifiee.libelle} » mise à jour avec succès.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la mise à jour de la définition d’observation."));
        return false;
      }
    },
    [notif],
  );

  const definirCodifications = useCallback(
    async (id: number, codifications: CodificationItem[]): Promise<boolean> => {
      try {
        const modifiee = await observationDefinitionApi.definirCodifications(id, codifications);
        setDefinitions((prev) => prev.map((d) => (d.id === id ? modifiee : d)));
        notif.succes(`Codifications de l’observation mises à jour.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la mise à jour des codifications."));
        return false;
      }
    },
    [notif],
  );

  const creerUnite = useCallback(
    async (saisie: NouvelleUniteInput): Promise<boolean> => {
      try {
        const unit = await observationDefinitionApi.creerUnite(saisie);
        setUnites((prev) => [...prev, unit].sort((a, b) => a.code.localeCompare(b.code, "fr")));
        notif.succes(`Unité « ${unit.code} » (${unit.libelle}) ajoutée.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l’ajout de l’unité."));
        return false;
      }
    },
    [notif],
  );

  const basculerActivationUnite = useCallback(
    async (id: number, statutActuel: boolean): Promise<boolean> => {
      try {
        const unit = await observationDefinitionApi.changerActivationUnite(id, !statutActuel);
        setUnites((prev) => prev.map((u) => (u.id === id ? unit : u)));
        notif.succes(`Unité « ${unit.code} » ${unit.actif ? "activée" : "désactivée"}.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec du changement de statut de l’unité."));
        return false;
      }
    },
    [notif],
  );

  const creerCodeSystem = useCallback(
    async (saisie: NouveauCodeSystemeInput): Promise<boolean> => {
      try {
        const cs = await observationDefinitionApi.creerCodeSystem(saisie);
        setCodeSystems((prev) => [...prev, cs].sort((a, b) => a.code.localeCompare(b.code, "fr")));
        notif.succes(`Système de codification « ${cs.code} » ajouté.`);
        notifierCodeSystemsChanges();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l’ajout du système de codification."));
        return false;
      }
    },
    [notif],
  );

  const basculerActivationCodeSystem = useCallback(
    async (id: number, statutActuel: boolean): Promise<boolean> => {
      try {
        const cs = await observationDefinitionApi.changerActivationCodeSystem(id, !statutActuel);
        setCodeSystems((prev) => prev.map((c) => (c.id === id ? cs : c)));
        notif.succes(`Système « ${cs.code} » ${cs.actif ? "activé" : "désactivé"}.`);
        notifierCodeSystemsChanges();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec du changement de statut de la terminologie."));
        return false;
      }
    },
    [notif],
  );

  /* ------------------------------------------------------------------ *
   * Catégories : relais directs vers le hook dédié.
   * On rafraîchit aussi la liste des définitions quand une catégorie
   * change de parent : les chemins (`chemin`) de chaque définition
   * peuvent changer d'un coup.
   * ------------------------------------------------------------------ */

  const creerCategorie = useCallback(
    async (code: string, libelle: string, parentCode: string | null): Promise<boolean> => {
      const ok = await categoriesHook.creer({ code, libelle, parentCode });
      if (ok) {
        // Recharger les définitions pour récupérer les `chemin` recalculés.
        await recharger();
      }
      return ok;
    },
    [categoriesHook, recharger],
  );

  const changerParentCategorie = useCallback(
    async (id: number, parentCode: string | null): Promise<boolean> => {
      const ok = await categoriesHook.changerParent(id, parentCode);
      if (ok) {
        await recharger();
      }
      return ok;
    },
    [categoriesHook, recharger],
  );

  const stats = useMemo(() => {
    const total = definitions.length;
    const actives = definitions.filter((d) => d.actif).length;
    const inactives = total - actives;
    const numeriques = definitions.filter((d) => d.typeValeur === "numerique").length;
    const textes = definitions.filter((d) => d.typeValeur === "texte").length;
    const totalCategories = categoriesHook.categories.length;
    const totalFeuilles = categoriesHook.feuilles.length;
    return { total, actives, inactives, numeriques, textes, totalCategories, totalFeuilles };
  }, [definitions, categoriesHook.categories, categoriesHook.feuilles]);

  return {
    // Définitions
    definitions: definitionsFiltrees,
    definitionsToutes: definitions,

    // Unités & terminologies
    unites,
    codeSystems,

    // Catégories : liste plate + arbre + feuilles
    categories: categoriesHook.categories,
    categoriesArbre: categoriesHook.arbre,
    categoriesFeuilles: categoriesHook.feuilles,
    categoriesChargement: categoriesHook.chargement,
    categoriesErreur: categoriesHook.erreur,

    // État global
    chargement,
    erreur,
    stats,

    // Filtres
    recherche,
    setRecherche,
    filtreType,
    setFiltreType,
    filtreActif,
    setFiltreActif,
    filtreCategorie,
    setFiltreCategorie,

    // Actions
    recharger,
    creerDefinition,
    modifierDefinition,
    definirCodifications,
    creerUnite,
    basculerActivationUnite,
    creerCodeSystem,
    basculerActivationCodeSystem,

    // Catégories
    creerCategorie,
    changerParentCategorie,
    rechargerCategories: categoriesHook.recharger,
  };
}
