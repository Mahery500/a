/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Search,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useSession } from '@/cerveau/session';
import { extraireElementsCollection, extraireMessageErreur } from '@/noyau/http';
import { http } from '../api/http';
import { formaterDate } from '../api/rendez-vous.mapping';
import { rendezVousApi as apiServices } from '../api/rendez-vous.api';
import { useRequete } from '../hooks/useRequete';
import { useAnnulerRendezVous, useConfirmerArrivee } from '../hooks/useRendezVousMutations';
import type { Agenda, RendezVous } from '../modele/types';
import { CalendrierStaff } from './CalendrierStaff';
import { DemandesEnAttente } from './DemandesEnAttente';
import { FormulaireAgendaModale } from './FormulaireAgendaModale';
import { FormulaireRendezVousModale } from './FormulaireRendezVousModale';
import { SelecteurPatient } from './SelecteursRendezVous';
import { SelecteurPersonnelMedical } from './SelecteurPersonnelMedical';

export interface PageRendezVousProps {
  siteId?: number;
}

const ELEMENTS_PAR_PAGE = 10;

/* ---------- Styles (charte ASINA Médical) ---------- */
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40';

const BTN_PRIMAIRE = `inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#1f9d55] px-4 text-sm font-bold text-white transition hover:bg-[#14703c] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_SECONDAIRE = `inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_DANGER = `inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#b42318] px-4 text-sm font-bold text-white transition hover:bg-[#912018] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
/** Bouton « Annuler » en ligne : secondaire, texte rouge, fond rouge clair au survol. */
const BTN_ANNULER_LIGNE = `inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#b42318] transition hover:border-[#b42318]/30 hover:bg-[#fef3f2] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;

const TH =
  'sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] p-3 text-left text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]';

const sansAccent = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const initiales = (nom?: string | null) => {
  if (!nom) return '?';
  const parties = nom.trim().split(/\s+/);
  return ((parties[0]?.[0] ?? '') + (parties[1]?.[0] ?? '')).toUpperCase() || '?';
};

/* ---------- Statuts : texte + icône, jamais la couleur seule ---------- */
const STYLES_STATUT: Record<string, { libelle: string; classes: string; icone: React.ReactNode }> = {
  PLANIFIE: {
    libelle: 'Planifié',
    classes: 'border-[#e5e7eb] bg-[#f6f8f7] text-[#5b6472]',
    icone: <Clock className="h-3 w-3" aria-hidden="true" />,
  },
  CONFIRME: {
    libelle: 'Arrivée confirmée',
    classes: 'border-transparent bg-[#fff4e0] text-[#8a5300]',
    icone: <CalendarClock className="h-3 w-3" aria-hidden="true" />,
  },
  HONORE: {
    libelle: 'Honoré',
    classes: 'border-transparent bg-[#e7f6ed] text-[#14703c]',
    icone: <Check className="h-3 w-3" aria-hidden="true" />,
  },
  ANNULE: {
    libelle: 'Annulé',
    classes: 'border-transparent bg-[#fef3f2] text-[#b42318]',
    icone: <Ban className="h-3 w-3" aria-hidden="true" />,
  },
  ABSENT: {
    libelle: 'Absent',
    classes: 'border-[#e5e7eb] bg-white text-[#5b6472]',
    icone: <UserX className="h-3 w-3" aria-hidden="true" />,
  },
};

const styleStatut = (statut: string) =>
  STYLES_STATUT[statut] ?? {
    libelle: statut,
    classes: 'border-[#e5e7eb] bg-[#f6f8f7] text-[#5b6472]',
    icone: null,
  };

