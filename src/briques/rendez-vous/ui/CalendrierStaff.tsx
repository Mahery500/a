/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  AlertCircle,
  Ban,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquareText,
  Pencil,
  RefreshCw,
  UserX,
  X,
} from 'lucide-react';
import { extraireElementsCollection } from '@/noyau/http';
import { http } from '../api/http';
import { useRequete } from '../hooks/useRequete';

export interface AgendaItem {
  id: number;
  staffId: number;
  libelle: string;
}

interface RdvCal {
  id: number;
  dateRdv: string;
  dateFin?: string | null;
  statut: string;
  commentaire?: string | null;
  patientId: number;
  patientNom?: string | null;
  staffId?: number | null;
}

const HEURE_DEBUT = 7;
const HEURE_FIN = 19;
const PX_PAR_HEURE = 96;
const PX_PAR_MIN = PX_PAR_HEURE / 60;
const DUREE_PAR_DEFAUT_MIN = 30;
const DUREE_MIN_AFFICHEE = 10;
/** En dessous de cette hauteur (px), le rendez-vous tient sur une seule ligne. */
const HAUTEUR_COMPACTE = 40;

/* ---------- Styles (charte ASINA Médical) ---------- */
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40';

const BTN_SECONDAIRE = `inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_ICONE = `inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:w-10 ${FOCUS}`;
const BTN_PRIMAIRE = `inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#1f9d55] px-4 text-sm font-bold text-white transition hover:bg-[#14703c] disabled:cursor-default disabled:bg-[#e7f6ed] disabled:text-[#14703c] md:h-10 ${FOCUS}`;

/* ---------- Statuts : texte + icône + liseré, jamais la couleur seule ---------- */
interface StyleStatut {
  libelle: string;
  court: string;
  icone: ComponentType<{ className?: string }>;
  classes: string;
  accent: string;
}

const STATUTS: Record<string, StyleStatut> = {
  PLANIFIE: {
    libelle: 'Planifié',
    court: 'Planifié',
    icone: Clock,
    classes: 'border-[#e5e7eb] bg-[#f6f8f7] text-[#5b6472]',
    accent: '#5b6472',
  },
  CONFIRME: {
    libelle: 'Arrivée confirmée',
    court: 'Confirmé',
    icone: CalendarClock,
    classes: 'border-[#f5d9a8] bg-[#fff4e0] text-[#8a5300]',
    accent: '#8a5300',
  },
  HONORE: {
    libelle: 'Honoré',
    court: 'Honoré',
    icone: Check,
    classes: 'border-[#bfe6cf] bg-[#e7f6ed] text-[#14703c]',
    accent: '#1f9d55',
  },
  ANNULE: {
    libelle: 'Annulé',
    court: 'Annulé',
    icone: Ban,
    classes: 'border-[#f4c7c3] bg-[#fef3f2] text-[#b42318]',
    accent: '#b42318',
  },
  ABSENT: {
    libelle: 'Absent',
    court: 'Absent',
    icone: UserX,
    classes: 'border-[#e5e7eb] bg-white text-[#5b6472]',
    accent: '#cbd5e1',
  },
};

const STATUT_INCONNU: StyleStatut = STATUTS.ABSENT;
const styleDe = (statut: string) => STATUTS[statut] ?? STATUT_INCONNU;

/* ---------- Dates ---------- */
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const decaler = (date: string, jours: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + jours);
  return iso(d);
};

/** Les 7 jours (lundi à dimanche) de la semaine qui contient `date`. */
const semaineDe = (date: string) => {
  const d = new Date(`${date}T12:00:00`);
  const decalage = (d.getDay() + 6) % 7; // lundi = 0
  return Array.from({ length: 7 }, (_, i) => decaler(date, i - decalage));
};

const jourCourt = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');

const numeroJour = (date: string) => Number(date.slice(8, 10));

