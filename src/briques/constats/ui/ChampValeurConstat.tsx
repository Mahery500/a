/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlignLeft } from "lucide-react";
import type { DefinitionConstat } from "../modele/constat.types";

/**
 * Code de la définition spéciale « constat libre ».
 * On garde la comparaison locale (pas d'import de types) pour que le
 * composant reste testable isolément et n'impose pas d'ordre de refactor.
 */
const CODE_CONSTAT_LIBRE = "CONSTAT_LIBRE";

/** Limite imposée par la colonne partagée `observations.valeur` (VARCHAR 255). */
const MAX_LONGUEUR_LIBRE = 255;

/** À partir de ce seuil, le compteur passe en couleur d'alerte. */
const SEUIL_ALERTE = MAX_LONGUEUR_LIBRE - 15;

export interface ChampValeurConstatProps {
  definition: DefinitionConstat;
  valeur: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

/** Rendu du champ de saisie, adapté au type de valeur du constat. */
export const ChampValeurConstat: React.FC<ChampValeurConstatProps> = ({
  definition,
  valeur,
  onChange,
  disabled,
}) => {
  const classeBase =
    "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
    "focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
    "disabled:bg-[#fafbfa] disabled:text-[#5b6472]/60";

  const libelle = (
    <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
      Valeur <span className="text-[#b42318]">*</span>
    </span>
  );

  /* ── Booléen : deux boutons Oui / Non ───────────────────────────── */
  if (definition.typeValeur === "booleen") {
    return (
      <label className="flex flex-col gap-1.5">
        {libelle}
        <div className="flex gap-2">
          {[
            { v: "true", label: "Oui", actif: valeur === "true" },
            { v: "false", label: "Non", actif: valeur === "false" },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.v)}
              aria-pressed={opt.actif}
              className={`flex-1 h-10 rounded-[10px] border text-sm font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                opt.actif
                  ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c]"
                  : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </label>
    );
  }

  /* ── Numérique : input texte avec unité affichée ────────────────── */
  if (definition.typeValeur === "numerique") {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between">
          {libelle}
          {definition.uniteCode && (
            <span className="text-[11px] font-mono font-bold text-[#14703c] bg-[#e7f6ed] px-2 py-0.5 rounded">
              {definition.uniteCode}
            </span>
          )}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Valeur numérique (ex. 37.5)"
          className={classeBase}
        />
        <span className="text-[11px] text-[#5b6472]">
          Le séparateur décimal « , » ou « . » est accepté.
        </span>
      </label>
    );
  }

  /* ── Texte : deux cas possibles ─────────────────────────────────── *
   *  - constat libre (code CONSTAT_LIBRE) : badge + compteur + aide
   *    sur le champ Commentaire pour le détail ;
   *  - texte standard (définition nommée) : input simple.              */
  const estLibre = definition.code.toUpperCase() === CODE_CONSTAT_LIBRE;
  const longueur = valeur.length;
  const procheLimite = estLibre && longueur >= SEUIL_ALERTE;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between gap-2">
        {libelle}
        {estLibre && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#14703c] bg-[#e7f6ed] px-2 py-0.5 rounded"
            title="Constat décrit en texte libre — sera promu plus tard en définition dédiée si récurrent."
          >
            <AlignLeft className="h-3 w-3" aria-hidden="true" />
            Constat libre
          </span>
        )}
      </span>

      <input
        type="text"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={estLibre ? MAX_LONGUEUR_LIBRE : undefined}
        placeholder={
          estLibre
            ? "Décrivez brièvement ce que vous observez…"
            : "Saisir un texte libre…"
        }
        aria-describedby={estLibre ? "aide-constat-libre" : undefined}
        className={classeBase}
      />

      {estLibre && (
        <span
          id="aide-constat-libre"
          className="flex items-baseline justify-between gap-2"
        >
          <span className="text-[11px] text-[#5b6472]">
            Pour un constat détaillé (jusqu'à 2000 caractères), utilisez le champ{" "}
            <b className="font-semibold">« Commentaire »</b> ci-dessous.
          </span>
          <span
            className={`text-[11px] font-mono tabular-nums shrink-0 ${
              procheLimite
                ? "text-[#8a5300] font-bold"
                : "text-[#5b6472]"
            }`}
            aria-live="polite"
          >
            {longueur} / {MAX_LONGUEUR_LIBRE}
          </span>
        </span>
      )}
    </label>
  );
};