/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  ActeMedical,
  TypeServiceOption,
  NouvelActeInput,
  ModificationActeInput,
  CategorieActe,
  CodificationActe,
  CodeSystemeOption,
  NouveauCodeSystemeInput,
} from "../modele/catalogue-actes.types";
import { ActeDefinitionApi, CodeSystemApiOutput } from "./catalogue-actes.contrats";
import {
  mapperActeMedical,
  mapperTypeServiceOption,
  mapperNouvelActeVersApi,
  mapperModificationActeVersApi,
  mapperCodeSystemDepuisApi,
  mapperNouveauCodeSystemVersApi,
  mapperCategorieActe,
} from "./catalogue-actes.mapping";
import { categoriesActesApi } from "@/briques/categorie-actes";

export const catalogueActesApi = {
  // ---- Catégories (déléguées à la brique dédiée) ----

  listerCategories: (feuillesUniquement = false): Promise<CategorieActe[]> =>
    categoriesActesApi.lister(feuillesUniquement),

  creerCategorie: (saisie: { code: string; libelle: string; parentCode: string | null }) =>
    categoriesActesApi.creer(saisie),

  changerParentCategorie: (id: number, parentCode: string | null) =>
    categoriesActesApi.changerParent(id, parentCode),

  // ---- Actes ----

  async listerActes(): Promise<ActeMedical[]> {
    const reponse = await clientHttp<unknown>("/acte_definitions");
    const elements = extraireElementsCollection<unknown>(reponse);
    return elements
      .map(mapperActeMedical)
      .filter((a): a is ActeMedical => a !== null)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },

  async creerActe(saisie: NouvelActeInput): Promise<ActeMedical> {
    const rep = await clientHttp<ActeDefinitionApi>("/acte_definitions", {
      method: "POST",
      body: JSON.stringify(mapperNouvelActeVersApi(saisie)),
    });
    const acte = mapperActeMedical(rep);
    if (!acte)
      throw new ErreurApi(500, "L'API a répondu sans identifiant valide pour l'acte créé.");
    return acte;
  },

  async modifierActe(id: number, saisie: ModificationActeInput): Promise<ActeMedical> {
    const rep = await clientHttp<ActeDefinitionApi>(`/acte_definitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: JSON.stringify(mapperModificationActeVersApi(saisie)),
    });
    const acte = mapperActeMedical(rep);
    if (!acte) throw new ErreurApi(500, "Réponse invalide lors de la modification de l'acte.");
    return acte;
  },

  async changerStatutActe(id: number, actif: boolean): Promise<ActeMedical> {
    const rep = await clientHttp<ActeDefinitionApi>(`/acte_definitions/${id}/activation`, {
      method: "POST",
      body: JSON.stringify({ actif }),
    });
    const acte = mapperActeMedical(rep);
    if (!acte) throw new ErreurApi(500, "Réponse invalide pour l'acte mis à jour.");
    return acte;
  },

  async listerTypesServices(): Promise<TypeServiceOption[]> {
    const rep = await clientHttp<unknown>("/type-services");
    return extraireElementsCollection<unknown>(rep)
      .map(mapperTypeServiceOption)
      .filter((t): t is TypeServiceOption => t !== null)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  },

  // ---- Codifications / systèmes ----

  async listerCodeSystems(actifsUniquement = false): Promise<CodeSystemeOption[]> {
    const rep = await clientHttp<unknown>("/code_systems", {
      params: actifsUniquement ? { actif: "true" } : undefined,
    });
    return extraireElementsCollection<unknown>(rep)
      .map(mapperCodeSystemDepuisApi)
      .filter((c): c is CodeSystemeOption => c !== null)
      .sort((a, b) => a.code.localeCompare(b.code, "fr"));
  },

  async creerCodeSystem(saisie: NouveauCodeSystemeInput): Promise<CodeSystemeOption> {
    const rep = await clientHttp<CodeSystemApiOutput>("/code_systems", {
      method: "POST",
      body: JSON.stringify(mapperNouveauCodeSystemVersApi(saisie)),
    });
    const cs = mapperCodeSystemDepuisApi(rep);
    if (!cs) throw new ErreurApi(500, "Échec de l'enregistrement du système de codification.");
    return cs;
  },

  async changerActivationCodeSystem(id: number, actif: boolean): Promise<CodeSystemeOption> {
    const rep = await clientHttp<CodeSystemApiOutput>(`/code_systems/${id}/activation`, {
      method: "POST",
      body: JSON.stringify({ actif }),
    });
    const cs = mapperCodeSystemDepuisApi(rep);
    if (!cs) throw new ErreurApi(500, "Échec du changement d'activation.");
    return cs;
  },

  async definirCodificationsActe(
    acteId: number,
    codifications: CodificationActe[],
  ): Promise<ActeMedical> {
    const payload = {
      codifications: codifications.map((c) => ({
        codeSystem: c.codeSystem.trim().toUpperCase(),
        code: c.code.trim(),
        libelle: c.libelle?.trim(),
      })),
    };
    const rep = await clientHttp<ActeDefinitionApi>(`/acte_definitions/${acteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: JSON.stringify(payload),
    });
    const acte = mapperActeMedical(rep);
    if (!acte) throw new ErreurApi(500, "Échec de l'enregistrement des codifications de l'acte.");
    return acte;
  },
};
