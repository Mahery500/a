/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarPlus,
  ChevronDown,
  Clock,
  Loader2,
  MessageSquareText,
  Stethoscope,
  X,
} from 'lucide-react';
import { messageErreur } from '@/noyau/utils/erreur';
import { useAgendas } from '../hooks/useAgendas';
import { useCreneauxDisponibles } from '../hooks/useCreneauxDisponibles';
import { useReserverRendezVous } from '../hooks/useRendezVousMutations';
import type { CreneauDisponible } from '../modele/types';

interface Props {
  /** Patient présélectionné (ex. depuis la fiche patient). */
  patientId?: number;
  /** Rendu du sélecteur patient (GET /api/patients). */
  renderSelecteurPatient: (valeur: number | undefined, changer: (id: number) => void) => React.ReactNode;
  onFermer: () => void;
}

/** Forme réelle renvoyée par GET /api/agendas (AgendaOutput), tolérante aux anciens champs. */
type AgendaAffiche = {
  id: number;
  libelle?: string;
  staffNom?: string;
  specialite?: string;
};

/* ---------- Styles (charte ASINA Médical) ---------- */
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40';

const CHAMP =
  'h-12 w-full rounded-[10px] border bg-white pl-9 text-sm text-[#1f2937] placeholder:text-[#5b6472] ' +
  'transition focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 disabled:cursor-wait ' +
  'disabled:bg-[#fafbfa] disabled:text-[#5b6472] md:h-10';
const BORDURE_OK = 'border-[#e5e7eb] focus:border-[#1f9d55]';
const BORDURE_ERR = 'border-[#b42318] focus:border-[#b42318]';

