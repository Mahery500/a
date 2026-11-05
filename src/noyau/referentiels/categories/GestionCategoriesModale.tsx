/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, MoreHorizontal, MoveRight, Plus, Search, X } from "lucide-react";
import {
  ArbreCategorie,
  CategorieHierarchique,
  NouvelleCategorieInput,
  PROFONDEUR_MAX,
} from "./hierarchie.types";

/* =====================================================================
 *  Tokens du design (maquettes Cat1 / Cat2)
 *  vert #1f9d55 · vert clair #e7f6ed · vert foncé #14703c
 *  bordure #e5e7eb · séparateur #f0f2f1 · texte #1f2937 · muted #5b6472
 * ===================================================================== */
const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 " +
  "border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 " +
  "bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const NIVEAU_CHIP =
  "inline-block bg-[#f0f2f1] text-[#5b6472] rounded-full px-2.5 py-0.5 text-[12px] font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

/* =====================================================================
 *  Helper : filtrage récursif (garde un nœud si lui ou un descendant matche)
 * ===================================================================== */
const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function filtrerArbre(
  nodes: ArbreCategorie<CategorieHierarchique>[],
  requete: string,
): ArbreCategorie<CategorieHierarchique>[] {
  const q = normaliser(requete.trim());
  if (!q) return nodes;

  const filtrer = (
    n: ArbreCategorie<CategorieHierarchique>,
  ): ArbreCategorie<CategorieHierarchique> | null => {
    const matchSelf =
      normaliser(n.categorie.code).includes(q) ||
      normaliser(n.categorie.libelle).includes(q);
    const enfants = n.enfants
      .map(filtrer)
      .filter(
        (x): x is ArbreCategorie<CategorieHierarchique> => x !== null,
      );
    if (matchSelf || enfants.length > 0) {
      return { categorie: n.categorie, enfants };
    }
    return null;
  };

  return nodes
    .map(filtrer)
    .filter((x): x is ArbreCategorie<CategorieHierarchique> => x !== null);
}

/* =====================================================================
 *  Sous-composant : formulaire de création inline
 * ===================================================================== */
const FormulaireCreationInline: React.FC<{
  parent: CategorieHierarchique | null;
  niveauAffiche: number;
  code: string;
  libelle: string;
  onCode: (v: string) => void;
  onLibelle: (v: string) => void;
  onAnnuler: () => void;
  onCreer: () => void;
  enCours: boolean;
  erreur: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
}> = ({
  parent,
  niveauAffiche,
  code,
  libelle,
  onCode,
  onLibelle,
  onAnnuler,
  onCreer,
  enCours,
  erreur,
  inputRef,
}) => (
  <div
    className="bg-white rounded-[14px] border border-[#1f9d55] p-3.5 flex flex-col gap-3"
    style={{ marginLeft: niveauAffiche * 28 }}
  >
    <div className="text-[12px]">
      <span className="font-bold text-[#1f2937]">
        {parent ? "Nouvelle sous-catégorie" : "Nouvelle catégorie"}
      </span>
      {parent && (
        <span className="text-[#5b6472]">
          {" "}
          · de <b className="text-[#1f2937]">{parent.libelle}</b> · niveau{" "}
          {parent.niveau + 1} sur {PROFONDEUR_MAX}
        </span>
      )}
    </div>

    {erreur && (
      <div
        role="alert"
        className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-[12px]"
      >
        {erreur}
      </div>
    )}

    <div className="flex gap-3">
      <div className="w-[230px] shrink-0">
        <label className={LABEL}>
          Code <b className="text-[#b42318]">*</b>
        </label>
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => onCode(e.target.value.toUpperCase())}
          placeholder={parent ? "EX : ANTHRO_TOUR_TAILLE" : "EX : BIO_OBS"}
          disabled={enCours}
          className={`${CHAMP} font-mono`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <label className={LABEL}>
          Libellé <b className="text-[#b42318]">*</b>
        </label>
        <input
          type="text"
          value={libelle}
          onChange={(e) => onLibelle(e.target.value)}
          placeholder={parent ? "ex : Tour de taille" : "ex : Biologie"}
          disabled={enCours}
          className={CHAMP}
        />
      </div>
    </div>

    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onAnnuler}
        disabled={enCours}
        className={BTN}
      >
        Annuler
      </button>
      <button
        type="button"
        onClick={onCreer}
        disabled={enCours}
        className={BTN_PRIMAIRE}
      >
        <Check className="w-[18px] h-[18px]" />
        Créer
      </button>
    </div>
  </div>
);

