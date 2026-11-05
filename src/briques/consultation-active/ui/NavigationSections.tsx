/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Activity,
  ShieldAlert,
  FlaskConical,
  FileDown,
  Send,
  Pill,
} from "lucide-react";
import type { OngletConsultation } from "./TabsConsultation";

/* ------------------------------------------------------------------ *
 *  Définition des groupes / sections (identique à avant)
 * ------------------------------------------------------------------ */

interface SectionDef {
  id: OngletConsultation;
  libelle: string;
}

interface GroupeDef {
  titre: string;
  sections: SectionDef[];
}

const GROUPES: GroupeDef[] = [
  {
    titre: "CLINIQUE",
    sections: [
      { id: "diag", libelle: "Diagnostic" },
      { id: "constat", libelle: "Constats" },
      { id: "allergies", libelle: "Allergies" },
    ],
  },
  {
    titre: "ACTES",
    sections: [
      { id: "actes", libelle: "Actes et résultats" },
      { id: "ext", libelle: "Actes externes" },
    ],
  },
  {
    titre: "PRESCRIPTIONS",
    sections: [
      { id: "dem", libelle: "Demandes aux soignants" },
      { id: "ord", libelle: "Ordonnance" },
    ],
  },
];

/** Ordre canonique consommé par le parent (Alt+↑/↓). */
export const ORDRE_SECTIONS: OngletConsultation[] = GROUPES.flatMap((g) =>
  g.sections.map((s) => s.id),
);

/* ------------------------------------------------------------------ *
 *  Icône & libellé par section (pour le rail replié)
 * ------------------------------------------------------------------ */

type IconeSection = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const ICONES_SECTIONS: Record<OngletConsultation, IconeSection> = {
  diag: ClipboardList,
  constat: Activity,
  allergies: ShieldAlert,
  actes: FlaskConical,
  ext: FileDown,
  dem: Send,
  ord: Pill,
};

const LIBELLES_SECTIONS: Record<OngletConsultation, string> = {
  diag: "Diagnostic",
  constat: "Constats",
  allergies: "Allergies",
  actes: "Actes et résultats",
  ext: "Actes externes",
  dem: "Demandes aux soignants",
  ord: "Ordonnance",
};

/** Pour détecter les changements de groupe et insérer les séparateurs. */
const GROUPE_DE: Record<OngletConsultation, string> = Object.fromEntries(
  GROUPES.flatMap((g) => g.sections.map((s) => [s.id, g.titre])),
) as Record<OngletConsultation, string>;

/* ------------------------------------------------------------------ *
 *  Types & Props
 * ------------------------------------------------------------------ */

export interface NavigationSectionsProps {
  actif: OngletConsultation;
  onChange: (id: OngletConsultation) => void;
  counts: Record<OngletConsultation, number>;
  /** État de repli (rail 64 px sur desktop, barre compacte sur mobile). */
  replie: boolean;
  onToggleReplie: () => void;
}

/* ------------------------------------------------------------------ *
 *  Badge de statut (✓ rempli / ○ vide) en pastille
 * ------------------------------------------------------------------ */

const BadgeStatut: React.FC<{ count: number }> = ({ count }) => {
  const rempli = count > 0;
  return (
    <span
      className={`absolute -bottom-[2px] -right-[2px] w-[16px] h-[16px] rounded-full grid place-items-center text-[10px] font-bold border-[1.5px] border-white ${
        rempli
          ? "bg-[#e7f6ed] text-[#14703c]"
          : "bg-[#f0f2f1] text-[#5b6472]"
      }`}
      aria-hidden="true"
    >
      {rempli ? "✓" : "○"}
    </span>
  );
};

/* ------------------------------------------------------------------ *
 *  Composant principal
 * ------------------------------------------------------------------ */

