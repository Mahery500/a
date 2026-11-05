/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Clock, RefreshCw, Stethoscope } from "lucide-react";
import type {
  ConstatEnregistre,
  StatutConstat,
} from "../modele/constat.types";

export interface ListeConstatsProps {
  constats: ConstatEnregistre[];
  chargement: boolean;
  inclureInactifs: boolean;
  onToggleInactifs: (v: boolean) => void;
  onRafraichir: () => void;
}

const LIBELLES_STATUT: Record<StatutConstat, string> = {
  preliminaire: "Préliminaire",
  final: "Final",
  corrige: "Corrigé",
  saisi_par_erreur: "Saisi par erreur",
};

const CLASSE_STATUT: Record<StatutConstat, string> = {
  preliminaire: "bg-[#fff4e0] text-[#8a5300] border-[#f3d9a8]",
  final: "bg-[#e7f6ed] text-[#14703c] border-[#1f9d55]/30",
  corrige: "bg-[#f0f2f1] text-[#5b6472] border-[#e5e7eb]",
  saisi_par_erreur: "bg-rose-50 text-rose-700 border-rose-200 line-through",
};

const formaterValeur = (c: ConstatEnregistre): string => {
  if (c.typeValeur === "booleen") {
    if (c.valeur === "true") return "Oui";
    if (c.valeur === "false") return "Non";
    return c.valeur;
  }
  if (c.typeValeur === "numerique" && c.uniteCode) {
    return `${c.valeur} ${c.uniteCode}`;
  }
  return c.valeur;
};

const formaterDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const ListeConstats: React.FC<ListeConstatsProps> = ({
  constats,
  chargement,
  inclureInactifs,
  onToggleInactifs,
  onRafraichir,
}) => {
  return (
    <div className="flex flex-col min-h-0">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#f0f2f1]">
        <div>
          <h3 className="text-sm font-bold text-[#1f2937]">
            Constats ({constats.length})
          </h3>
          <p className="text-[11px] text-[#5b6472]">
            Observations cliniques saisies pendant la prise en charge
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-[#5b6472] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inclureInactifs}
              onChange={(e) => onToggleInactifs(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#1f9d55]"
            />
            Afficher les corrigés / erreurs
          </label>
          <button
            type="button"
            onClick={onRafraichir}
            disabled={chargement}
            title="Rafraîchir"
            aria-label="Rafraîchir les constats"
            className="h-8 w-8 grid place-items-center rounded-[10px] border border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa] cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
          </button>
        </div>
      </div>

      {chargement && constats.length === 0 ? (
        <div className="p-8 text-center text-[#5b6472] text-xs">
          <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-[#1f9d55]" />
          Chargement des constats…
        </div>
      ) : constats.length === 0 ? (
        <div className="p-8 text-center text-[#5b6472] text-[13px] space-y-1">
          <Stethoscope className="h-7 w-7 mx-auto text-[#5b6472]" strokeWidth={1.6} />
          <b className="block text-[#1f2937] text-sm">Aucun constat enregistré</b>
          <p className="text-xs">
            Les observations cliniques apparaîtront ici après enregistrement.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#f0f2f1] overflow-y-auto max-h-[520px]">
          {constats.map((c) => (
            <li key={c.id} className="py-3">
              <div className="flex items-start gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-bold bg-[#e7f6ed] text-[#14703c] rounded px-1.5 py-0.5">
                  {c.code}
                </span>
                <span className="text-[13px] text-[#1f2937] font-semibold flex-1 min-w-0 truncate">
                  {c.libelle}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CLASSE_STATUT[c.statut]}`}
                >
                  {LIBELLES_STATUT[c.statut]}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                <span className="text-base font-black text-[#1f2937] font-mono tabular-nums">
                  {formaterValeur(c)}
                </span>
                <span className="text-[11px] text-[#5b6472] inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formaterDate(c.dateObservation)}
                </span>
                {c.interpretation && (
                  <span className="text-[11px] italic text-[#5b6472]">
                    — {c.interpretation}
                  </span>
                )}
              </div>

              {c.commentaire && (
                <p className="mt-1 text-[12px] text-[#5b6472] italic bg-[#fafbfa] border border-[#f0f2f1] rounded-md px-2 py-1">
                  {c.commentaire}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};