const BTN_PRIMAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-[#1f9d55] px-4 text-sm font-bold text-white transition hover:bg-[#14703c] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_SECONDAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;

/* ---------- Utilitaires ---------- */
const heure = (iso: string) => iso.slice(11, 16);
const jourIso = (iso: string) => iso.slice(0, 10);

const aujourdhui = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${j}`;
};

const dateLongue = (isoJour: string) =>
  new Date(`${isoJour}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const Etiquette: React.FC<{ htmlFor?: string; texte: string; requis?: boolean; facultatif?: boolean }> = ({
  htmlFor,
  texte,
  requis,
  facultatif,
}) => (
  <label htmlFor={htmlFor} className="text-xs font-bold text-[#5b6472]">
    {texte}
    {requis && (
      <span className="ml-0.5 text-[#b42318]" aria-hidden="true">
        *
      </span>
    )}
    {facultatif && <span className="ml-1 font-normal">(facultatif)</span>}
  </label>
);

const MessageChamp: React.FC<{ id?: string; texte: string }> = ({ id, texte }) => (
  <p id={id} role="alert" className="text-xs font-medium text-[#b42318]">
    {texte}
  </p>
);

/** Une pastille d'horaire (choix unique). */
const PastilleCreneau: React.FC<{ c: CreneauDisponible; actif: boolean; onChoisir: () => void }> = ({
  c,
  actif,
  onChoisir,
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={actif}
    aria-label={`Créneau de ${heure(c.debut)} à ${heure(c.fin)}`}
    onClick={onChoisir}
    className={`inline-flex min-h-[44px] items-center justify-center rounded-full border px-[14px] py-1.5 font-mono text-[13px] tabular-nums transition md:min-h-[36px] ${FOCUS} ${
      actif
        ? 'border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]'
        : 'border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]'
    }`}
  >
    {heure(c.debut)}
  </button>
);

export function FormulaireRendezVousModale({ patientId: patientInitial, renderSelecteurPatient, onFermer }: Props) {
  const [patientId, setPatientId] = useState<number | undefined>(patientInitial);
  const [agendaId, setAgendaId] = useState<number>();
  const [date, setDate] = useState('');
  const [creneau, setCreneau] = useState<CreneauDisponible>();
  const [commentaire, setCommentaire] = useState('');
  const [tentative, setTentative] = useState(false);

  const agendas = useAgendas();
  const creneaux = useCreneauxDisponibles(agendaId, date);
  const reserver = useReserverRendezVous();

  // Échap ferme le volet (sauf pendant l'enregistrement).
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !reserver.isPending) onFermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer, reserver.isPending]);

  const erreurs = {
    patient: !patientId ? 'Choisissez un patient.' : null,
    agenda: !agendaId ? 'Choisissez un médecin ou un agenda.' : null,
    date: !date ? 'Choisissez une date.' : null,
    creneau: agendaId && date && !creneau ? 'Choisissez un créneau.' : null,
  };
  const voir = (cle: keyof typeof erreurs) => (tentative ? erreurs[cle] : null);

  // Matin / après-midi
  const groupes = useMemo(() => {
    const liste = creneaux.data ?? [];
    return [
      { titre: 'Matin', items: liste.filter((c) => Number(heure(c.debut).slice(0, 2)) < 12) },
      { titre: 'Après-midi', items: liste.filter((c) => Number(heure(c.debut).slice(0, 2)) >= 12) },
    ].filter((g) => g.items.length > 0);
  }, [creneaux.data]);

  function soumettre(e: React.SyntheticEvent) {
    e.preventDefault();
    setTentative(true);
    if (Object.values(erreurs).some(Boolean) || !creneau) return;

    reserver.mutate(
      {
        patientId: patientId!,
        agendaId: agendaId!,
        creneauDebut: creneau.debut,
        creneauFin: creneau.fin,
        commentaire: commentaire.trim() || undefined,
      },
      {
        onSuccess: onFermer,
        // Créneau pris entre-temps : on le désélectionne, la liste est rechargée par l'invalidation.
        onError: () => setCreneau(undefined),
      },
    );
  }

  const erreurAgenda = voir('agenda');
  const erreurDate = voir('date');
  const erreurCreneau = voir('creneau');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-rdv"
      className="fixed inset-0 z-50"
    >
      {/* Fond */}
      <div
        className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
        onClick={() => !reserver.isPending && onFermer()}
        aria-hidden="true"
      />

      {/* Volet du bas (mobile) / tiroir à droite (desktop) */}
      <form
        onSubmit={soumettre}
        noValidate
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-[20px] bg-white text-sm text-[#1f2937] shadow-xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[560px] md:rounded-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#e5e7eb] md:hidden" aria-hidden="true" />

        {/* ───────── En-tête ───────── */}
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e7f6ed]">
              <CalendarPlus className="h-5 w-5 text-[#14703c]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="titre-rdv" className="text-[19px] font-bold leading-tight text-[#1f2937]">
                Planifier un rendez-vous
              </h2>
              <p className="text-[13px] text-[#5b6472]">Choisissez un patient, un agenda et un créneau.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            disabled={reserver.isPending}
            aria-label="Fermer"
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-[#5b6472] transition hover:bg-[#f0f2f1] hover:text-[#1f2937] disabled:opacity-40 md:h-10 md:w-10 ${FOCUS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* ───────── Corps ───────── */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-[#f6f8f7] px-5 py-4">
          {/* Patient */}
          <section className="space-y-1 rounded-[14px] border border-[#e5e7eb] bg-white p-4">
            {renderSelecteurPatient(patientId, setPatientId)}
            {voir('patient') && <MessageChamp texte={voir('patient')!} />}
          </section>

          {/* Agenda + date */}
          <section className="space-y-4 rounded-[14px] border border-[#e5e7eb] bg-white p-4">
            <div className="flex flex-col gap-1">
              <Etiquette htmlFor="rdv-agenda" texte="Médecin / agenda" requis />
              <div className="relative">
                <Stethoscope
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14703c]"
                  aria-hidden="true"
                />
                <select
                  id="rdv-agenda"
                  className={`${CHAMP} ${erreurAgenda ? BORDURE_ERR : BORDURE_OK} cursor-pointer appearance-none pr-9`}
                  value={agendaId ?? ''}
                  aria-invalid={!!erreurAgenda}
                  aria-describedby={erreurAgenda ? 'rdv-agenda-err' : undefined}
                  onChange={(e) => {
                    setAgendaId(e.target.value ? Number(e.target.value) : undefined);
                    setCreneau(undefined);
                  }}
                  disabled={agendas.isLoading}
                >
                  <option value="">{agendas.isLoading ? 'Chargement des agendas…' : 'Choisir un agenda'}</option>
                  {(agendas.data as AgendaAffiche[] | undefined)?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.libelle ?? a.staffNom ?? `Agenda #${a.id}`}
                      {a.specialite ? ` — ${a.specialite}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
                  aria-hidden="true"
                />
              </div>
              {erreurAgenda && <MessageChamp id="rdv-agenda-err" texte={erreurAgenda} />}
            </div>

            <div className="flex flex-col gap-1">
              <Etiquette htmlFor="rdv-date" texte="Date" requis />
              <div className="relative">
                <Calendar
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14703c]"
                  aria-hidden="true"
                />
                <input
                  id="rdv-date"
                  type="date"
                  min={aujourdhui()}
                  className={`${CHAMP} ${erreurDate ? BORDURE_ERR : BORDURE_OK} pr-3`}
                  value={date}
                  aria-invalid={!!erreurDate}
                  aria-describedby={erreurDate ? 'rdv-date-err' : undefined}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setCreneau(undefined);
                  }}
                />
              </div>
              {erreurDate && <MessageChamp id="rdv-date-err" texte={erreurDate} />}
            </div>
          </section>

          {/* Créneaux */}
          <section
            aria-labelledby="rdv-creneaux"
            className={`rounded-[14px] border bg-white p-4 ${erreurCreneau ? 'border-[#b42318]' : 'border-[#e5e7eb]'}`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 id="rdv-creneaux" className="flex items-center gap-1.5 text-base font-bold text-[#1f2937]">
                <Clock className="h-4 w-4 text-[#14703c]" aria-hidden="true" />
                Créneaux disponibles
                <span className="text-[#b42318]" aria-hidden="true">
                  *
                </span>
              </h3>
              {agendaId && date && (
                <span className="text-xs capitalize text-[#5b6472]">{dateLongue(date)}</span>
              )}
            </div>

            {(!agendaId || !date) && (
              <p className="rounded-[10px] bg-[#fafbfa] px-3 py-3 text-[13px] text-[#5b6472]">
                Choisissez un agenda et une date pour afficher les créneaux libres.
              </p>
            )}

            {agendaId && date && creneaux.isLoading && (
              <div className="flex flex-wrap gap-2" aria-live="polite" aria-busy="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[44px] w-[72px] animate-pulse rounded-full bg-[#f0f2f1] md:h-9" />
                ))}
              </div>
            )}

            {agendaId && date && creneaux.isError && (
              <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-[#b42318]">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Impossible de charger les créneaux. Changez de date puis revenez, ou réessayez.
              </p>
            )}

            {agendaId && date && !creneaux.isLoading && !creneaux.isError && creneaux.data?.length === 0 && (
              <div
                role="note"
                className="flex items-start gap-2 rounded-[10px] bg-[#fff4e0] px-3 py-2.5 text-[13px] font-medium text-[#8a5300]"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Aucun créneau libre ce jour-là. Essayez une autre date.</span>
              </div>
            )}

            {groupes.length > 0 && (
              <div role="radiogroup" aria-labelledby="rdv-creneaux" className="space-y-3">
                {groupes.map((g) => (
                  <div key={g.titre}>
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">
                      {g.titre}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.items.map((c) => (
                        <PastilleCreneau
                          key={c.debut}
                          c={c}
                          actif={creneau?.debut === c.debut}
                          onChoisir={() => setCreneau(c)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {erreurCreneau && <div className="mt-2"><MessageChamp texte={erreurCreneau} /></div>}
          </section>

          {/* Motif */}
          <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
            <div className="flex flex-col gap-1">
              <Etiquette htmlFor="rdv-motif" texte="Motif" facultatif />
              <div className="relative">
                <MessageSquareText
                  className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#14703c]"
                  aria-hidden="true"
                />
                <textarea
                  id="rdv-motif"
                  rows={2}
                  placeholder="Ex : consultation de suivi, renouvellement d'ordonnance…"
                  className="min-h-[72px] w-full resize-none rounded-[10px] border border-[#e5e7eb] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Erreur du serveur : on affiche son vrai message */}
          {reserver.isError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#fef3f2] p-3 text-sm text-[#b42318]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {messageErreur(
                  reserver.error,
                  "Réservation refusée : le créneau n'est peut-être plus libre. Choisissez-en un autre.",
                )}
              </span>
            </div>
          )}
        </div>

        {/* ───────── Pied fixe ───────── */}
        <div className="flex flex-col gap-3 border-t border-[#e5e7eb] bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-[13px] text-[#5b6472]" aria-live="polite">
            {creneau ? (
              <>
                Créneau choisi :{' '}
                <strong className="font-bold capitalize text-[#1f2937]">{dateLongue(jourIso(creneau.debut))}</strong>
                {' · '}
                <strong className="font-mono font-bold tabular-nums text-[#1f2937]">
                  {heure(creneau.debut)}–{heure(creneau.fin)}
                </strong>
              </>
            ) : (
              'Aucun créneau sélectionné'
            )}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={onFermer} disabled={reserver.isPending} className={BTN_SECONDAIRE}>
              Annuler
            </button>
            <button type="submit" disabled={reserver.isPending} className={BTN_PRIMAIRE}>
              {reserver.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  Planifier
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}