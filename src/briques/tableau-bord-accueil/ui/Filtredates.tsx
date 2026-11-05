/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Filtredates.tsx - ASINA Médical
 * Emplacement : briques/tableau-bord-accueil/ui/Filtredates.tsx
 */

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { CHARTE, CLASSE_FOCUS } from './charte';

export interface PlageDates {
  cle: 'aujourdhui' | 'hier' | '7jours' | 'mois' | 'perso';
  libelle: string;
  debut: string;
  fin: string;
}

export const plageAujourdhui: PlageDates = {
  cle: 'aujourdhui',
  libelle: 'Aujourd\'hui',
  debut: new Date().toISOString().split('T')[0],
  fin: new Date().toISOString().split('T')[0],
};

const OPTIONS_PREDEFINIES: { cle: PlageDates['cle']; libelle: string }[] = [
  { cle: 'aujourdhui', libelle: 'Aujourd\'hui' },
  { cle: 'hier', libelle: 'Hier' },
  { cle: '7jours', libelle: '7 derniers jours' },
  { cle: 'mois', libelle: 'Ce mois-ci' },
  { cle: 'perso', libelle: 'Personnalisé' },
];

export interface FiltreDatesProps {
  valeur: PlageDates;
  onChange: (nouvellePlage: PlageDates) => void;
}

export const FiltreDates: React.FC<FiltreDatesProps> = ({ valeur, onChange }) => {
  const [ouvert, setOuvert] = useState(false);
  const [dateDebut, setDateDebut] = useState(valeur.debut);
  const [dateFin, setDateFin] = useState(valeur.fin);

  const selectionnerOption = (opt: typeof OPTIONS_PREDEFINIES[0]) => {
    const aujourdhui = new Date();
    const isoAujourdhui = aujourdhui.toISOString().split('T')[0];

    if (opt.cle === 'aujourdhui') {
      onChange({
        cle: 'aujourdhui',
        libelle: 'Aujourd\'hui',
        debut: isoAujourdhui,
        fin: isoAujourdhui,
      });
      setOuvert(false);
    } else if (opt.cle === 'hier') {
      const hier = new Date(aujourdhui);
      hier.setDate(hier.getDate() - 1);
      const isoHier = hier.toISOString().split('T')[0];
      onChange({
        cle: 'hier',
        libelle: 'Hier',
        debut: isoHier,
        fin: isoHier,
      });
      setOuvert(false);
    } else if (opt.cle === '7jours') {
      const j7 = new Date(aujourdhui);
      j7.setDate(j7.getDate() - 6);
      onChange({
        cle: '7jours',
        libelle: '7 derniers jours',
        debut: j7.toISOString().split('T')[0],
        fin: isoAujourdhui,
      });
      setOuvert(false);
    } else if (opt.cle === 'mois') {
      const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
      onChange({
        cle: 'mois',
        libelle: 'Ce mois-ci',
        debut: debutMois.toISOString().split('T')[0],
        fin: isoAujourdhui,
      });
      setOuvert(false);
    }
  };

  const appliquerPerso = () => {
    onChange({
      cle: 'perso',
      libelle: `Du ${dateDebut} au ${dateFin}`,
      debut: dateDebut,
      fin: dateFin,
    });
    setOuvert(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        aria-haspopup="true"
        className={`inline-flex min-h-[48px] items-center gap-2 rounded-[10px] border px-3.5 text-[14px] font-medium transition-colors md:min-h-[40px] cursor-pointer ${CLASSE_FOCUS}`}
        style={{
          background: CHARTE.surface,
          borderColor: ouvert ? CHARTE.primaire : CHARTE.bordure,
          color: CHARTE.encre,
        }}
      >
        <Calendar className="h-4 w-4 shrink-0 text-[#1f9d55]" />
        <span>{valeur.libelle}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${ouvert ? 'rotate-180 text-[#1f9d55]' : 'text-[#5b6472]'}`} />
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-20 cursor-default" onClick={() => setOuvert(false)} />
          <div
            className="absolute right-0 z-30 mt-2 w-72 rounded-[14px] border p-3 shadow-lg"
            style={{
              background: CHARTE.surface,
              borderColor: CHARTE.bordure,
              boxShadow: '0 10px 25px -5px rgba(15, 27, 61, 0.1)',
            }}
          >
            <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.05em]" style={{ color: CHARTE.secondaire }}>
              Période d'analyse
            </div>

            <div className="space-y-1">
              {OPTIONS_PREDEFINIES.map((opt) => {
                const estActif = valeur.cle === opt.cle;
                return (
                  <button
                    key={opt.cle}
                    type="button"
                    onClick={() => selectionnerOption(opt)}
                    className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[13px] font-medium transition-colors cursor-pointer ${CLASSE_FOCUS}`}
                    style={{
                      background: estActif ? CHARTE.primaireClair : 'transparent',
                      color: estActif ? CHARTE.primaireFonce : CHARTE.encre,
                    }}
                  >
                    <span>{opt.libelle}</span>
                    {estActif && <Check className="h-4 w-4 text-[#1f9d55]" />}
                  </button>
                );
              })}
            </div>

            <div className="my-2.5 h-[1px]" style={{ background: CHARTE.separateur }} />

            <div className="space-y-2 p-1">
              <span className="text-[12px] font-bold" style={{ color: CHARTE.secondaire }}>
                Plage personnalisée
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#5b6472] mb-1">Du</label>
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className={`w-full rounded-[6px] border px-2 py-1.5 text-[12px] ${CLASSE_FOCUS}`}
                    style={{ borderColor: CHARTE.bordure, color: CHARTE.encre }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#5b6472] mb-1">Au</label>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className={`w-full rounded-[6px] border px-2 py-1.5 text-[12px] ${CLASSE_FOCUS}`}
                    style={{ borderColor: CHARTE.bordure, color: CHARTE.encre }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={appliquerPerso}
                className={`mt-2 w-full rounded-[8px] py-1.5 text-[12px] font-bold text-white cursor-pointer ${CLASSE_FOCUS}`}
                style={{ background: CHARTE.primaire }}
              >
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
