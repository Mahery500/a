/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export type VarianteBadge = "succes" | "danger" | "avertissement" | "info" | "neutre" | "primaire";

export interface BadgeStatutProps {
  statut?: string;
  libelle?: string;
  variante?: VarianteBadge;
  taille?: "sm" | "md";
}

export const BadgeStatut: React.FC<BadgeStatutProps> = ({
  statut,
  libelle,
  variante,
  taille = "sm",
}) => {
  const deduireVariante = (st?: string): VarianteBadge => {
    if (!st) return "neutre";
    const s = st.toLowerCase();
    if (
      s.includes("actif") ||
      s.includes("valide") ||
      s.includes("termine") ||
      s.includes("succes") ||
      s.includes("ok") ||
      s.includes("realise") ||
      s.includes("confirme")
    ) {
      return "succes";
    }
    if (
      s.includes("inactif") ||
      s.includes("bloque") ||
      s.includes("annule") ||
      s.includes("danger") ||
      s.includes("perime") ||
      s.includes("erreur")
    ) {
      return "danger";
    }
    if (
      s.includes("attente") ||
      s.includes("alerte") ||
      s.includes("suspendu") ||
      s.includes("warn") ||
      s.includes("planifie")
    ) {
      return "avertissement";
    }
    if (s.includes("cours") || s.includes("soins") || s.includes("info")) {
      return "info";
    }
    return "neutre";
  };

  const varianteFinale = variante || deduireVariante(statut);

  const configVariante: Record<
    VarianteBadge,
    { badge: string; dot: string }
  > = {
    succes: {
      badge: "bg-emerald-50/80 text-emerald-800 border-emerald-250",
      dot: "bg-emerald-600",
    },
    danger: {
      badge: "bg-rose-50/80 text-rose-800 border-rose-250",
      dot: "bg-rose-600",
    },
    avertissement: {
      badge: "bg-amber-50/80 text-amber-800 border-amber-250",
      dot: "bg-amber-600",
    },
    info: {
      badge: "bg-sky-50/80 text-sky-800 border-sky-250",
      dot: "bg-sky-600",
    },
    primaire: {
      badge: "bg-emerald-50/90 text-emerald-900 border-emerald-300",
      dot: "bg-emerald-700",
    },
    neutre: {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const tailleClasses = taille === "md" ? "text-xs px-2.5 py-1" : "text-[11px] px-2 py-0.5";

  const texteAffiche = libelle || statut || "—";
  const conf = configVariante[varianteFinale];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${tailleClasses} ${conf.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dot}`} aria-hidden="true" />
      <span className="truncate">{texteAffiche}</span>
    </span>
  );
};

export default BadgeStatut;
