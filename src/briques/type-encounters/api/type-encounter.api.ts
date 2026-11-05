/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  TypeEncounter,
  NouveauTypeEncounterInput,
  ModificationTypeEncounterInput,
} from "../modele/type-encounter.types";
import { TypeEncounterApiOutput } from "./type-encounter.contrats";
import {
  mapperTypeEncounter,
  mapperNouveauVersApi,
  mapperModificationVersApi,
} from "./type-encounter.mapping";

export const typeEncounterApi = {
  async lister(actifsUniquement = false, typeServiceId?: number): Promise<TypeEncounter[]> {
    const params: Record<string, string | number> = {};
    if (actifsUniquement) params.actif = "true";
    if (typeServiceId !== undefined) params.typeServiceId = typeServiceId;

    const raw = await clientHttp<unknown>("/type_encounters", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    const elements = extraireElementsCollection<unknown>(raw);
    return elements
      .map(mapperTypeEncounter)
      .filter((t): t is TypeEncounter => t !== null)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },

  async obtenirParId(id: number): Promise<TypeEncounter> {
    const raw = await clientHttp<TypeEncounterApiOutput>(`/type_encounters/${id}`);
    const t = mapperTypeEncounter(raw);
    if (!t) throw new ErreurApi(500, "Réponse API sans identifiant valide.");
    return t;
  },

  async creer(saisie: NouveauTypeEncounterInput): Promise<TypeEncounter> {
    const raw = await clientHttp<TypeEncounterApiOutput>("/type_encounters", {
      method: "POST",
      body: JSON.stringify(mapperNouveauVersApi(saisie)),
    });
    const t = mapperTypeEncounter(raw);
    if (!t) throw new ErreurApi(500, "L'API n'a pas renvoyé d'identifiant valide.");
    return t;
  },

  async modifier(id: number, saisie: ModificationTypeEncounterInput): Promise<TypeEncounter> {
    const raw = await clientHttp<TypeEncounterApiOutput>(`/type_encounters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: JSON.stringify(mapperModificationVersApi(saisie)),
    });
    const t = mapperTypeEncounter(raw);
    if (!t) throw new ErreurApi(500, "Réponse API invalide après mise à jour.");
    return t;
  },

  async changerActivation(id: number, actif: boolean): Promise<TypeEncounter> {
    const raw = await clientHttp<TypeEncounterApiOutput>(`/type_encounters/${id}/activation`, {
      method: "POST",
      body: JSON.stringify({ actif }),
    });
    const t = mapperTypeEncounter(raw);
    if (!t) throw new ErreurApi(500, "Réponse API invalide après activation.");
    return t;
  },

  /**
   * Remplace la liste des types de service où ce type d'encounter est autorisé.
   * Endpoint : PUT /type_encounters/{id}/types_service
   */
  async definirTypesService(id: number, typeServiceIds: number[]): Promise<TypeEncounter> {
    const raw = await clientHttp<TypeEncounterApiOutput>(`/type_encounters/${id}/types_service`, {
      method: "PUT",
      body: JSON.stringify({ typeServiceIds }),
    });
    const t = mapperTypeEncounter(raw);
    if (!t)
      throw new ErreurApi(500, "Réponse API invalide après affectation des types de service.");
    return t;
  },
};
