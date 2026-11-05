/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ObservationDefinition,
  UniteMesure,
  CodeSysteme,
  NouvelleObservationDefinitionInput,
  ModificationObservationDefinitionInput,
  NouvelleUniteInput,
  NouveauCodeSystemeInput,
} from "../modele/observation-definition.types";
import {
  ObservationDefinitionApiOutput,
  CreateObservationDefinitionApiInput,
  UpdateObservationDefinitionApiInput,
  UniteApiOutput,
  CreateUniteApiInput,
  CodeSystemApiOutput,
  CreateCodeSystemApiInput,
} from "./observation-definition.contrats";
import type { CategorieHierarchique } from "@/noyau/referentiels/categories";

/* ------------------------------------------------------------------ *
 * Catégories d'observations
 * ------------------------------------------------------------------ */

/**
 * Mappe un objet catégorie renvoyé par le backend (CategorieObservationOutput)
 * vers la forme partagée utilisée par tous les référentiels hiérarchiques.
 */
export function mapperCategorieObservation(brut: unknown): CategorieHierarchique | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;

  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    code: String(o.code ?? "")
      .trim()
      .toUpperCase(),
    libelle: String(o.libelle ?? "").trim(),
    parentId: typeof o.parentId === "number" ? o.parentId : null,
    parentCode: typeof o.parentCode === "string" ? o.parentCode : null,
    niveau: typeof o.niveau === "number" ? o.niveau : 1,
    feuille: typeof o.feuille === "boolean" ? o.feuille : true,
    chemin: Array.isArray(o.chemin) ? o.chemin.map(String) : [],
  };
}

/* ------------------------------------------------------------------ *
 * Définitions d'observations
 * ------------------------------------------------------------------ */

export function mapperObservationDefinitionDepuisApi(brut: unknown): ObservationDefinition | null {
  if (!brut || typeof brut !== "object") return null;
  const obj = brut as Record<string, unknown>;

  let id = Number(obj.id ?? obj.Id_Observation_Definition);
  if (!Number.isFinite(id) || id <= 0) {
    if (typeof obj["@id"] === "string" && obj["@id"].includes("/")) {
      id = Number(obj["@id"].split("/").pop());
    }
  }
  if (!Number.isFinite(id) || id <= 0) return null;

  // La catégorie est obligatoire côté backend : sans elle la ligne est
  // inutilisable. On rejette plutôt que d'inventer une catégorie fantôme.
  const categorie = mapperCategorieObservation(obj.categorie);
  if (!categorie) return null;

  const code = String(obj.code ?? "")
    .trim()
    .toUpperCase();
  const libelle = String(obj.libelle ?? obj.name ?? `Observation #${id}`).trim();
  const typeValeurBrut = String(obj.typeValeur ?? "numerique")
    .trim()
    .toLowerCase();
  const typeValeur = typeValeurBrut === "texte" ? "texte" : "numerique";

  const actif = typeof obj.actif === "boolean" ? obj.actif : true;

  const uniteIdNum = Number(obj.uniteId);
  const uniteId = Number.isFinite(uniteIdNum) && uniteIdNum > 0 ? uniteIdNum : null;
  const uniteCode =
    typeof obj.uniteCode === "string" && obj.uniteCode.trim() ? obj.uniteCode.trim() : null;
  const uniteLibelle =
    typeof obj.uniteLibelle === "string" && obj.uniteLibelle.trim()
      ? obj.uniteLibelle.trim()
      : null;

  const codificationsBrutes = Array.isArray(obj.codifications) ? obj.codifications : [];
  const codifications = codificationsBrutes
    .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === "object"))
    .map((c) => ({
      codeSystem: String(c.codeSystem ?? "")
        .trim()
        .toUpperCase(),
      code: String(c.code ?? "").trim(),
    }))
    .filter((c) => c.codeSystem.length > 0 && c.code.length > 0);

  return {
    id,
    code,
    libelle,
    typeValeur,
    actif,
    categorie, // ← désormais propagé
    uniteId,
    uniteCode,
    uniteLibelle,
    codifications,
  };
}