const ChipStatut: React.FC<{ statut: string }> = ({ statut }) => {
  const s = styleStatut(statut);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${s.classes}`}
    >
      {s.icone}
      {s.libelle}
    </span>
  );
};

const Avatar: React.FC<{ nom?: string | null }> = ({ nom }) => (
  <span
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f6ed] text-xs font-bold text-[#14703c]"
    aria-hidden="true"
  >
    {initiales(nom)}
  </span>
);

/* ---------- Filtre par statut ---------- */
type FiltreStatut = 'tous' | 'planifie' | 'confirme' | 'honore' | 'annule';

const correspond = (f: FiltreStatut, statut: string) => {
  switch (f) {
    case 'tous':
      return true;
    case 'planifie':
      return statut === 'PLANIFIE';
    case 'confirme':
      return statut === 'CONFIRME';
    case 'honore':
      return statut === 'HONORE';
    case 'annule':
      return statut === 'ANNULE' || statut === 'ABSENT';
  }
};

/* ================================================================== *
 * Pagination
 * ================================================================== */
const Pagination: React.FC<{ page: number; parPage: number; total: number; onChange: (p: number) => void }> = ({
  page,
  parPage,
  total,
  onChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / parPage));
  const debut = total === 0 ? 0 : (page - 1) * parPage + 1;
  const fin = Math.min(page * parPage, total);
  const btn = `inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-40 md:h-10 md:w-10 ${FOCUS}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-3">
      <p className="text-xs text-[#5b6472]" aria-live="polite">
        <span className="font-bold tabular-nums text-[#1f2937]">
          {debut}–{fin}
        </span>{' '}
        sur <span className="tabular-nums">{total}</span>
      </p>
      {totalPages > 1 && (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(page - 1, 1))}
            disabled={page === 1}
            aria-label="Page précédente"
            className={btn}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4.5rem] text-center text-xs text-[#5b6472]">
            Page <strong className="tabular-nums text-[#1f2937]">{page}</strong> / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            aria-label="Page suivante"
            className={btn}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ================================================================== *
 * Actions d'un rendez-vous : boutons alignés sur une ligne
 * ================================================================== */
interface ActionsLigneProps {
  rdv: RendezVous;
  nomPatient: string;
  occupe: boolean;
  onConfirmer: (rdv: RendezVous) => void;
  onAnnuler: (rdv: RendezVous) => void;
  /** true = boutons pleine largeur côte à côte (cartes mobiles). */
  pleineLargeur?: boolean;
}

const ActionsLigne: React.FC<ActionsLigneProps> = ({
  rdv,
  nomPatient,
  occupe,
  onConfirmer,
  onAnnuler,
  pleineLargeur,
}) => {
  const confirmable = rdv.statut === 'PLANIFIE';
  const annulable = rdv.statut === 'PLANIFIE' || rdv.statut === 'CONFIRME';

  if (!confirmable && !annulable) {
    return <span className="block text-right text-xs text-[#5b6472]">Aucune action</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${pleineLargeur ? 'w-full' : 'justify-end'}`}>
      {confirmable && (
        <button
          type="button"
          onClick={() => onConfirmer(rdv)}
          disabled={occupe}
          aria-label={`Confirmer l'arrivée de ${nomPatient}`}
          className={`${BTN_PRIMAIRE} ${pleineLargeur ? 'flex-1' : ''}`}
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Confirmer l'arrivée
        </button>
      )}
      {annulable && (
        <button
          type="button"
          onClick={() => onAnnuler(rdv)}
          disabled={occupe}
          aria-label={`Annuler le rendez-vous de ${nomPatient}`}
          className={`${BTN_ANNULER_LIGNE} ${pleineLargeur ? 'flex-1' : ''}`}
        >
          <Ban className="h-4 w-4" aria-hidden="true" />
          Annuler
        </button>
      )}
    </div>
  );
};

/* ================================================================== *
 * Page
 * ================================================================== */
