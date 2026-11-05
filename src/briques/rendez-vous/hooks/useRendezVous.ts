/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { useSession } from "@/cerveau/session";
import {
  RendezVous,
  NouveauRendezVousInput,
  PatientOption,
  ServiceOption,
  RendezVousFiltres,
} from "../modele/rendez-vous.types";
import { rendezVousApi } from "../api/rendez-vous.api";
import { mapperRendezVous, estAujourdHui, estPasse } from "../api/rendez-vous.mapping";
import { PatientApiSummary } from "../api/rendez-vous.contrats";

export function useRendezVous(siteIdInitial?: number) {
  const { siteActifId } = useSession();
  const notifier = useNotifier();

  const siteIdActif = siteIdInitial ?? siteActifId ?? 1;

  const [rendezVousBruts, setRendezVousBruts] = useState<RendezVous[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);

  const [filtres, setFiltres] = useState<RendezVousFiltres>({
    recherche: "",
    statut: "TOUS",
    filtreDate: "tous",
  });

  // Charger les données de référence et la liste des RDV
  const recharger = useCallback(async () => {
    setChargement(true);
    try {
      const [rdvRaw, patientsList, servicesList] = await Promise.all([
        rendezVousApi.lister(),
        rendezVousApi.listerPatients(),
        rendezVousApi.listerServices(siteIdActif),
      ]);

      const mapPatients = new Map<number, PatientApiSummary>();
      patientsList.forEach((p) => {
        mapPatients.set(p.id, {
          id: p.id,
          nom: p.nomComplet,
          prenom: "",
          matricule: p.matricule,
        });
      });

      const mapped = rdvRaw.map((r) => mapperRendezVous(r, mapPatients));
      setRendezVousBruts(mapped);
      setPatients(patientsList);
      setServices(servicesList);
    } catch (err) {
      notifier.erreur(messageErreur(err, "Impossible de charger les rendez-vous."));
    } finally {
      setChargement(false);
    }
  }, [siteIdActif, notifier]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const mettreAJourFiltres = useCallback((nouveauxFiltres: Partial<RendezVousFiltres>) => {
    setFiltres((prev) => ({ ...prev, ...nouveauxFiltres }));
  }, []);

  // Filtrage réactif
  const rendezVousFiltres = useMemo(() => {
    return rendezVousBruts.filter((r) => {
      // Filtre statut
      if (filtres.statut !== "TOUS" && r.statut !== filtres.statut) {
        return false;
      }

      // Filtre date
      if (filtres.filtreDate === "aujourd_hui" && !r.estAujourdHui) {
        return false;
      }
      if (filtres.filtreDate === "a_venir" && estPasse(r.dateRdv) && !r.estAujourdHui) {
        return false;
      }
      if (filtres.filtreDate === "passes" && (!estPasse(r.dateRdv) || r.estAujourdHui)) {
        return false;
      }

      // Filtre recherche textuelle (patient nom ou matricule ou commentaire)
      if (filtres.recherche.trim()) {
        const q = filtres.recherche.toLowerCase();
        const matchNom = r.patientNom?.toLowerCase().includes(q);
        const matchMatricule = r.patientMatricule?.toLowerCase().includes(q);
        const matchCommentaire = r.commentaire?.toLowerCase().includes(q);
        if (!matchNom && !matchMatricule && !matchCommentaire) {
          return false;
        }
      }

      return true;
    });
  }, [rendezVousBruts, filtres]);

  // Statistiques calculées
  const statistiques = useMemo(() => {
    const total = rendezVousBruts.length;
    const aujourdHui = rendezVousBruts.filter((r) => r.estAujourdHui).length;
    const planifies = rendezVousBruts.filter((r) => r.statut === "PLANIFIE").length;
    const confirmes = rendezVousBruts.filter((r) => r.statut === "CONFIRME").length;
    const honores = rendezVousBruts.filter((r) => r.statut === "HONORE").length;
    const annules = rendezVousBruts.filter(
      (r) => r.statut === "ANNULE" || r.statut === "ABSENT",
    ).length;
    return { total, aujourdHui, planifies, confirmes, honores, annules };
  }, [rendezVousBruts]);

  // Réserver un nouveau rendez-vous
  const reserverRendezVous = useCallback(
    async (input: NouveauRendezVousInput): Promise<boolean> => {
      setActionEnCours(true);
      try {
        await rendezVousApi.reserver(input);
        notifier.succes("Rendez-vous planifié avec succès.");
        await recharger();
        return true;
      } catch (err) {
        notifier.erreur(messageErreur(err, "Échec de la planification du rendez-vous."));
        return false;
      } finally {
        setActionEnCours(false);
      }
    },
    [notifier, recharger],
  );

  // Annuler un rendez-vous (DELETE /api/rendez-vous/{id})
  const annulerRendezVous = useCallback(
    async (id: number): Promise<boolean> => {
      setActionEnCours(true);
      try {
        await rendezVousApi.annuler(id);
        notifier.succes("Rendez-vous annulé.");
        await recharger();
        return true;
      } catch (err) {
        notifier.erreur(messageErreur(err, "Impossible d’annuler ce rendez-vous."));
        return false;
      } finally {
        setActionEnCours(false);
      }
    },
    [notifier, recharger],
  );

  // Confirmer l'arrivée physique (POST /api/rendez-vous/{id}/confirmer-arrivee)
  const confirmerArrivee = useCallback(
    async (rdvId: number, serviceId: number): Promise<boolean> => {
      setActionEnCours(true);
      try {
        const resultat = await rendezVousApi.confirmerArrivee(rdvId, siteIdActif, serviceId);

        notifier.succes(`Arrivée confirmée ! Ticket n° ${resultat.numTicket} généré.`);
        await recharger();
        return true;
      } catch (err) {
        notifier.erreur(
          messageErreur(err, "Impossible de confirmer l'arrivée pour ce rendez-vous."),
        );
        return false;
      } finally {
        setActionEnCours(false);
      }
    },
    [siteIdActif, rendezVousBruts, services, notifier, recharger],
  );

  return {
    rendezVous: rendezVousBruts,
    rendezVousFiltres,
    chargement,
    actionEnCours,
    filtres,
    mettreAJourFiltres,
    patients,
    services,
    statistiques,
    recharger,
    reserverRendezVous,
    annulerRendezVous,
    confirmerArrivee,
  };
}
