/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, Loader2, Save, Timer, X } from 'lucide-react';
import { useEnregistrerAgenda } from '../hooks/useAgendas';
import type { Agenda, PlageHebdomadaire } from '../modele/types';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

interface Props {
  /** Agenda existant à modifier ; absent = création. */
  agenda?: Agenda;
  /** Rendu du sélecteur de staff (référentiel du personnel). */
  renderSelecteurStaff: (valeur: number | undefined, changer: (id: number) => void) => React.ReactNode;
  onFermer: () => void;
}

type Ligne = { actif: boolean; heureDebut: string; heureFin: string };

const ligneParDefaut = (i: number): Ligne => ({ actif: i < 5, heureDebut: '08:00', heureFin: '16:00' });

/** Un horaire tel que renvoyé par GET /api/agendas (la durée est portée par chaque horaire). */
type HoraireApi = {
  jour: number;
  heureDebut: string;
  heureFin: string;
  dureeCreneauMinutes?: number;
};

/** Forme tolérante d'un agenda de la liste : horaires sous `horaires` (ou `plages`). */
type AgendaEditable = {
  id: number;
  staffId?: number;
  dureeCreneauMinutes?: number;
  horaires?: HoraireApi[];
  plages?: HoraireApi[];
};

const lireAgenda = (agenda?: Agenda) => agenda as unknown as AgendaEditable | undefined;

/** Horaires existants de l'agenda, ou null si l'API ne les a pas fournis. */
const horairesDe = (agenda?: Agenda): HoraireApi[] | null => {
  const src = lireAgenda(agenda);
  const liste = src?.horaires ?? src?.plages;
  return Array.isArray(liste) ? liste : null;
};

/** Recompose les 7 lignes du formulaire à partir des horaires enregistrés. */
const lignesDepuisHoraires = (horaires: HoraireApi[]): Ligne[] =>
  JOURS.map((_, i) => {
    const h = horaires.find((x) => Number(x.jour) === i + 1);
    return h
      ? { actif: true, heureDebut: String(h.heureDebut).slice(0, 5), heureFin: String(h.heureFin).slice(0, 5) }
      : { actif: false, heureDebut: '08:00', heureFin: '16:00' };
  });

/* ---------- Styles (charte ASINA Médical) ---------- */
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40';

