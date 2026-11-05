/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, X } from "lucide-react";

export interface ChampRechercheProps {
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  onVider?: () => void;
  desactive?: boolean;
}

export const ChampRecherche: React.FC<ChampRechercheProps> = ({
  valeur,
  onChange,
  placeholder = "Rechercher...",
  onVider,
  desactive = false,
}) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={desactive}
        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 transition focus:outline-hidden focus:bg-white focus:border-asina-500 focus:ring-1 focus:ring-asina-500"
      />
      {valeur && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            if (onVider) onVider();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          title="Effacer la recherche"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default ChampRecherche;
