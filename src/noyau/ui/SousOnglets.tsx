/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface OngletElement {
  id: string;
  libelle: string;
  icone?: React.ReactNode;
  badge?: number | string;
}

export interface SousOngletsProps {
  onglets: OngletElement[];
  ongletActif: string;
  onChanger: (id: string) => void;
}

export const SousOnglets: React.FC<SousOngletsProps> = ({ onglets, ongletActif, onChanger }) => {
  return (
    <div className="overflow-x-auto scrollbar-none py-1">
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-250/80 shadow-2xs min-w-max"
      >
        {onglets.map((onglet) => {
          const estActif = onglet.id === ongletActif;
          return (
            <button
              key={onglet.id}
              role="tab"
              aria-selected={estActif}
              type="button"
              onClick={() => onChanger(onglet.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                estActif
                  ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent"
              }`}
            >
              {onglet.icone && (
                <span
                  className={`h-4 w-4 shrink-0 flex items-center justify-center transition-colors ${
                    estActif ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {onglet.icone}
                </span>
              )}
              <span>{onglet.libelle}</span>
              {onglet.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md tabular-nums transition-colors ${
                    estActif
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200/80"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {onglet.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SousOnglets;
