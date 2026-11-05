/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Inbox } from "lucide-react";

export interface ColonneTableau {
  cle: string;
  entete: string;
  alignement?: "gauche" | "centre" | "droite";
  largeur?: string;
}

export interface TableauDonneesProps {
  colonnes: ColonneTableau[];
  children: React.ReactNode;
  estVide?: boolean;
  messageVide?: string;
  chargement?: boolean;
}

export const TableauDonnees: React.FC<TableauDonneesProps> = ({
  colonnes,
  children,
  estVide = false,
  messageVide = "Aucun enregistrement trouvé.",
  chargement = false,
}) => {
  const alignClasses = {
    gauche: "text-left",
    centre: "text-center",
    droite: "text-right",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs transition-all">
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider select-none">
              {colonnes.map((col) => (
                <th
                  key={col.cle}
                  style={col.largeur ? { width: col.largeur } : undefined}
                  className={`py-3 px-3.5 whitespace-nowrap ${alignClasses[col.alignement || "gauche"]}`}
                >
                  {col.entete}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {chargement ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    {colonnes.map((col) => (
                      <td key={col.cle} className="py-3.5 px-3.5">
                        <div className="h-3.5 bg-slate-150 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ) : estVide ? (
              <tr>
                <td colSpan={colonnes.length} className="py-14 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="p-3 rounded-full bg-slate-50 border border-slate-200/60 text-slate-350">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{messageVide}</span>
                  </div>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableauDonnees;
