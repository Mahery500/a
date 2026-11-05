import React, { useState } from 'react';
import {
  Users,
  Stethoscope,
  Calendar,
  UserCheck,
  FolderHeart,
  ArrowRight,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  MoreVertical,
  Activity,
  FileText,
  Building2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTableauBordConsultation, PatientFile } from '../hooks/useTableauBordConsultation';

export interface ConsultationEnCoursTB {
  patientId?: number;
  encounterId?: number;
  numTicket?: string;
  patientNom?: string;
}

interface Props {
  siteActifId?: number;
  consultationEnCours: ConsultationEnCoursTB | null;
  onNaviguer: (ecranId: 'file' | 'active' | 'dossiers') => void;
  onOuvrirConsultationPatient?: (patient: PatientFile) => void;
}

// Couleurs de la Charte ASINA Médical
const ASINA = {
  primary: '#1f9d55',
  primaryDark: '#14703c',
  primaryLight: '#e7f6ed',
  midnight: '#0f1b3d',
  textPrimary: '#1f2937',
  textSecondary: '#5b6472',
  border: '#e5e7eb',
  divider: '#f0f2f1',
  tableHeader: '#fafbfa',
  alertBg: '#fff4e0',
  alertText: '#8a5300',
  badgeBg: '#eef2ff',
  badgeText: '#3730a3',
  error: '#b42318',
  neutralGray: '#94a3b8',
};

// Carte métrique conforme à la charte ASINA (blanche, bordure 1px, rayon 14px, SANS OMBRE)
const CarteMetrique: React.FC<{
  icone: React.ReactNode;
  valeur: number | string;
  libelle: string;
  sousTexte?: string;
  onClick?: () => void;
  accent?: boolean;
}> = ({ icone, valeur, libelle, sousTexte, onClick, accent }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex items-start justify-between rounded-[14px] border p-5 text-left transition-colors duration-150 ${
      accent
        ? 'border-[#1f9d55] bg-[#e7f6ed]/40 hover:bg-[#e7f6ed]/70'
        : 'border-[#e5e7eb] bg-white hover:border-[#1f9d55]'
    }`}
  >
    <div className="space-y-1">
      <div className="text-[13px] font-medium text-[#5b6472]">{libelle}</div>
      <div className="text-[26px] font-bold tracking-tight text-[#1f2937] tabular-nums">
        {valeur}
      </div>
      {sousTexte && (
        <div className="text-[12px] text-[#5b6472]">{sousTexte}</div>
      )}
    </div>
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors ${
        accent ? 'bg-[#1f9d55] text-white' : 'bg-[#e7f6ed] text-[#14703c] group-hover:bg-[#1f9d55] group-hover:text-white'
      }`}
    >
      {icone}
    </div>
  </button>
);

