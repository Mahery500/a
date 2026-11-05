/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarPlus, Check, Inbox, RefreshCw, X } from 'lucide-react';
import { extraireMessageErreur } from '@/noyau/http';
import { demandesRendezVousApi, type DemandeRendezVous } from '../api/demandesRendezVous.api';
import { invalider, useRequete } from '../hooks/useRequete';
import { FormulaireRendezVousModale } from './FormulaireRendezVousModale';

const formaterDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

/** Fixe le patient dans le formulaire existant et rappelle la demande du médecin. */
function PatientImpose({
  demande,
  changer,
}: {
  demande: DemandeRendezVous;
  changer: (id: number) => void;
}) {
  useEffect(() => {
    changer(demande.patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demande.patientId]);

  return (
    <div className="text-sm">
      <span className="mb-1.5 block font-semibold text-slate-700">Patient</span>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-900">
        {demande.patientNom ?? `Patient ${demande.patientId}`}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {demande.type === 'SPECIALISTE' && (
          <strong className="text-indigo-700">
            Spécialité : {demande.specialiteLibelle ?? '—'} —{' '}
          </strong>
        )}
        Motif demandé : {demande.motif}
        {demande.dateSouhaitee && ` — souhaité vers le ${formaterDate(demande.dateSouhaitee)}`}
      </p>
    </div>
  );
}

export function DemandesEnAttente() {
  const [aPlanifier, setAPlanifier] = useState<DemandeRendezVous | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const demandes = useRequete(
    () => demandesRendezVousApi.lister({ statut: 'EN_ATTENTE' }),
    [],
    { tag: 'demandes-rdv' },
  );
  const liste = demandes.data ?? [];

  // Rafraîchissement automatique : la réception voit les nouvelles demandes sans recharger.
  useEffect(() => {
    const id = window.setInterval(() => demandes.refetch(), 30_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function agir(action: () => Promise<unknown>) {
    setErreur(null);
    try {
      await action();
      invalider('demandes-rdv', 'rendez-vous');
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    }
  }

  function fermerFormulaire() {
    setAPlanifier(null);
    invalider('rendez-vous', 'creneaux'); // rafraîchit la liste des rendez-vous
  }

  if (demandes.isError) {
    return (
      <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
        Impossible de charger les demandes des médecins : {extraireMessageErreur(demandes.error)}
      </p>
    );
  }

  if (!demandes.isLoading && liste.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-amber-700" />
          <h2 className="text-sm font-bold text-amber-900">
            Demandes des médecins ({liste.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={() => demandes.refetch()}
          disabled={demandes.isLoading}
          title="Actualiser"
          className="cursor-pointer rounded-lg p-1.5 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${demandes.isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {erreur && (
        <p role="alert" className="px-4 pt-3 text-xs font-medium text-rose-600">
          {erreur}
        </p>
      )}

      <ul className="divide-y divide-amber-100">
        {liste.map((d) => (
          <li key={d.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-slate-900">
                  {d.patientNom ?? `Patient ${d.patientId}`}
                </strong>
                {d.type === 'SPECIALISTE' && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    Spécialiste : {d.specialiteLibelle ?? '—'}
                  </span>
                )}
                {d.urgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    <AlertTriangle className="h-3 w-3" /> Urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">{d.motif}</p>
              {d.resumeClinique && (
                <p className="mt-1 whitespace-pre-line rounded border border-amber-100 bg-white px-2 py-1 text-[11px] text-slate-600">
                  {d.resumeClinique}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-slate-400">
                Demandé par {d.demandeur}
                {d.dateSouhaitee && ` · souhaité vers le ${formaterDate(d.dateSouhaitee)}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAPlanifier(d)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
              >
                <CalendarPlus className="h-3.5 w-3.5" /> Planifier
              </button>
              <button
                type="button"
                onClick={() => void agir(() => demandesRendezVousApi.marquerPlanifiee(d.id))}
                title="À utiliser une fois le rendez-vous créé"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                <Check className="h-3.5 w-3.5" /> Marquer planifiée
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Refuser cette demande ?')) {
                    void agir(() => demandesRendezVousApi.refuser(d.id));
                  }
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
              >
                <X className="h-3.5 w-3.5" /> Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>

      {aPlanifier && (
        <FormulaireRendezVousModale
          renderSelecteurPatient={(_valeur, changer) => (
            <PatientImpose demande={aPlanifier} changer={changer} />
          )}
          onFermer={fermerFormulaire}
        />
      )}
    </div>
  );
}