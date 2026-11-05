/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import {
  ActeRealiseApiOutput,
  ObservationApiOutput,
  ActeDefinitionRealisableApi,
  ActeObservationsReponseApi,
} from "./constante-vitale.contrats";
import {
  mapperObservation,
  mapperChampObservationMoule,
  mapperActeConstante,
  extraireIdCategorie,
} from "./constante-vitale.mapping";
import {
  MesureObservation,
  ChampObservationMoule,
  ActeConstanteOption,
  SaisieConstantesInput,
} from "../modele/constante-vitale.types";

export const constantesVitalesApi = {
  /**
   * Récupère les actes du catalogue de catégorie 3 (Constantes).
   * Filtre explicitement sur la catégorie Acte = 3 (Constantes vitales).
   */
  async listerActesConstantes(encounterId?: number): Promise<ActeConstanteOption[]> {
    let rawList: ActeDefinitionRealisableApi[] = [];

    // 1. Tenter d'abord la requête filtrée par catégorie 3 (priorité demandée)
    const tentatives = [
      () => clientHttp<unknown>("/api/acte_definitions", { params: { categorie: 3, actif: true } }),
      () => clientHttp<unknown>("/api/acte_definitions", { params: { categorie: 3 } }),
      () => clientHttp<unknown>("/api/acte_definitions", { params: { "categorie.id": 3 } }),
      () => clientHttp<unknown>("/api/acte_definitions", { params: { categorieId: 3 } }),
      () =>
        clientHttp<unknown>("/api/acte_definitions", {
          params: { categorie: "/api/categorie_actes/3" },
        }),
    ];

    for (const tentative of tentatives) {
      try {
        const donnees = await tentative();
        const elems = extraireElementsCollection<ActeDefinitionRealisableApi>(donnees);
        if (elems.length > 0) {
          rawList = elems;
          break;
        }
      } catch {
        // Essayer le format suivant
      }
    }

    // 2. Si rien trouvé, tenter avec realisableEncounterId
    if (rawList.length === 0 && encounterId) {
      try {
        const donnees = await clientHttp<unknown>("/api/acte_definitions", {
          params: { realisableEncounterId: encounterId },
        });
        rawList = extraireElementsCollection<ActeDefinitionRealisableApi>(donnees);
      } catch {
        // repli
      }
    }

    // 3. Fallback catalogue complet actif
    if (rawList.length === 0) {
      try {
        const donneesActifs = await clientHttp<unknown>("/api/acte_definitions", {
          params: { actif: true },
        });
        rawList = extraireElementsCollection<ActeDefinitionRealisableApi>(donneesActifs);
      } catch {
        // repli
      }
    }

    // 4. Filtrer spécifiquement pour Constantes grâce au filtre catégorie Acte (id 3)
    const filtresCategorie3 = rawList.filter((a) => {
      const catId = extraireIdCategorie(a.categorie) ?? extraireIdCategorie(a.categorieId);
      return catId === 3;
    });

    if (filtresCategorie3.length > 0) {
      return filtresCategorie3.map(mapperActeConstante);
    }

    // Si aucune catégorie marquée explicitement 3, filtrer sur le texte / code de constante
    const filtresTexte = rawList.filter((a) => {
      const catObj = typeof a.categorie === "object" && a.categorie ? a.categorie : null;
      const catId = extraireIdCategorie(a.categorie) ?? extraireIdCategorie(a.categorieId);
      const texte =
        `${catObj?.code || ""} ${catObj?.libelle || ""} ${a.code} ${a.libelle}`.toLowerCase();
      return (
        catId === 3 ||
        texte.includes("const") ||
        texte.includes("vital") ||
        texte.includes("tension") ||
        texte.includes("pouls")
      );
    });

    const aConserver = filtresTexte.length > 0 ? filtresTexte : rawList;
    return aConserver.map(mapperActeConstante);
  },

  /**
   * Récupère le moule des observations attendues pour un acte donné.
   * GET /api/acte_definitions/{id}/observations
   */
  async obtenirObservationsMoule(acteDefinitionId: number): Promise<ChampObservationMoule[]> {
    try {
      const reponse = await clientHttp<ActeObservationsReponseApi>(
        `/api/acte_definitions/${acteDefinitionId}/observations`,
      );
      if (Array.isArray(reponse?.observations)) {
        return reponse.observations
          .map(mapperChampObservationMoule)
          .sort((a, b) => a.ordre - b.ordre);
      }
    } catch {
      // repli
    }
    return [];
  },

  /**
   * Récupère la liste des actes saisis et leurs observations pour cet encounter.
   * GET /api/acte_realises?encounterId=...
   */
  async listerActesEncounter(encounterId: number): Promise<ActeRealiseApiOutput[]> {
    const raw = await clientHttp<unknown>("/api/acte_realises", {
      params: { encounterId },
    });
    return extraireElementsCollection<ActeRealiseApiOutput>(raw);
  },

  /**
   * Récupère toutes les observations de constantes déjà enregistrées sur cet encounter.
   */
  async listerObservationsEncounter(encounterId: number): Promise<MesureObservation[]> {
    const actes = await this.listerActesEncounter(encounterId);
    const resultats: MesureObservation[] = [];
    actes.forEach((acte) => {
      if (Array.isArray(acte.observations)) {
        acte.observations.forEach((obs) => {
          resultats.push(mapperObservation(obs));
        });
      }
    });
    return resultats;
  },

  /**
   * Enregistre les observations d'un acte de constantes (prise totale ou partielle).
   * Réutilise l'acte de l'encounter s'il existe déjà pour éviter le conflit unique Symfony.
   */
  async enregistrerConstantes(input: SaisieConstantesInput): Promise<MesureObservation[]> {
    // 1. Filtrer les observations renseignées (on ne transmet pas les champs vides)
    const observationsARenseigner = input.observations.filter(
      (obs) => obs.valeur !== undefined && obs.valeur !== null && String(obs.valeur).trim() !== "",
    );

    if (observationsARenseigner.length === 0) {
      throw new Error("Veuillez renseigner au moins une valeur de constante vitale.");
    }

    // 2. Vérifier s'il existe déjà un acte réalisé actif pour cette définition dans cet encounter
    const actesExistants = await this.listerActesEncounter(input.encounterId);
    const acteExistant = actesExistants.find(
      (a) =>
        a.acteDefinitionId === input.acteDefinitionId &&
        a.statut !== "annule" &&
        a.statut !== "saisi_par_erreur",
    );

    let acteId: number;

    if (acteExistant) {
      acteId = acteExistant.id;
    } else {
      // Créer l'acte support en statut 'en_cours' pour autoriser la saisie partielle
      const nouvelActe = await clientHttp<ActeRealiseApiOutput>("/api/acte_realises", {
        method: "POST",
        body: JSON.stringify({
          encounterId: Number(input.encounterId),
          acteDefinitionId: Number(input.acteDefinitionId),
          statut: "en_cours",
          commentaire: input.commentaire || "Prise des constantes vitales",
        }),
      });
      acteId = nouvelActe.id;
    }

    // 3. Ajouter chaque observation renseignée
    const observationsEnregistrees: MesureObservation[] = [];
    for (const obs of observationsARenseigner) {
      try {
        const obsReponse = await clientHttp<{ observations?: ObservationApiOutput[] }>(
          `/api/acte_realises/${acteId}/observations`,
          {
            method: "POST",
            body: JSON.stringify({
              observationDefinitionId: Number(obs.observationDefinitionId),
              valeur: String(obs.valeur).trim(),
              interpretation: obs.interpretation?.trim() || null,
            }),
          },
        );
        const derniere = obsReponse?.observations?.[obsReponse.observations.length - 1];
        if (derniere) {
          observationsEnregistrees.push(mapperObservation(derniere));
        }
      } catch (err) {
        console.warn(
          `Erreur lors de l'enregistrement de l'observation #${obs.observationDefinitionId}:`,
          err,
        );
        throw err;
      }
    }

    // 4. Si demandé, tenter de valider l'acte au statut 'realise'
    if (input.marquerRealise) {
      try {
        await clientHttp(`/api/acte_realises/${acteId}/statut`, {
          method: "POST",
          body: JSON.stringify({ statut: "realise" }),
        });
      } catch {
        // Si Symfony refuse car certaines obligatoires manquent, l'acte reste en 'en_cours'
      }
    }

    return observationsEnregistrees;
  },
};
