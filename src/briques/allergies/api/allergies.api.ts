// src/briques/allergies/api/allergies.api.ts

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";

import type {
  Allergie,
  AllergieDefinition,
  AllergieDefinitionSummary,
  ChangerStatutInput,
  ModificationAllergieDefinitionInput,
  ModificationAllergieInput,
  NouvelleAllergieDefinitionInput,
  NouvelleAllergieInput,
  NouvelleReactionInput,
  PrincipeActifOption,
  ReactionAllergie,
  ReferentielsAllergie,
} from "../modele/allergie.types";

import {
  mapperAllergie,
  mapperDefinition,
  mapperDefinitionSummary,
  mapperPrincipeActif,
  mapperReaction,
  mapperReferentiels,
} from "./allergies.mapping";

import type {
  AllergieApiOutput,
  AllergieDefinitionApiOutput,
  AllergieDefinitionSummaryApiOutput,
  ChangeStatutApiInput,
  CreateAllergieApiInput,
  CreateAllergieDefinitionApiInput,
  CreateReactionApiInput,
  ReactionApiOutput,
  ReferentielsAllergieApiOutput,
  UpdateAllergieApiInput,
  UpdateAllergieDefinitionApiInput,
} from "./allergies.contrats";

export const allergiesApi = {
  /* ── Allergies (par patient) ────────────────────────────────────── */

  async lister(
    patientId: number,
    actifsUniquement = false,
  ): Promise<Allergie[]> {
    const raw = await clientHttp<unknown>("/allergies", {
      params: {
        patientId,
        ...(actifsUniquement ? { actifsUniquement: "true" } : {}),
      },
    });
    return extraireElementsCollection<AllergieApiOutput>(raw).map(mapperAllergie);
  },

  async obtenir(id: number): Promise<Allergie> {
    const raw = await clientHttp<AllergieApiOutput>(`/allergies/${id}`);
    return mapperAllergie(raw);
  },

  async creer(input: NouvelleAllergieInput): Promise<Allergie> {
    const payload: CreateAllergieApiInput = { ...input };
    const raw = await clientHttp<AllergieApiOutput>("/allergies", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapperAllergie(raw);
  },

  async modifier(id: number, input: ModificationAllergieInput): Promise<Allergie> {
    const payload: UpdateAllergieApiInput = { ...input };
    const raw = await clientHttp<AllergieApiOutput>(`/allergies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: JSON.stringify(payload),
    });
    return mapperAllergie(raw);
  },

  async changerStatut(id: number, input: ChangerStatutInput): Promise<Allergie> {
    const payload: ChangeStatutApiInput = { ...input };
    const raw = await clientHttp<AllergieApiOutput>(`/allergies/${id}/statut`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapperAllergie(raw);
  },

  /* ── Réactions ──────────────────────────────────────────────────── */

  async listerReactions(allergieId: number): Promise<ReactionAllergie[]> {
    const raw = await clientHttp<unknown>(`/allergies/${allergieId}/reactions`);
    return extraireElementsCollection<ReactionApiOutput>(raw).map(mapperReaction);
  },

  async ajouterReaction(
    allergieId: number,
    input: NouvelleReactionInput,
  ): Promise<ReactionAllergie> {
    const payload: CreateReactionApiInput = { ...input };
    const raw = await clientHttp<ReactionApiOutput>(
      `/allergies/${allergieId}/reactions`,
      { method: "POST", body: JSON.stringify(payload) },
    );
    return mapperReaction(raw);
  },

  /* ── Référentiels (liste déroulante) ───────────────────────────── */

  async referentiels(): Promise<ReferentielsAllergie> {
    const raw = await clientHttp<ReferentielsAllergieApiOutput>(
      "/allergies/referentiels",
    );
    return mapperReferentiels(raw);
  },

  async definitionsActives(): Promise<AllergieDefinitionSummary[]> {
    const raw = await clientHttp<unknown>("/allergie_definitions/actifs");
    return extraireElementsCollection<AllergieDefinitionSummaryApiOutput>(raw).map(
      mapperDefinitionSummary,
    );
  },

  /* ── Définitions (admin) ───────────────────────────────────────── */

  async listerDefinitions(filtres?: {
    actif?: boolean;
    recherche?: string;
    categorie?: string;
  }): Promise<AllergieDefinition[]> {
    const params: Record<string, string> = {};
    if (filtres?.actif !== undefined) params.actif = String(filtres.actif);
    if (filtres?.recherche) params.recherche = filtres.recherche;
    if (filtres?.categorie) params.categorie = filtres.categorie;
    const raw = await clientHttp<unknown>("/allergie_definitions", {
      params: Object.keys(params).length ? params : undefined,
    });
    return extraireElementsCollection<AllergieDefinitionApiOutput>(raw).map(
      mapperDefinition,
    );
  },

  async creerDefinition(
    input: NouvelleAllergieDefinitionInput,
  ): Promise<AllergieDefinition> {
    const payload: CreateAllergieDefinitionApiInput = {
      code: input.code.trim().toUpperCase(),
      libelle: input.libelle.trim(),
      categorie: input.categorie,
      codifications: input.codifications ?? [],
    };
    const raw = await clientHttp<AllergieDefinitionApiOutput>(
      "/allergie_definitions",
      { method: "POST", body: JSON.stringify(payload) },
    );
    return mapperDefinition(raw);
  },

  async modifierDefinition(
    id: number,
    input: ModificationAllergieDefinitionInput,
  ): Promise<AllergieDefinition> {
    const payload: UpdateAllergieDefinitionApiInput = { ...input };
    const raw = await clientHttp<AllergieDefinitionApiOutput>(
      `/allergie_definitions/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(payload),
      },
    );
    return mapperDefinition(raw);
  },

  async changerActivationDefinition(
    id: number,
    actif: boolean,
  ): Promise<AllergieDefinition> {
    const raw = await clientHttp<AllergieDefinitionApiOutput>(
      `/allergie_definitions/${id}/activation`,
      { method: "POST", body: JSON.stringify({ actif }) },
    );
    return mapperDefinition(raw);
  },

  /* ── Principes actifs (catalogue Stock) ─────────────────────────── */

  /**
   * GET /api/principe_actifs — shortName Symfony `PrincipeActif`.
   * Même endpoint que celui utilisé par le reste de l'application
   * (briques stock-commun / pharmacie-catalogue).
   */
  async listerPrincipesActifs(): Promise<PrincipeActifOption[]> {
    const raw = await clientHttp<unknown>("/principe_actifs");
    return extraireElementsCollection<unknown>(raw)
      .map(mapperPrincipeActif)
      .filter((p): p is PrincipeActifOption => p !== null)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },
};