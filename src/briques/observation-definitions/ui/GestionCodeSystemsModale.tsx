// src/briques/observation-definitions/ui/GestionCodeSystemsModale.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookMarked,
  Check,
  Copy,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";
import {
  CodeSysteme,
  NouveauCodeSystemeInput,
} from "../modele/observation-definition.types";

/* =====================================================================
 *  Tokens du design (maquettes Terms / Terms2)
 *  vert #1f9d55 · vert clair #e7f6ed · vert foncé #14703c
 *  bordure #e5e7eb · séparateur #f0f2f1 · ink #1f2937 · ink2 #5b6472
 *  ext #eef2ff / #3730a3 · ambre #fff4e0 / #8a5300 · erreur #b42318
 * ===================================================================== */
const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const EXT_CHIP =
  "inline-block text-center bg-[#eef2ff] text-[#3730a3] rounded-md px-2 py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

const REGEX_URI = /^https?:\/\/.+/i;

type FiltreStatut = "toutes" | "actives" | "inactives";

interface MenuOuvert {
  cs: CodeSysteme;
  top: number;
  right: number;
}

/* =====================================================================
 *  Props (rétro‑compatibles : nouvelles props optionnelles)
 * ===================================================================== */
export interface GestionCodeSystemsModaleProps {
  ouvert: boolean;
  codeSystems: CodeSysteme[];
  onFermer: () => void;
  onCreerCodeSystem: (saisie: NouveauCodeSystemeInput) => Promise<boolean>;
  onBasculerActivation: (id: number, statutActuel: boolean) => Promise<boolean>;
  /**
   * Compteur d'utilisation (nombre d'observations/diagnostics/actes codifiés
   * avec chaque terminologie). Absent = tout à 0.
   */
  compteParCodeSystemId?: Record<number, number>;
}

/* =====================================================================
 *  Composant
 * ===================================================================== */
