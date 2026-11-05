import { useCallback, useEffect, useMemo, useState } from 'react';
import { consultationFileApi } from '@/briques/consultation-file';

/* ───────────── Types (inchangés) ───────────── */

export interface MoisFrequentation {
  mois: string;
  moisCourt: string;
  totalVisites: number;
  programmes: number;
  urgencesNonProgrammes: number;
  teleconsultations: number;
  anneePrecedente: number;
  tauxSatisfaction: number;
}

export interface RepartitionMotif {
  nom: string;
  valeur: number;
  pourcentage: number;
  couleur: string;
}

export interface AffluenceHoraire {
  heure: string;
  patients: number;
  capaciteMax: number;
}

export interface PatientFile {
  id: number;
  patientId: number;
  numTicket: string;
  patientNom: string;
  age: number;
  genre: 'F' | 'M';
  heureArrivee: string;
  heureRdv?: string;
  type: 'Programmé' | 'Sans RDV' | 'Urgence modérée' | 'Contrôle';
  statut: 'En attente' | 'En consultation' | 'Terminé' | 'Appelé';
  praticien: string;
  motif: string;
  constantesPrises: boolean;
  tempsAttenteMinutes: number;
  codeActe?: string;
}

export interface StatsTableauBord {
  enAttente: number;
  rdvDuJour: number;
  arrives: number;
  termines: number;
  tempsMoyenAttenteMin: number;
  tauxPonctualitePct: number;
  totalMoisEnCours: number;
  croissanceMoisPct: number;
  frequentationMensuelle: MoisFrequentation[];
  repartitionMotifs: RepartitionMotif[];
  affluenceHoraires: AffluenceHoraire[];
  fileAttente: PatientFile[];
}

/* ───────────── Sources de données réelles ─────────────
 * Chaque fonction renvoie des données vides tant qu'elle n'est pas branchée
 * sur l'API. Remplace uniquement le corps des fonctions marquées TODO.
 */

interface DonneesBrutes {
  file: PatientFile[];
  rdvDuJour: number;
  frequentationMensuelle: MoisFrequentation[];
  repartitionMotifs: RepartitionMotif[];
  affluenceHoraires: AffluenceHoraire[];
}

async function chargerDonnees(_siteActifId?: number, _annee?: string): Promise<DonneesBrutes> {
  // TODO: brancher sur les endpoints existants / à créer, par exemple :
  // const file = await consultationFileApi.lister(siteActifId);            // → PatientFile[]
  // const rdv = await consultationFileApi.listerRendezVousDuJour(siteActifId);
  // const stats = await consultationFileApi.statistiques(siteActifId, annee);
  return {
    file: [],
    rdvDuJour: 0,
    frequentationMensuelle: [],
    repartitionMotifs: [],
    affluenceHoraires: [],
  };
}

/* ───────────── Hook ───────────── */

const STATS_VIDES: StatsTableauBord = {
  enAttente: 0,
  rdvDuJour: 0,
  arrives: 0,
  termines: 0,
  tempsMoyenAttenteMin: 0,
  tauxPonctualitePct: 0,
  totalMoisEnCours: 0,
  croissanceMoisPct: 0,
  frequentationMensuelle: [],
  repartitionMotifs: [],
  affluenceHoraires: [],
  fileAttente: [],
};

export const useTableauBordConsultation = (siteActifId?: number) => {
  const [donnees, setDonnees] = useState<DonneesBrutes | null>(null);
  const [consultationEnCours, setConsultationEnCours] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [anneeChoisie, setAnneeChoisie] = useState<string>(String(new Date().getFullYear()));

  const charger = useCallback(async () => {
    try {
      const [brutes, enCours] = await Promise.all([
        chargerDonnees(siteActifId, anneeChoisie),
        consultationFileApi.obtenirPatientEnCours(),
      ]);
      setDonnees(brutes);
      setConsultationEnCours(Boolean(enCours?.enCours));
      setErreur(null);
    } catch {
      setErreur('Impossible de charger le tableau de bord.');
    } finally {
      setChargement(false);
    }
  }, [siteActifId, anneeChoisie]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 15000);
    return () => clearInterval(t);
  }, [charger]);

  const stats = useMemo<StatsTableauBord>(() => {
    if (!donnees) return STATS_VIDES;

    const { file, rdvDuJour, frequentationMensuelle } = donnees;
    const enAttente = file.filter((p) => p.statut === 'En attente');
    const termines = file.filter((p) => p.statut === 'Terminé').length;

    const tempsMoyenAttenteMin = enAttente.length
      ? Math.round(enAttente.reduce((s, p) => s + p.tempsAttenteMinutes, 0) / enAttente.length)
      : 0;

    // Mois courant et précédent, uniquement si les données mensuelles existent.
    const idxMois = new Date().getMonth();
    const courant = frequentationMensuelle[idxMois]?.totalVisites ?? 0;
    const precedent = frequentationMensuelle[idxMois - 1]?.totalVisites ?? 0;
    const croissanceMoisPct = precedent
      ? Number((((courant - precedent) / precedent) * 100).toFixed(1))
      : 0;

    return {
      enAttente: enAttente.length,
      rdvDuJour,
      arrives: file.length,
      termines,
      tempsMoyenAttenteMin,
      tauxPonctualitePct: 0, // TODO: à fournir par le backend (heure RDV vs heure de prise en charge)
      totalMoisEnCours: courant,
      croissanceMoisPct,
      frequentationMensuelle,
      repartitionMotifs: donnees.repartitionMotifs,
      affluenceHoraires: donnees.affluenceHoraires,
      fileAttente: file,
    };
  }, [donnees]);

  return {
    stats,
    consultationEnCours,
    chargement,
    erreur,
    anneeChoisie,
    setAnneeChoisie,
    rafraichir: charger,
  };
};