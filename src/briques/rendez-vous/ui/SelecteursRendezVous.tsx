/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertCircle, ChevronDown, User, UserCog } from 'lucide-react';
import { extraireElementsCollection } from '@/noyau/http';
import { http } from '../api/http';
import { useRequete } from '../hooks/useRequete';
import type { PatientOption } from '../modele/types';

interface Props {
  valeur?: number;
  changer: (id: number) => void;
}

interface StaffOption {
  id: number;
  nom: string;
  prenom?: string | null;
}

const CLASSES_CHAMP =
  'w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 text-sm text-slate-800 ' +
  'placeholder:text-slate-400 transition focus:outline-hidden focus:border-blue-500 ' +
  'focus:ring-3 focus:ring-blue-100 disabled:cursor-wait disabled:bg-slate-50 disabled:text-slate-400';

export function SelecteurPatient({ valeur, changer }: Props) {
  const patients = useRequete(
    async () => extraireElementsCollection<PatientOption>(await http.get('/api/patients')),
    [],
  );

  return (
    <div className="block text-sm">
      <label htmlFor="selecteur-patient" className="mb-1.5 block font-semibold text-slate-700">
        Patient <span className="text-rose-500">*</span>
      </label>

      <div className="relative">
        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          id="selecteur-patient"
          className={`${CLASSES_CHAMP} appearance-none pr-9 cursor-pointer`}
          value={valeur ?? ''}
          disabled={patients.isLoading}
          onChange={(e) => e.target.value && changer(Number(e.target.value))}
        >
          <option value="">
            {patients.isLoading ? 'Chargement des patients…' : 'Choisir un patient'}
          </option>
          {patients.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.nom, p.prenom].filter(Boolean).join(' ') || `Patient ${p.id}`}
              {p.matricule ? ` (${p.matricule})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {patients.isError && (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Impossible de charger les patients.
        </p>
      )}
    </div>
  );
}

export function SelecteurStaff({ valeur, changer }: Props) {
  const staffs = useRequete(
    async () => extraireElementsCollection<StaffOption>(await http.get('/api/staffs')),
    [],
  );

  return (
    <div className="block text-sm">
      <label htmlFor="selecteur-staff" className="mb-1.5 block font-semibold text-slate-700">
        Membre du personnel <span className="text-rose-500">*</span>
      </label>

      <div className="relative">
        <UserCog className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          id="selecteur-staff"
          className={`${CLASSES_CHAMP} appearance-none pr-9 cursor-pointer`}
          value={valeur ?? ''}
          disabled={staffs.isLoading}
          onChange={(e) => e.target.value && changer(Number(e.target.value))}
        >
          <option value="">
            {staffs.isLoading ? 'Chargement du personnel…' : 'Choisir un membre du personnel'}
          </option>
          {staffs.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {[s.nom, s.prenom].filter(Boolean).join(' ') || `Staff ${s.id}`}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      {staffs.isError && (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Impossible de charger le personnel.
        </p>
      )}
    </div>
  );
}