export const GestionCodeSystemsModale: React.FC<GestionCodeSystemsModaleProps> = ({
  ouvert,
  codeSystems,
  onFermer,
  onCreerCodeSystem,
  onBasculerActivation,
  compteParCodeSystemId,
}) => {
  /* ---------------- État local ---------------- */
  const [creationActive, setCreationActive] = useState(false);
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [uri, setUri] = useState("");
  const [enCoursAjout, setEnCoursAjout] = useState(false);
  const [erreurAjout, setErreurAjout] = useState<string | null>(null);

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("toutes");
  const [menu, setMenu] = useState<MenuOuvert | null>(null);
  const [uriCopieeId, setUriCopieeId] = useState<number | null>(null);
  const [actionEnCoursId, setActionEnCoursId] = useState<number | null>(null);

  const codeRef = useRef<HTMLInputElement>(null);

  /* ---------------- Reset à l'ouverture ---------------- */
  useEffect(() => {
    if (!ouvert) return;
    setCreationActive(false);
    setCode("");
    setLibelle("");
    setUri("");
    setErreurAjout(null);
    setRecherche("");
    setFiltreStatut("toutes");
    setMenu(null);
    setUriCopieeId(null);
  }, [ouvert]);

  /* ---------------- Focus auto en mode création ---------------- */
  useEffect(() => {
    if (creationActive) {
      setTimeout(() => codeRef.current?.focus(), 30);
    }
  }, [creationActive]);

  /* ---------------- Fermeture menu ---------------- */
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

  /* ---------------- Feedback copie URI ---------------- */
  useEffect(() => {
    if (uriCopieeId === null) return;
    const t = setTimeout(() => setUriCopieeId(null), 1500);
    return () => clearTimeout(t);
  }, [uriCopieeId]);

  /* ---------------- Listes filtrées ---------------- */
  const listeFiltree = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return codeSystems
      .filter((cs) => {
        if (filtreStatut === "actives" && !cs.actif) return false;
        if (filtreStatut === "inactives" && cs.actif) return false;
        if (!q) return true;
        return (
          cs.code.toLowerCase().includes(q) ||
          cs.libelle.toLowerCase().includes(q) ||
          (cs.uri ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.code.localeCompare(b.code, "fr"));
  }, [codeSystems, recherche, filtreStatut]);

  const compteurs = useMemo(() => {
    const total = codeSystems.length;
    const actives = codeSystems.filter((c) => c.actif).length;
    return { total, actives, inactives: total - actives };
  }, [codeSystems]);

  /* ---------------- Handlers du formulaire ---------------- */
  const demarrerCreation = () => {
    setCreationActive(true);
    setErreurAjout(null);
    setCode("");
    setLibelle("");
    setUri("");
  };

  const annulerCreation = () => {
    if (enCoursAjout) return;
    setCreationActive(false);
    setCode("");
    setLibelle("");
    setUri("");
    setErreurAjout(null);
  };

  const validerCreation = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErreurAjout(null);

    const codeNettoye = code.trim().toUpperCase();
    const libelleNettoye = libelle.trim();
    const uriNettoyee = uri.trim();

    if (!codeNettoye) return setErreurAjout("Le code est obligatoire.");
    if (!libelleNettoye) return setErreurAjout("Le libellé est obligatoire.");
    if (!uriNettoyee) return setErreurAjout("L'URI FHIR / URL canonique est obligatoire.");
    if (!REGEX_URI.test(uriNettoyee)) {
      return setErreurAjout("L'URI doit commencer par http:// ou https://.");
    }
    if (codeSystems.some((cs) => cs.code === codeNettoye)) {
      return setErreurAjout(`La terminologie « ${codeNettoye} » existe déjà.`);
    }

    setEnCoursAjout(true);
    try {
      const ok = await onCreerCodeSystem({
        code: codeNettoye,
        libelle: libelleNettoye,
        uri: uriNettoyee,
      });
      if (ok) {
        setCreationActive(false);
        setCode("");
        setLibelle("");
        setUri("");
      }
    } finally {
      setEnCoursAjout(false);
    }
  };

  /* ---------------- Handlers des lignes ---------------- */
  const basculer = async (cs: CodeSysteme) => {
    setActionEnCoursId(cs.id);
    try {
      await onBasculerActivation(cs.id, cs.actif);
    } finally {
      setActionEnCoursId(null);
    }
  };

  const copierUri = async (cs: CodeSysteme) => {
    if (!cs.uri) return;
    try {
      await navigator.clipboard.writeText(cs.uri);
      setUriCopieeId(cs.id);
    } catch {
      // Silencieux : certains navigateurs refusent sans HTTPS
    }
  };

  const ouvrirMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    cs: CodeSysteme,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({
      cs,
      top: Math.min(r.bottom + 4, window.innerHeight - 140),
      right: window.innerWidth - r.right,
    });
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
        onClick={enCoursAjout ? undefined : onFermer}
        aria-hidden="true"
      />

      {/* Tiroir */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="gestion-terminologies-titre"
        className="absolute top-0 right-0 bottom-0 w-[720px] max-w-full bg-white flex flex-col text-[#1f2937]"
        style={{ boxShadow: "-12px 0 40px rgba(15,27,61,.25)" }}
      >
        {/* ===================== Header ===================== */}
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2
              id="gestion-terminologies-titre"
              className="text-[17px] font-bold leading-tight"
            >
              Terminologies médicales
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              {compteurs.total} terminologie{compteurs.total > 1 ? "s" : ""} · utilisées
              pour la codification externe
            </p>
          </div>
          <button
            type="button"
            onClick={enCoursAjout ? undefined : onFermer}
            disabled={enCoursAjout}
            className={`p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50 ${FOCUS}`}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================== Barre d'actions (mode liste) ===================== */}
        {!creationActive && (
          <div className="px-6 pt-4 pb-2 flex items-center gap-2.5 shrink-0">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une terminologie…"
                aria-label="Rechercher une terminologie"
                className={`${CHAMP} pl-9`}
              />
            </div>

            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
              aria-label="Filtrer par statut"
              className={`${CHAMP} !w-auto min-w-[140px] shrink-0 cursor-pointer`}
            >
              <option value="toutes">Toutes ({compteurs.total})</option>
              <option value="actives">Actives ({compteurs.actives})</option>
              <option value="inactives">Inactives ({compteurs.inactives})</option>
            </select>

            <button
              type="button"
              onClick={demarrerCreation}
              disabled={enCoursAjout}
              className={`${BTN_PRIMAIRE} shrink-0`}
            >
              <Plus className="w-[18px] h-[18px]" />
              Ajouter une terminologie
            </button>
          </div>
        )}

        {/* ===================== Contenu ===================== */}
        <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-3 min-h-0">
          {/* ---- Formulaire inline (mode ajout) ---- */}
          {creationActive && (
            <form
              onSubmit={validerCreation}
              className="border border-[#1f9d55] rounded-[14px] p-4 flex flex-col gap-3 bg-white mt-2"
            >
              <div className="font-bold text-sm text-[#1f2937]">
                Nouvelle terminologie
              </div>

              {erreurAjout && (
                <div
                  role="alert"
                  className="p-2.5 bg-rose-50 border border-rose-200 text-[#b42318] rounded-[10px] text-[12px] font-medium"
                >
                  {erreurAjout}
                </div>
              )}

              <div className="flex gap-3">
                <div className="w-[180px] shrink-0">
                  <label htmlFor="cs-code" className={LABEL}>
                    Code <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    id="cs-code"
                    ref={codeRef}
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.toUpperCase().replace(/\s/g, ""))
                    }
                    placeholder="EX : LOINC"
                    disabled={enCoursAjout}
                    className={`${CHAMP} font-mono`}
                  />
                  <p className={AIDE}>Unique, en majuscules.</p>
                </div>
                <div className="flex-1 min-w-0">
                  <label htmlFor="cs-libelle" className={LABEL}>
                    Libellé <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    id="cs-libelle"
                    type="text"
                    value={libelle}
                    onChange={(e) => setLibelle(e.target.value)}
                    placeholder="ex : Logical Observation Identifiers Names and Codes"
                    disabled={enCoursAjout}
                    className={CHAMP}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cs-uri" className={LABEL}>
                  URI FHIR / URL canonique <span className="text-[#b42318]">*</span>
                </label>
                <input
                  id="cs-uri"
                  type="url"
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  placeholder="ex : http://loinc.org"
                  disabled={enCoursAjout}
                  className={`${CHAMP} font-mono`}
                />
                <p className={AIDE}>Doit commencer par http:// ou https://.</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={annulerCreation}
                  disabled={enCoursAjout}
                  className={BTN}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={enCoursAjout}
                  className={BTN_PRIMAIRE}
                >
                  {enCoursAjout ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    <Check className="w-[18px] h-[18px]" />
                  )}
                  {enCoursAjout ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </form>
          )}

          {/* ---- Liste / tableau ---- */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white overflow-hidden">
            {/* Header : uniquement en mode liste */}
            {!creationActive && (
              <div className="bg-[#fafbfa] border-b border-[#e5e7eb] flex items-center h-10 px-4">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]"
                  style={{ width: 76 }}
                >
                  Code
                </span>
                <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                  Libellé et URI
                </span>
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]"
                  style={{ width: 112 }}
                >
                  Utilisation
                </span>
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]"
                  style={{ width: 96 }}
                >
                  Statut
                </span>
                <span style={{ width: 24 }} aria-hidden="true" />
              </div>
            )}

            {/* Rows */}
            {listeFiltree.length === 0 ? (
              <div className="p-10 text-center text-[#5b6472] text-sm italic">
                {codeSystems.length === 0
                  ? "Aucune terminologie enregistrée. Ajoutez-en une pour coder les diagnostics, observations et actes."
                  : "Aucune terminologie ne correspond aux filtres appliqués."}
              </div>
            ) : (
              listeFiltree.map((cs) => {
                const nbUtilisations = compteParCodeSystemId?.[cs.id] ?? 0;
                const labelUtilisation = `${nbUtilisations} observation${
                  nbUtilisations > 1 ? "s" : ""
                }`;
                const estCopie = uriCopieeId === cs.id;

                return (
                  <div
                    key={cs.id}
                    className="flex items-start px-4 py-3 border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors gap-3"
                  >
                    {/* Code */}
                    <div style={{ width: 64 }} className="shrink-0">
                      <span className={EXT_CHIP} title={cs.code}>
                        {cs.code}
                      </span>
                    </div>

                    {/* Libellé + URI */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14px] text-[#1f2937] truncate">
                        {cs.libelle}
                      </div>
                      {cs.uri ? (
                        <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
                          <span
                            className="font-mono text-[12px] text-[#5b6472] truncate"
                            title={cs.uri}
                            style={{ maxWidth: 340 }}
                          >
                            {cs.uri}
                          </span>
                          <button
                            type="button"
                            onClick={() => copierUri(cs)}
                            aria-label="Copier l'URI"
                            title={estCopie ? "URI copiée !" : "Copier l'URI"}
                            className={`shrink-0 p-0.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#f0f2f1] cursor-pointer ${FOCUS}`}
                          >
                            {estCopie ? (
                              <Check className="w-3.5 h-3.5 text-[#14703c]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[12px] italic text-[#8a5300] mt-0.5">
                          Aucune URI canonique
                        </div>
                      )}
                    </div>

                    {/* Utilisation */}
                    <div
                      className="text-[12px] text-[#5b6472] shrink-0"
                      style={{ width: 112 }}
                    >
                      {labelUtilisation}
                    </div>

                    {/* Statut (toggle + label) */}
                    <div
                      className="flex items-center gap-2 shrink-0"
                      style={{ width: 96 }}
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={cs.actif}
                        aria-label={`${cs.actif ? "Désactiver" : "Activer"} ${cs.libelle}`}
                        onClick={() => basculer(cs)}
                        disabled={actionEnCoursId === cs.id}
                        className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                          cs.actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                        } ${FOCUS}`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                            cs.actif ? "left-4" : "left-0.5"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-[12px] font-bold ${
                          cs.actif ? "text-[#14703c]" : "text-[#5b6472]"
                        }`}
                      >
                        {cs.actif ? "Actif" : "Inactif"}
                      </span>
                    </div>

                    {/* Menu ⋯ */}
                    <div style={{ width: 24 }} className="shrink-0 text-center">
                      <button
                        type="button"
                        aria-label={`Actions pour ${cs.code}`}
                        aria-haspopup="menu"
                        onClick={(e) => ouvrirMenu(e, cs)}
                        className={`h-6 w-6 grid place-items-center rounded text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] cursor-pointer ${FOCUS}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {listeFiltree.length > 0 && !creationActive && (
            <p className="text-[11px] text-[#5b6472] px-1">
              <strong className="font-bold text-[#1f2937]">{listeFiltree.length}</strong>{" "}
              terminologie{listeFiltree.length > 1 ? "s" : ""} affichée
              {listeFiltree.length > 1 ? "s" : ""}
              {listeFiltree.length !== codeSystems.length && (
                <> sur {codeSystems.length}</>
              )}
            </p>
          )}
        </div>

        {/* ===================== Footer ===================== */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onFermer}
            disabled={enCoursAjout}
            className={BTN}
          >
            Fermer
          </button>
        </div>

        {/* ===================== Menu ⋯ (fixed) ===================== */}
        {menu && (
          <>
            <div
              className="fixed inset-0 z-[70]"
              onClick={() => setMenu(null)}
              aria-hidden="true"
            />
            <div
              role="menu"
              style={{ top: menu.top, right: menu.right }}
              className="fixed z-[75] w-56 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  basculer(menu.cs);
                  setMenu(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer ${
                  menu.cs.actif
                    ? "text-[#b42318] hover:bg-rose-50"
                    : "text-[#14703c] hover:bg-[#e7f6ed]"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {menu.cs.actif ? "Désactiver" : "Réactiver"}
              </button>
              {menu.cs.uri && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    copierUri(menu.cs);
                    setMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#5b6472]" />
                  Copier l'URI
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default GestionCodeSystemsModale;