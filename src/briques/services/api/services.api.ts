/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  ServiceMedical,
  TypeServiceMedical,
  NouveauServiceInput,
  ModificationServiceInput,
  NouveauTypeServiceInput,
  ModificationTypeServiceInput,
} from "../modele/service.types";
import { ServiceOutputApi, TypeServiceOutputApi } from "./services.contrats";
import {
  mapperService,
  mapperTypeService,
  mapperServiceVersApi,
  mapperTypeServiceVersApi,
} from "./services.mapping";

export const servicesApi = {
  // --- Services rattachés (/api/services) ---

  listerServices: async (): Promise<ServiceMedical[]> => {
    const reponse = await clientHttp<unknown>("/services");
    const elements = extraireElementsCollection<unknown>(reponse);
    return elements.map(mapperService).filter((s): s is ServiceMedical => s !== null);
  },

  creerService: async (saisie: NouveauServiceInput): Promise<ServiceMedical> => {
    const payload = mapperServiceVersApi(saisie);
    const reponse = await clientHttp<ServiceOutputApi>("/services", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const s = mapperService(reponse);
    if (!s) {
      throw new ErreurApi(500, "L'API a répondu sans identifiant valide pour le nouveau service.");
    }
    return s;
  },

  modifierService: async (
    id: number,
    saisie: ModificationServiceInput,
  ): Promise<ServiceMedical> => {
    const payload = mapperServiceVersApi(saisie);
    const reponse = await clientHttp<ServiceOutputApi>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const s = mapperService(reponse);
    if (!s) {
      throw new ErreurApi(
        500,
        "L'API a répondu sans identifiant valide lors de la mise à jour du service.",
      );
    }
    return s;
  },

  supprimerService: async (id: number): Promise<void> => {
    await clientHttp<void>(`/services/${id}`, { method: "DELETE" });
  },

  // --- Types de services (/api/type-services) ---

  listerTypes: async (): Promise<TypeServiceMedical[]> => {
    const reponse = await clientHttp<unknown>("/type-services");
    const elements = extraireElementsCollection<unknown>(reponse);
    return elements.map(mapperTypeService).filter((t): t is TypeServiceMedical => t !== null);
  },

  creerType: async (saisie: NouveauTypeServiceInput): Promise<TypeServiceMedical> => {
    const payload = mapperTypeServiceVersApi(saisie);
    const reponse = await clientHttp<TypeServiceOutputApi>("/type-services", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const t = mapperTypeService(reponse);
    if (!t) {
      throw new ErreurApi(
        500,
        "L'API a répondu sans identifiant valide pour le nouveau type de service.",
      );
    }
    return t;
  },

  modifierType: async (
    id: number,
    saisie: ModificationTypeServiceInput,
  ): Promise<TypeServiceMedical> => {
    const payload = mapperTypeServiceVersApi(saisie);
    const reponse = await clientHttp<TypeServiceOutputApi>(`/type-services/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const t = mapperTypeService(reponse);
    if (!t) {
      throw new ErreurApi(
        500,
        "L'API a répondu sans identifiant valide lors de la mise à jour du type de service.",
      );
    }
    return t;
  },

  supprimerType: async (id: number): Promise<void> => {
    await clientHttp<void>(`/type-services/${id}`, { method: "DELETE" });
  },

  // --- Référentiel des sites pour sélection locale sans import inter-briques ---

  listerSitesPourSelection: async (): Promise<{ id: number; nom: string; code: string }[]> => {
    const reponse = await clientHttp<unknown>("/sites");
    const elements = extraireElementsCollection<Record<string, unknown>>(reponse);
    return elements
      .map((el) => {
        const id = Number(el.id ?? el.Id_Site);
        if (!Number.isFinite(id) || id <= 0) return null;
        return {
          id,
          nom: String(el.name ?? el.Libelle ?? el.libelle ?? `Site ${id}`),
          code: String(el.code ?? ""),
        };
      })
      .filter((s): s is { id: number; nom: string; code: string } => s !== null);
  },
};
