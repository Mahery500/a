// hooks/useStatsAccueil.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { clientHttp } from '@/noyau/http/clientHttp';
import { ErreurApi } from '@/noyau/http/erreurApi';
// À ajuster selon l'emplacement réel du module patients
import { patientsApi } from '@/briques/patients/api/patients.api';
import type { PlageDates } from '../ui/Filtredates';

/** @deprecated Remplacé par PlageDates (filtre par dates). Conservé pour FiltrePeriode.tsx. */
export type Periode = 'jour' | '7j' | '30j';

/** Statistiques calculées par le serveur, filtrées par dates. */
export interface StatsApi {
  kpis: {
    patients: number;
    rendezVous: number;
    ticketsEnAttente: number;
    ticketsAttenteLongue: number;
    tempsAttenteMoyenMin: number;
    tauxPresence: number;
  };
  affluenceParHeure: { heure: string; tickets: number; rdv: number }[];
  rdvParStatut: { nom: string; valeur: number }[];
  ticketsParService: { nom: string; valeur: number }[];
  evolution: { jour: string; patients: number; rdv: number }[];
  tempsAttenteParHeure: { heure: string; minutes: number }[];
  adherents: { nom: string; valeur: number }[];
}

export interface Repertoire {
  total: number;
  salaries: number;
  ayantsDroit: number;
}

export interface PatientsEntreprise {
  id: string | number;
  entreprise: string;
  patients: number;
}

/** Stats du serveur + répertoire complet des patients (sans filtre de dates). */
export interface StatsAccueil extends StatsApi {
  repertoire: Repertoire;
  patientsParEntreprise: PatientsEntreprise[];
}

const DEMO: StatsApi = {
  kpis: { patients: 48, rendezVous: 22, ticketsEnAttente: 6, ticketsAttenteLongue: 2, tempsAttenteMoyenMin: 18, tauxPresence: 86 },
  affluenceParHeure: ['07h','08h','09h','10h','11h','12h','13h','14h','15h','16h'].map((heure, i) => ({
    heure, tickets: [2, 8, 14, 12, 9, 4, 6, 10, 7, 3][i], rdv: [1, 3, 5, 4, 3, 1, 2, 4, 3, 1][i],
  })),
  rdvParStatut: [
    { nom: 'Planifié', valeur: 6 }, { nom: 'Confirmé', valeur: 5 },
    { nom: 'Honoré', valeur: 8 }, { nom: 'Annulé', valeur: 2 }, { nom: 'Absent', valeur: 1 },
  ],
  ticketsParService: [
    { nom: 'Consultation', valeur: 24 }, { nom: 'Infirmerie', valeur: 12 },
    { nom: 'Pharmacie', valeur: 9 }, { nom: 'Kinésithérapie', valeur: 3 },
  ],
  evolution: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((jour, i) => ({
    jour, patients: [40, 52, 47, 48, 55, 20, 5][i], rdv: [18, 22, 20, 22, 25, 8, 0][i],
  })),
  tempsAttenteParHeure: ['08h','09h','10h','11h','12h','14h','15h','16h'].map((heure, i) => ({
    heure, minutes: [8, 15, 24, 20, 10, 14, 18, 9][i],
  })),
  adherents: [{ nom: 'Adhérents', valeur: 39 }, { nom: 'Non-adhérents', valeur: 9 }],
};

const REPERTOIRE_VIDE: Repertoire = { total: 0, salaries: 0, ayantsDroit: 0 };

async function chargerStats(params: Record<string, string | number | boolean>): Promise<StatsApi> {
  try {
    return await clientHttp<StatsApi>('/api/accueil/stats', { params });
  } catch (err) {
    if (err instanceof ErreurApi && err.statut === 404) {
      return await clientHttp<StatsApi>('/accueil/stats', { params });
    }
    throw err;
  }
}

export function useStatsAccueil(siteId: number | null | undefined, plage: PlageDates) {
  const [donneesApi, setDonneesApi] = useState<StatsApi | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreurStats, setErreurStats] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [rechargement, setRechargement] = useState(0);

  const [repertoire, setRepertoire] = useState<Repertoire>(REPERTOIRE_VIDE);
  const [patientsParEntreprise, setPatientsParEntreprise] = useState<PatientsEntreprise[]>([]);
  const [erreurRepertoire, setErreurRepertoire] = useState<string | null>(null);

  const recharger = useCallback(() => setRechargement((n) => n + 1), []);

  // Statistiques du serveur : dépendent du site et des dates
  useEffect(() => {
    let annule = false;
    setChargement(true);
    setErreurStats(null);
    setDemo(false);

    // du / au : « AAAA-MM-JJ », bornes incluses
    const params: Record<string, string | number | boolean> = { du: plage.du, au: plage.au };
    if (siteId) params.siteId = siteId;

    chargerStats(params)
      .then((d) => { if (!annule) setDonneesApi(d); })
      .catch((err) => {
        if (annule) return;
        if (err instanceof ErreurApi && err.statut === 404 && import.meta.env.DEV) {
          setDonneesApi(DEMO);
          setDemo(true);
          return;
        }
        setErreurStats(err instanceof Error ? err.message : 'Erreur inconnue');
      })
      .finally(() => { if (!annule) setChargement(false); });

    return () => { annule = true; };
  }, [siteId, plage.du, plage.au, rechargement]);

  // Répertoire complet : même source que la page « Répertoire des patients », sans filtre de dates
  useEffect(() => {
    let annule = false;
    setErreurRepertoire(null);

    Promise.all([patientsApi.lister(), patientsApi.listerEntreprises()])
      .then(([patients, entreprises]) => {
        if (annule) return;

        // Mêmes règles que les compteurs de la page Répertoire
        const salaries = patients.filter((p) => p.statut === 'Agent').length;
        const ayantsDroit = patients.filter((p) => p.statut && p.statut !== 'Agent').length;
        setRepertoire({ total: patients.length, salaries, ayantsDroit });

        const noms = new Map<number, string>(entreprises.map((e) => [e.id, e.nom]));
        const compte = new Map<string | number, { entreprise: string; patients: number }>();
        for (const p of patients) {
          const cle = p.idEntreprise ?? 'sans-entreprise';
          const entreprise = (p.idEntreprise != null && noms.get(p.idEntreprise)) || 'Sans entreprise';
          const ligne = compte.get(cle) ?? { entreprise, patients: 0 };
          ligne.patients += 1;
          compte.set(cle, ligne);
        }
        setPatientsParEntreprise(
          [...compte].map(([id, l]) => ({ id, ...l })).sort((a, b) => b.patients - a.patients),
        );
      })
      .catch((err) => {
        if (annule) return;
        setErreurRepertoire(
          err instanceof Error ? err.message : 'Impossible de charger le répertoire des patients',
        );
      });

    return () => { annule = true; };
  }, [rechargement]);

  const data: StatsAccueil | null = useMemo(
    () => (donneesApi ? { ...donneesApi, repertoire, patientsParEntreprise } : null),
    [donneesApi, repertoire, patientsParEntreprise],
  );

  return { data, chargement, erreur: erreurStats ?? erreurRepertoire, demo, recharger };
}