function PageRendezVousContenu({ siteId }: { siteId: number }) {
  const [modale, setModale] = useState<'rdv' | 'agenda' | null>(null);
  const [vue, setVue] = useState<'calendrier' | 'liste'>('calendrier');
  const [aAnnuler, setAAnnuler] = useState<RendezVous | null>(null);
  // Agenda en cours de modification (null = création) et clé pour recharger le calendrier après enregistrement.
  const [agendaAModifier, setAgendaAModifier] = useState<Agenda | null>(null);
  const [cleCalendrier, setCleCalendrier] = useState(0);

  const [filtre, setFiltre] = useState<FiltreStatut>('tous');
  const [recherche, setRecherche] = useState('');
  const [pageCourante, setPageCourante] = useState(1);

  const liste = useRequete(
    async () => {
      const brut = extraireElementsCollection<RendezVous>(
        await http.get(`/api/rendez-vous?siteId=${siteId}`),
      );
      // L'API renvoie dateRdv (ISO) : on calcule ici les libellés affichés par le tableau.
      return brut.map((r) => ({ ...r, ...formaterDate(r.dateRdv) }));
    },
    [siteId],
    { tag: 'rendez-vous' },
  );
  const annuler = useAnnulerRendezVous();

  /* ---------- Confirmation d'arrivée ---------- */
  const confirmer = useConfirmerArrivee();
  const [aConfirmer, setAConfirmer] = useState<RendezVous | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const services = useRequete(async () => apiServices.listerServices(siteId), [siteId]);
  const listeServices = services.data ?? [];
  // Un seul service : présélectionné d'office.
  const serviceChoisi = serviceId ?? (listeServices.length === 1 ? listeServices[0].id : null);

  const validerArrivee = () => {
    if (!aConfirmer || serviceChoisi == null) return;
    const nom = aConfirmer.patientNom ?? `Patient ${aConfirmer.patientId}`;
    confirmer.mutate(
      { id: aConfirmer.id, serviceId: serviceChoisi },
      {
        onSuccess: (res: unknown) => {
          const ticket = (res as { numTicket?: string | number } | undefined)?.numTicket;
          setMessage(`Arrivée confirmée pour ${nom}${ticket != null ? ` · ticket n° ${ticket}` : ''}.`);
          setAConfirmer(null);
          setServiceId(null);
        },
        onError: () => setAConfirmer(null), // l'erreur s'affiche dans le bandeau de la page
      },
    );
  };

  const rendezVous = liste.data ?? [];

  useEffect(() => setPageCourante(1), [filtre, recherche, vue]);

  /* ---------- Compteurs (servent aussi de filtres) ---------- */
  const stats = useMemo(
    () => [
      { id: 'tous' as const, label: 'Total', icone: Calendar, valeur: rendezVous.length },
      {
        id: 'planifie' as const,
        label: 'Planifiés',
        icone: CalendarClock,
        valeur: rendezVous.filter((r) => r.statut === 'PLANIFIE').length,
      },
      {
        id: 'confirme' as const,
        label: 'Arrivée confirmée',
        icone: Clock,
        valeur: rendezVous.filter((r) => r.statut === 'CONFIRME').length,
      },
      {
        id: 'honore' as const,
        label: 'Honorés',
        icone: CalendarCheck,
        valeur: rendezVous.filter((r) => r.statut === 'HONORE').length,
      },
      {
        id: 'annule' as const,
        label: 'Annulés / Absents',
        icone: CalendarX,
        valeur: rendezVous.filter((r) => r.statut === 'ANNULE' || r.statut === 'ABSENT').length,
      },
    ],
    [rendezVous],
  );

  const nbConfirmesEnAttente = stats.find((s) => s.id === 'confirme')?.valeur ?? 0;

  const visibles = useMemo(() => {
    const q = sansAccent(recherche);
    return rendezVous.filter((r) => {
      if (!correspond(filtre, r.statut)) return false;
      if (!q) return true;
      return sansAccent(
        [r.patientNom ?? `Patient ${r.patientId}`, r.commentaire, r.dateAffichee, r.heureAffichee].join(' '),
      ).includes(q);
    });
  }, [rendezVous, filtre, recherche]);

  const nbFiltresActifs = (filtre !== 'tous' ? 1 : 0) + (recherche ? 1 : 0);
  const reinitialiser = () => {
    setFiltre('tous');
    setRecherche('');
  };

  const totalPages = Math.ceil(visibles.length / ELEMENTS_PAR_PAGE) || 1;
  const pageActuelleSecurisee = Math.min(pageCourante, totalPages);
  const elementsPagines = useMemo(() => {
    const debut = (pageActuelleSecurisee - 1) * ELEMENTS_PAR_PAGE;
    return visibles.slice(debut, debut + ELEMENTS_PAR_PAGE);
  }, [visibles, pageActuelleSecurisee]);

  const confirmerAnnulation = () => {
    if (!aAnnuler) return;
    annuler.mutate(aAnnuler.id, {
      onSuccess: () => setAAnnuler(null),
      onError: () => setAAnnuler(null), // l'erreur s'affiche dans le bandeau de la page
    });
  };

  const occupe = annuler.isPending || confirmer.isPending;

  return (
    <section className="space-y-[14px] px-4 py-5 text-sm text-[#1f2937] md:px-6">
      {/* ───────── En-tête ───────── */}
      <header className="space-y-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[#1f2937]">Rendez-vous</h1>
          <p className="text-[13px] text-[#5b6472]">
            Planifiez les consultations et gérez les agendas du personnel.
          </p>
        </div>

        {/* Barre d'outils : une seule ligne, tous les éléments à 40 px */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e5e7eb] bg-white p-2">
          {/* Sélecteur d'affichage segmenté */}
          <div
            role="radiogroup"
            aria-label="Affichage"
            className="inline-flex rounded-[10px] bg-[#f6f8f7] p-1"
          >
            {(
              [
                { v: 'calendrier', l: 'Calendrier', Icone: CalendarClock },
                { v: 'liste', l: 'Liste', Icone: Users },
              ] as const
            ).map(({ v, l, Icone }) => {
              const actif = vue === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => setVue(v)}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-[8px] px-4 text-sm transition md:h-8 ${FOCUS} ${
                    actif
                      ? 'bg-white font-bold text-[#14703c] shadow-sm ring-1 ring-[#1f9d55]'
                      : 'font-semibold text-[#5b6472] hover:text-[#1f2937]'
                  }`}
                >
                  <Icone className="h-4 w-4" aria-hidden="true" />
                  {l}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => liste.refetch?.()}
              disabled={liste.isLoading}
              aria-label="Actualiser les rendez-vous"
              title="Actualiser"
              className={`${BTN_SECONDAIRE} w-12 px-0 md:w-10`}
            >
              <RefreshCw className={`h-4 w-4 ${liste.isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAgendaAModifier(null);
                setModale('agenda');
              }}
              className={BTN_SECONDAIRE}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Agenda du staff
            </button>

            <button type="button" onClick={() => setModale('rdv')} className={`${BTN_PRIMAIRE} hidden md:inline-flex`}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Planifier un rendez-vous
            </button>
          </div>
        </div>
      </header>

      {/* ───────── Erreurs et confirmations ───────── */}
      {liste.isError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#fef3f2] p-3.5 text-sm text-[#b42318]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{extraireMessageErreur(liste.error)}</span>
          <button
            type="button"
            onClick={() => liste.refetch?.()}
            className={`rounded font-bold underline underline-offset-2 ${FOCUS}`}
          >
            Réessayer
          </button>
        </div>
      )}
      {annuler.isError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#fef3f2] p-3.5 text-sm text-[#b42318]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{extraireMessageErreur(annuler.error)}</span>
        </div>
      )}
      {confirmer.isError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#fef3f2] p-3.5 text-sm text-[#b42318]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{extraireMessageErreur(confirmer.error)}</span>
        </div>
      )}
      {message && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-[14px] bg-[#e7f6ed] p-3.5 text-sm font-medium text-[#14703c]"
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{message}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Fermer" className={`rounded ${FOCUS}`}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Demandes envoyées par les médecins (suivi / orientation spécialiste) */}
      <DemandesEnAttente />

      {vue === 'calendrier' ? (
        <CalendrierStaff
          key={cleCalendrier}
          siteId={siteId}
          onModifierAgenda={(a) => {
            // L'agenda de la liste est transmis tel quel ; la modale complète ses horaires si besoin.
            setAgendaAModifier(a as unknown as Agenda);
            setModale('agenda');
          }}
        />
      ) : (
        <>
          {/* ───────── Bandeau de stats = filtres par statut ───────── */}
          {!liste.isLoading && rendezVous.length > 0 && (
            <div
              role="radiogroup"
              aria-label="Filtrer par statut"
              className="grid grid-cols-2 gap-2 rounded-[14px] border border-[#e5e7eb] bg-white p-2 sm:grid-cols-3 lg:grid-cols-5"
            >
              {stats.map(({ id, label, icone: Icone, valeur }) => {
                const actif = filtre === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={actif}
                    onClick={() => setFiltre(actif && id !== 'tous' ? 'tous' : id)}
                    className={`flex min-h-[56px] items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition ${FOCUS} ${
                      actif ? 'border-[#1f9d55] bg-[#e7f6ed]' : 'border-transparent hover:bg-[#fafbfa]'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
                        actif ? 'bg-white text-[#14703c]' : 'bg-[#f6f8f7] text-[#5b6472]'
                      }`}
                    >
                      <Icone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-xl font-bold tabular-nums leading-tight ${
                          actif ? 'text-[#14703c]' : 'text-[#1f2937]'
                        }`}
                      >
                        {valeur}
                      </span>
                      <span className="block truncate text-xs text-[#5b6472]">{label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Alerte ambre : patients arrivés, consultation à suivre */}
          {nbConfirmesEnAttente > 0 && filtre !== 'confirme' && (
            <div
              role="note"
              className="flex flex-wrap items-center gap-2 rounded-[14px] bg-[#fff4e0] px-3.5 py-3 text-sm font-medium text-[#8a5300]"
            >
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {nbConfirmesEnAttente} patient{nbConfirmesEnAttente > 1 ? 's' : ''} arrivé
                {nbConfirmesEnAttente > 1 ? 's' : ''}, en attente de consultation.
              </span>
              <button
                type="button"
                onClick={() => setFiltre('confirme')}
                className={`ml-auto rounded font-bold underline underline-offset-2 ${FOCUS}`}
              >
                Afficher
              </button>
            </div>
          )}

          {/* ───────── Recherche ───────── */}
          {!liste.isLoading && rendezVous.length > 0 && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Patient, motif, date…"
                    aria-label="Rechercher un rendez-vous"
                    className="h-12 w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-9 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 md:h-10 [&::-webkit-search-cancel-button]:hidden"
                  />
                  {recherche && (
                    <button
                      type="button"
                      onClick={() => setRecherche('')}
                      aria-label="Effacer la recherche"
                      className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] ${FOCUS}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <span className="text-xs text-[#5b6472]" aria-live="polite">
                  {nbFiltresActifs > 0
                    ? `${visibles.length} sur ${rendezVous.length} rendez-vous`
                    : `${rendezVous.length} rendez-vous`}
                </span>

                {nbFiltresActifs > 0 && (
                  <button type="button" onClick={reinitialiser} className={BTN_SECONDAIRE}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Réinitialiser ({nbFiltresActifs})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ───────── État vide ───────── */}
          {!liste.isLoading && !liste.isError && visibles.length === 0 && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6f8f7]">
                <Calendar className="h-6 w-6 text-[#5b6472]" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-[#1f2937]">
                {rendezVous.length === 0 ? 'Aucun rendez-vous.' : 'Aucun rendez-vous ne correspond à ces filtres.'}
              </p>
              {rendezVous.length === 0 ? (
                <>
                  <p className="mt-1 text-xs text-[#5b6472]">
                    Planifiez le premier rendez-vous pour qu’il apparaisse ici.
                  </p>
                  <button type="button" onClick={() => setModale('rdv')} className={`${BTN_PRIMAIRE} mt-3`}>
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Planifier un rendez-vous
                  </button>
                </>
              ) : (
                <button type="button" onClick={reinitialiser} className={`${BTN_SECONDAIRE} mt-3`}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {/* ───────── Tableau (desktop) ───────── */}
          {(liste.isLoading || visibles.length > 0) && (
            <div className="hidden overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white md:block">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={TH}>Date et heure</th>
                      <th scope="col" className={TH}>Patient</th>
                      <th scope="col" className={TH}>Statut</th>
                      <th scope="col" className={TH}>Motif</th>
                      <th scope="col" className={`${TH} w-[300px] text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2f1]">
                    {liste.isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`sk-${i}`} aria-hidden="true" className="h-[54px]">
                          <td className="p-3">
                            <div className="h-4 w-24 animate-pulse rounded bg-[#f0f2f1]" />
                            <div className="mt-2 h-3 w-16 animate-pulse rounded bg-[#f0f2f1]" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-40 animate-pulse rounded bg-[#f0f2f1]" />
                          </td>
                          <td className="p-3">
                            <div className="h-5 w-24 animate-pulse rounded-full bg-[#f0f2f1]" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-48 animate-pulse rounded bg-[#f0f2f1]" />
                          </td>
                          <td />
                        </tr>
                      ))}

                    {!liste.isLoading &&
                      elementsPagines.map((rdv) => {
                        const nomPatient = rdv.patientNom ?? `Patient ${rdv.patientId}`;
                        const annulee = rdv.statut === 'ANNULE';
                        return (
                          <tr
                            key={rdv.id}
                            className={`h-[64px] transition-colors hover:bg-[#fafbfa] ${annulee ? 'opacity-60' : ''}`}
                          >
                            <td className="whitespace-nowrap p-3">
                              <div className="font-mono text-sm font-bold tabular-nums text-[#1f2937]">
                                {rdv.heureAffichee}
                              </div>
                              <div className="text-xs text-[#5b6472]">{rdv.dateAffichee}</div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar nom={rdv.patientNom} />
                                <span className="truncate font-bold text-[#1f2937]">{nomPatient}</span>
                              </div>
                            </td>

                            <td className="whitespace-nowrap p-3">
                              <ChipStatut statut={rdv.statut} />
                            </td>

                            <td className="max-w-xs p-3">
                              {rdv.commentaire ? (
                                <span className="line-clamp-2 text-[#1f2937]" title={rdv.commentaire}>
                                  {rdv.commentaire}
                                </span>
                              ) : (
                                <span className="text-[#5b6472]">—</span>
                              )}
                            </td>

                            <td className="p-3">
                              <ActionsLigne
                                rdv={rdv}
                                nomPatient={nomPatient}
                                occupe={occupe}
                                onConfirmer={setAConfirmer}
                                onAnnuler={setAAnnuler}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───────── Cartes (mobile) ───────── */}
          {(liste.isLoading || visibles.length > 0) && (
            <ul className="space-y-3 md:hidden">
              {liste.isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={`skm-${i}`}
                    aria-hidden="true"
                    className="rounded-[14px] border border-[#e5e7eb] bg-white p-4"
                  >
                    <div className="h-4 w-32 animate-pulse rounded bg-[#f0f2f1]" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[#f0f2f1]" />
                    <div className="mt-4 h-4 w-40 animate-pulse rounded bg-[#f0f2f1]" />
                  </li>
                ))}

              {!liste.isLoading &&
                elementsPagines.map((rdv) => {
                  const nomPatient = rdv.patientNom ?? `Patient ${rdv.patientId}`;
                  const annulee = rdv.statut === 'ANNULE';
                  const aDesActions = rdv.statut === 'PLANIFIE' || rdv.statut === 'CONFIRME';
                  return (
                    <li
                      key={rdv.id}
                      className={`rounded-[14px] border border-[#e5e7eb] bg-white p-4 ${annulee ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-base font-bold tabular-nums text-[#1f2937]">
                            {rdv.heureAffichee}
                          </div>
                          <div className="text-xs text-[#5b6472]">{rdv.dateAffichee}</div>
                        </div>
                        <ChipStatut statut={rdv.statut} />
                      </div>

                      <div className="mt-3 flex items-center gap-2.5">
                        <Avatar nom={rdv.patientNom} />
                        <span className="truncate font-bold text-[#1f2937]">{nomPatient}</span>
                      </div>

                      {rdv.commentaire && (
                        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-[#5b6472]">
                          <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="line-clamp-2">{rdv.commentaire}</span>
                        </p>
                      )}

                      {aDesActions && (
                        <div className="mt-3 border-t border-[#f0f2f1] pt-3">
                          <ActionsLigne
                            rdv={rdv}
                            nomPatient={nomPatient}
                            occupe={occupe}
                            onConfirmer={setAConfirmer}
                            onAnnuler={setAAnnuler}
                            pleineLargeur
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}

          {!liste.isLoading && visibles.length > 0 && (
            <Pagination
              page={pageActuelleSecurisee}
              parPage={ELEMENTS_PAR_PAGE}
              total={visibles.length}
              onChange={setPageCourante}
            />
          )}
        </>
      )}

      {/* ───────── Bouton flottant (mobile) ───────── */}
      <button
        type="button"
        onClick={() => setModale('rdv')}
        className={`fixed bottom-5 right-5 z-30 inline-flex h-[52px] items-center gap-2 rounded-full bg-[#1f9d55] px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(31,157,85,.35)] transition hover:bg-[#14703c] md:hidden ${FOCUS}`}
      >
        <CalendarPlus className="h-5 w-5" aria-hidden="true" />
        Planifier
      </button>

      {/* ───────── Confirmation d'annulation ───────── */}
      {aAnnuler && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="titre-annulation" className="fixed inset-0 z-50 grid place-items-end md:place-items-center">
          <div
            className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
            onClick={() => !annuler.isPending && setAAnnuler(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-t-[20px] bg-white p-5 shadow-xl md:rounded-[14px]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e5e7eb] md:hidden" aria-hidden="true" />
            <h2 id="titre-annulation" className="text-base font-bold text-[#1f2937]">
              Annuler ce rendez-vous ?
            </h2>
            <p className="mt-2 text-sm text-[#5b6472]">
              Rendez-vous de{' '}
              <strong className="text-[#1f2937]">{aAnnuler.patientNom ?? `Patient ${aAnnuler.patientId}`}</strong> le{' '}
              {aAnnuler.dateAffichee} à {aAnnuler.heureAffichee}. Le créneau redeviendra disponible.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#f0f2f1] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAAnnuler(null)}
                disabled={annuler.isPending}
                className={BTN_SECONDAIRE}
              >
                Garder le rendez-vous
              </button>
              <button
                type="button"
                onClick={confirmerAnnulation}
                disabled={annuler.isPending}
                className={BTN_DANGER}
              >
                {annuler.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Annuler le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Confirmation d'arrivée : choix du service ───────── */}
      {aConfirmer && (
        <div role="dialog" aria-modal="true" aria-labelledby="titre-arrivee" className="fixed inset-0 z-50 grid place-items-end md:place-items-center">
          <div
            className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
            onClick={() => !confirmer.isPending && setAConfirmer(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-t-[20px] bg-white p-5 shadow-xl md:rounded-[14px]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e5e7eb] md:hidden" aria-hidden="true" />
            <h2 id="titre-arrivee" className="text-base font-bold text-[#1f2937]">
              Confirmer l'arrivée
            </h2>
            <p className="mt-2 text-sm text-[#5b6472]">
              <strong className="text-[#1f2937]">
                {aConfirmer.patientNom ?? `Patient ${aConfirmer.patientId}`}
              </strong>{' '}
              est arrivé pour son rendez-vous de {aConfirmer.heureAffichee}. Un ticket sera émis dans le service choisi.
            </p>

            <fieldset className="mt-4">
              <legend className="text-xs font-bold text-[#5b6472]">
                Service <span className="text-[#b42318]">*</span>
              </legend>
              {services.isLoading ? (
                <p className="mt-2 text-sm text-[#5b6472]">Chargement des services…</p>
              ) : services.isError || listeServices.length === 0 ? (
                <p role="alert" className="mt-2 text-sm text-[#b42318]">
                  Aucun service disponible pour ce site.
                </p>
              ) : (
                <div role="radiogroup" className="mt-2 space-y-2">
                  {listeServices.map((s) => {
                    const actif = serviceChoisi === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={actif}
                        onClick={() => setServiceId(s.id)}
                        className={`flex min-h-12 w-full items-center justify-between rounded-[10px] border px-3.5 text-left text-sm transition ${FOCUS} ${
                          actif
                            ? 'border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]'
                            : 'border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]'
                        }`}
                      >
                        {s.nom}
                        {actif && <Check className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#f0f2f1] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAConfirmer(null)}
                disabled={confirmer.isPending}
                className={BTN_SECONDAIRE}
              >
                Retour
              </button>
              <button
                type="button"
                onClick={validerArrivee}
                disabled={confirmer.isPending || serviceChoisi == null}
                className={BTN_PRIMAIRE}
              >
                {confirmer.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Confirmer et émettre le ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Modales ───────── */}
      {modale === 'rdv' && (
        <FormulaireRendezVousModale
          renderSelecteurPatient={(valeur, changer) => <SelecteurPatient valeur={valeur} changer={changer} />}
          onFermer={() => setModale(null)}
        />
      )}
      {modale === 'agenda' && (
        <FormulaireAgendaModale
          agenda={agendaAModifier ?? undefined}
          renderSelecteurStaff={(valeur, changer) => (
            <SelecteurPersonnelMedical
              valeur={valeur}
              changer={changer}
              siteId={siteId}
              verrouille={!!agendaAModifier}
            />
          )}
          onFermer={() => {
            setModale(null);
            setAgendaAModifier(null);
            setCleCalendrier((n) => n + 1); // recharge le calendrier
          }}
        />
      )}
    </section>
  );
}

/**
 * Point d'entrée : le site vient de la prop, sinon du site actif de la session.
 * Sans site, on n'envoie aucune requête (plus de site 1 par défaut).
 */
export function PageRendezVous({ siteId }: PageRendezVousProps) {
  const { siteActifId: siteSessionId } = useSession();
  const site = siteId ?? siteSessionId ?? null;

  if (site == null) {
    return (
      <section className="px-4 py-5 md:px-6">
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#fef3f2] p-3.5 text-sm text-[#b42318]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Aucun site actif. Reconnectez-vous ou contactez un administrateur.</span>
        </div>
      </section>
    );
  }

  return <PageRendezVousContenu siteId={site} />;
}