/* =====================================================================
 *  Props (rétro-compatibles — nouveaux champs tous optionnels)
 * ===================================================================== */
export interface GestionCategoriesModaleProps {
  ouvert: boolean;
  titre: string;
  libelleSingulier: string;
  arbre: ArbreCategorie<CategorieHierarchique>[];
  categories: CategorieHierarchique[];
  chargement: boolean;
  onFermer: () => void;
  onCreer: (input: NouvelleCategorieInput) => Promise<boolean>;
  onChangerParent: (id: number, parentCode: string | null) => Promise<boolean>;
  /** Optionnel : nombre d'items rattachés par code de catégorie (obs., actes…). */
  compteParCode?: Record<string, number>;
  /** Optionnel : renommer une catégorie (nécessite un endpoint backend). */
  onRenommer?: (id: number, nouveauLibelle: string) => Promise<boolean>;
  /** Optionnel : archiver/désactiver une catégorie. */
  onArchiver?: (id: number) => Promise<boolean>;
}

interface MenuOuvert {
  cat: CategorieHierarchique;
  top: number;
  left: number;
}

/* =====================================================================
 *  Composant principal
 * ===================================================================== */
export const GestionCategoriesModale: React.FC<GestionCategoriesModaleProps> = ({
  ouvert,
  titre,
  libelleSingulier,
  arbre,
  categories,
  chargement,
  onFermer,
  onCreer,
  onChangerParent,
  compteParCode,
  onRenommer,
  onArchiver,
}) => {
  const [recherche, setRecherche] = useState("");
  const [ouverts, setOuverts] = useState<Set<number>>(new Set());
  const [menu, setMenu] = useState<MenuOuvert | null>(null);

  // Création inline
  const [creationActive, setCreationActive] = useState(false);
  const [creationParent, setCreationParent] =
    useState<CategorieHierarchique | null>(null);
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");

  // Déplacement
  const [deplacementPour, setDeplacementPour] =
    useState<CategorieHierarchique | null>(null);
  const [nouveauParentCode, setNouveauParentCode] = useState<string>("");

  // État global
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  /* --------- Reset à l'ouverture --------- */
  useEffect(() => {
    if (!ouvert) return;
    setRecherche("");
    setMenu(null);
    setCreationActive(false);
    setCreationParent(null);
    setCode("");
    setLibelle("");
    setErreur(null);
    setDeplacementPour(null);
    setNouveauParentCode("");
    // Auto-expand des racines
    const racines = new Set<number>();
    arbre.forEach((n) => racines.add(n.categorie.id));
    setOuverts(racines);
  }, [ouvert, arbre]);

  /* --------- Focus auto sur le code dès l'ouverture du form --------- */
  useEffect(() => {
    if (creationActive) {
      // Délai pour que le DOM existe
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [creationActive, creationParent]);

  /* --------- Fermeture menus au clic extérieur / scroll / Échap --------- */
  useEffect(() => {
    if (!menu) return;
    const fermer = () => setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);

  /* --------- Échap : ferme progressivement l'élément le plus interne --------- */
  useEffect(() => {
    if (!ouvert) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) {
        setMenu(null);
      } else if (deplacementPour) {
        if (!enCours) setDeplacementPour(null);
      } else if (creationActive) {
        if (!enCours) annulerCreation();
      } else if (!enCours) {
        onFermer();
      }
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, menu, deplacementPour, creationActive, enCours, onFermer]);

  /* --------- Arbre filtré --------- */
  const rechercheActive = recherche.trim() !== "";
  const arbreFiltre = useMemo(
    () => filtrerArbre(arbre, recherche),
    [arbre, recherche],
  );

  /* --------- Tout déplier / tout replier --------- */
  const toutDeplie = useMemo(() => {
    const parents = new Set<number>();
    const walk = (nodes: ArbreCategorie<CategorieHierarchique>[]) => {
      nodes.forEach((n) => {
        if (n.enfants.length > 0) {
          parents.add(n.categorie.id);
          walk(n.enfants);
        }
      });
    };
    walk(arbre);
    return parents.size > 0 && [...parents].every((id) => ouverts.has(id));
  }, [arbre, ouverts]);

  const basculerToutDeplier = () => {
    if (toutDeplie) {
      setOuverts(new Set());
    } else {
      const tous = new Set<number>();
      const walk = (nodes: ArbreCategorie<CategorieHierarchique>[]) => {
        nodes.forEach((n) => {
          if (n.enfants.length > 0) tous.add(n.categorie.id);
          walk(n.enfants);
        });
      };
      walk(arbre);
      setOuverts(tous);
    }
  };

  const basculer = (id: number) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* --------- Menu « ⋯ » --------- */
  const ouvrirMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    cat: CategorieHierarchique,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - 240);
    const top = Math.min(r.bottom + 4, window.innerHeight - 200);
    setMenu({ cat, top, left });
  };

  /* --------- Création --------- */
  const demarrerCreation = (parent: CategorieHierarchique | null) => {
    setMenu(null);
    setErreur(null);
    setCode("");
    setLibelle("");
    setCreationActive(true);
    setCreationParent(parent);
    if (parent) {
      setOuverts((prev) => new Set(prev).add(parent.id));
    }
  };

  const annulerCreation = () => {
    if (enCours) return;
    setCreationActive(false);
    setCreationParent(null);
    setCode("");
    setLibelle("");
    setErreur(null);
  };

  const validerCreation = async () => {
    setErreur(null);
    const c = code.trim().toUpperCase();
    const l = libelle.trim();
    if (!c) return setErreur("Le code est obligatoire.");
    if (!l) return setErreur("Le libellé est obligatoire.");

    setEnCours(true);
    try {
      const ok = await onCreer({
        code: c,
        libelle: l,
        parentCode: creationParent?.code ?? null,
      });
      if (ok) {
        setCreationActive(false);
        setCreationParent(null);
        setCode("");
        setLibelle("");
      }
    } finally {
      setEnCours(false);
    }
  };

  /* --------- Déplacement --------- */
  const validerDeplacement = async () => {
    if (!deplacementPour) return;
    if (nouveauParentCode === (deplacementPour.parentCode ?? "")) {
      setDeplacementPour(null);
      return;
    }
    setEnCours(true);
    try {
      const ok = await onChangerParent(
        deplacementPour.id,
        nouveauParentCode || null,
      );
      if (ok) {
        setDeplacementPour(null);
        setNouveauParentCode("");
      }
    } finally {
      setEnCours(false);
    }
  };

  const optionsParentDepl = useMemo(
    () =>
      categories
        .filter(
          (c) => c.id !== deplacementPour?.id && c.niveau < PROFONDEUR_MAX,
        )
        .sort((a, b) =>
          a.chemin.join("/").localeCompare(b.chemin.join("/"), "fr"),
        ),
    [categories, deplacementPour],
  );

  /* --------- Renommer / Archiver (handlers optionnels) --------- */
  const declencherRenommer = (cat: CategorieHierarchique) => {
    setMenu(null);
    if (!onRenommer) return;
    const nouveau = window.prompt(
      `Renommer « ${cat.libelle} » :`,
      cat.libelle,
    );
    if (nouveau && nouveau.trim() && nouveau.trim() !== cat.libelle) {
      void onRenommer(cat.id, nouveau.trim());
    }
  };

  const declencherArchiver = (cat: CategorieHierarchique) => {
    setMenu(null);
    if (!onArchiver) return;
    if (window.confirm(`Archiver la catégorie « ${cat.libelle} » ?`)) {
      void onArchiver(cat.id);
    }
  };

  if (!ouvert) return null;

  /* =====================================================================
   *  Rendu récursif d'un nœud
   * ===================================================================== */
  const rendreNoeud = (
    node: ArbreCategorie<CategorieHierarchique>,
    niveauAffiche: number,
  ): React.ReactNode => {
    const cat = node.categorie;
    const aDesEnfants = node.enfants.length > 0;
    const estOuvert = rechercheActive ? true : ouverts.has(cat.id);
    const compte = compteParCode?.[cat.code];
    const estSelectionne =
      menu?.cat.id === cat.id || creationParent?.id === cat.id;
    const peutCreerSousCat = cat.niveau < PROFONDEUR_MAX;

    return (
      <React.Fragment key={cat.id}>
        <div
          className={`flex items-center gap-2 h-11 px-2.5 rounded-[10px] border ${
            estSelectionne
              ? "border-[#1f9d55] bg-[#e7f6ed]"
              : "border-transparent hover:bg-[#fafbfa]"
          }`}
          style={{ marginLeft: niveauAffiche * 28 }}
          role="treeitem"
          aria-level={niveauAffiche + 1}
          aria-expanded={aDesEnfants ? estOuvert : undefined}
          onClick={() => aDesEnfants && basculer(cat.id)}
        >
          <span
            className="select-none shrink-0"
            style={{ color: "#9aa3af", letterSpacing: "-2px" }}
            title="Réorganisation par glisser-déposer (bientôt disponible)"
            aria-hidden="true"
          >
            ⋮⋮
          </span>

          <span
            className="shrink-0 text-[#5b6472] text-[14px] leading-none"
            style={{ width: 12 }}
            aria-hidden="true"
          >
            {aDesEnfants ? (estOuvert ? "⌄" : "›") : ""}
          </span>

          <span className={CODE_CHIP}>{cat.code}</span>

          <span className="flex-1 font-bold text-[#1f2937] text-[14px] truncate">
            {cat.libelle}
          </span>

          {compte !== undefined && (
            <span className="text-[12px] text-[#5b6472] whitespace-nowrap">
              {compte} obs.
            </span>
          )}

          <span className={NIVEAU_CHIP}>Niv. {cat.niveau}</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              ouvrirMenu(e, cat);
            }}
            aria-label={`Actions pour ${cat.libelle}`}
            aria-haspopup="menu"
            className={`w-7 h-7 grid place-items-center rounded-md text-[#5b6472] hover:bg-white hover:text-[#1f2937] cursor-pointer ${FOCUS}`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Enfants récursifs */}
        {estOuvert &&
          node.enfants.map((enfant) =>
            rendreNoeud(enfant, niveauAffiche + 1),
          )}

        {/* Formulaire de création inline, APRÈS les enfants */}
        {estOuvert && creationActive && creationParent?.id === cat.id && (
          <FormulaireCreationInline
            parent={cat}
            niveauAffiche={niveauAffiche + 1}
            code={code}
            libelle={libelle}
            onCode={setCode}
            onLibelle={setLibelle}
            onAnnuler={annulerCreation}
            onCreer={validerCreation}
            enCours={enCours}
            erreur={erreur}
            inputRef={inputRef}
          />
        )}

        {/* Info de blocage pour profondeur atteinte */}
        {creationActive &&
          creationParent?.id === cat.id &&
          !peutCreerSousCat && null}
      </React.Fragment>
    );
  };

  const total = categories.length;

  /* =====================================================================
   *  Rendu principal
   * ===================================================================== */
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
        onClick={enCours ? undefined : onFermer}
        aria-hidden="true"
      />

      {/* Drawer 720 px */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="absolute top-0 right-0 bottom-0 w-[720px] max-w-full bg-white flex flex-col text-[#1f2937]"
        style={{ boxShadow: "-12px 0 40px rgba(15,27,61,.25)" }}
      >
        {/* Header */}
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">{titre}</h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              {total} catégorie{total > 1 ? "s" : ""} · {PROFONDEUR_MAX} niveaux maximum
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? undefined : onFermer}
            disabled={enCours}
            className={`p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50 ${FOCUS}`}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6472] pointer-events-none" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une catégorie ou un code…"
              aria-label="Rechercher une catégorie"
              className={`${CHAMP} pl-9`}
            />
          </div>
          <button
            type="button"
            onClick={basculerToutDeplier}
            className={BTN}
            disabled={chargement}
          >
            {toutDeplie ? "Tout replier" : "Tout déplier"}
          </button>
          <button
            type="button"
            onClick={() => demarrerCreation(null)}
            className={BTN_PRIMAIRE}
            disabled={enCours || creationActive}
          >
            <Plus className="w-[18px] h-[18px]" />
            Nouvelle catégorie
          </button>
        </div>

        {/* Arbre */}
        <div
          className="flex-1 overflow-y-auto px-6 pb-4 pt-2 flex flex-col gap-1"
          role="tree"
          aria-label={titre}
        >
          {chargement ? (
            <p className="p-6 text-center text-[#5b6472] text-sm">Chargement…</p>
          ) : arbreFiltre.length === 0 ? (
            <div className="p-10 text-center text-[#5b6472] text-sm italic border border-dashed border-[#e5e7eb] rounded-[14px]">
              {rechercheActive
                ? `Aucune catégorie ne correspond à « ${recherche} ».`
                : "Aucune catégorie enregistrée. Cliquez sur « Nouvelle catégorie »."}
            </div>
          ) : (
            arbreFiltre.map((node) => rendreNoeud(node, 0))
          )}

          {/* Création à la racine */}
          {creationActive && creationParent === null && !rechercheActive && (
            <div className="mt-3">
              <FormulaireCreationInline
                parent={null}
                niveauAffiche={0}
                code={code}
                libelle={libelle}
                onCode={setCode}
                onLibelle={setLibelle}
                onAnnuler={annulerCreation}
                onCreer={validerCreation}
                enCours={enCours}
                erreur={erreur}
                inputRef={inputRef}
              />
            </div>
          )}
        </div>

        {/* Bandeau d'aide */}
        <div className="border-t border-[#e5e7eb] bg-[#fafbfa] px-6 py-2.5 text-[12px] text-[#5b6472] shrink-0">
          Glisser-déposer pour réorganiser · « ⋯ » pour les autres actions.
        </div>

        {/* Footer */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onFermer}
            disabled={enCours}
            className={BTN}
          >
            Fermer
          </button>
        </div>

        {/* Menu « ⋯ » (fixed) */}
        {menu && (
          <>
            <div
              className="fixed inset-0 z-[70]"
              onClick={() => setMenu(null)}
              aria-hidden="true"
            />
            <div
              role="menu"
              style={{ top: menu.top, left: menu.left, width: 230 }}
              className="fixed z-[75] bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-1.5"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => demarrerCreation(menu.cat)}
                disabled={menu.cat.niveau >= PROFONDEUR_MAX}
                title={
                  menu.cat.niveau >= PROFONDEUR_MAX
                    ? `Niveau maximum atteint (${PROFONDEUR_MAX})`
                    : undefined
                }
                className={`w-full h-10 flex items-center px-3 rounded-lg font-bold text-[#14703c] bg-[#e7f6ed] hover:bg-[#dcf0e3] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une sous-catégorie
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => declencherRenommer(menu.cat)}
                disabled={!onRenommer}
                title={!onRenommer ? "Non disponible sur ce backend" : undefined}
                className="w-full h-10 flex items-center px-3 rounded-lg text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Renommer
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDeplacementPour(menu.cat);
                  setNouveauParentCode(menu.cat.parentCode ?? "");
                  setMenu(null);
                }}
                className="w-full h-10 flex items-center px-3 rounded-lg text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
              >
                Déplacer vers…
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => declencherArchiver(menu.cat)}
                disabled={!onArchiver}
                title={!onArchiver ? "Non disponible sur ce backend" : undefined}
                className="w-full h-10 flex items-center px-3 rounded-lg text-[#b42318] hover:bg-rose-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Archiver
              </button>
            </div>
          </>
        )}

        {/* Dialogue « Déplacer vers… » */}
        {deplacementPour && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(15,27,61,.35)] p-4"
            onClick={() => !enCours && setDeplacementPour(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Déplacer la catégorie ${deplacementPour.libelle}`}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] max-w-md w-full p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-base font-bold text-[#1f2937]">
                  Déplacer « {deplacementPour.libelle} »
                </h3>
                <p className="text-[12px] text-[#5b6472] mt-0.5">
                  Choisissez la nouvelle catégorie parente, ou « Racine » pour la remettre au
                  premier niveau. Les descendants suivent automatiquement.
                </p>
              </div>

              <div>
                <label className={LABEL}>Catégorie parente</label>
                <select
                  value={nouveauParentCode}
                  onChange={(e) => setNouveauParentCode(e.target.value)}
                  disabled={enCours}
                  className={CHAMP}
                >
                  <option value="">— Racine (aucun parent) —</option>
                  {optionsParentDepl.map((c) => (
                    <option key={c.id} value={c.code}>
                      {"— ".repeat(c.niveau - 1)}
                      {c.libelle} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeplacementPour(null)}
                  disabled={enCours}
                  className={BTN}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={validerDeplacement}
                  disabled={enCours}
                  className={BTN_PRIMAIRE}
                >
                  <MoveRight className="w-4 h-4" />
                  Déplacer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionCategoriesModale;