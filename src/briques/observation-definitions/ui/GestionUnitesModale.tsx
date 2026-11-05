/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  MoreHorizontal,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";
import { UniteMesure, NouvelleUniteInput } from "../modele/observation-definition.types";

/* =====================================================================
 *  Tokens du design (maquette « Unités — tiroir, liste »)
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
const CHIP_NIVEAU =
  "inline-block bg-[#f0f2f1] text-[#5b6472] rounded-full px-2.5 py-0.5 text-[12px] font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

/* --------------------------------------------------------------------- */

type FiltreStatut = "toutes" | "actives" | "inactives";

interface MenuOuvert {
  unite: UniteMesure;
  top: number;
  left: number;
}

/* --------------------------------------------------------------------- */

export interface GestionUnitesModaleProps {
  ouvert: boolean;
  unites: UniteMesure[];
  onFermer: () => void;
  onCreerUnite: (saisie: NouvelleUniteInput) => Promise<boolean>;
  onBasculerActivation: (id: number, statutActuel: boolean) => Promise<boolean>;
  /** Optionnel : nombre d'observations utilisant chaque unité (par id). */
  compteParUniteId?: Record<number, number>;
}

/* =====================================================================
 *  Formulaire de création inline
 * ===================================================================== */
const FormulaireCreationInline: React.FC<{
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
  <div className="bg-white rounded-[14px] border border-[#1f9d55] p-3.5 flex flex-col gap-3 mb-2">
    <div className="text-[12px]">
      <span className="font-bold text-[#1f2937]">Nouvelle unité de mesure</span>
      <span className="text-[#5b6472]">
        {" "}
        · un code UCUM (mmHg, °C, bpm…) ou un code libre
      </span>
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
      <div className="w-[200px] shrink-0">
        <label className={LABEL}>
          Code <b className="text-[#b42318]">*</b>
        </label>
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => onCode(e.target.value)}
          placeholder="ex : mmHg, °C, bpm"
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
          placeholder="ex : millimètre de mercure"
          disabled={enCours}
          className={CHAMP}
        />
      </div>
    </div>

    <div className="flex justify-end gap-2">
      <button type="button" onClick={onAnnuler} disabled={enCours} className={BTN}>
        Annuler
      </button>
      <button type="button" onClick={onCreer} disabled={enCours} className={BTN_PRIMAIRE}>
        <Check className="w-[18px] h-[18px]" />
        Créer
      </button>
    </div>
  </div>
);

/* =====================================================================
 *  Composant principal
 * ===================================================================== */
