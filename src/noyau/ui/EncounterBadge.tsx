/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export type StatutEncounter = "planifie" | "en_cours" | "termine" | "annule";

export interface EncounterBadgeProps {
  statut?: string;
  className?: string;
}

export const EncounterBadge: React.FC<EncounterBadgeProps> = ({ statut = "planifie", className = "" }) => {
  const normalise = statut.toLowerCase().replace(/[\s-]/g, "_");

  const styles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    planifie: {
      bg: "bg-sky-50 border-sky-200/80",
      text: "text-sky-800",
      dot: "bg-sky-500",
      label: "Planifié",
    },
    en_attente: {
      bg: "bg-amber-50 border-amber-200/80",
      text: "text-amber-800",
      dot: "bg-amber-500",
      label: "En attente",
    },
    en_cours: {
      bg: "bg-emerald-50 border-emerald-300",
      text: "text-emerald-800",
      dot: "bg-emerald-600 animate-pulse",
      label: "En cours",
    },
    termine: {
      bg: "bg-slate-100 border-slate-200",
      text: "text-slate-700",
      dot: "bg-slate-400",
      label: "Terminé",
    },
    annule: {
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      dot: "bg-rose-500",
      label: "Annulé",
    },
  };

  const config = styles[normalise] || {
    bg: "bg-slate-100 border-slate-200",
    text: "text-slate-600",
    dot: "bg-slate-400",
    label: statut,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

export default EncounterBadge;