export function mapperNouvelleObservationDefinitionVersApi(
  saisie: NouvelleObservationDefinitionInput,
): CreateObservationDefinitionApiInput {
  return {
    code: saisie.code.trim().toUpperCase(),
    libelle: saisie.libelle.trim(),
    typeValeur: saisie.typeValeur,
    categorieCode: saisie.categorieCode.trim().toUpperCase(), // ← champ requis
    uniteId: saisie.typeValeur === "numerique" && saisie.uniteId ? Number(saisie.uniteId) : null,
  };
}

export function mapperModificationObservationDefinitionVersApi(
  saisie: ModificationObservationDefinitionInput,
): UpdateObservationDefinitionApiInput {
  const payload: UpdateObservationDefinitionApiInput = {};

  if (saisie.libelle !== undefined && saisie.libelle !== null) {
    payload.libelle = saisie.libelle.trim();
  }
  if (saisie.code !== undefined && saisie.code !== null) {
    payload.code = saisie.code.trim().toUpperCase();
  }
  if (saisie.typeValeur !== undefined && saisie.typeValeur !== null) {
    payload.typeValeur = saisie.typeValeur;
  }
  if (saisie.categorieCode !== undefined && saisie.categorieCode !== null) {
    payload.categorieCode = saisie.categorieCode.trim().toUpperCase(); // ← nouveau
  }
  if (saisie.uniteId !== undefined) {
    payload.uniteId = saisie.uniteId ? Number(saisie.uniteId) : null;
  }

  return payload;
}

/* ------------------------------------------------------------------ *
 * Unités de mesure
 * ------------------------------------------------------------------ */

export function mapperUniteDepuisApi(brut: unknown): UniteMesure | null {
  if (!brut || typeof brut !== "object") return null;
  const obj = brut as Record<string, unknown>;

  let id = Number(obj.id);
  if (!Number.isFinite(id) || id <= 0) {
    if (typeof obj["@id"] === "string" && obj["@id"].includes("/")) {
      id = Number(obj["@id"].split("/").pop());
    }
  }
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    code: String(obj.code ?? "").trim(),
    libelle: String(obj.libelle ?? `Unité #${id}`).trim(),
    actif: typeof obj.actif === "boolean" ? obj.actif : true,
  };
}

export function mapperNouvelleUniteVersApi(saisie: NouvelleUniteInput): CreateUniteApiInput {
  return {
    code: saisie.code.trim(),
    libelle: saisie.libelle.trim(),
  };
}

/* ------------------------------------------------------------------ *
 * Systèmes de codification
 * ------------------------------------------------------------------ */

export function mapperCodeSystemDepuisApi(brut: unknown): CodeSysteme | null {
  if (!brut || typeof brut !== "object") return null;
  const obj = brut as Record<string, unknown>;

  let id = Number(obj.id);
  if (!Number.isFinite(id) || id <= 0) {
    if (typeof obj["@id"] === "string" && obj["@id"].includes("/")) {
      id = Number(obj["@id"].split("/").pop());
    }
  }
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    code: String(obj.code ?? "")
      .trim()
      .toUpperCase(),
    libelle: String(obj.libelle ?? `Système #${id}`).trim(),
    uri: typeof obj.uri === "string" && obj.uri.trim() ? obj.uri.trim() : null,
    actif: typeof obj.actif === "boolean" ? obj.actif : true,
  };
}

export function mapperNouveauCodeSystemVersApi(
  saisie: NouveauCodeSystemeInput,
): CreateCodeSystemApiInput {
  return {
    code: saisie.code.trim().toUpperCase(),
    libelle: saisie.libelle.trim(),
    uri: saisie.uri?.trim() || null,
  };
}
