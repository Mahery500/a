/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

export interface ModaleProps {
  ouvert?: boolean;
  ouverte?: boolean;
  onFermer?: () => void;
  surFermeture?: () => void;
  titre: React.ReactNode;
  description?: React.ReactNode;
  enfants?: React.ReactNode;
  children?: React.ReactNode;
  icone?: React.ReactNode;
  pied?: React.ReactNode;
  largeurMax?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export const Modale: React.FC<ModaleProps> = ({
  ouvert,
  ouverte,
  onFermer,
  surFermeture,
  titre,
  description,
  enfants,
  children,
  icone,
  pied,
  largeurMax = "md",
}) => {
  const estOuvert = ouvert ?? ouverte ?? false;
  
  const fermer = useCallback(
    () => {
      (onFermer ?? surFermeture)?.();
    },
    [onFermer, surFermeture]
  );

  const contenu = enfants ?? children;

  useEffect(() => {
    if (!estOuvert) return;
    const gererTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    window.addEventListener("keydown", gererTouche);
    return () => window.removeEventListener("keydown", gererTouche);
  }, [estOuvert, fermer]);

  if (!estOuvert) return null;

  const classesLargeur: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-slide-in">
      <div
        className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full ${classesLargeur[largeurMax] || "max-w-md"} max-h-[92vh] flex flex-col overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            {icone && (
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                {icone}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{titre}</h3>
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={fermer}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Fermer la fenêtre modale"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">{contenu}</div>

        {pied && (
          <div className="border-t border-slate-150 px-5 py-3.5 bg-slate-50/80 rounded-b-2xl flex justify-end gap-2 shrink-0">
            {pied}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modale;
