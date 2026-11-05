/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BriquesTableauBord.tsx - ASINA Médical
 * Emplacement : briques/tableau-bord-accueil/ui/BriquesTableauBord.tsx
 */

import React from 'react';
import { Inbox } from 'lucide-react';
import { CHARTE } from './charte';

export function nombre(valeur: number): string {
  return new Intl.NumberFormat('fr-FR').format(valeur);
}

export interface BarreHorizontaleProps {
  libelle: string;
  valeur: number;
  max: number;
  ton?: 'vert' | 'indigo' | 'ambre';
  unite?: string;
}

export const BarreHorizontale: React.FC<BarreHorizontaleProps> = ({
  libelle,
  valeur,
  max,
  ton = 'indigo',
  unite = '',
}) => {
  const pourcentage = max > 0 ? Math.min(100, Math.round((valeur / max) * 100)) : 0;

  let couleurBarre = CHARTE.primaire;
  let fondPastille = CHARTE.primaireClair;
  let couleurTexte = CHARTE.primaireFonce;

  if (ton === 'indigo') {
    couleurBarre = '#4f46e5';
    fondPastille = CHARTE.badgeFond;
    couleurTexte = CHARTE.badgeTexte;
  } else if (ton === 'ambre') {
    couleurBarre = CHARTE.alerteTexte;
    fondPastille = CHARTE.alerteFond;
    couleurTexte = CHARTE.alerteTexte;
  }

  return (
    <li className="space-y-1.5 list-none">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium truncate pr-2" style={{ color: CHARTE.encre }}>
          {libelle}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="font-mono text-[12px] font-bold tabular-nums rounded-[6px] px-1.5 py-0.5"
            style={{ background: fondPastille, color: couleurTexte }}
          >
            {nombre(valeur)} {unite}
          </span>
          <span className="font-mono text-[11px] text-[#5b6472] tabular-nums w-8 text-right">
            {pourcentage}%
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: CHARTE.separateur }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pourcentage}%`, background: couleurBarre }}
        />
      </div>
    </li>
  );
};

export interface PartProps {
  libelle: string;
  valeur: number;
  couleur: string;
}

export const Repartition: React.FC<{ parts: PartProps[]; resume?: string }> = ({ parts, resume }) => {
  const total = parts.reduce((s, p) => s + p.valeur, 0);

  return (
    <div className="space-y-4 pt-1">
      {resume && (
        <div className="text-[12px]" style={{ color: CHARTE.secondaire }}>
          {resume}
        </div>
      )}

      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {parts.map((p, i) => {
          if (p.valeur === 0) return null;
          const pct = total > 0 ? (p.valeur / total) * 100 : 0;
          return (
            <div
              key={i}
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: p.couleur }}
              title={`${p.libelle}: ${nombre(p.valeur)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 pt-1">
        {parts.map((p, i) => {
          const pct = total > 0 ? ((p.valeur / total) * 100).toFixed(1) : '0';
          return (
            <div key={i} className="flex items-center gap-2 rounded-[8px] border p-2 text-[12px]" style={{ borderColor: CHARTE.separateur }}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.couleur }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium" style={{ color: CHARTE.encre }}>
                  {p.libelle}
                </div>
                <div className="font-mono text-[11px] tabular-nums" style={{ color: CHARTE.secondaire }}>
                  {nombre(p.valeur)} ({pct}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Squelette: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-14 rounded-[10px]" style={{ background: CHARTE.separateur }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="h-44 rounded-[10px]" style={{ background: CHARTE.separateur }} />
        <div className="h-44 rounded-[10px]" style={{ background: CHARTE.separateur }} />
      </div>
    </div>
  );
};

export const Vide: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center" style={{ color: CHARTE.secondaire }}>
      <Inbox className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-[13px]">{message}</p>
    </div>
  );
};

// Re-exports des briques complémentaires
export { BandeauStats } from './BandeauStats';
export { Carte, Colonnes } from './CarteGraphique';
