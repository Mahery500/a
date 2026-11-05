import { useCallback, useEffect, useState } from "react";
import { infirmerieFileApi } from "@/briques/infirmerie-file";

export interface StatsTableauBordInfirmerie {
  enAttente: number;
  patientEnCours: { nom: string; dureeMinutes: number; numTicket?: string } | null;
  realisesAujourdhui: number;
  annulesAujourdhui: number;
}

const VIDE: StatsTableauBordInfirmerie = {
  enAttente: 0,
  patientEnCours: null,
  realisesAujourdhui: 0,
  annulesAujourdhui: 0,
};

export function useTableauBordInfirmerie(siteActifId?: number) {
  const [stats, setStats] = useState<StatsTableauBordInfirmerie>(VIDE);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const [enCours /*, file, historique */] = await Promise.all([
        infirmerieFileApi.obtenirPatientEnCours(),
        // TODO: brancher les vrais appels existants :
        // infirmerieFileApi.lister(siteActifId),
        // infirmerieHistoriqueApi.lister({ du: aujourdhui, au: aujourdhui }),
      ]);

      setStats({
        enAttente: 0, // TODO: file.length
        patientEnCours: enCours?.enCours
          ? {
              nom: enCours.patientNom || `Patient #${enCours.patientId}`,
              dureeMinutes: enCours.dureeMinutes ?? 0,
              numTicket: enCours.numTicket || undefined,
            }
          : null,
        realisesAujourdhui: 0, // TODO: historique.filter(statut === "REALISE").length
        annulesAujourdhui: 0, // TODO: historique.filter(statut === "ANNULE").length
      });
      setErreur(null);
    } catch (e) {
      setErreur("Impossible de charger le tableau de bord.");
    } finally {
      setChargement(false);
    }
  }, [siteActifId]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 15000);
    return () => clearInterval(t);
  }, [charger]);

  return { stats, chargement, erreur, rafraichir: charger };
}