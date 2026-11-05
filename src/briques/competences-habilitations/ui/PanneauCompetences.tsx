/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { CompetenceItem, SousVueCompetence } from "../modele/competence.types";
import { competencesApi } from "../api/competences.api";
import { useCompetences } from "../hooks/useCompetences";
import { useUtilisationHabilitations } from "../hooks/useUtilisationHabilitations";
import { FormulaireCompetenceInline } from "./FormulaireCompetenceInline";

/* =====================================================================
 *  Tokens du design (maquettes Ch1 → Ch4)
 *  vert #1f9d55 · vert foncé #14703c · vert clair #e7f6ed
 *  ink #1f2937 · ink2 #5b6472 · bordure #e5e7eb · séparateur #f0f2f1
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BOUTON_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BOUTON_SECONDAIRE = `${BOUTON_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BOUTON_PRIMAIRE = `${BOUTON_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

interface MenuOuvert {
  item: CompetenceItem;
  top: number;
  right: number;
}

export interface PanneauCompetencesProps {
  mode?: ModeAffichage;
  sousOngletActif?: string | null;
  onSousOngletChange?: (id: string) => void;
}

/** Le check « mode masqué » est fait AVANT d'appeler les hooks API. */
export const PanneauCompetences: React.FC<PanneauCompetencesProps> = (props) => {
  if (props.mode === "masque") return null;
  return <ContenuCompetences {...props} />;
};

