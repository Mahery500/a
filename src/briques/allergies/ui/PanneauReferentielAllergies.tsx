// src/briques/allergies/ui/PanneauReferentielAllergies.tsx

import React, { useState } from "react";
import { MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";

import type { ModeAffichage } from "@/cerveau/permissions/types";
import {
  COULEURS_STATUT,
  LIBELLES_CATEGORIE,
  type Allergie,
  type AllergieCategorie,
  type AllergieDefinition,
} from "../modele/allergie.types";
import { useReferentielAllergies } from "../hooks/useReferentielAllergies";
import { FormulaireAllergieDefinitionTiroir } from "./FormulaireAllergieDefinitionTiroir";

const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";
const CHIP_CODE =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-xs font-bold";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

interface MenuEtat {
  def: AllergieDefinition;
  top: number;
  right: number;
}

export interface PanneauReferentielAllergiesProps {
  mode?: ModeAffichage;
}

export const PanneauReferentielAllergies: React.FC<
  PanneauReferentielAllergiesProps
> = ({ mode = "edition" }) => {
  if (mode === "masque") return null;
  const estLectureSeule = mode === "lecture";

  const {
    definitions,
    definitionsToutes,
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
  } = useReferentielAllergies();

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [definitionEnEdition, setDefinitionEnEdition] =
    useState<AllergieDefinition | null>(null);
  const [menu, setMenu] = useState<MenuEtat | null>(null);

  const stats = {
    total: definitionsToutes.length,
    actifs: definitionsToutes.filter((d) => d.actif).length,
    inactifs: definitionsToutes.filter((d) => !d.actif).length,
  };

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            Référentiel des substances allergènes
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Substances actives utilisables dans les fiches patient.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recharger}
            disabled={chargement}
            className={`${BTN_SECONDAIRE} !px-2.5`}
            aria-label="Rafraîchir"
          >
            <RefreshCw
              className={`h-4 w-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
          </button>
          {!estLectureSeule && (
            <button
              type="button"
              onClick={() => {
                setDefinitionEnEdition(null);
                setFormulaireOuvert(true);
              }}
              className={BTN_PRIMAIRE}
            >
              <Plus className="h-[18px] w-[18px]" />
              Nouvelle substance
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 h-14`}>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.total}</b> substances
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.actifs}</b> actives
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.inactifs}</b> inactives
        </span>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par code ou libellé…"
            aria-label="Rechercher"
            className={`${CHAMP} w-full pl-9`}
          />
        </div>
        <select
          value={filtreCategorie}
          onChange={(e) =>
            setFiltreCategorie(e.target.value as AllergieCategorie | "toutes")
          }
          aria-label="Catégorie"
          className={`${CHAMP} md:w-[200px]`}
        >
          <option value="toutes">Toutes catégories</option>
          {Object.entries(LIBELLES_CATEGORIE).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={filtreActif}
          onChange={(e) =>
            setFiltreActif(e.target.value as "tous" | "actifs" | "inactifs")
          }
          aria-label="Statut"
          className={`${CHAMP} md:w-[170px]`}
        >
          <option value="tous">Tous statuts</option>
          <option value="actifs">Actifs</option>
          <option value="inactifs">Inactifs</option>
        </select>
      </div>

      {erreur && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-rose-700 text-xs flex items-center justify-between">
          <span>{erreur}</span>
          <button
            type="button"
            onClick={recharger}
            className="font-bold underline cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau */}
      <div className={`${CARTE} overflow-hidden`}>
        {chargement ? (
          <div className="p-12 text-center text-[#5b6472]">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55] mx-auto mb-2" />
            <span className="text-xs">Chargement du référentiel…</span>
          </div>
        ) : definitions.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px]">
            {definitionsToutes.length === 0
              ? "Aucune substance enregistrée."
              : "Aucun résultat pour les filtres appliqués."}
          </div>
        ) : (
          <>
            <div className="bg-[#fafbfa] border-b border-[#e5e7eb] flex items-center h-10 px-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
              <span className="w-[160px]">Code</span>
              <span className="flex-1">Libellé</span>
              <span className="w-[160px]">Catégorie</span>
              <span className="w-[140px]">Codifications</span>
              <span className="w-[120px]">Statut</span>
              <span className="w-[40px]" />
            </div>
            {definitions.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDefinitionEnEdition(d);
                  setFormulaireOuvert(true);
                }}
                className="w-full flex items-center h-[54px] px-4 gap-3 border-t border-[#f0f2f1] hover:bg-[#fafbfa] text-left cursor-pointer transition-colors"
              >
                <span className="w-[160px]">
                  <span className={CHIP_CODE}>{d.code}</span>
                </span>
                <span className="flex-1 font-bold text-[#1f2937] truncate">
                  {d.libelle}
                </span>
                <span className="w-[160px] text-[12px] text-[#1f2937]">
                  {LIBELLES_CATEGORIE[d.categorie]}
                </span>
                <span className="w-[140px] text-[12px] text-[#5b6472]">
                  {d.codifications.length > 0
                    ? `${d.codifications.length} code${d.codifications.length > 1 ? "s" : ""}`
                    : "—"}
                </span>
                <span className="w-[120px]">
                  <span
                    className={`${PUCE} ${
                      d.actif
                        ? "bg-[#e7f6ed] text-[#14703c]"
                        : "bg-[#f0f2f1] text-[#5b6472]"
                    }`}
                  >
                    {d.actif ? "Actif" : "Inactif"}
                  </span>
                </span>
                <span className="w-[40px] text-center">
                  <MoreHorizontal className="h-5 w-5 text-[#5b6472]" />
                </span>
              </button>
            ))}
            <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-[11px] text-[#5b6472]">
              <strong className="font-bold text-[#1f2937]">
                {definitions.length}
              </strong>{" "}
              substance{definitions.length > 1 ? "s" : ""} affichée
              {definitions.length > 1 ? "s" : ""} sur {definitionsToutes.length}
            </div>
          </>
        )}
      </div>

      <FormulaireAllergieDefinitionTiroir
        ouvert={formulaireOuvert}
        definitionEnEdition={definitionEnEdition}
        enCours={false}
        onFermer={() => setFormulaireOuvert(false)}
        onCreer={async (input) => {
          const ok = await creer(input);
          if (ok) setFormulaireOuvert(false);
          return ok;
        }}
        onModifier={async (id, input) => {
          const ok = await modifier(id, input);
          if (ok) setFormulaireOuvert(false);
          return ok;
        }}
        onBasculerActivation={basculerActivation}
      />
    </div>
  );
};

export default PanneauReferentielAllergies;