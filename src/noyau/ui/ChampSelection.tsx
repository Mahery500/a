/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface OptionSelection {
  valeur: string | number;
  libelle: string;
  desactive?: boolean;
}

export interface ChampSelectionProps {
  label?: string;
  etiquette?: string;
  valeur: string | number;
  onChange?: (valeur: string) => void;
  surChangement?: (valeur: string) => void;
  options: OptionSelection[];
  placeholderOption?: string;
  obligatoire?: boolean;
  requis?: boolean;
  desactive?: boolean;
  erreur?: string;
  aide?: string;
  icone?: React.ReactNode;
  nom?: string;
}

export const ChampSelection: React.FC<ChampSelectionProps> = ({
  label,
  etiquette,
  valeur,
  onChange,
  surChangement,
  options,
  placeholderOption = "— Sélectionner —",
  obligatoire = false,
  requis = false,
  desactive = false,
  erreur,
  aide,
  icone,
  nom,
}) => {
  const libelleAffiche = label ?? etiquette;
  const estRequis = obligatoire || requis;
  const changer = onChange ?? surChangement ?? (() => {});

  return (
    <div className="space-y-1">
      {libelleAffiche && (
        <label className="block text-slate-700 font-semibold text-xs flex items-center gap-1.5">
          {icone && <span className="text-slate-400 shrink-0">{icone}</span>}
          <span>{libelleAffiche}</span>
          {estRequis && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <select
        name={nom}
        value={valeur}
        onChange={(e) => changer(e.target.value)}
        disabled={desactive}
        required={estRequis}
        className={`w-full bg-white border rounded-lg p-2 text-xs text-slate-800 transition focus:outline-hidden focus:ring-1 ${
          erreur
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30"
            : "border-slate-300 focus:border-asina-500 focus:ring-asina-500"
        } ${desactive ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""}`}
      >
        {placeholderOption && (
          <option value="" disabled={estRequis}>
            {placeholderOption}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.valeur} value={opt.valeur} disabled={opt.desactive}>
            {opt.libelle}
          </option>
        ))}
      </select>

      {erreur && <p className="text-[11px] text-rose-600 font-medium">{erreur}</p>}
      {!erreur && aide && <p className="text-[10px] text-slate-400">{aide}</p>}
    </div>
  );
};

export default ChampSelection;