const ContenuCompetences: React.FC<PanneauCompetencesProps> = ({
  mode = "edition",
  sousOngletActif,
  onSousOngletChange,
}) => {
  const estLectureSeule = mode === "lecture";

  const [vueInterne, setVueInterne] = useState<SousVueCompetence>("corps_medicaux");
  const vueActive: SousVueCompetence =
    sousOngletActif === "corps_medicaux" || sousOngletActif === "specialites"
      ? sousOngletActif
      : vueInterne;

  // Les deux référentiels sont chargés : les compteurs des onglets
  // doivent être disponibles sans attendre un clic.
  const corpsHook = useCompetences(competencesApi.corpsMedicaux, "corps médical");
  const specialitesHook = useCompetences(competencesApi.specialites, "spécialité");

  const courantHook = vueActive === "corps_medicaux" ? corpsHook : specialitesHook;
  const libelleSingulier = vueActive === "corps_medicaux" ? "corps médical" : "spécialité";

  // Colonne « Utilisation » (N habilitations) — vient de actes + diagnostics.
  const { usageCorps, usageSpecialite } = useUtilisationHabilitations();
  const usage = vueActive === "corps_medicaux" ? usageCorps : usageSpecialite;

  const [recherche, setRecherche] = useState("");
  const [filtreActif, setFiltreActif] = useState<"tous" | "actifs" | "inactifs">("tous");
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<CompetenceItem | null>(null);
  const [menu, setMenu] = useState<MenuOuvert | null>(null);

  useEffect(() => {
    if (!menu) return;
    const fermer = () => setMenu(null);
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", surTouche);
    };
  }, [menu]);

  const items = courantHook.items;

  const stats = useMemo(
    () => ({
      total: items.length,
      actifs: items.filter((c) => c.actif).length,
      inactifs: items.filter((c) => !c.actif).length,
    }),
    [items],
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return items.filter((c) => {
      if (filtreActif === "actifs" && !c.actif) return false;
      if (filtreActif === "inactifs" && c.actif) return false;
      if (
        q &&
        !c.code.toLowerCase().includes(q) &&
        !c.libelle.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, recherche, filtreActif]);

  const changerVue = (id: SousVueCompetence) => {
    setVueInterne(id);
    onSousOngletChange?.(id);
    // Le formulaire en cours n'a pas de sens dans l'autre référentiel.
    setFormulaireOuvert(false);
    setEnEdition(null);
    setRecherche("");
    setFiltreActif("tous");
  };

  const ouvrirCreation = () => {
    setEnEdition(null);
    setFormulaireOuvert(true);
  };

  const ouvrirEdition = (item: CompetenceItem) => {
    setEnEdition(item);
    setFormulaireOuvert(true);
  };

  const fermerFormulaire = () => {
    setFormulaireOuvert(false);
    setEnEdition(null);
  };

  const handleEnregistrer = async (
    saisie: { code: string; libelle: string },
    id?: number,
  ): Promise<boolean> => {
    if (id) {
      const courante = items.find((c) => c.id === id);
      if (!courante) return false;
      return courantHook.modifier(id, { libelle: saisie.libelle }, courante);
    }
    return courantHook.creer({ code: saisie.code, libelle: saisie.libelle });
  };

  const boutonAction =
    vueActive === "corps_medicaux" ? "Nouveau corps médical" : "Nouvelle spécialité";

  const pilules = [
    { cle: "tous" as const, libelle: "Tous", n: stats.total },
    { cle: "actifs" as const, libelle: "Actifs", n: stats.actifs },
    { cle: "inactifs" as const, libelle: "Inactifs", n: stats.inactifs },
  ];

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            Compétences et habilitations
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Référentiels utilisés pour habiliter les actes et les diagnostics au personnel
            médical.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => courantHook.recharger()}
            disabled={courantHook.chargement}
            className={`${BOUTON_SECONDAIRE} !px-2.5`}
            title="Rafraîchir"
            aria-label="Rafraîchir"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                courantHook.chargement ? "animate-spin text-[#1f9d55]" : ""
              }`}
            />
          </button>
          {!estLectureSeule && (
            <button type="button" onClick={ouvrirCreation} className={BOUTON_PRIMAIRE}>
              <Plus className="h-[18px] w-[18px]" />
              {boutonAction}
            </button>
          )}
        </div>
      </div>

      {/* ===================== Barre de statistiques ===================== */}
      <div className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 h-14`}>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{stats.total}</b> référencés
        </span>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{stats.actifs}</b> actifs
        </span>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{stats.inactifs}</b> inactifs
        </span>
      </div>

      {/* ===================== Recherche + pilules ===================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par code ou libellé…"
            aria-label="Rechercher"
            className={`${CHAMP} w-full pl-9`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pilules.map((p) => {
            const actif = filtreActif === p.cle;
            return (
              <button
                key={p.cle}
                type="button"
                onClick={() => setFiltreActif(p.cle)}
                aria-pressed={actif}
                className={`rounded-full px-3.5 py-1.5 text-[13px] border cursor-pointer transition-colors ${FOCUS} ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
                }`}
              >
                {p.libelle} · {p.n}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================== Erreur de chargement ===================== */}
      {courantHook.erreur && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-rose-700 text-xs flex items-center justify-between">
          <span>{courantHook.erreur}</span>
          <button
            type="button"
            onClick={() => courantHook.recharger()}
            className="font-bold underline cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ===================== Formulaire inline ===================== */}
      {formulaireOuvert && !estLectureSeule && (
        <FormulaireCompetenceInline
          enEdition={enEdition}
          libelleSingulier={libelleSingulier}
          onFermer={fermerFormulaire}
          onEnregistrer={handleEnregistrer}
        />
      )}

      {/* ===================== Carte principale : tabs + tableau ===================== */}
      <div className={`${CARTE} overflow-hidden`}>
        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb]" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={vueActive === "corps_medicaux"}
            onClick={() => changerVue("corps_medicaux")}
            className={`px-5 h-12 flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer transition-colors border-b-2 ${FOCUS} ${
              vueActive === "corps_medicaux"
                ? "text-[#14703c] font-bold border-[#1f9d55]"
                : "text-[#5b6472] font-semibold border-transparent hover:text-[#1f2937]"
            }`}
          >
            Corps médicaux
            <span
              className={`px-2 rounded-full text-[10px] font-bold tabular-nums ${
                vueActive === "corps_medicaux"
                  ? "bg-[#e7f6ed] text-[#14703c]"
                  : "bg-[#f0f2f1] text-[#5b6472]"
              }`}
            >
              {corpsHook.items.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vueActive === "specialites"}
            onClick={() => changerVue("specialites")}
            className={`px-5 h-12 flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer transition-colors border-b-2 ${FOCUS} ${
              vueActive === "specialites"
                ? "text-[#14703c] font-bold border-[#1f9d55]"
                : "text-[#5b6472] font-semibold border-transparent hover:text-[#1f2937]"
            }`}
          >
            Spécialités
            <span
              className={`px-2 rounded-full text-[10px] font-bold tabular-nums ${
                vueActive === "specialites"
                  ? "bg-[#e7f6ed] text-[#14703c]"
                  : "bg-[#f0f2f1] text-[#5b6472]"
              }`}
            >
              {specialitesHook.items.length}
            </span>
          </button>
        </div>

        {/* Tableau */}
        {courantHook.chargement ? (
          <div className="p-12 text-center text-[#5b6472]">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55] mx-auto mb-2" />
            <span className="text-xs">Chargement des {libelleSingulier}s…</span>
          </div>
        ) : filtres.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px]">
            {items.length === 0
              ? `Aucun ${libelleSingulier} enregistré.`
              : "Aucun résultat pour les filtres appliqués."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    { label: "Code", w: "w-[242px]" },
                    { label: "Libellé", w: "w-auto" },
                    { label: "Utilisation", w: "w-[202px]" },
                    { label: "Statut", w: "w-[122px]" },
                    { label: "", w: "w-[40px]" },
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`${h.w} bg-[#fafbfa] text-left h-10 px-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-t border-[#e5e7eb]`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtres.map((c) => {
                  const nb = usage.get(c.code) ?? 0;
                  return (
                    <tr
                      key={c.id}
                      className="h-[54px] border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className={CODE_CHIP}>{c.code}</span>
                      </td>
                      <td className="px-4 py-2 font-bold text-[#1f2937]">{c.libelle}</td>
                      <td className="px-4 py-2 text-[12px] text-[#5b6472]">
                        {nb} habilitation{nb > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-2">
                        {estLectureSeule ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                              c.actif
                                ? "bg-[#e7f6ed] text-[#14703c]"
                                : "bg-[#f0f2f1] text-[#5b6472]"
                            }`}
                          >
                            {c.actif ? "Actif" : "Inactif"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={c.actif}
                            aria-label={`${c.actif ? "Désactiver" : "Activer"} ${c.libelle}`}
                            onClick={() => courantHook.basculerActivation(c)}
                            className={`inline-flex items-center gap-2 cursor-pointer ${FOCUS}`}
                          >
                            <span
                              className={`relative w-[34px] h-5 rounded-full transition-colors ${
                                c.actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                  c.actif ? "left-4" : "left-0.5"
                                }`}
                              />
                            </span>
                            <span
                              className={`text-[12px] font-bold ${
                                c.actif ? "text-[#14703c]" : "text-[#5b6472]"
                              }`}
                            >
                              {c.actif ? "Actif" : "Inactif"}
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {!estLectureSeule && (
                          <button
                            type="button"
                            aria-label={`Actions pour ${c.libelle}`}
                            aria-haspopup="menu"
                            onClick={(e) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              setMenu({
                                item: c,
                                top: r.bottom + 4,
                                right: window.innerWidth - r.right,
                              });
                            }}
                            className={`w-9 h-9 grid place-items-center rounded-[10px] text-[#5b6472] hover:bg-[#fafbfa] hover:text-[#1f2937] cursor-pointer transition-colors ${FOCUS}`}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!courantHook.chargement && filtres.length > 0 && (
          <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-[11px] text-[#5b6472]">
            <strong className="font-bold text-[#1f2937]">{filtres.length}</strong>{" "}
            {libelleSingulier}
            {filtres.length > 1 ? "s" : ""} affiché{filtres.length > 1 ? "s" : ""}
            {filtres.length !== items.length && (
              <> · sur {items.length} au total</>
            )}
          </div>
        )}
      </div>

      {/* ===================== Menu contextuel ⋯ ===================== */}
      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            style={{ top: menu.top, right: menu.right }}
            className="fixed z-50 w-52 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                ouvrirEdition(menu.item);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              Modifier
            </button>
            <div className="my-1 border-t border-[#f0f2f1]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                courantHook.basculerActivation(menu.item);
                setMenu(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer ${
                menu.item.actif
                  ? "text-[#b42318] hover:bg-rose-50"
                  : "text-[#14703c] hover:bg-[#e7f6ed]"
              }`}
            >
              {menu.item.actif ? "Désactiver" : "Réactiver"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PanneauCompetences;