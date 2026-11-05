/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { annoncerVocalementTicket, abonnerAnnonceTicket } from "@/noyau/utils/carillon";
import { TicketAppele } from "../modele/ecran-attente.types";
import { ecranAttenteApi } from "../api/ecran-attente.api";

const INTERVALLE_SONDAGE_MS = 5000;

export function useEcranAttente(siteId: number) {
  const [appeles, setAppeles] = useState<TicketAppele[]>([]);
  const [enAttente, setEnAttente] = useState<TicketAppele[]>([]);
  const [chargement, setChargement] = useState(true);

  const [dateObj, setDateObj] = useState(() => new Date());

  // Horloge temps réel (rafraîchit uniquement l'affichage de l'heure)
  useEffect(() => {
    const timer = setInterval(() => setDateObj(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Écoute des annonces déclenchées par le poste qui appelle (via storage event).
  // C'est le SEUL canal audio de cet écran : le polling ne parle jamais.
  useEffect(() => {
    return abonnerAnnonceTicket((signal) => {
      annoncerVocalementTicket(signal.numTicket, signal.serviceLabel);
    });
  }, []);

  // Rafraîchit l'affichage (silencieux) toutes les 5 s.
  const actualiser = useCallback(async () => {
    try {
      const donnees = await ecranAttenteApi.chargerDonneesFile(siteId);
      setAppeles(donnees.appeles);
      setEnAttente(donnees.enAttente);
    } catch {
      // Échec temporaire de sondage ignoré
    } finally {
      setChargement(false);
    }
  }, [siteId]);

  useEffect(() => {
    actualiser();
    const timer = setInterval(actualiser, INTERVALLE_SONDAGE_MS);
    return () => clearInterval(timer);
  }, [actualiser]);

  // Le backend renvoie déjà les appels triés par dateAppel DESC :
  // le premier élément est donc le dernier appelé.
  const dernierAppele = appeles[0] || null;

  const heureCourante = dateObj.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateCourante = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    appeles,
    enAttente,
    dernierAppele,
    heureCourante,
    dateCourante,
    chargement,
    actualiser,
  };
}
