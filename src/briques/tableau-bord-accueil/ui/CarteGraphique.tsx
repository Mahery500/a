/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CarteGraphique.tsx - ASINA Médical
 * Emplacement : briques/tableau-bord-accueil/ui/CarteGraphique.tsx
 * Cartes blanches 14 px sans ombre avec graphiques en colonnes et séries
 */

import React, { useState } from 'react';
import { CHARTE } from './charte';
import { nombre } from './BriquesTableauBord';

export interface CarteProps {
  titre: string;
  aide?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Carte: React.FC<CarteProps> = ({ titre, aide, action, children, className = '' }) => {
  return (
    <section
      className={`rounded-[14px] border p-4 md:p-5 ${className}`}
      style={{
        background: CHARTE.surface,
        borderColor: CHARTE.bordure,
        color: CHARTE.encre,
      }}
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: CHARTE.separateur }}>
        <div>
          <h3 className="text-[16px] font-bold md:text-[17px]" style={{ color: CHARTE.encre }}>
            {titre}
          </h3>
          {aide && (
            <p className="mt-0.5 text-[12px]" style={{ color: CHARTE.secondaire }}>
              {aide}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
};

export interface SerieColonne {
  cle: string;
  libelle: string;
  couleur: string;
}

export interface ColonnesProps {
  donnees: Record<string, any>[];
  cleLibelle: string;
  series: SerieColonne[];
  resume?: string;
  hauteur?: number;
}

export const Colonnes: React.FC<ColonnesProps> = ({
  donnees,
  cleLibelle,
  series,
  resume,
  hauteur = 190,
}) => {
  const [pointSurvole, setPointSurvole] = useState<number | null>(null);

  let maxValeur = 1;
  donnees.forEach((d) => {
    series.forEach((s) => {
      const v = Number(d[s.cle]) || 0;
      if (v > maxValeur) maxValeur = v;
    });
  });
  const maxEchelle = Math.ceil(maxValeur * 1.15) || 10;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
        {resume ? (
          <span className="text-[12px]" style={{ color: CHARTE.secondaire }}>
            {resume}
          </span>
        ) : <div />}
        <div className="flex items-center gap-3">
          {series.map((s) => (
            <div key={s.cle} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.couleur }} />
              <span className="text-[12px] font-medium" style={{ color: CHARTE.secondaire }}>
                {s.libelle}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative flex items-end justify-between gap-1.5 pt-4 pb-6"
        style={{ height: `${hauteur}px` }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-4 bottom-6 flex flex-col justify-between">
          <div className="border-b border-dashed" style={{ borderColor: CHARTE.separateur }} />
          <div className="border-b border-dashed" style={{ borderColor: CHARTE.separateur }} />
          <div className="border-b" style={{ borderColor: CHARTE.bordure }} />
        </div>

        {donnees.map((item, index) => {
          const estSurvole = pointSurvole === index;
          return (
            <div
              key={index}
              className="group relative flex flex-1 flex-col items-center h-full justify-end"
              onMouseEnter={() => setPointSurvole(index)}
              onMouseLeave={() => setPointSurvole(null)}
            >
              {estSurvole && (
                <div
                  className="absolute bottom-full mb-1 z-20 whitespace-nowrap rounded-[6px] border px-2 py-1 text-[11px] shadow-sm pointer-events-none"
                  style={{
                    background: CHARTE.encre,
                    color: '#ffffff',
                    borderColor: CHARTE.encre,
                  }}
                >
                  <div className="font-bold">{item[cleLibelle]}</div>
                  {series.map((s) => (
                    <div key={s.cle} className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.couleur }} />
                      <span>{s.libelle}: <strong>{nombre(item[s.cle] ?? 0)}</strong></span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex w-full items-end justify-center gap-1 max-w-[36px] z-10 h-full pb-[1px]">
                {series.map((s) => {
                  const val = Number(item[s.cle]) || 0;
                  const pourcentage = Math.min(100, Math.max(4, Math.round((val / maxEchelle) * 100)));
                  return (
                    <div
                      key={s.cle}
                      className="w-full rounded-t-[4px] transition-all duration-200"
                      style={{
                        height: `${pourcentage}%`,
                        background: s.couleur,
                        opacity: pointSurvole !== null && !estSurvole ? 0.6 : 1,
                      }}
                    />
                  );
                })}
              </div>

              <span
                className="absolute -bottom-5 text-[11px] font-medium truncate max-w-full"
                style={{ color: estSurvole ? CHARTE.encre : CHARTE.secondaire }}
              >
                {item[cleLibelle]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
