/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi"; // ⬅️ AJOUT
import type {
  CreateConstatApiInput,
  ObservationDefinitionApiOutput,
  ObservationOutputApi,
} from "./constat.contrats";
import type {
  ConstatEnregistre,
  DefinitionConstat,
  NouveauConstatInput,
} from "../modele/constat.types";
import { mapperConstat, mapperDefinitionConstat } from "./constat.mapping";

/** Code de la catégorie racine des observations « constat clinique ». */
const CODE_RACINE_CONSTAT = "EXAMEN_CLINIQUE";
/** Libellé attendu de cette racine (pour filtrer sur categorie.chemin[0]). */
const LIBELLE_RACINE_CONSTAT = "examen clinique";

/**
 * Appel API constat : tente /api/<chemin>, retombe sur /<chemin> en cas de 404.
 * Aligne le module Constat sur le comportement des autres briques
 * (tickets-accueil, verification-adherent, diagnostics…).
 */
async function appelConstat<T>(
  chemin: string,
  options?: Parameters<typeof clientHttp>[1],
): Promise<T> {
  try {
    return await clientHttp<T>(`/api${chemin}`, options);
  } catch (err) {
    if (err instanceof ErreurApi && err.statut === 404) {
      return await clientHttp<T>(chemin, options);
    }
    throw err;
  }
}

export const constatApi = {
  async lister(encounterId: number, actifsUniquement = true): Promise<ConstatEnregistre[]> {
    const raw = await appelConstat<unknown>(`/encounters/${encounterId}/constats`, {
      // actifsUniquement=true est le défaut côté backend ; on précise false si besoin
      params: actifsUniquement ? undefined : { actifsUniquement: "false" },
    });
    return extraireElementsCollection<ObservationOutputApi>(raw)
      .map(mapperConstat)
      .sort(
        (a, b) =>
          new Date(b.dateObservation).getTime() - new Date(a.dateObservation).getTime(),
      );
  },

  async creer(
    encounterId: number,
    input: NouveauConstatInput,
  ): Promise<ConstatEnregistre> {
    const payload: CreateConstatApiInput = {
      observationDefinitionId: input.observationDefinitionId,
      valeur: input.valeur.trim(),
      commentaire: input.commentaire?.trim() || null,
      dateObservation: input.dateObservation || null,
    };
    const raw = await appelConstat<ObservationOutputApi>(
      `/encounters/${encounterId}/constats`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    return mapperConstat(raw);
  },

  /**
   * Renvoie uniquement les définitions d'observation qui sont des « constats »
   * (leur catégorie racine est EXAMEN_CLINIQUE).
   *
   * On filtre côté client à partir de `categorie.chemin` que le backend
   * renvoie DÉJÀ calculé (HierarchieCategorie::chemin()). On supprime donc
   * l'appel à /categorie_observations et la remontée manuelle de l'arbre.
   */
  async listerDefinitionsConstats(): Promise<DefinitionConstat[]> {
    const rawDefs = await appelConstat<unknown>("/observation_definitions", {
      params: { actif: "true" },
    });

    const defs = extraireElementsCollection<ObservationDefinitionApiOutput>(rawDefs);

    return defs
      .filter((d) => {
        const cat = d.categorie;
        if (!cat) return false;
        // Test défensif : code exact OU racine par libellé.
        if (cat.code === CODE_RACINE_CONSTAT) return true;
        const racine = (cat.chemin?.[0] ?? "").toLowerCase().trim();
        return racine === LIBELLE_RACINE_CONSTAT;
      })
      .map(mapperDefinitionConstat)
      .filter((d): d is DefinitionConstat => d !== null)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },
};