const BTN_PRIMAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-[#1f9d55] px-4 text-sm font-bold text-white transition hover:bg-[#14703c] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_SECONDAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;

const CHAMP =
  'h-12 w-full rounded-[10px] border border-[#e5e7eb] bg-white text-sm text-[#1f2937] transition ' +
  'placeholder:text-[#5b6472] focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 ' +
  'disabled:cursor-not-allowed disabled:bg-[#fafbfa] disabled:text-[#5b6472] md:h-10';

const CHAMP_HEURE =
  'h-12 rounded-[10px] border border-[#e5e7eb] bg-white px-2.5 font-mono text-sm text-[#1f2937] transition ' +
  'focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 ' +
  'disabled:cursor-not-allowed disabled:bg-[#fafbfa] disabled:text-[#5b6472] md:h-10';

/** Interrupteur de statut : 34 × 20 px, vert = actif, gris = inactif. */
function Interrupteur({
  actif,
  onChange,
  label,
}: {
  actif: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={label}
      onClick={() => onChange(!actif)}
      className={`relative inline-flex h-5 w-[34px] shrink-0 cursor-pointer items-center rounded-full transition ${FOCUS} ${
        actif ? 'bg-[#1f9d55]' : 'bg-[#cbd5e1]'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          actif ? 'translate-x-[16px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

export function FormulaireAgendaModale({ agenda, renderSelecteurStaff, onFermer }: Props) {
  /* ---------- Modification : on reprend les horaires déjà enregistrés ---------- */
  const horairesExistants = horairesDe(agenda);
  const dureeExistante =
    lireAgenda(agenda)?.dureeCreneauMinutes ?? horairesExistants?.[0]?.dureeCreneauMinutes ?? 30;

  const [staffId, setStaffId] = useState<number | undefined>(agenda?.staffId);
  const [duree, setDuree] = useState(dureeExistante);
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    horairesExistants ? lignesDepuisHoraires(horairesExistants) : JOURS.map((_, i) => ligneParDefaut(i)),
  );
  const enregistrer = useEnregistrerAgenda();

  // En modification sans horaires reçus de l'API, on bloque l'enregistrement :
  // sinon on écraserait l'agenda par des valeurs par défaut.
  const horairesCharges = !agenda || horairesExistants !== null;
  const echecHoraires = !!agenda && !horairesCharges;

  // Échap ferme la fenêtre (sauf pendant l'enregistrement).
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !enregistrer.isPending) onFermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer, enregistrer.isPending]);

  const maj = (i: number, patch: Partial<Ligne>) =>
    setLignes((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const plages: PlageHebdomadaire[] = lignes
    .map((l, i) => ({ ...l, jour: (i + 1) as PlageHebdomadaire['jour'] }))
    .filter((l) => l.actif)
    .map(({ jour, heureDebut, heureFin }) => ({ jour, heureDebut, heureFin }));

  const horairesValides = lignes.every((l) => !l.actif || l.heureDebut < l.heureFin);
  const dureeValide = duree > 0;
  // En modification, on n'enregistre jamais avant d'avoir les vrais horaires (sinon on écraserait l'agenda par des valeurs par défaut).
  const pret = !!staffId && plages.length > 0 && dureeValide && horairesValides && horairesCharges;

  function soumettre(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!pret) return;
    enregistrer.mutate(
      { id: agenda?.id, input: { staffId: staffId!, dureeCreneauMinutes: duree, plages } },
      { onSuccess: onFermer },
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-agenda"
      className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end"
    >
      {/* Fond */}
      <div
        className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
        onClick={() => !enregistrer.isPending && onFermer()}
        aria-hidden="true"
      />

      {/* Tiroir à droite (desktop) / volet du bas (mobile) */}
      <form
        onSubmit={soumettre}
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-[20px] bg-white shadow-xl md:h-full md:max-h-none md:w-[560px] md:rounded-none"
      >
        {/* Poignée (mobile) */}
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#e5e7eb] md:hidden" aria-hidden="true" />

        {/* ───────── En-tête ───────── */}
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e7f6ed] text-[#14703c]">
              <CalendarClock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="titre-agenda" className="text-base font-bold text-[#1f2937]">
                {agenda ? "Modifier l'agenda" : 'Créer un agenda'}
              </h2>
              <p className="text-xs text-[#5b6472]">
                Définissez les jours, les horaires et la durée des créneaux.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            disabled={enregistrer.isPending}
            aria-label="Fermer"
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-[#5b6472] transition hover:bg-[#f0f2f1] hover:text-[#1f2937] disabled:opacity-50 md:h-10 md:w-10 ${FOCUS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* ───────── Corps ───────── */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-6">
          {/* Modification : horaires non fournis par l'API */}
          {echecHoraires && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#fef3f2] p-3.5 text-sm text-[#b42318]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Les horaires de cet agenda sont indisponibles. Actualisez le calendrier puis réessayez : rien n'a
                été modifié.
              </span>
            </div>
          )}

          {/* Personnel */}
          <div>{renderSelecteurStaff(staffId, setStaffId)}</div>

          {/* Durée */}
          <div>
            <label htmlFor="agenda-duree" className="mb-1.5 block text-xs font-bold text-[#5b6472]">
              Durée d'un créneau <span className="text-[#b42318]">*</span>
            </label>
            <div className="relative">
              <Timer
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
                aria-hidden="true"
              />
              <input
                id="agenda-duree"
                type="number"
                min={5}
                step={5}
                inputMode="numeric"
                aria-invalid={!dureeValide}
                aria-describedby="aide-duree"
                className={`${CHAMP} pl-9 pr-20 font-mono`}
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5b6472]">
                minutes
              </span>
            </div>
            <p
              id="aide-duree"
              className={`mt-1.5 text-xs ${dureeValide ? 'text-[#5b6472]' : 'font-semibold text-[#b42318]'}`}
            >
              {dureeValide
                ? `Chaque rendez-vous durera ${duree} minutes.`
                : 'Indiquez une durée supérieure à 0.'}
            </p>
          </div>

          {/* Jours et horaires */}
          <fieldset>
            <legend className="mb-2 text-xs font-bold text-[#5b6472]">
              Jours et horaires de consultation <span className="text-[#b42318]">*</span>
            </legend>

            <ul className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
              {JOURS.map((nom, i) => {
                const actif = lignes[i].actif;
                const invalide = actif && lignes[i].heureDebut >= lignes[i].heureFin;
                return (
                  <li
                    key={nom}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#f0f2f1] px-3.5 py-2.5 last:border-b-0"
                  >
                    <div className="flex w-36 shrink-0 items-center gap-2.5">
                      <Interrupteur
                        actif={actif}
                        onChange={(v) => maj(i, { actif: v })}
                        label={`${nom} : jour de consultation`}
                      />
                      <span className={`text-sm font-bold ${actif ? 'text-[#1f2937]' : 'text-[#5b6472]'}`}>
                        {nom}
                      </span>
                    </div>

                    {actif ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          aria-label={`${nom}, heure de début`}
                          aria-invalid={invalide}
                          value={lignes[i].heureDebut}
                          onChange={(e) => maj(i, { heureDebut: e.target.value })}
                          className={`${CHAMP_HEURE} ${invalide ? 'border-[#b42318]' : ''}`}
                        />
                        <span className="text-xs text-[#5b6472]">à</span>
                        <input
                          type="time"
                          aria-label={`${nom}, heure de fin`}
                          aria-invalid={invalide}
                          value={lignes[i].heureFin}
                          onChange={(e) => maj(i, { heureFin: e.target.value })}
                          className={`${CHAMP_HEURE} ${invalide ? 'border-[#b42318]' : ''}`}
                        />
                      </div>
                    ) : (
                      <span className="ml-auto rounded-full border border-[#e5e7eb] bg-[#f6f8f7] px-2.5 py-0.5 text-xs font-bold text-[#5b6472]">
                        Repos
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {!horairesValides && (
              <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#b42318]">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                L'heure de fin doit être après l'heure de début.
              </p>
            )}
            {plages.length === 0 && (
              <p role="note" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#8a5300]">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Activez au moins un jour de consultation.
              </p>
            )}
          </fieldset>

          {enregistrer.isError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#fef3f2] p-3.5 text-sm text-[#b42318]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Enregistrement impossible. Vérifiez les horaires et réessayez.</span>
            </div>
          )}
        </div>

        {/* ───────── Pied fixe ───────── */}
        <div className="flex items-center justify-between gap-3 border-t border-[#e5e7eb] bg-white px-5 py-3.5 md:px-6">
          <p className="hidden text-xs text-[#5b6472] sm:block" aria-live="polite">
            <strong className="tabular-nums text-[#1f2937]">{plages.length}</strong> jour
            {plages.length > 1 ? 's' : ''} de consultation
          </p>

          <div className="flex w-full flex-col-reverse gap-2 sm:ml-auto sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onFermer}
              disabled={enregistrer.isPending}
              className={BTN_SECONDAIRE}
            >
              Annuler
            </button>
            <button type="submit" disabled={!pret || enregistrer.isPending} className={BTN_PRIMAIRE}>
              {enregistrer.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Enregistrer l'agenda
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}