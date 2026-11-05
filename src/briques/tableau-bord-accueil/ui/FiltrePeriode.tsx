/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FiltrePeriode.tsx - ASINA Médical
 * Emplacement : briques/tableau-bord-accueil/ui/FiltrePeriode.tsx
 */

import React from 'react';
import { CHARTE, CLASSE_FOCUS } from './charte';
import { PlageDates } from './Filtredates';

interface FiltrePeriodeProps {
  valeur: PlageDates;
  onChange: (valeur: PlageDates) => void;
}

export const FiltrePeriode: React.FC<FiltrePeriodeProps> = ({ valeur, onChange }) => {
  const periodes: { cle: PlageDates['cle']; libelle: string }[] = [
    { cle: 'aujourdhui', libelle: 'Aujourd\'hui' },
    { cle: 'hier', libelle: 'Hier' },
    { cle: '7jours', libelle: '7 jours' },
    { cle: 'mois', libelle: 'Ce mois' },
  ];

  const aujourdhui = new Date().toISOString().split('T')[0];

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-[10px] border bg-white" style={{ borderColor: CHARTE.bordure }}>
      {periodes.map((p) => {
        const estActif = valeur.cle === p.cle;
        return (
          <button
            key={p.cle}
            type="button"
            onClick={() =>
              onChange({
                cle: p.cle,
                libelle: p.libelle,
                debut: aujourdhui,
                fin: aujourdhui,
              })
            }
            className={`min-h-[32px] px-3 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer ${CLASSE_FOCUS}`}
            style={{
              background: estActif ? CHARTE.primaireClair : 'transparent',
              color: estActif ? CHARTE.primaireFonce : CHARTE.secondaire,
            }}
          >
            {p.libelle}
          </button>
        );
      })}
    </div>
  );
};
