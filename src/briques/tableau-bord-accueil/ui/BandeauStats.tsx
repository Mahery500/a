/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BandeauStats.tsx - ASINA Médical
 * Emplacement : briques/tableau-bord-accueil/ui/BandeauStats.tsx
 * Bandeau de stats : une seule ligne blanche avec indicateurs clés
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { CHARTE } from './charte';
import { nombre } from './BriquesTableauBord';

export interface KpiItem {
  libelle: string;
  valeur: string | number;
  detail: string;
  ton?: 'vert' | 'indigo' | 'ambre' | 'gris';
  Icone?: LucideIcon;
}

export const BandeauStats: React.FC<{ items: KpiItem[] }> = ({ items }) => {
  return (
    <div
      className="grid grid-cols-2 divide-y divide-[#f0f2f1] rounded-[14px] border md:grid-cols-3 lg:grid-cols-6 lg:divide-y-0 lg:divide-x lg:divide-[#f0f2f1]"
      style={{
        background: CHARTE.surface,
        borderColor: CHARTE.bordure,
      }}
    >
      {items.map((kpi, idx) => {
        let fondIcone = CHARTE.primaireClair;
        let couleurIcone = CHARTE.primaireFonce;
        if (kpi.ton === 'ambre') {
          fondIcone = CHARTE.alerteFond;
          couleurIcone = CHARTE.alerteTexte;
        } else if (kpi.ton === 'indigo') {
          fondIcone = CHARTE.badgeFond;
          couleurIcone = CHARTE.badgeTexte;
        } else if (kpi.ton === 'gris') {
          fondIcone = '#f1f5f9';
          couleurIcone = '#475569';
        }

        return (
          <div key={idx} className="flex flex-col justify-between p-3.5 md:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-bold" style={{ color: CHARTE.secondaire }}>
                {kpi.libelle}
              </span>
              {kpi.Icone && (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-[8px] shrink-0"
                  style={{ background: fondIcone, color: couleurIcone }}
                >
                  <kpi.Icone className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="mt-2.5">
              <div
                className="font-mono text-[22px] font-bold tracking-tight md:text-[24px] tabular-nums"
                style={{
                  color: kpi.ton === 'ambre' ? CHARTE.alerteTexte : CHARTE.encre,
                }}
              >
                {typeof kpi.valeur === 'number' ? nombre(kpi.valeur) : kpi.valeur}
              </div>
              <div className="mt-0.5 truncate text-[11px]" style={{ color: CHARTE.secondaire }} title={kpi.detail}>
                {kpi.detail}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
