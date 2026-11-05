/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/cerveau/session";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { annoncerVocalementTicket, diffuserAnnonceTicket } from "@/noyau/utils/carillon";
import { TicketAiguillage, PatientOption, ServiceOption } from "../modele/tickets-accueil.types";
import { ticketsAccueilApi } from "../api/tickets-accueil.api";
import { mapperAiguillage } from "../api/tickets-accueil.mapping";
import { PatientApiSummary, ServiceApiSummary } from "../api/tickets-accueil.contrats";

const INTERVALLE_SONDAGE_MS = 6000;

export function useTicketsAccueil(siteIdInitial?: number) {
  const { siteActifId } = useSession();
  const notifier = useNotifier();

  const siteIdActif = siteIdInitial ?? siteActifId ?? 1;

  const [enAttente, setEnAttente] = useState<TicketAiguillage[]>([]);
  const [enCours, setEnCours] = useState<TicketAiguillage[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [filtreService, setFiltreService] = useState<string>("ALL");

  // Charger les données de référence (patients, services)
  useEffect(() => {
    let monte = true;
    const initialiserReferentiels = async () => {
      try {
        const [patientsList, servicesList] = await Promise.all([
          ticketsAccueilApi.listerPatients(),
          ticketsAccueilApi.listerServices(siteIdActif),
        ]);
        if (monte) {
          setPatients(patientsList);
          setServices(servicesList);
        }
      } catch (err) {
        console.warn("Erreur chargement référentiels ticketing", err);
      }
    };
    initialiserReferentiels();
    return () => {
      monte = false;
    };
  }, [siteIdActif]);

  // Actualiser la file d'attente (aiguillages EN_ATTENTE et EN_COURS).
  // Pas de détection automatique ici : l'annonce se déclenche uniquement
  // via appelerTicket() (bouton "Rappeler" ou appel explicite depuis le guichet).
  const recharger = useCallback(async () => {
    try {
      const [waitingRaw, inProgressRaw] = await Promise.all([
        ticketsAccueilApi.listerAiguillages(siteIdActif, "EN_ATTENTE"),
        ticketsAccueilApi.listerAiguillages(siteIdActif, "EN_COURS"),
      ]);

      const mapPatients = new Map<number, PatientApiSummary>();
      patients.forEach((p) => {
        mapPatients.set(p.id, {
          id: p.id,
          nom: p.nomComplet,
          prenom: "",
          matricule: p.matricule,
        });
      });

      const mapServices = new Map<number, ServiceApiSummary>();
      services.forEach((s) => {
        mapServices.set(s.id, { id: s.id, nom: s.nom });
      });

      const waitingMapped = waitingRaw.map((a) =>
        mapperAiguillage(a, "EN_ATTENTE", mapPatients, mapServices),
      );
      const inProgressMapped = inProgressRaw.map((a) =>
        mapperAiguillage(a, "EN_COURS", mapPatients, mapServices),
      );

      setEnAttente(waitingMapped);
      setEnCours(inProgressMapped);
    } catch {
      // Échec temporaire de sondage réseau ignoré
    } finally {
      setChargement(false);
    }
  }, [siteIdActif, patients, services]);

  // Sondage régulier
  useEffect(() => {
    recharger();
    const timer = setInterval(recharger, INTERVALLE_SONDAGE_MS);
    return () => clearInterval(timer);
  }, [recharger]);

  // Émission d'un nouveau ticket
  const emettreTicket = useCallback(
    async (patientId: number, serviceId: number): Promise<boolean> => {
      setActionEnCours(true);
      try {
        const ticketEmis = await ticketsAccueilApi.emettreTicket({
          patientId,
          premierServiceId: serviceId,
          siteId: siteIdActif,
        });

        notifier.succes(`Ticket numéro ${ticketEmis.numTicket} émis avec succès.`);
        await recharger();
        return true;
      } catch (err) {
        if (err instanceof ErreurApi && err.statut === 403) {
          notifier.erreur(
            "Accès refusé (403) : Votre compte ne dispose pas des droits requis (rôle ROLE_RECEPTION, ROLE_SECRETAIRE ou ROLE_ADMIN requis) ou n'est pas affecté à ce site pour émettre des tickets.",
          );
        } else {
          notifier.erreur(messageErreur(err, "Échec lors de l'émission du ticket."));
        }
        return false;
      } finally {
        setActionEnCours(false);
      }
    },
    [siteIdActif, services, patients, notifier, recharger],
  );

  // Appel ou rappel vocal d'un ticket au guichet.
  // C'est l'UNIQUE point d'entrée de l'audio côté guichet : le polling ne parle jamais.
  const appelerTicket = useCallback(
    (a: TicketAiguillage) => {
      annoncerVocalementTicket(a.numTicket, a.serviceNom);
      diffuserAnnonceTicket({
        ticketId: a.ticketId,
        numTicket: a.numTicket,
        serviceLabel: a.serviceNom,
        at: Date.now(),
      });
      notifier.info(`Annonce vocale lancée pour le ticket ${a.numTicket}.`);
    },
    [notifier],
  );

  // Filtrage selon le service sélectionné
  const enAttenteFiltres = useMemo(() => {
    if (filtreService === "ALL") return enAttente;
    const sId = Number(filtreService);
    return enAttente.filter((a) => a.serviceId === sId);
  }, [enAttente, filtreService]);

  const enCoursFiltres = useMemo(() => {
    if (filtreService === "ALL") return enCours;
    const sId = Number(filtreService);
    return enCours.filter((a) => a.serviceId === sId);
  }, [enCours, filtreService]);

  const statistiques = useMemo(() => {
    return {
      totalEnAttente: enAttente.length,
      totalEnCours: enCours.length,
    };
  }, [enAttente, enCours]);

  return {
    enAttente: enAttenteFiltres,
    enCours: enCoursFiltres,
    tousEnAttente: enAttente,
    tousEnCours: enCours,
    statistiques,
    chargement,
    actionEnCours,
    filtreService,
    setFiltreService,
    patients,
    services,
    recharger,
    emettreTicket,
    appelerTicket,
  };
}
