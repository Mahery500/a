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
import { useCategoriesActes } from "@/briques/categorie-actes";
import {
  ActeMedical,
  CategorieActe,
  TypeServiceOption,
  NouvelActeInput,
  ModificationActeInput,
  NouvelleCategorieInput,
  CodificationActe,
  CodeSystemeOption,
  NouveauCodeSystemeInput,
} from "../modele/catalogue-actes.types";
import { catalogueActesApi } from "../api/catalogue-actes.api";

export function useCatalogueActes() {
  const notif = useNotifier();

  // --- Catégories : déléguées à la brique dédiée --------------------------
  // L'arborescence (parentId, niveau, chemin…) vit désormais dans
  // useCategoriesActes(). On ne duplique plus la liste ici : on expose
  // simplement ses sorties, ce qui évite toute désynchronisation entre
  // l'écran « Catalogue » et l'écran de gestion des catégories.
  const categoriesHook = useCategoriesActes();

  const [actes, setActes] = useState<ActeMedical[]>([]);
  const [typesServices, setTypesServices] = useState<TypeServiceOption[]>([]);
  const [codeSystems, setCodeSystems] = useState<CodeSystemeOption[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres
  const [recherche, setRecherche] = useState<string>("");
  const [categorieFiltre, setCategorieFiltre] = useState<string>("tous");
  const [statutFiltre, setStatutFiltre] = useState<"tous" | "actifs" | "inactifs">("tous");
  const [corpsMedicalFiltre, setCorpsMedicalFiltre] = useState<string>("tous");

  // Rechargement dédié des terminologies : utilisé après un événement externe,
  // sans recharger tout le reste (actes, types de service).
  const rechargerCodeSystems = useCallback(async () => {
    try {
      const liste = await catalogueActesApi.listerCodeSystems().catch(() => []);
      setCodeSystems(liste);
    } catch {
      // silencieux : un rafraîchissement raté ne doit pas bloquer l'écran
    }
  }, []);

  /**
   * Recharge uniquement les actes (les catégories, types de service et
   * code_systems ont leurs propres cycles de vie).
   */
  const rechargerActes = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [listeActes, listeTypes, listeCodeSystems] = await Promise.all([
        catalogueActesApi.listerActes(),
        catalogueActesApi.listerTypesServices(),
        catalogueActesApi.listerCodeSystems().catch(() => []),
      ]);
      setActes(listeActes);
      setTypesServices(listeTypes);
      setCodeSystems(listeCodeSystems);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger la nomenclature des actes médicaux.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => {
    rechargerActes();
  }, [rechargerActes]);

  // Synchronisation inter-modules : si un autre écran modifie les terminologies,
  // on rafraîchit notre propre liste.
  useEffect(() => {
    return abonnerCodeSystemsChanges(() => {
      rechargerCodeSystems();
    });
  }, [rechargerCodeSystems]);

  /**
   * Rechargement global (utilisé par le bouton « Actualiser » du panneau).
   * Recharge les actes ET force un rafraîchissement de l'arbre des catégories.
   */
  const recharger = useCallback(async () => {
    await Promise.all([rechargerActes(), categoriesHook.recharger()]);
  }, [rechargerActes, categoriesHook]);

  // Filtrage combiné en mémoire des données réelles chargées
  const actesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return actes.filter((a) => {
      if (categorieFiltre !== "tous" && a.categorie.code !== categorieFiltre) return false;
      if (statutFiltre === "actifs" && !a.actif) return false;
      if (statutFiltre === "inactifs" && a.actif) return false;
      if (
        corpsMedicalFiltre !== "tous" &&
        !a.habilitations.some((h) => h.corpsMedicalCode === corpsMedicalFiltre)
      )
        return false;
      if (q) {
        const correspondCode = a.code.toLowerCase().includes(q);
        const correspondLibelle = a.libelle.toLowerCase().includes(q);
        const correspondCat = a.categorie.libelle.toLowerCase().includes(q);
        if (!correspondCode && !correspondLibelle && !correspondCat) return false;
      }
      return true;
    });
   }, [actes, recherche, categorieFiltre, statutFiltre, corpsMedicalFiltre])

  const creerActe = useCallback(
    async (saisie: NouvelActeInput): Promise<boolean> => {
      try {
        const nouvelActe = await catalogueActesApi.creerActe(saisie);
        setActes((prev) =>
          [...prev, nouvelActe].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        notif.succes(`Acte « ${nouvelActe.libelle} » enregistré avec succès.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l'enregistrement de l'acte médical."));
        return false;
      }
    },
    [notif],
  );

  const modifierActe = useCallback(
    async (id: number, saisie: ModificationActeInput): Promise<boolean> => {
      try {
        const acteModifie = await catalogueActesApi.modifierActe(id, saisie);
        setActes((prev) =>
          prev
            .map((a) => (a.id === id ? acteModifie : a))
            .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        notif.succes(`Acte « ${acteModifie.libelle} » mis à jour.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la modification de l'acte."));
        return false;
      }
    },
    [notif],
  );

  const basculerStatutActe = useCallback(
    async (acte: ActeMedical): Promise<boolean> => {
      const nouvelEtat = !acte.actif;
      try {
        const misAJour = await catalogueActesApi.changerStatutActe(acte.id, nouvelEtat);
        setActes((prev) => prev.map((a) => (a.id === acte.id ? misAJour : a)));
        notif.info(
          nouvelEtat
            ? `L'acte « ${acte.libelle} » est désormais actif.`
            : `L'acte « ${acte.libelle} » a été désactivé.`,
        );
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Impossible de modifier le statut de cet acte."));
        return false;
      }
    },
    [notif],
  );

  /**
   * Création d'une catégorie d'acte. Signature inchangée pour les appelants
   * existants : `NouvelleCategorieInput` accepte maintenant un `parentCode`
   * optionnel (null/vide = racine). Le hook des catégories rafraîchit
   * automatiquement son propre arbre après création.
   */
  const creerCategorie = useCallback(
    (saisie: NouvelleCategorieInput): Promise<boolean> =>
      categoriesHook.creer({
        code: saisie.code,
        libelle: saisie.libelle,
        parentCode: saisie.parentCode ?? null,
      }),
    [categoriesHook],
  );

  /**
   * Déplace une catégorie dans l'arborescence. Exposé pour les écrans qui
   * pilotent directement la hiérarchie sans passer par la modale partagée.
   */
  const changerParentCategorie = useCallback(
    (id: number, parentCode: string | null): Promise<boolean> =>
      categoriesHook.changerParent(id, parentCode),
    [categoriesHook],
  );

  const definirCodifications = useCallback(
    async (acteId: number, codifications: CodificationActe[]): Promise<boolean> => {
      try {
        const acteMaj = await catalogueActesApi.definirCodificationsActe(acteId, codifications);
        setActes((prev) => prev.map((a) => (a.id === acteId ? acteMaj : a)));
        notif.succes(`Codifications enregistrées pour « ${acteMaj.libelle} ».`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l'enregistrement des codifications de l'acte."));
        return false;
      }
    },
    [notif],
  );

  const creerCodeSystem = useCallback(
    async (saisie: NouveauCodeSystemeInput): Promise<boolean> => {
      try {
        const nouveau = await catalogueActesApi.creerCodeSystem(saisie);
        setCodeSystems((prev) =>
          [...prev, nouveau].sort((a, b) => a.code.localeCompare(b.code, "fr")),
        );
        notif.succes(`Système de codification « ${nouveau.code} » ajouté.`);
        notifierCodeSystemsChanges();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l'ajout de la terminologie."));
        return false;
      }
    },
    [notif],
  );

  const basculerActivationCodeSystem = useCallback(
    async (id: number, statutActuel: boolean): Promise<boolean> => {
      const nouvelEtat = !statutActuel;
      try {
        const maj = await catalogueActesApi.changerActivationCodeSystem(id, nouvelEtat);
        setCodeSystems((prev) => prev.map((c) => (c.id === id ? maj : c)));
        notif.info(
          nouvelEtat
            ? `Terminologie « ${maj.code} » activée.`
            : `Terminologie « ${maj.code} » désactivée.`,
        );
        notifierCodeSystemsChanges();
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Impossible de modifier l'état de la terminologie."));
        return false;
      }
    },
    [notif],
  );

  const stats = useMemo(() => {
    const total = actes.length;
    const actifs = actes.filter((a) => a.actif).length;
    const inactifs = total - actifs;
    const totalCat = categoriesHook.categories.length;
    const totalFeuilles = categoriesHook.feuilles.length;
    return { total, actifs, inactifs, totalCat, totalFeuilles };
  }, [actes, categoriesHook.categories, categoriesHook.feuilles]);

  return {
    // --- Actes -----------------------------------------------------------
    actes: actesFiltres,
    actesTous: actes,

    // --- Catégories : liste plate + arbre + feuilles ---------------------
    // `categories` reste exposé pour ne pas casser les appelants existants ;
    // les deux nouvelles clés servent aux écrans qui ont besoin de la structure.
    categories: categoriesHook.categories,
    categoriesArbre: categoriesHook.arbre,
    categoriesFeuilles: categoriesHook.feuilles,
    categoriesChargement: categoriesHook.chargement,
    categoriesErreur: categoriesHook.erreur,
    rechargerCategories: categoriesHook.recharger,
    changerParentCategorie,

    // --- Référentiels ----------------------------------------------------
    typesServices,
    codeSystems,

    // --- État global -----------------------------------------------------
    chargement,
    erreur,
    stats,

    // --- Filtres ---------------------------------------------------------
    recherche,
    setRecherche,
    categorieFiltre,
    setCategorieFiltre,
    statutFiltre,
    setStatutFiltre,
    corpsMedicalFiltre,
    setCorpsMedicalFiltre,

    // --- Actions ---------------------------------------------------------
    recharger,
    creerActe,
    modifierActe,
    basculerStatutActe,
    creerCategorie,
    definirCodifications,
    creerCodeSystem,
    basculerActivationCodeSystem,
  };
}
