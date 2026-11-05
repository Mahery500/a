/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { categoriesObservationsApi } from "@/briques/categorie-observations";
import type {
  CategorieHierarchique,
  NouvelleCategorieInput,
} from "@/noyau/referentiels/categories";
import {
  ObservationDefinition,
  UniteMesure,
  CodeSysteme,
  NouvelleObservationDefinitionInput,
  ModificationObservationDefinitionInput,
  NouvelleUniteInput,
  NouveauCodeSystemeInput,
  CodificationItem,
  ActeObservationLiaison,
} from "../modele/observation-definition.types";
import {
  ObservationDefinitionApiOutput,
  UniteApiOutput,
  CodeSystemApiOutput,
  ActeObservationsApiOutput,
} from "./observation-definition.contrats";
import {
  mapperObservationDefinitionDepuisApi,
  mapperNouvelleObservationDefinitionVersApi,
  mapperModificationObservationDefinitionVersApi,
  mapperUniteDepuisApi,
  mapperNouvelleUniteVersApi,
  mapperCodeSystemDepuisApi,
  mapperNouveauCodeSystemVersApi,
} from "./observation-definition.mapping";

export const observationDefinitionApi = {
  /* ------------------------------------------------------------------ *
   * Catégories d'observations : déléguées à la brique dédiée
   * ------------------------------------------------------------------ */

  listerCategories: (feuillesUniquement = false): Promise<CategorieHierarchique[]> =>
    categoriesObservationsApi.lister(feuillesUniquement),

  creerCategorie: (saisie: NouvelleCategorieInput): Promise<CategorieHierarchique> =>
    categoriesObservationsApi.creer(saisie),

  changerParentCategorie: (id: number, parentCode: string | null): Promise<CategorieHierarchique> =>
    categoriesObservationsApi.changerParent(id, parentCode),

  /* ------------------------------------------------------------------ *
   * Définitions d'observations
   * ------------------------------------------------------------------ */

  async listerDefinitions(actifsUniquement = false): Promise<ObservationDefinition[]> {
    const raw = await clientHttp<unknown>("/observation_definitions", {
      params: actifsUniquement ? { actif: "true" } : undefined,
    });
    const elements = extraireElementsCollection<unknown>(raw);
    return elements
      .map(mapperObservationDefinitionDepuisApi)
      .filter((d): d is ObservationDefinition => d !== null)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },

  async recupererDefinition(id: number): Promise<ObservationDefinition> {
    const raw = await clientHttp<ObservationDefinitionApiOutput>(`/observation_definitions/${id}`);
    const def = mapperObservationDefinitionDepuisApi(raw);
    if (!def) {
      throw new ErreurApi(500, `Définition d'observation #${id} introuvable ou invalide.`);
    }
    return def;
  },

  async creerDefinition(
    saisie: NouvelleObservationDefinitionInput,
  ): Promise<ObservationDefinition> {
    const payload = mapperNouvelleObservationDefinitionVersApi(saisie);
    const raw = await clientHttp<ObservationDefinitionApiOutput>("/observation_definitions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    let def = mapperObservationDefinitionDepuisApi(raw);
    if (!def) {
      throw new ErreurApi(500, "L'API a répondu sans format valide lors de la création.");
    }

    // Les codifications externes ne passent pas par POST : elles ont leur
    // propre endpoint (PUT /observation_definitions/{id}/codifications).
    if (saisie.codifications && saisie.codifications.length > 0) {
      def = await observationDefinitionApi.definirCodifications(def.id, saisie.codifications);
    }

    return def;
  },

  async modifierDefinition(
    id: number,
    saisie: ModificationObservationDefinitionInput,
  ): Promise<ObservationDefinition> {
    const payload = mapperModificationObservationDefinitionVersApi(saisie);
    const raw = await clientHttp<ObservationDefinitionApiOutput>(`/observation_definitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: JSON.stringify(payload),
    });

    const def = mapperObservationDefinitionDepuisApi(raw);
    if (!def) {
      throw new ErreurApi(500, "Échec de la mise à jour de la définition d'observation.");
    }
    return def;
  },

  async definirCodifications(
    id: number,
    codifications: CodificationItem[],
  ): Promise<ObservationDefinition> {
    const payload = {
      codifications: codifications.map((c) => ({
        codeSystem: c.codeSystem.trim().toUpperCase(),
        code: c.code.trim(),
      })),
    };

    const raw = await clientHttp<ObservationDefinitionApiOutput>(
      `/observation_definitions/${id}/codifications`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    const def = mapperObservationDefinitionDepuisApi(raw);
    if (!def) {
      throw new ErreurApi(500, "Échec de l'enregistrement des codifications.");
    }
    return def;
  },

  /* ------------------------------------------------------------------ *
   * Unités de mesure
   * ------------------------------------------------------------------ */

  async listerUnites(actifsUniquement = false): Promise<UniteMesure[]> {
    const raw = await clientHttp<unknown>("/unites", {
      params: actifsUniquement ? { actif: "true" } : undefined,
    });
    const elements = extraireElementsCollection<unknown>(raw);
    return elements
      .map(mapperUniteDepuisApi)
      .filter((u): u is UniteMesure => u !== null)
      .sort((a, b) => a.code.localeCompare(b.code, "fr"));
  },

  async creerUnite(saisie: NouvelleUniteInput): Promise<UniteMesure> {
    const payload = mapperNouvelleUniteVersApi(saisie);
    const raw = await clientHttp<UniteApiOutput>("/unites", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const unit = mapperUniteDepuisApi(raw);
    if (!unit) {
      throw new ErreurApi(500, "Échec de l'enregistrement de l'unité.");
    }
    return unit;
  },

  async changerActivationUnite(id: number, actif: boolean): Promise<UniteMesure> {
    const raw = await clientHttp<UniteApiOutput>(`/unites/${id}/activation`, {
      method: "POST",
      body: JSON.stringify({ actif }),
    });
    const unit = mapperUniteDepuisApi(raw);
    if (!unit) {
      throw new ErreurApi(500, "Échec de la modification du statut de l'unité.");
    }
    return unit;
  },

  /* ------------------------------------------------------------------ *
   * Systèmes de codification
   * ------------------------------------------------------------------ */

  async listerCodeSystems(actifsUniquement = false): Promise<CodeSysteme[]> {
    const raw = await clientHttp<unknown>("/code_systems", {
      params: actifsUniquement ? { actif: "true" } : undefined,
    });
    const elements = extraireElementsCollection<unknown>(raw);
    return elements
      .map(mapperCodeSystemDepuisApi)
      .filter((c): c is CodeSysteme => c !== null)
      .sort((a, b) => a.code.localeCompare(b.code, "fr"));
  },

  async creerCodeSystem(saisie: NouveauCodeSystemeInput): Promise<CodeSysteme> {
    const payload = mapperNouveauCodeSystemVersApi(saisie);
    const raw = await clientHttp<CodeSystemApiOutput>("/code_systems", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const cs = mapperCodeSystemDepuisApi(raw);
    if (!cs) {
      throw new ErreurApi(500, "Échec de l'enregistrement du système de codification.");
    }
    return cs;
  },

  async changerActivationCodeSystem(id: number, actif: boolean): Promise<CodeSysteme> {
    const raw = await clientHttp<CodeSystemApiOutput>(`/code_systems/${id}/activation`, {
      method: "POST",
      body: JSON.stringify({ actif }),
    });
    const cs = mapperCodeSystemDepuisApi(raw);
    if (!cs) {
      throw new ErreurApi(500, "Échec du changement d'activation du système de codification.");
    }
    return cs;
  },

  /* ------------------------------------------------------------------ *
   * Moule d'observations d'un acte
   * ------------------------------------------------------------------ */

  async recupererObservationsActe(acteDefinitionId: number): Promise<ActeObservationLiaison[]> {
    const raw = await clientHttp<ActeObservationsApiOutput>(
      `/acte_definitions/${acteDefinitionId}/observations`,
    );
    if (!raw || !Array.isArray(raw.observations)) return [];

    return raw.observations.map((item) => ({
      ordre: item.ordre,
      obligatoire: item.obligatoire,
      observationId: item.observation.id,
      observation: mapperObservationDefinitionDepuisApi(item.observation) || undefined,
    }));
  },

  async definirObservationsActe(
    acteDefinitionId: number,
    liaisons: { observationId: number; ordre: number; obligatoire: boolean }[],
  ): Promise<ActeObservationLiaison[]> {
    const payload = {
      observations: liaisons.map((l) => ({
        observationId: Number(l.observationId),
        ordre: Number(l.ordre),
        obligatoire: Boolean(l.obligatoire),
      })),
    };

    const raw = await clientHttp<ActeObservationsApiOutput>(
      `/acte_definitions/${acteDefinitionId}/observations`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );

    if (!raw || !Array.isArray(raw.observations)) return [];

    return raw.observations.map((item) => ({
      ordre: item.ordre,
      obligatoire: item.obligatoire,
      observationId: item.observation.id,
      observation: mapperObservationDefinitionDepuisApi(item.observation) || undefined,
    }));
  },
};