const dateLongue = (isoJour: string) =>
  new Date(`${isoJour}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const heureLocale = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Minutes depuis minuit, lues directement dans la chaîne ISO (HH à l'index 11, mm à 14). */
const minutesDuJour = (isoDate: string) =>
  Number(isoDate.slice(11, 13)) * 60 + Number(isoDate.slice(14, 16));

const debutMin = (r: RdvCal) => minutesDuJour(r.dateRdv);
const finMin = (r: RdvCal) =>
  r.dateFin
    ? Math.max(minutesDuJour(r.dateFin), debutMin(r) + DUREE_MIN_AFFICHEE)
    : debutMin(r) + DUREE_PAR_DEFAUT_MIN;

const plageHoraire = (r: RdvCal) =>
  `${r.dateRdv.slice(11, 16)}${r.dateFin ? `–${r.dateFin.slice(11, 16)}` : ''}`;

const nomDe = (r: RdvCal) => r.patientNom ?? `Patient ${r.patientId}`;

const initiales = (nom?: string | null) => {
  if (!nom) return '?';
  const parties = nom.trim().split(/\s+/);
  return ((parties[0]?.[0] ?? '') + (parties[1]?.[0] ?? '')).toUpperCase() || '?';
};

/* ---------- Chevauchements : côte à côte plutôt que superposés ---------- */
interface RdvPositionne {
  rdv: RdvCal;
  voie: number;
  voies: number;
}

function disposer(liste: RdvCal[]): RdvPositionne[] {
  const tries = [...liste].sort((a, b) => debutMin(a) - debutMin(b));
  const resultat: RdvPositionne[] = [];
  let groupe: RdvPositionne[] = [];
  let finsDesVoies: number[] = [];
  let finGroupe = -1;

  const cloturer = () => {
    groupe.forEach((g) => {
      g.voies = finsDesVoies.length;
    });
    resultat.push(...groupe);
    groupe = [];
    finsDesVoies = [];
  };

  for (const rdv of tries) {
    const d = debutMin(rdv);
    const f = finMin(rdv);
    if (groupe.length > 0 && d >= finGroupe) cloturer();

    let voie = finsDesVoies.findIndex((fin) => fin <= d);
    if (voie === -1) {
      voie = finsDesVoies.length;
      finsDesVoies.push(f);
    } else {
      finsDesVoies[voie] = f;
    }
    groupe.push({ rdv, voie, voies: 1 });
    finGroupe = groupe.length === 1 ? f : Math.max(finGroupe, f);
  }
  cloturer();
  return resultat;
}

/* ---------- Petits composants ---------- */
function PastilleStatut({ statut }: { statut: string }) {
  const s = styleDe(statut);
  const Icone = s.icone;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${s.classes}`}
    >
      <Icone className="h-3 w-3" aria-hidden="true" />
      {s.libelle}
    </span>
  );
}

function Avatar({ nom, taille = 'h-8 w-8' }: { nom?: string | null; taille?: string }) {
  return (
    <span
      className={`flex ${taille} shrink-0 items-center justify-center rounded-full bg-[#e7f6ed] text-xs font-bold text-[#14703c]`}
      aria-hidden="true"
    >
      {initiales(nom)}
    </span>
  );
}

