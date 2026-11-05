// src/briques/allergies/ui/PanneauAllergies.tsx

import React, { useState } from "react";
import {
  AlertTriangle,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";

import type { ModeAffichage } from "@/cerveau/permissions/types";
import { useAllergies } from "../hooks/useAllergies";
import { LIBELLES_CATEGORIE } from "../modele/allergie.types";
import {
  BadgeCriticalite,
  BadgeStatut,
  BadgeVerification,
} from "./BadgesAllergie";
import { FormulaireAllergieTiroir } from "./FormulaireAllergieTiroir";
import { FicheAllergieTiroir } from "./FicheAllergieTiroir";

/* ── Design tokens ─────────────────────────────────────────────────── */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const PUCE =
  "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";

export interface PanneauAllergiesProps {
  mode?: ModeAffichage;
  patientId?: number | null;
  patientNom?: string;
}

export const PanneauAllergies: React.FC<PanneauAllergiesProps> = ({
  mode = "edition",
  patientId,
  patientNom,
}) => {
  // Tous les hooks d'abord, les retours conditionnels ensuite.
  const {
    allergies,
    allergiesAffichees,
    definitionsActives,
    principesActifs,
    referentiels,
    chargement,
    actionEnCours,
    erreur,
    stats,
    inclureInactives,
    setInclureInactives,
    filtreCategorie,
    setFiltreCategorie,
    recherche,
    setRecherche,
    recharger,
    creer,
    changerStatut,
    ajouterReaction,
  } = useAllergies(patientId);

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [ficheId, setFicheId] = useState<number | null>(null);

  if (mode === "masque") return null;

  if (!patientId) {
    return (
      <div className={`${CARTE} p-8 text-center text-[13px] text-[#5b6472]`}>
        Sélectionnez un patient pour afficher ses allergies.
      </div>
    );
  }

  const estLectureSeule = mode === "lecture";
  const categories = referentiels?.categories ?? [];
  const ficheAllergie = allergies.find((a) => a.id === ficheId) ?? null;
  const aucuneSource =
    definitionsActives.length === 0 && principesActifs.length === 0;

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            Allergies {patientNom ? `— ${patientNom}` : ""}
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Substances allergènes, criticité et réactions documentées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recharger}
            disabled={chargement}
            className={`${BTN_SECONDAIRE} px-2.5!`}
            title="Rafraîchir"
            aria-label="Rafraîchir"
          >
            <RefreshCw
              className={`h-4 w-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
          </button>
          {!estLectureSeule && (
            <button
              type="button"
              onClick={() => setFormulaireOuvert(true)}
              disabled={chargement || aucuneSource}
              className={BTN_PRIMAIRE}
              title={
                aucuneSource && !chargement
                  ? "Aucune substance active et aucun principe actif disponible"
                  : undefined
              }
            >
              <Plus className="h-4.5 w-4.5" />
              Nouvelle allergie
            </button>
          )}
        </div>
      </div>

      {/* ===================== Stats ===================== */}
      <div
        className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 h-14`}
      >
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.total}</b> allergies
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.actives}</b> actives
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.reactionnes}</b> avec
          réactions
        </span>
        {stats.critiques > 0 && (
          <span
            className={`${PUCE} ml-auto bg-rose-50 text-rose-700 px-3.5 py-1.5 text-[13px]`}
          >
            <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
            {stats.critiques} à criticité élevée
          </span>
        )}
      </div>

      {/* ===================== Filtres ===================== */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une substance ou une note…"
            aria-label="Rechercher une allergie"
            className={`${CHAMP} w-full pl-9`}
          />
        </div>

        <select
          value={filtreCategorie}
          onChange={(e) => setFiltreCategorie(e.target.value)}
          aria-label="Filtrer par catégorie"
          className={`${CHAMP} md:w-50`}
        >
          <option value="toutes">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.valeur} value={c.valeur}>
              {c.libelle}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 text-[13px] text-[#5b6472] cursor-pointer select-none h-10">
          <input
            type="checkbox"
            checked={inclureInactives}
            onChange={(e) => setInclureInactives(e.target.checked)}
            className="h-4 w-4 accent-[#1f9d55]"
          />
          <Filter className="h-3.5 w-3.5" />
          Inclure inactives & résolues
        </label>
      </div>

      {/* ===================== Erreur ===================== */}
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

      {/* ===================== Tableau ===================== */}
      <div className={`${CARTE} overflow-hidden`}>
        {chargement ? (
          <div className="p-12 text-center text-[#5b6472]">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55] mx-auto mb-2" />
            <span className="text-xs">Chargement des allergies…</span>
          </div>
        ) : allergiesAffichees.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px] space-y-1">
            <Stethoscope
              className="h-8 w-8 mx-auto text-[#5b6472]"
              strokeWidth={1.6}
            />
            <b className="block text-[#1f2937]">Aucune allergie</b>
            <p>
              {inclureInactives || recherche || filtreCategorie !== "toutes"
                ? "Aucun résultat pour les filtres appliqués."
                : "Aucune allergie documentée pour ce patient."}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-[#fafbfa] border-b border-[#e5e7eb] flex items-center h-10 px-4 text-[11px] font-bold uppercase tracking-wider text-[#5b6472]">
              <span className="flex-1 min-w-55">Substance</span>
              <span className="w-35">Catégorie</span>
              <span className="w-32.5">Criticité</span>
              <span className="w-35">Vérification</span>
              <span className="w-30">Statut</span>
              <span className="w-27.5">Réactions</span>
              <span className="w-10" />
            </div>

            {allergiesAffichees.map((a) => {
              const libelle =
                a.allergieDefinitionLibelle ??
                a.principeActifLibelle ??
                `Allergie #${a.id}`;

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setFicheId(a.id)}
                  className="w-full flex items-center h-13.5 px-4 gap-3 border-t border-[#f0f2f1] hover:bg-[#fafbfa] text-left cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-55 flex items-center gap-2">
                    <ShieldAlert
                      className={`h-4 w-4 shrink-0 ${
                        a.criticalite === "high"
                          ? "text-rose-600"
                          : "text-[#5b6472]"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[#1f2937] truncate">
                        {libelle}
                      </div>
                      {a.allergieDefinitionCode && (
                        <div className="text-[11px] font-mono text-[#5b6472] truncate">
                          {a.allergieDefinitionCode}
                        </div>
                      )}
                      {!a.allergieDefinitionCode && a.principeActifLibelle && (
                        <div className="text-[11px] font-mono text-[#5b6472] truncate">
                          PA #{a.principeActifId}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="w-35 text-[12px] font-semibold text-[#1f2937]">
                    {LIBELLES_CATEGORIE[a.categorie]}
                  </span>
                  <span className="w-32.5">
                    <BadgeCriticalite valeur={a.criticalite} />
                  </span>
                  <span className="w-35">
                    <BadgeVerification valeur={a.verificationStatut} />
                  </span>
                  <span className="w-30">
                    <BadgeStatut statut={a.statut} />
                  </span>
                  <span className="w-27.5 text-[12px] text-[#5b6472]">
                    {a.reactions.length > 0 ? (
                      <span className="font-bold text-[#1f2937]">
                        {a.reactions.length}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="w-10 text-center">
                    <MoreHorizontal className="h-5 w-5 text-[#5b6472]" />
                  </span>
                </button>
              );
            })}

            <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-[11px] text-[#5b6472]">
              <strong className="font-bold text-[#1f2937]">
                {allergiesAffichees.length}
              </strong>{" "}
              allergie{allergiesAffichees.length > 1 ? "s" : ""} affichée
              {allergiesAffichees.length > 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>

      {/* ===================== Tiroirs ===================== */}
      <FormulaireAllergieTiroir
        ouvert={formulaireOuvert}
        patientId={patientId}
        definitionsActives={definitionsActives}
        principesActifs={principesActifs}
        referentiels={referentiels}
        enCours={actionEnCours}
        onFermer={() => setFormulaireOuvert(false)}
        onCreer={async (input) => {
          const creee = await creer(input);
          if (creee) setFormulaireOuvert(false);
          return creee !== null;
        }}
      />

      <FicheAllergieTiroir
        ouvert={ficheAllergie !== null}
        allergie={ficheAllergie}
        mode={mode}
        definitionsActives={definitionsActives}
        referentiels={referentiels}
        enCours={actionEnCours}
        onFermer={() => setFicheId(null)}
        onChangerStatut={(id, input) => changerStatut(id, input)}
        onAjouterReaction={async (id, input) => {
          const ok = await ajouterReaction(id, input);
          return ok !== null;
        }}
      />
    </div>
  );
};

export default PanneauAllergies;