export const GestionUnitesModale: React.FC<GestionUnitesModaleProps> = ({
  ouvert,
  unites,
  onFermer,
  onCreerUnite,
  onBasculerActivation,
  compteParUniteId,
}) => {
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("toutes");
  const [menu, setMenu] = useState<MenuOuvert | null>(null);

  // Création inline
  const [creationActive, setCreationActive] = useState(false);
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /* --------- Reset à l'ouverture --------- */
  useEffect(() => {
    if (!ouvert) return;
    setRecherche("");
    setFiltreStatut("toutes");
    setMenu(null);
    setCreationActive(false);
    setCode("");
    setLibelle("");
    setErreur(null);
  }, [ouvert]);

  /* --------- Focus auto --------- */
  useEffect(() => {
    if (creationActive) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [creationActive]);

  /* --------- Fermeture menus --------- */
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

  /* --------- Échap progressif --------- */
  useEffect(() => {
    if (!ouvert) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) setMenu(null);
      else if (creationActive) {
        if (!enCours) annulerCreation();
      } else if (!enCours) onFermer();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvert, menu, creationActive, enCours, onFermer]);

  /* --------- Compteurs --------- */
  const compteurs = useMemo(() => {
    const total = unites.length;
    const actives = unites.filter((u) => u.actif).length;
    return { total, actives, inactives: total - actives };
  }, [unites]);

  /* --------- Liste filtrée + triée --------- */
  const listeFiltree = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return unites
      .filter((u) => {
        if (filtreStatut === "actives" && !u.actif) return false;
        if (filtreStatut === "inactives" && u.actif) return false;
        if (!q) return true;
        return (
          u.code.toLowerCase().includes(q) || u.libelle.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  }, [unites, recherche, filtreStatut]);

  /* --------- Création --------- */
  const demarrerCreation = () => {
    setErreur(null);
    setCode("");
    setLibelle("");
    setCreationActive(true);
  };

  const annulerCreation = () => {
    if (enCours) return;
    setCreationActive(false);
    setCode("");
    setLibelle("");
    setErreur(null);
  };

  const validerCreation = async () => {
    setErreur(null);
    const c = code.trim();
    const l = libelle.trim();
    if (!c) return setErreur("Le code est obligatoire.");
    if (!l) return setErreur("Le libellé est obligatoire.");

    setEnCours(true);
    try {
      const ok = await onCreerUnite({ code: c, libelle: l });
      if (ok) {
        setCreationActive(false);
        setCode("");
        setLibelle("");
      }
    } finally {
      setEnCours(false);
    }
  };

  /* --------- Menu « ⋯ » --------- */
  const ouvrirMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    unite: UniteMesure,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - 220);
    const top = Math.min(r.bottom + 4, window.innerHeight - 120);
    setMenu({ unite, top, left });
  };

  const basculerStatut = (unite: UniteMesure) => {
    void onBasculerActivation(unite.id, unite.actif);
  };

  if (!ouvert) return null;

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
        onClick={enCours ? undefined : onFermer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Unités de mesure cliniques"
        className="absolute top-0 right-0 bottom-0 w-[720px] max-w-full bg-white flex flex-col text-[#1f2937]"
        style={{ boxShadow: "-12px 0 40px rgba(15,27,61,.25)" }}
      >
        {/* ===================== Header ===================== */}
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">
              Unités de mesure cliniques
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              {compteurs.total} unité{compteurs.total > 1 ? "s" : ""} ·{" "}
              {compteurs.actives} active{compteurs.actives > 1 ? "s" : ""}
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

        {/* ===================== Toolbar ===================== */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6472] pointer-events-none" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une unité par code ou libellé…"
              aria-label="Rechercher une unité"
              className={`${CHAMP} pl-9`}
            />
          </div>

          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
            aria-label="Filtrer par statut"
            className={`${CHAMP} !w-auto min-w-[140px] shrink-0`}
          >
            <option value="toutes">Toutes ({compteurs.total})</option>
            <option value="actives">Actives ({compteurs.actives})</option>
            <option value="inactives">Inactives ({compteurs.inactives})</option>
          </select>

          <button
            type="button"
            onClick={demarrerCreation}
            className={BTN_PRIMAIRE}
            disabled={enCours || creationActive}
          >
            <Plus className="w-[18px] h-[18px]" />
            Ajouter une unité
          </button>
        </div>

        {/* ===================== Contenu (tableau) ===================== */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {creationActive && (
            <FormulaireCreationInline
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

          <div className="rounded-[14px] border border-[#e5e7eb] bg-white overflow-hidden">
            {/* Header tableau */}
            <div className="bg-[#fafbfa] border-b border-[#e5e7eb] flex items-center px-4 h-10">
              <span className="w-[162px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Code UCUM
              </span>
              <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Libellé
              </span>
              <span className="w-[112px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Utilisation
              </span>
              <span className="w-[110px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Statut
              </span>
              <span className="w-[40px]" aria-hidden="true" />
            </div>

            {/* Lignes */}
            {listeFiltree.length === 0 ? (
              <div className="p-10 text-center text-[#5b6472] text-sm italic">
                {unites.length === 0
                  ? "Aucune unité enregistrée. Cliquez sur « Ajouter une unité »."
                  : recherche.trim() || filtreStatut !== "toutes"
                    ? "Aucune unité ne correspond aux filtres appliqués."
                    : "Aucune unité disponible."}
              </div>
            ) : (
              listeFiltree.map((u) => {
                const compte = compteParUniteId?.[u.id] ?? 0;
                return (
                  <div
                    key={u.id}
                    className="flex items-center px-4 h-[54px] border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                  >
                    {/* Code UCUM */}
                    <span className="w-[162px] font-mono text-[12px] font-bold text-[#1f2937] whitespace-nowrap truncate pr-2">
                      {u.code}
                    </span>

                    {/* Libellé */}
                    <span className="flex-1 text-[13px] text-[#1f2937] truncate pr-2">
                      {u.libelle}
                    </span>

                    {/* Utilisation */}
                    <span className="w-[112px] text-[12px] text-[#5b6472] whitespace-nowrap">
                      {compte} observation{compte > 1 ? "s" : ""}
                    </span>

                    {/* Statut (toggle + texte) */}
                    <span className="w-[110px]">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={u.actif}
                        aria-label={`${u.actif ? "Désactiver" : "Activer"} ${u.libelle}`}
                        onClick={() => basculerStatut(u)}
                        className={`inline-flex items-center gap-2 cursor-pointer ${FOCUS}`}
                      >
                        <span
                          className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 ${
                            u.actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                              u.actif ? "left-4" : "left-0.5"
                            }`}
                          />
                        </span>
                        <span
                          className={`text-[12px] font-bold ${
                            u.actif ? "text-[#14703c]" : "text-[#5b6472]"
                          }`}
                        >
                          {u.actif ? "Actif" : "Inactif"}
                        </span>
                      </button>
                    </span>

                    {/* Actions ⋯ */}
                    <span className="w-[40px] text-center">
                      <button
                        type="button"
                        aria-label={`Actions pour ${u.libelle}`}
                        aria-haspopup="menu"
                        onClick={(e) => ouvrirMenu(e, u)}
                        className={`w-8 h-8 grid place-items-center rounded-md text-[#5b6472] hover:bg-white hover:text-[#1f2937] cursor-pointer ${FOCUS}`}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {listeFiltree.length > 0 && (
            <div className="mt-2 text-[11px] text-[#5b6472] px-1">
              <strong className="font-bold text-[#1f2937]">{listeFiltree.length}</strong>{" "}
              unité{listeFiltree.length > 1 ? "s" : ""} affichée
              {listeFiltree.length > 1 ? "s" : ""}
              {listeFiltree.length !== unites.length && (
                <> sur {unites.length}</>
              )}
            </div>
          )}
        </div>

        {/* ===================== Footer ===================== */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Fermer
          </button>
        </div>

        {/* ===================== Menu « ⋯ » ===================== */}
        {menu && (
          <>
            <div
              className="fixed inset-0 z-[70]"
              onClick={() => setMenu(null)}
              aria-hidden="true"
            />
            <div
              role="menu"
              style={{ top: menu.top, left: menu.left, width: 220 }}
              className="fixed z-[75] bg-white border border-[#e5e7eb] rounded-xl shadow-lg p-1.5"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  basculerStatut(menu.unite);
                  setMenu(null);
                }}
                className={`w-full h-10 flex items-center px-3 rounded-lg cursor-pointer ${FOCUS} ${
                  menu.unite.actif
                    ? "text-[#b42318] hover:bg-rose-50"
                    : "text-[#14703c] hover:bg-[#e7f6ed]"
                }`}
              >
                <Power className="w-4 h-4 mr-2" />
                {menu.unite.actif ? "Désactiver l'unité" : "Réactiver l'unité"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GestionUnitesModale;