export const NavigationSections: React.FC<NavigationSectionsProps> = ({
  actif,
  onChange,
  counts,
  replie,
  onToggleReplie,
}) => {
  /** Position de l'info-bulle (par rapport au viewport). */
  const [tooltip, setTooltip] = useState<{
    id: OngletConsultation;
    top: number;
    left: number;
  } | null>(null);

  const montrerTooltip = (e: React.MouseEvent<HTMLButtonElement>, id: OngletConsultation) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      id,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const cacherTooltip = () => setTooltip(null);

  const total = ORDRE_SECTIONS.length;
  const renseignees = ORDRE_SECTIONS.filter(
    (id) => (counts[id] ?? 0) > 0,
  ).length;
  const pct = Math.round((renseignees / total) * 100);

  /* ================================================================== */
  /*  ÉTAT REPLIÉ                                                       */
  /* ================================================================== */
  if (replie) {
    return (
      <>
        <aside
          aria-label="Sections de la consultation (réduite)"
          className="bg-white border border-[#e5e7eb] rounded-[14px] lg:h-full lg:flex lg:flex-col lg:items-center overflow-hidden"
        >
          {/* -------- Mobile : barre horizontale compacte -------- */}
          <button
            type="button"
            onClick={onToggleReplie}
            aria-label="Déplier les sections"
            aria-expanded={false}
            className="lg:hidden w-full h-14 flex items-center gap-3 px-4 cursor-pointer hover:bg-[#fafbfa] transition-colors"
          >
            <span className="text-sm font-bold text-[#1f2937] shrink-0">
              Progression
            </span>
            <div className="h-1.5 flex-1 max-w-[160px] rounded-full bg-[#f0f2f1] overflow-hidden">
              <div
                className="h-full bg-[#1f9d55] transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-[#5b6472] tabular-nums shrink-0">
              {renseignees}/{total}
            </span>
            <ChevronDown
              className="w-5 h-5 text-[#5b6472] shrink-0 ml-auto"
              aria-hidden="true"
            />
          </button>

          {/* -------- Desktop : rail vertical de 64 px -------- */}
          <div className="hidden lg:flex flex-col items-center w-full h-full">
            {/* Bouton d'expansion */}
            <button
              type="button"
              onClick={onToggleReplie}
              aria-label="Déplier les sections"
              aria-expanded={false}
              title="Déplier les sections"
              className="w-11 h-11 mt-2 grid place-items-center rounded-[10px] text-[#14703c] hover:bg-[#fafbfa] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]"
            >
              <ChevronRight className="w-[20px] h-[20px]" />
            </button>

            {/* Séparateur sous le bouton d'expansion */}
            <span className="w-7 h-px bg-[#e5e7eb] my-2" aria-hidden="true" />

            {/* Icônes des sections */}
            <nav
              aria-label="Sections de la consultation"
              className="flex-1 flex flex-col items-center gap-2.5 py-2 overflow-y-auto w-full"
            >
              {ORDRE_SECTIONS.map((id, index) => {
                const estActif = actif === id;
                const count = counts[id] ?? 0;
                const Icone = ICONES_SECTIONS[id];
                const besoinSeparateur =
                  index > 0 &&
                  GROUPE_DE[ORDRE_SECTIONS[index - 1]] !== GROUPE_DE[id];

                return (
                  <React.Fragment key={id}>
                    {besoinSeparateur && (
                      <span
                        className="w-7 h-px bg-[#e5e7eb] my-1"
                        aria-hidden="true"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => onChange(id)}
                      onMouseEnter={(e) => montrerTooltip(e, id)}
                      onMouseLeave={cacherTooltip}
                      onFocus={(e) =>
                        montrerTooltip(
                          e as unknown as React.MouseEvent<HTMLButtonElement>,
                          id,
                        )
                      }
                      onBlur={cacherTooltip}
                      aria-current={estActif ? "page" : undefined}
                      aria-label={`${LIBELLES_SECTIONS[id]} (${count} élément${
                        count > 1 ? "s" : ""
                      })`}
                      className={`relative w-11 h-11 rounded-[10px] grid place-items-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] ${
                        estActif
                          ? "bg-[#1f9d55] text-white"
                          : "bg-[#f0f2f1] border border-[#e5e7eb] text-[#5b6472] hover:bg-[#e3e6e8]"
                      }`}
                    >
                      <Icone className="w-[22px] h-[22px]" strokeWidth={2} />
                      {!estActif && <BadgeStatut count={count} />}
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* -------- Info-bulle (position: fixed, jamais coupée) -------- */}
        {tooltip && (
          <div
            role="tooltip"
            className="fixed z-50 pointer-events-none -translate-y-1/2"
            style={{ top: tooltip.top, left: tooltip.left }}
          >
            <div className="bg-[#1f2937] text-white text-[13px] font-semibold rounded-lg px-3 py-2 whitespace-nowrap shadow-lg animate-slide-in">
              {LIBELLES_SECTIONS[tooltip.id]}
            </div>
          </div>
        )}
      </>
    );
  }

  /* ================================================================== */
  /*  ÉTAT DÉPLIÉ (inchangé)                                            */
  /* ================================================================== */
  return (
    <aside
      aria-label="Sections de la consultation"
      className="bg-white border border-[#e5e7eb] rounded-[14px] h-full flex flex-col overflow-hidden"
    >
      {/* En-tête progression */}
      <div className="px-3.5 pt-3.5 pb-2 shrink-0">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <b className="text-[#1f2937]">Progression</b>
          <div className="flex items-center gap-1.5">
            <span className="text-[#5b6472] tabular-nums">
              {renseignees} / {total} renseignées
            </span>
            <button
              type="button"
              onClick={onToggleReplie}
              aria-label="Réduire les sections"
              aria-expanded={true}
              title="Réduire les sections"
              className="w-6 h-6 grid place-items-center rounded-md text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={renseignees}
          className="mt-1.5 h-1.5 rounded-full bg-[#f0f2f1] overflow-hidden"
        >
          <div
            className="h-full bg-[#1f9d55] transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Liste des sections (version dépliée, inchangée) */}
      <nav className="flex-1 overflow-y-auto px-1.5 pb-1.5">
      {GROUPES.map((groupe) => (
        <div key={groupe.titre}>
          <div className="text-[11px] font-bold tracking-[0.05em] text-[#5b6472] px-2.5 pt-2.5 pb-1">
            {groupe.titre}
          </div>
          {groupe.sections.map((section) => {
            const estActif = actif === section.id;
            const count = counts[section.id] ?? 0;
            const Icone = ICONES_SECTIONS[section.id];
            const renseigne = count > 0;
            const alerte = section.id === "diag" && count === 0;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onChange(section.id)}
                aria-current={estActif ? "page" : undefined}
                className={`w-full h-11 flex items-center gap-2.5 px-2.5 rounded-[10px] transition-colors cursor-pointer ${
                  estActif
                    ? "bg-[#e7f6ed] shadow-[inset_3px_0_0_#1f9d55]"
                    : "hover:bg-[#fafbfa]"
                }`}
              >
                {/* Icône + pastille de statut */}
                <span className="relative shrink-0">
                  <span
                    className={`w-7 h-7 rounded-[7px] flex items-center justify-center transition-colors ${
                      estActif
                        ? "bg-[#1f9d55] text-white"
                        : "bg-[#f0f2f1] text-[#5b6472]"
                    }`}
                  >
                    <Icone className="w-4 h-4" strokeWidth={2} />
                  </span>
                  <span
                    className={`absolute -top-1 -right-1 w-[14px] h-[14px] rounded-full grid place-items-center text-[9px] font-bold border-[1.5px] border-white ${
                      renseigne
                        ? "bg-[#1f9d55] text-white"
                        : alerte
                          ? "bg-[#d97706] text-white"
                          : "bg-[#cbd5e1] text-white"
                    }`}
                    aria-hidden="true"
                  >
                    {renseigne ? "✓" : alerte ? "!" : "○"}
                  </span>
                </span>

                <span
                  title={section.libelle}
                  className={`flex-1 text-left text-[13px] truncate ${
                    estActif
                      ? "font-bold text-[#14703c]"
                      : "font-semibold text-[#1f2937]"
                  }`}
                >
                  {section.libelle}
                </span>

                <span className="text-[12px] font-bold text-[#5b6472] tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>

      <div className="border-t border-[#f0f2f1] px-3.5 py-2.5 text-[11px] text-[#5b6472] shrink-0">
        Alt + ↑ ↓ : changer de section
      </div>
    </aside>
  );
};

export default NavigationSections;