// Tooltip personnalisé pour Recharts aux couleurs de la charte ASINA
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltipChart: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-3 text-[13px] shadow-sm">
        <div className="mb-2 font-bold text-[#1f2937]">{label}</div>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#5b6472]">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-[3px]"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-semibold text-[#1f2937] tabular-nums">
                {entry.value} {entry.name.toLowerCase().includes('satisfaction') ? '%' : 'patients'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const PanneauConsultationTableauBord: React.FC<Props> = ({
  siteActifId = 1,
  consultationEnCours,
  onNaviguer,
  onOuvrirConsultationPatient,
}) => {
  const {
    stats,
    chargement,
    erreur,
    anneeChoisie,
    setAnneeChoisie,
    appelerPatientSuivant,
    terminerConsultationEnCours,
    ajouterPatientSansRdv,
  } = useTableauBordConsultation(siteActifId);

  // Filtre d'affichage du graphe de fréquentation
  const [vueGraphe, setVueGraphe] = useState<'evolution' | 'composition' | 'taux'>('evolution');
  // Filtre du tableau de la file d'attente
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'attente' | 'termines'>('tous');
  // Modal ajout patient sans RDV
  const [modalSansRdv, setModalSansRdv] = useState(false);
  const [nomNouveau, setNomNouveau] = useState('');
  const [ageNouveau, setAgeNouveau] = useState('45');
  const [genreNouveau, setGenreNouveau] = useState<'F' | 'M'>('F');
  const [motifNouveau, setMotifNouveau] = useState('Consultation spontanée / urgence ressentie');

  if (chargement) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-[14px] text-[#5b6472]">
        <RefreshCw size={20} className="mr-2 animate-spin text-[#1f9d55]" />
        Chargement des données cliniques…
      </div>
    );
  }

  const enConsultationCompte = consultationEnCours?.encounterId ? 1 : 0;

  // Calcul des totaux annuels pour le cartouche récapitulatif
  const totalCumuleAnnee = stats.frequentationMensuelle.reduce((acc, m) => acc + m.totalVisites, 0);
  const totalCumuleNMoins1 = stats.frequentationMensuelle.reduce((acc, m) => acc + m.anneePrecedente, 0);
  const progressionAnnuelle = Number((((totalCumuleAnnee - totalCumuleNMoins1) / totalCumuleNMoins1) * 100).toFixed(1));

  // Filtrage des patients affichés dans la file du jour
  const patientsFiltres = stats.fileAttente.filter((p) => {
    if (filtreStatut === 'attente') return p.statut === 'En attente';
    if (filtreStatut === 'termines') return p.statut === 'Terminé';
    return true;
  });

  const handleCreerSansRdv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomNouveau.trim()) return;
    ajouterPatientSansRdv({
      nom: nomNouveau.trim(),
      age: parseInt(ageNouveau, 10) || 30,
      genre: genreNouveau,
      motif: motifNouveau,
    });
    setNomNouveau('');
    setModalSansRdv(false);
  };

  return (
    <div className="space-y-[14px] p-5 sm:p-6">
      {/* En-tête de page ASINA Médical : Titre 22px gras, sous-titre 13px gris */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#1f2937]">Tableau de bord de consultation</h1>
            <span className="rounded-full bg-[#e7f6ed] px-[10px] py-[2px] text-[12px] font-bold text-[#14703c]">
              Service actif
            </span>
          </div>
          <p className="text-[13px] text-[#5b6472]">
            Activité de consultation, flux de patients du jour et statistiques de fréquentation
          </p>
        </div>

        {/* Actions principales de l'en-tête */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalSansRdv(true)}
            className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[14px] font-medium text-[#1f2937] transition hover:border-[#1f9d55] hover:text-[#14703c]"
          >
            <Plus size={16} className="text-[#1f9d55]" />
            Ajouter un sans RDV
          </button>

          <button
            type="button"
            onClick={() => {
              appelerPatientSuivant();
              onNaviguer('active');
            }}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-[#1f9d55] px-4 text-[14px] font-medium text-white transition hover:bg-[#14703c]"
          >
            <PhoneCall size={16} />
            Appeler le suivant
          </button>
        </div>
      </div>

      {/* Alerte d'erreur éventuelle */}
      {erreur && (
        <div className="flex items-center gap-2 rounded-[10px] border border-[#b42318]/30 bg-red-50 px-4 py-3 text-[13px] text-[#b42318]">
          <AlertCircle size={16} className="shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      {/* Bandeau d'alerte et de contextualisation conforme à la charte */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e5e7eb] bg-[#fafbfa] px-4 py-3 text-[13px] text-[#5b6472]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-[#1f2937]">
            <Building2 size={16} className="text-[#1f9d55]" />
            Site actuel :
          </span>
          <span className="font-semibold text-[#1f2937]">
            {siteActifId === 1 ? 'Centre Médical Principal - Batignolles' : siteActifId === 2 ? 'Pôle Consultations Sud' : 'Centre Spécialisé Est'}
          </span>
          <span className="hidden sm:inline text-[#e5e7eb]">|</span>
          <span className="hidden sm:inline">Temps d'attente moyen : <strong className="text-[#1f2937]">{stats.tempsMoyenAttenteMin} min</strong></span>
          <span className="hidden sm:inline text-[#e5e7eb]">|</span>
          <span className="hidden sm:inline">Ponctualité : <strong className="text-[#14703c]">{stats.tauxPonctualitePct}%</strong></span>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#fff4e0] px-2 py-1 text-[#8a5300] font-medium">
            <AlertCircle size={13} />
            1 acte à codifier
          </span>
        </div>
      </div>

      {/* Cartes métriques principales (4 colonnes) */}
      <div className="grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        <CarteMetrique
          icone={<Users size={22} />}
          valeur={stats.enAttente}
          libelle="Patients en attente"
          sousTexte="Dans la salle d'attente"
          onClick={() => onNaviguer('file')}
        />
        <CarteMetrique
          icone={<Stethoscope size={22} />}
          valeur={enConsultationCompte}
          libelle="En consultation"
          sousTexte={consultationEnCours?.patientNom || 'Prêt pour le suivant'}
          onClick={() => onNaviguer('active')}
          accent={Boolean(consultationEnCours?.encounterId)}
        />
        <CarteMetrique
          icone={<Calendar size={22} />}
          valeur={stats.rdvDuJour}
          libelle="Rendez-vous du jour"
          sousTexte="Planning consultations"
          onClick={() => onNaviguer('file')}
        />
        <CarteMetrique
          icone={<UserCheck size={22} />}
          valeur={stats.arrives}
          libelle="Patients arrivés"
          sousTexte={`${stats.termines} consultations terminées`}
          onClick={() => onNaviguer('file')}
        />
      </div>

      {/* Consultation en cours (Fidèle à la structure de l'utilisateur, charte ASINA) */}
      <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#1f2937]">Consultation en cours</h2>
          {consultationEnCours?.encounterId && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#e7f6ed] px-[10px] py-[2px] text-[12px] font-bold text-[#14703c]">
              <span className="h-2 w-2 rounded-full bg-[#1f9d55]" />
              En examen actif
            </span>
          )}
        </div>

        {consultationEnCours?.encounterId ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-[#f6f8f7] p-4">
            <div className="space-y-1">
              <div className="text-[16px] font-bold text-[#1f2937]">
                {consultationEnCours.patientNom || `Patient #${consultationEnCours.patientId}`}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#5b6472]">
                {consultationEnCours.numTicket && (
                  <span className="rounded-[6px] bg-[#e7f6ed] px-[7px] py-[3px] font-mono font-bold text-[#14703c]">
                    Ticket {consultationEnCours.numTicket}
                  </span>
                )}
                <span>Dossier #{consultationEnCours.encounterId}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-[#5b6472]" />
                  Début : 09:02 (18 min écoulées)
                </span>
                <span>·</span>
                <span className="rounded-[6px] bg-[#eef2ff] px-[7px] py-[3px] font-mono font-bold text-[#3730a3]">
                  CCAM : G+MD
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNaviguer('dossiers')}
                className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[14px] font-medium text-[#1f2937] transition hover:bg-slate-50"
              >
                <FolderHeart size={16} className="text-[#5b6472]" />
                Dossier patient
              </button>
              <button
                type="button"
                onClick={terminerConsultationEnCours}
                className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[14px] font-medium text-[#5b6472] transition hover:border-[#b42318] hover:text-[#b42318]"
              >
                <CheckCircle2 size={16} />
                Clôturer l'acte
              </button>
              <button
                type="button"
                onClick={() => onNaviguer('active')}
                className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#1f9d55] px-4 text-[14px] font-medium text-white transition hover:bg-[#14703c]"
              >
                Ouvrir la consultation <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between gap-3 rounded-[10px] border border-dashed border-[#e5e7eb] p-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-medium text-[#1f2937]">Aucune consultation en cours pour ce cabinet.</p>
              <p className="text-[13px] text-[#5b6472]">
                {stats.enAttente} patient(s) attendent actuellement dans la file d’attente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                appelerPatientSuivant();
                onNaviguer('active');
              }}
              className="flex h-10 items-center gap-2 rounded-[10px] bg-[#1f9d55] px-4 text-[14px] font-medium text-white transition hover:bg-[#14703c]"
            >
              <PhoneCall size={16} />
              Appeler le patient suivant
            </button>
          </div>
        )}
      </div>

      {/* SECTION DES GRAPHES AVEC RECHARTS : STATISTIQUES DE FRÉQUENTATION MENSUELLE */}
      <div className="space-y-[14px]">
        {/* Grande carte graphique : Fréquentation mensuelle */}
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5">
          <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-[#1f2937]">
                  Statistiques de fréquentation mensuelle
                </h2>
                <span className="rounded-full bg-[#e7f6ed] px-[10px] py-[2px] text-[12px] font-bold text-[#14703c]">
                  Recharts · Année {anneeChoisie}
                </span>
              </div>
              <p className="text-[13px] text-[#5b6472]">
                Suivi des flux de consultations (programmées, urgences/sans RDV, téléconsultations)
              </p>
            </div>

            {/* Pastilles de filtres et contrôles (Charte ASINA : padding 6px 14px, bordure verte si active) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sélecteur de vue graphique */}
              <div className="flex items-center rounded-[10px] border border-[#e5e7eb] p-0.5">
                <button
                  type="button"
                  onClick={() => setVueGraphe('evolution')}
                  className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition ${
                    vueGraphe === 'evolution'
                      ? 'bg-[#1f9d55] text-white'
                      : 'text-[#5b6472] hover:text-[#1f2937]'
                  }`}
                >
                  Comparatif N vs N-1
                </button>
                <button
                  type="button"
                  onClick={() => setVueGraphe('composition')}
                  className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition ${
                    vueGraphe === 'composition'
                      ? 'bg-[#1f9d55] text-white'
                      : 'text-[#5b6472] hover:text-[#1f2937]'
                  }`}
                >
                  Détail par filière
                </button>
                <button
                  type="button"
                  onClick={() => setVueGraphe('taux')}
                  className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition ${
                    vueGraphe === 'taux'
                      ? 'bg-[#1f9d55] text-white'
                      : 'text-[#5b6472] hover:text-[#1f2937]'
                  }`}
                >
                  Satisfaction
                </button>
              </div>

              {/* Filtre Année */}
              <div className="flex items-center gap-1">
                {(['2026', '2025'] as const).map((annee) => {
                  const actif = anneeChoisie === annee;
                  return (
                    <button
                      key={annee}
                      type="button"
                      onClick={() => setAnneeChoisie(annee)}
                      className={`rounded-full px-[14px] py-[6px] text-[13px] font-medium transition ${
                        actif
                          ? 'border border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]'
                          : 'border border-[#e5e7eb] bg-white text-[#5b6472] hover:border-[#1f9d55]'
                      }`}
                    >
                      {annee}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bandeau de synthèse chiffrée sous le titre du graphe */}
          <div className="mb-5 grid grid-cols-2 gap-3 border-y border-[#f0f2f1] py-3 sm:grid-cols-4">
            <div>
              <div className="text-[12px] text-[#5b6472]">Cumul annuel</div>
              <div className="text-[18px] font-bold text-[#1f2937] tabular-nums">
                {totalCumuleAnnee.toLocaleString('fr-FR')} visites
              </div>
            </div>
            <div>
              <div className="text-[12px] text-[#5b6472]">Évolution N / N-1</div>
              <div className="flex items-center gap-1 text-[18px] font-bold text-[#14703c] tabular-nums">
                <TrendingUp size={16} />
                +{progressionAnnuelle}%
              </div>
            </div>
            <div>
              <div className="text-[12px] text-[#5b6472]">Moyenne mensuelle</div>
              <div className="text-[18px] font-bold text-[#1f2937] tabular-nums">
                {Math.round(totalCumuleAnnee / 12)} patients / mois
              </div>
            </div>
            <div>
              <div className="text-[12px] text-[#5b6472]">Mois de pic</div>
              <div className="text-[18px] font-bold text-[#0f1b3d]">
                Octobre (710)
              </div>
            </div>
          </div>

          {/* Conteneur Recharts de fréquentation mensuelle */}
          <div className="h-[310px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {vueGraphe === 'evolution' ? (
                <AreaChart
                  data={stats.frequentationMensuelle}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorActuelle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ASINA.primary} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={ASINA.primary} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPrecedente" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ASINA.midnight} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={ASINA.midnight} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                  <XAxis
                    dataKey="moisCourt"
                    tick={{ fill: ASINA.textSecondary, fontSize: 12 }}
                    axisLine={{ stroke: ASINA.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: ASINA.textSecondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltipChart />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '13px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalVisites"
                    name={`Année ${anneeChoisie}`}
                    stroke={ASINA.primary}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorActuelle)"
                    dot={{ fill: ASINA.primary, r: 3 }}
                    activeDot={{ r: 5, fill: ASINA.primaryDark }}
                  />
                  <Area
                    type="monotone"
                    dataKey="anneePrecedente"
                    name={`Année ${parseInt(anneeChoisie, 10) - 1}`}
                    stroke={ASINA.midnight}
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorPrecedente)"
                    dot={{ fill: ASINA.midnight, r: 2 }}
                  />
                </AreaChart>
              ) : vueGraphe === 'composition' ? (
                <BarChart
                  data={stats.frequentationMensuelle}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                  <XAxis
                    dataKey="moisCourt"
                    tick={{ fill: ASINA.textSecondary, fontSize: 12 }}
                    axisLine={{ stroke: ASINA.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: ASINA.textSecondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltipChart />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '13px' }}
                  />
                  <Bar
                    dataKey="programmes"
                    name="Consultations programmées"
                    stackId="a"
                    fill={ASINA.primary}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="urgencesNonProgrammes"
                    name="Urgences & Sans RDV"
                    stackId="a"
                    fill={ASINA.midnight}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="teleconsultations"
                    name="Téléconsultations"
                    stackId="a"
                    fill={ASINA.alertText}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={stats.frequentationMensuelle}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                  <XAxis
                    dataKey="moisCourt"
                    tick={{ fill: ASINA.textSecondary, fontSize: 12 }}
                    axisLine={{ stroke: ASINA.border }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[85, 100]}
                    tick={{ fill: ASINA.textSecondary, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<CustomTooltipChart />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '13px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tauxSatisfaction"
                    name="Taux de satisfaction patients (%)"
                    stroke={ASINA.primary}
                    strokeWidth={2.5}
                    fill={ASINA.primaryLight}
                    dot={{ fill: ASINA.primaryDark, r: 4 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deux colonnes secondaires de graphiques analytiques Recharts */}
        <div className="grid gap-[14px] lg:grid-cols-2">
          {/* Graphe 1 : Répartition par motif & filière de soins */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5">
            <div className="mb-3">
              <h3 className="text-[16px] font-bold text-[#1f2937]">
                Répartition des motifs de consultation
              </h3>
              <p className="text-[12px] text-[#5b6472]">
                Volume d'actes par filière médicale sur le mois en cours
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-[190px] w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.repartitionMotifs}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="valeur"
                    >
                      {stats.repartitionMotifs.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.couleur} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(valeur: any) => [`${valeur} actes`, 'Consultations']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full space-y-2 sm:w-1/2">
                {stats.repartitionMotifs.map((item) => (
                  <div key={item.nom} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: item.couleur }}
                      />
                      <span className="truncate text-[#1f2937]">{item.nom}</span>
                    </div>
                    <span className="font-semibold text-[#1f2937] tabular-nums">
                      {item.pourcentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Graphe 2 : Affluence horaire de la journée */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#1f2937]">
                  Affluence par créneau horaire
                </h3>
                <p className="text-[12px] text-[#5b6472]">
                  Nombre de patients reçus par heure aujourd'hui
                </p>
              </div>
              <span className="rounded-[6px] bg-[#e7f6ed] px-[7px] py-[3px] text-[11px] font-bold text-[#14703c]">
                Pic : 10h & 15h
              </span>
            </div>

            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.affluenceHoraires}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                  <XAxis
                    dataKey="heure"
                    tick={{ fill: ASINA.textSecondary, fontSize: 11 }}
                    axisLine={{ stroke: ASINA.border }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: ASINA.textSecondary, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(valeur: any) => [`${valeur} patients`, 'Affluence']}
                  />
                  <Bar
                    dataKey="patients"
                    name="Patients reçus"
                    fill={ASINA.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* TABLEAU DE LA FILE DU JOUR (Charte ASINA : En-tête #fafbfa, lignes 54px, pas d'ombres) */}
      <div className="rounded-[14px] border border-[#e5e7eb] bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-[#e5e7eb] p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2937]">File d'attente du cabinet</h2>
            <p className="text-[13px] text-[#5b6472]">
              Flux de patients présents au centre ({patientsFiltres.length} affichés)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre par statut */}
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'tous', label: 'Tous' },
                  { id: 'attente', label: 'En attente' },
                  { id: 'termines', label: 'Terminés' },
                ] as const
              ).map((tab) => {
                const actif = filtreStatut === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFiltreStatut(tab.id)}
                    className={`rounded-full px-[14px] py-[6px] text-[13px] font-medium transition ${
                      actif
                        ? 'border border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]'
                        : 'border border-[#e5e7eb] bg-white text-[#5b6472] hover:border-[#1f9d55]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onNaviguer('file')}
              className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-[13px] font-medium text-[#1f2937] hover:border-[#1f9d55]"
            >
              Vue détaillée de file <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Liste des patients en tableau respectant les lignes de 54px */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fafbfa] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
              <tr className="border-b border-[#e5e7eb]">
                <th className="px-5 py-3.5">Ticket</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Arrivée / RDV</th>
                <th className="px-5 py-3.5">Motif médical</th>
                <th className="px-5 py-3.5">Constantes</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f1] text-[14px]">
              {patientsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-32 text-center text-[#5b6472]">
                    Aucun patient correspondant au filtre.
                  </td>
                </tr>
              ) : (
                patientsFiltres.map((p) => (
                  <tr
                    key={p.id}
                    className="h-[54px] transition hover:bg-[#f6f8f7]"
                  >
                    {/* Ticket */}
                    <td className="px-5 py-2 font-mono">
                      <span className="rounded-[6px] bg-[#e7f6ed] px-[7px] py-[3px] text-[12px] font-bold text-[#14703c]">
                        {p.numTicket}
                      </span>
                    </td>

                    {/* Patient & âge */}
                    <td className="px-5 py-2">
                      <div className="font-semibold text-[#1f2937]">{p.patientNom}</div>
                      <div className="text-[12px] text-[#5b6472]">
                        {p.genre === 'F' ? 'Femme' : 'Homme'}, {p.age} ans · #{p.patientId}
                      </div>
                    </td>

                    {/* Heure d'arrivée */}
                    <td className="px-5 py-2">
                      <div className="text-[13px] font-medium text-[#1f2937] tabular-nums">
                        {p.heureArrivee}
                      </div>
                      <div className="text-[12px] text-[#5b6472]">
                        {p.heureRdv ? `RDV à ${p.heureRdv}` : 'Sans rendez-vous'}
                      </div>
                    </td>

                    {/* Motif & code */}
                    <td className="px-5 py-2">
                      <div className="max-w-[260px] truncate text-[13px] text-[#1f2937]" title={p.motif}>
                        {p.motif}
                      </div>
                      {p.codeActe && (
                        <span className="text-[11px] font-mono text-[#5b6472]">
                          {p.codeActe}
                        </span>
                      )}
                    </td>

                    {/* Constantes vitales */}
                    <td className="px-5 py-2">
                      {p.constantesPrises ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#14703c]">
                          <CheckCircle2 size={14} className="text-[#1f9d55]" />
                          Prises (inf.)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] text-[#8a5300]">
                          <AlertCircle size={14} />
                          En attente
                        </span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-5 py-2">
                      <span
                        className={`inline-block rounded-full px-[10px] py-[2px] text-[12px] font-bold ${
                          p.statut === 'En consultation'
                            ? 'bg-[#e7f6ed] text-[#14703c]'
                            : p.statut === 'Terminé'
                            ? 'bg-slate-100 text-[#5b6472]'
                            : 'bg-[#fff4e0] text-[#8a5300]'
                        }`}
                      >
                        {p.statut}
                      </span>
                    </td>

                    {/* Actions de la ligne */}
                    <td className="px-5 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.statut === 'En attente' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onOuvrirConsultationPatient) {
                                onOuvrirConsultationPatient(p);
                              } else {
                                onNaviguer('active');
                              }
                            }}
                            className="flex h-[32px] items-center gap-1 rounded-[8px] bg-[#1f9d55] px-2.5 text-[12px] font-medium text-white transition hover:bg-[#14703c]"
                          >
                            <Stethoscope size={13} />
                            Prendre en charge
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onNaviguer('dossiers')}
                          title="Consulter le dossier"
                          className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-[#e5e7eb] text-[#5b6472] transition hover:border-[#1f9d55] hover:text-[#14703c]"
                        >
                          <FolderHeart size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Tiroir d'ajout d'un patient sans RDV */}
      {modalSansRdv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,27,61,.45)' }}
        >
          <div className="w-full max-w-lg rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#f0f2f1] pb-3">
              <div>
                <h3 className="text-[18px] font-bold text-[#1f2937]">
                  Admission d'un patient sans rendez-vous
                </h3>
                <p className="text-[12px] text-[#5b6472]">
                  Ajout immédiat à la file d'attente du jour
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSansRdv(false)}
                className="text-[20px] text-[#5b6472] hover:text-[#1f2937]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerSansRdv} className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#5b6472]">
                  Nom et prénom du patient <span className="text-[#b42318]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dubois Laurent"
                  value={nomNouveau}
                  onChange={(e) => setNomNouveau(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-[14px] text-[#1f2937] focus:border-[#1f9d55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-bold text-[#5b6472]">
                    Âge (années) <span className="text-[#b42318]">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    required
                    value={ageNouveau}
                    onChange={(e) => setAgeNouveau(e.target.value)}
                    className="h-10 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-[14px] text-[#1f2937] focus:border-[#1f9d55] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-bold text-[#5b6472]">
                    Genre civil <span className="text-[#b42318]">*</span>
                  </label>
                  <select
                    value={genreNouveau}
                    onChange={(e) => setGenreNouveau(e.target.value as 'F' | 'M')}
                    className="h-10 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-[14px] text-[#1f2937] focus:border-[#1f9d55] focus:outline-none"
                  >
                    <option value="F">Féminin (F)</option>
                    <option value="M">Masculin (M)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#5b6472]">
                  Motif de consultation / Symptômes <span className="text-[#b42318]">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={motifNouveau}
                  onChange={(e) => setMotifNouveau(e.target.value)}
                  className="w-full rounded-[10px] border border-[#e5e7eb] p-3 text-[14px] text-[#1f2937] focus:border-[#1f9d55] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#f0f2f1] pt-4">
                <button
                  type="button"
                  onClick={() => setModalSansRdv(false)}
                  className="h-10 rounded-[10px] border border-[#e5e7eb] px-4 text-[14px] font-medium text-[#5b6472] hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-[10px] bg-[#1f9d55] px-4 text-[14px] font-medium text-white hover:bg-[#14703c]"
                >
                  Générer le ticket & Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanneauConsultationTableauBord;
