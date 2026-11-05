/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import {
  AffectationPersonnel,
  OptionPersonnel,
  OptionServiceSite,
  OptionSite,
  NouvelleAffectationInput,
  ModificationAffectationInput,
} from "../modele/affectation.types";
import { affectationsApi } from "../api/affectations.api";

export function useAffectations() {
  const notif = useNotifier();

  const [affectations, setAffectations] = useState<AffectationPersonnel[]>([]);
  const [optionsPersonnel, setOptionsPersonnel] = useState<OptionPersonnel[]>([]);
  const [optionsServices, setOptionsServices] = useState<OptionServiceSite[]>([]);
  const [optionsSites, setOptionsSites] = useState<OptionSite[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtres
  const [recherche, setRecherche] = useState<string>("");
  const [filtreSiteId, setFiltreSiteId] = useState<number | "tous">("tous");
  const [filtreActif, setFiltreActif] = useState<"tous" | "actifs" | "inactifs">("tous");

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const donnees = await affectationsApi.listerDonnees();
      setAffectations(donnees.affectations);
      setOptionsPersonnel(donnees.optionsPersonnel);
      setOptionsServices(donnees.optionsServices);
      setOptionsSites(donnees.optionsSites);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger les affectations du personnel.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  // Filtrage combiné en mémoire des données réelles
  const affectationsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return affectations.filter((aff) => {
      // Filtre site
      if (filtreSiteId !== "tous" && aff.siteId !== filtreSiteId) {
        return false;
      }

      // Filtre statut
      if (filtreActif === "actifs" && !aff.actif) return false;
      if (filtreActif === "inactifs" && aff.actif) return false;

      // Recherche textuelle
      if (q) {
        const nomComplet = `${aff.nomPersonnel} ${aff.prenomPersonnel}`.toLowerCase();
        const nomService = aff.nomService.toLowerCase();
        const nomSite = aff.nomSite.toLowerCase();
        const role = aff.rolePersonnel.toLowerCase();
        if (
          !nomComplet.includes(q) &&
          !nomService.includes(q) &&
          !nomSite.includes(q) &&
          !role.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [affectations, recherche, filtreSiteId, filtreActif]);

  const creerAffectation = useCallback(
    async (saisie: NouvelleAffectationInput): Promise<boolean> => {
      try {
        await affectationsApi.creer(saisie);
        await recharger();
        notif.succes("Affectation enregistrée avec succès.");
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de l'enregistrement de l'affectation."));
        return false;
      }
    },
    [notif, recharger],
  );

  const modifierAffectation = useCallback(
    async (id: number, saisie: ModificationAffectationInput): Promise<boolean> => {
      try {
        await affectationsApi.modifier(id, saisie);
        await recharger();
        notif.succes("Affectation mise à jour avec succès.");
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la modification de l'affectation."));
        return false;
      }
    },
    [notif, recharger],
  );

  const supprimerAffectation = useCallback(
    async (id: number, nomAgent: string): Promise<boolean> => {
      try {
        await affectationsApi.supprimer(id);
        setAffectations((prev) => prev.filter((a) => a.id !== id));
        notif.succes(`Affectation de ${nomAgent} supprimée.`);
        return true;
      } catch (err) {
        notif.erreur(
          messageErreur(err, "Échec de la suppression de l'affectation sur le serveur."),
        );
        return false;
      }
    },
    [notif],
  );

  const stats = useMemo(() => {
    const total = affectations.length;
    const actives = affectations.filter((a) => a.actif).length;
    const inactives = total - actives;
    const idsAgents = new Set(affectations.map((a) => a.staffId));
    const agentsAffectes = idsAgents.size;
    return { total, actives, inactives, agentsAffectes };
  }, [affectations]);

  return {
    affectations: affectationsFiltrees,
    affectationsToutes: affectations,
    optionsPersonnel,
    optionsServices,
    optionsSites,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    filtreSiteId,
    setFiltreSiteId,
    filtreActif,
    setFiltreActif,
    recharger,
    creerAffectation,
    modifierAffectation,
    supprimerAffectation,
  };
}
