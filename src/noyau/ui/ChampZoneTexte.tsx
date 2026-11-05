/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface ChampZoneTexteProps {
  label?: string;
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  lignes?: number;
  obligatoire?: boolean;
  desactive?: boolean;
  lectureSeule?: boolean;
  erreur?: string;
  aide?: string;
  nom?: string;
}

export const ChampZoneTexte: React.FC<ChampZoneTexteProps> = ({
  label,
  valeur,
  onChange,
  placeholder,
  lignes = 3,
  obligatoire = false,
  desactive = false,
  lectureSeule = false,
  erreur,
  aide,
  nom,
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-slate-700 font-semibold text-xs flex items-center justify-between">
          <span>{label}</span>
          {obligatoire && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <textarea
        name={nom}
        rows={lignes}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={desactive}
        readOnly={lectureSeule}
        required={obligatoire}
        className={`w-full bg-white border rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 transition focus:outline-hidden focus:ring-1 resize-y ${
          erreur
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30"
            : "border-slate-300 focus:border-asina-500 focus:ring-asina-500"
        } ${desactive ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""}`}
      />

      {erreur && <p className="text-[11px] text-rose-600 font-medium">{erreur}</p>}
      {!erreur && aide && <p className="text-[10px] text-slate-400">{aide}</p>}
    </div>
  );
};

export default ChampZoneTexte;
