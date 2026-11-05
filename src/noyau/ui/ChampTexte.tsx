/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface ChampTexteProps {
  label?: string;
  etiquette?: string;
  valeur: string;
  onChange?: (valeur: string) => void;
  surChangement?: (valeur: string) => void;
  type?: "text" | "email" | "password" | "number" | "tel" | "date";
  placeholder?: string;
  obligatoire?: boolean;
  requis?: boolean;
  desactive?: boolean;
  lectureSeule?: boolean;
  erreur?: string;
  aide?: string;
  icone?: React.ReactNode;
  nom?: string;
  autoComplete?: string;
}

export const ChampTexte: React.FC<ChampTexteProps> = ({
  label,
  etiquette,
  valeur,
  onChange,
  surChangement,
  type = "text",
  placeholder,
  obligatoire = false,
  requis = false,
  desactive = false,
  lectureSeule = false,
  erreur,
  aide,
  icone,
  nom,
  autoComplete,
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

      <input
        name={nom}
        type={type}
        value={valeur}
        onChange={(e) => changer(e.target.value)}
        placeholder={placeholder}
        disabled={desactive}
        readOnly={lectureSeule}
        autoComplete={autoComplete}
        required={estRequis}
        className={`w-full bg-white border rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 transition focus:outline-hidden focus:ring-1 ${
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

export default ChampTexte;