/** Fiche d'un rendez-vous : volet du bas (mobile) / fenêtre centrée (desktop). */
function DetailRdv({
  rdv,
  agenda,
  onFermer,
}: {
  rdv: RdvCal;
  agenda?: string;
  onFermer: () => void;
}) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-detail-rdv"
      className="fixed inset-0 z-50 grid place-items-end md:place-items-center"
    >
      <div className="absolute inset-0 bg-[rgba(15,27,61,.45)]" onClick={onFermer} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-t-[20px] bg-white p-5 shadow-xl md:rounded-[14px]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e5e7eb] md:hidden" aria-hidden="true" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar nom={rdv.patientNom} taille="h-10 w-10" />
            <div className="min-w-0">
              <h2 id="titre-detail-rdv" className="truncate text-base font-bold text-[#1f2937]">
                {nomDe(rdv)}
              </h2>
              <p className="text-xs capitalize text-[#5b6472]">{dateLongue(rdv.dateRdv.slice(0, 10))}</p>
            </div>
          </div>
          <button type="button" onClick={onFermer} aria-label="Fermer" className={BTN_ICONE}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs font-bold text-[#5b6472]">Statut</dt>
            <dd>
              <PastilleStatut statut={rdv.statut} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs font-bold text-[#5b6472]">Horaire</dt>
            <dd className="font-mono font-bold tabular-nums text-[#1f2937]">{plageHoraire(rdv)}</dd>
          </div>
          {agenda && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs font-bold text-[#5b6472]">Agenda</dt>
              <dd className="truncate font-semibold text-[#1f2937]">{agenda}</dd>
            </div>
          )}
          <div className="border-t border-[#f0f2f1] pt-3">
            <dt className="mb-1 text-xs font-bold text-[#5b6472]">Motif</dt>
            <dd className="flex items-start gap-1.5 text-[#1f2937]">
              {rdv.commentaire ? (
                <>
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#5b6472]" aria-hidden="true" />
                  <span>{rdv.commentaire}</span>
                </>
              ) : (
                <span className="text-[#5b6472]">Aucun motif renseigné.</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex justify-end border-t border-[#f0f2f1] pt-4">
          <button type="button" onClick={onFermer} className={BTN_SECONDAIRE}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 * Calendrier du personnel
 * ================================================================== */
export function CalendrierStaff({
  siteId,
  onModifierAgenda,
}: {
  siteId: number;
  /** Ouvre le formulaire de modification pour l'agenda choisi. */
  onModifierAgenda?: (agenda: AgendaItem) => void;
}) {
  const [date, setDate] = useState(iso(new Date()));
  const [filtre, setFiltre] = useState<string>('TOUS');
  const [agendaMobileId, setAgendaMobileId] = useState<number | null>(null);
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [choisi, setChoisi] = useState<RdvCal | null>(null);
  const [actualisation, setActualisation] = useState(false);
  const [majA, setMajA] = useState<Date | null>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  // Rafraîchit le trait « heure actuelle » chaque minute.
  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const agendas = useRequete(
    async () => extraireElementsCollection<AgendaItem>(await http.get('/api/agendas')),
    [],
  );
  const rdvs = useRequete(
    async () =>
      extraireElementsCollection<RdvCal>(
        await http.get(`/api/rendez-vous?date=${date}&siteId=${siteId}`),
      ),
    [date, siteId],
  );

  // Heure de la dernière mise à jour : à chaque nouveau jeu de données.
  useEffect(() => {
    if (rdvs.data) setMajA(new Date());
  }, [rdvs.data]);

  /** Bouton « Actualiser » : recharge les agendas et les rendez-vous du jour affiché. */
  async function actualiser() {
    setActualisation(true);
    try {
      await Promise.all([agendas.refetch?.(), rdvs.refetch?.()]);
    } finally {
      setMajA(new Date());
      setActualisation(false);
    }
  }

  const fermerDetail = useCallback(() => setChoisi(null), []);

  const colonnes = agendas.data ?? [];
  const tous = rdvs.data ?? [];

  const compteurs = useMemo(() => {
    const c: Record<string, number> = {};
    tous.forEach((r) => {
      c[r.statut] = (c[r.statut] ?? 0) + 1;
    });
    return c;
  }, [tous]);

  const parStaff = useMemo(() => {
    const m = new Map<number, RdvCal[]>();
    tous
      .filter((r) => filtre === 'TOUS' || r.statut === filtre)
      .forEach((r) => {
        if (r.staffId == null) return;
        m.set(r.staffId, [...(m.get(r.staffId) ?? []), r]);
      });
    return m;
  }, [tous, filtre]);

  const nbAffiches = useMemo(
    () => Array.from(parStaff.values()).reduce((n, l) => n + l.length, 0),
    [parStaff],
  );

  const heures = Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i);
  const hauteur = (HEURE_FIN - HEURE_DEBUT) * PX_PAR_HEURE;

  const top = (r: RdvCal) => Math.max(0, (debutMin(r) - HEURE_DEBUT * 60) * PX_PAR_MIN);
  const hauteurRdv = (r: RdvCal) => (finMin(r) - debutMin(r)) * PX_PAR_MIN - 2;

  const aujourdhui = iso(maintenant);
  const estAujourdhui = date === aujourdhui;
  const minutesMaintenant = maintenant.getHours() * 60 + maintenant.getMinutes();
  const afficherTrait =
    estAujourdhui && minutesMaintenant >= HEURE_DEBUT * 60 && minutesMaintenant < HEURE_FIN * 60;
  const topMaintenant = (minutesMaintenant - HEURE_DEBUT * 60) * PX_PAR_MIN;

  // Au changement de jour ou au chargement : défile vers le premier rendez-vous
  // (ou vers l'heure actuelle, ou 08:00 si le jour est vide).
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || rdvs.isLoading) return;
    const cible =
      tous.length > 0
        ? Math.min(...tous.map(debutMin))
        : estAujourdhui
          ? minutesMaintenant
          : 8 * 60;
    zone.scrollTop = Math.max(0, (cible - HEURE_DEBUT * 60) * PX_PAR_MIN - 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, rdvs.data, colonnes.length]);

  const semaine = useMemo(() => semaineDe(date), [date]);

  const agendaMobile = colonnes.find((c) => c.id === agendaMobileId) ?? colonnes[0] ?? null;
  const rdvsMobile = agendaMobile
    ? [...(parStaff.get(agendaMobile.staffId) ?? [])].sort((a, b) => debutMin(a) - debutMin(b))
    : [];

  const libelleAgenda = (staffId?: number | null) =>
    colonnes.find((c) => c.staffId === staffId)?.libelle;

  const filtres: { code: string; libelle: string; nombre: number; icone: ComponentType<{ className?: string }> }[] = [
    { code: 'TOUS', libelle: 'Tous', nombre: tous.length, icone: Calendar },
    ...Object.entries(STATUTS).map(([code, s]) => ({
      code,
      libelle: s.court,
      nombre: compteurs[code] ?? 0,
      icone: s.icone,
    })),
  ];

  const enChargement = actualisation || rdvs.isLoading || agendas.isLoading;
  const erreur = agendas.isError || rdvs.isError;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white text-sm text-[#1f2937]">
      {/* ───────── Navigation : titre, actualiser, jour précédent / suivant ───────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e7f6ed] text-[#14703c]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold capitalize text-[#1f2937]">{dateLongue(date)}</h2>
            <p className="text-xs text-[#5b6472]" aria-live="polite">
              Agenda du personnel
              {majA && <span> · mis à jour à {heureLocale(majA)}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={actualiser}
            disabled={enChargement}
            aria-label="Actualiser le calendrier"
            title="Actualiser"
            className={BTN_SECONDAIRE}
          >
            {enChargement ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <span className="mx-1 hidden h-6 w-px bg-[#e5e7eb] md:block" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setDate(decaler(date, -1))}
            className={BTN_ICONE}
            aria-label="Jour précédent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDate(aujourdhui)}
            disabled={estAujourdhui}
            className={BTN_PRIMAIRE}
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={() => setDate(decaler(date, 1))}
            className={BTN_ICONE}
            aria-label="Jour suivant"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <label className="sr-only" htmlFor="calendrier-date">
            Choisir une date
          </label>
          <input
            id="calendrier-date"
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className={`h-12 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] transition focus:border-[#1f9d55] md:h-10 ${FOCUS}`}
          />
        </div>
      </div>

      {/* ───────── Semaine : accès direct aux jours ───────── */}
      <div
        className="grid grid-cols-7 gap-1.5 border-b border-[#f0f2f1] px-4 py-3 md:px-6"
        role="group"
        aria-label="Jours de la semaine"
      >
        {semaine.map((j) => {
          const actif = j === date;
          const estJourJ = j === aujourdhui;
          return (
            <button
              key={j}
              type="button"
              onClick={() => setDate(j)}
              aria-pressed={actif}
              aria-current={estJourJ ? 'date' : undefined}
              aria-label={dateLongue(j)}
              className={`flex min-h-12 flex-col items-center justify-center rounded-[10px] border px-1 py-1.5 transition ${FOCUS} ${
                actif
                  ? 'border-[#1f9d55] bg-[#e7f6ed] text-[#14703c]'
                  : 'border-transparent text-[#5b6472] hover:bg-[#fafbfa]'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-[.05em]">{jourCourt(j)}</span>
              <span className={`text-base tabular-nums ${actif ? 'font-bold' : 'font-semibold text-[#1f2937]'}`}>
                {numeroJour(j)}
              </span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${estJourJ ? 'bg-[#1f9d55]' : 'bg-transparent'}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* ───────── Compteurs = filtres par statut ───────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f2f1] bg-[#fafbfa] px-4 py-3 md:px-6">
        <p className="text-xs text-[#5b6472]">
          <strong className="tabular-nums text-[#1f2937]">{tous.length}</strong> rendez-vous
          <span className="mx-2 text-[#cbd5e1]" aria-hidden="true">
            |
          </span>
          <strong className="tabular-nums text-[#1f2937]">{colonnes.length}</strong> agenda
          {colonnes.length > 1 ? 's' : ''}
        </p>
        <div
          className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1"
          role="group"
          aria-label="Filtrer par statut"
        >
          {filtres.map((f) => {
            const actif = filtre === f.code;
            const Icone = f.icone;
            return (
              <button
                key={f.code}
                type="button"
                onClick={() => setFiltre(f.code)}
                aria-pressed={actif}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition ${FOCUS} ${
                  actif
                    ? 'border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]'
                    : 'border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]'
                }`}
              >
                <Icone className="h-3.5 w-3.5" aria-hidden="true" />
                {f.libelle}
                <span className="font-mono text-xs tabular-nums">{f.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── Erreur : message + réessayer ───────── */}
      {erreur && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-b border-[#b42318]/20 bg-[#fef3f2] px-4 py-3 text-sm text-[#b42318] md:px-6"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {agendas.isError ? 'Impossible de charger les agendas.' : 'Impossible de charger les rendez-vous.'}
          </span>
          <button
            type="button"
            onClick={actualiser}
            className={`rounded font-bold underline underline-offset-2 ${FOCUS}`}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ───────── Contenu ───────── */}
      {agendas.isLoading ? (
        <div className="space-y-3 p-6" role="status" aria-label="Chargement des agendas">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-[10px] bg-[#f0f2f1]" />
          ))}
        </div>
      ) : colonnes.length === 0 ? (
        !agendas.isError && (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6f8f7]">
              <CalendarDays className="h-6 w-6 text-[#5b6472]" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-[#1f2937]">Aucun agenda de personnel.</p>
            <p className="mt-1 text-xs text-[#5b6472]">Créez-en un via « Agenda du staff ».</p>
          </div>
        )
      ) : (
        <>
          {!rdvs.isLoading && !rdvs.isError && nbAffiches === 0 && (
            <div
              role="note"
              className="flex items-center gap-2 border-b border-[#f0f2f1] px-4 py-3 text-[13px] text-[#5b6472] md:px-6"
            >
              <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
              {tous.length === 0
                ? 'Aucun rendez-vous ce jour.'
                : 'Aucun rendez-vous avec ce statut ce jour.'}
            </div>
          )}

          {/* MOBILE : un agenda à la fois, rendez-vous en cartes */}
          <div className="md:hidden">
            <div
              className="flex gap-2 overflow-x-auto border-b border-[#f0f2f1] px-4 py-3"
              role="tablist"
              aria-label="Choisir un agenda"
            >
              {colonnes.map((c) => {
                const actif = agendaMobile?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={actif}
                    onClick={() => setAgendaMobileId(c.id)}
                    className={`min-h-12 shrink-0 rounded-full border px-4 text-[13px] transition ${FOCUS} ${
                      actif
                        ? 'border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]'
                        : 'border-[#e5e7eb] bg-white text-[#5b6472]'
                    }`}
                  >
                    {c.libelle}
                    <span className="ml-1.5 font-mono text-xs tabular-nums">
                      {(parStaff.get(c.staffId) ?? []).length}
                    </span>
                  </button>
                );
              })}
            </div>

            {onModifierAgenda && agendaMobile && (
              <div className="px-4 pt-3">
                <button
                  type="button"
                  onClick={() => onModifierAgenda(agendaMobile)}
                  className={`${BTN_SECONDAIRE} w-full`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Modifier l'agenda de {agendaMobile.libelle}
                </button>
              </div>
            )}

            {rdvsMobile.length > 0 && (
              <ul className="space-y-3 p-4">
                {rdvsMobile.map((r) => {
                  const s = styleDe(r.statut);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setChoisi(r)}
                        className={`flex w-full items-stretch gap-3 rounded-[14px] border border-l-4 border-[#e5e7eb] bg-white p-4 text-left transition hover:bg-[#fafbfa] ${FOCUS} ${
                          r.statut === 'ANNULE' ? 'opacity-60' : ''
                        }`}
                        style={{ borderLeftColor: s.accent }}
                      >
                        <span className="w-[52px] shrink-0 font-mono text-sm font-bold tabular-nums text-[#1f2937]">
                          {r.dateRdv.slice(11, 16)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[15px] font-bold ${
                              r.statut === 'ANNULE' ? 'text-[#5b6472] line-through' : 'text-[#1f2937]'
                            }`}
                          >
                            {nomDe(r)}
                          </span>
                          {r.commentaire && (
                            <span className="mt-0.5 line-clamp-2 block text-xs text-[#5b6472]">
                              {r.commentaire}
                            </span>
                          )}
                          <span className="mt-2 block">
                            <PastilleStatut statut={r.statut} />
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* DESKTOP : grille horaire */}
          <div
            ref={zoneRef}
            className="hidden overflow-auto md:block"
            style={{ maxHeight: '70vh' }}
            role="region"
            aria-label="Calendrier du personnel"
            tabIndex={0}
          >
            <div
              className="grid min-w-max"
              style={{
                gridTemplateColumns: `64px repeat(${colonnes.length}, minmax(240px, 1fr))`,
              }}
            >
              {/* En-têtes (sticky) */}
              <div className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-[#fafbfa]" />
              {colonnes.map((c) => (
                <div
                  key={c.id}
                  className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-l border-[#e5e7eb] bg-[#fafbfa] px-3 py-2.5"
                >
                  <Avatar nom={c.libelle} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold text-[#1f2937]">{c.libelle}</div>
                    <div className="text-xs text-[#5b6472]">
                      <span className="tabular-nums">{(parStaff.get(c.staffId) ?? []).length}</span> rdv
                    </div>
                  </div>
                  {onModifierAgenda && (
                    <button
                      type="button"
                      onClick={() => onModifierAgenda(c)}
                      aria-label={`Modifier l'agenda de ${c.libelle}`}
                      title="Modifier l'agenda"
                      className={`${BTN_ICONE} shrink-0 bg-white`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}

              {/* Colonne des heures */}
              <div className="relative" style={{ height: hauteur }}>
                {heures.map((h, i) => (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-2 font-mono text-xs text-[#5b6472]"
                    style={{ top: i * PX_PAR_HEURE }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
                {afficherTrait && (
                  <div
                    className="absolute right-1 z-10 -translate-y-1/2 rounded bg-[#1f9d55] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white"
                    style={{ top: topMaintenant }}
                    aria-hidden="true"
                  >
                    {heureLocale(maintenant)}
                  </div>
                )}
              </div>

              {/* Colonnes du personnel */}
              {colonnes.map((c) => (
                <div
                  key={c.id}
                  className="relative border-l border-[#e5e7eb]"
                  style={{ height: hauteur }}
                >
                  {heures.map((h, i) => (
                    <div key={h}>
                      <div
                        className="absolute inset-x-0 border-t border-[#e5e7eb]"
                        style={{ top: i * PX_PAR_HEURE }}
                      />
                      <div
                        className="absolute inset-x-0 border-t border-dashed border-[#f0f2f1]"
                        style={{ top: i * PX_PAR_HEURE + PX_PAR_HEURE / 2 }}
                      />
                    </div>
                  ))}

                  {afficherTrait && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-[#1f9d55]"
                      style={{ top: topMaintenant }}
                      aria-hidden="true"
                    />
                  )}

                  {disposer(parStaff.get(c.staffId) ?? []).map(({ rdv: r, voie, voies }) => {
                    const s = styleDe(r.statut);
                    const Icone = s.icone;
                    const largeur = 100 / voies;
                    const h = hauteurRdv(r);
                    const compact = h < HAUTEUR_COMPACTE;
                    const info = [
                      `${plageHoraire(r)} · ${nomDe(r)}`,
                      `Statut : ${s.libelle}`,
                      r.commentaire ? `Motif : ${r.commentaire}` : null,
                    ]
                      .filter(Boolean)
                      .join('\n');
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setChoisi(r)}
                        title={info}
                        aria-label={`${plageHoraire(r)}, ${nomDe(r)}, ${s.libelle}`}
                        className={`absolute z-[5] overflow-hidden rounded-[10px] border border-l-4 px-2.5 text-left text-xs transition hover:brightness-95 ${FOCUS} ${s.classes} ${
                          compact ? 'flex items-center gap-2' : 'py-1.5 leading-snug'
                        }`}
                        style={{
                          top: top(r),
                          height: h,
                          left: `calc(${voie * largeur}% + 4px)`,
                          width: `calc(${largeur}% - 8px)`,
                          borderLeftColor: s.accent,
                        }}
                      >
                        {compact ? (
                          <>
                            <Icone className="h-3 w-3 shrink-0" aria-hidden="true" />
                            <span className="shrink-0 font-mono font-bold">{r.dateRdv.slice(11, 16)}</span>
                            <span
                              className={`truncate font-semibold ${
                                r.statut === 'ANNULE' ? 'line-through' : ''
                              }`}
                            >
                              {nomDe(r)}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 font-mono font-bold">
                              <Icone className="h-3 w-3 shrink-0" aria-hidden="true" />
                              {plageHoraire(r)}
                            </div>
                            <div
                              className={`truncate text-[13px] font-semibold ${
                                r.statut === 'ANNULE' ? 'line-through' : ''
                              }`}
                            >
                              {nomDe(r)}
                            </div>
                            {h >= 70 && r.commentaire && (
                              <div className="truncate opacity-80">{r.commentaire}</div>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {choisi && (
        <DetailRdv rdv={choisi} agenda={libelleAgenda(choisi.staffId)} onFermer={fermerDetail} />
      )}
    </div>
  );
}