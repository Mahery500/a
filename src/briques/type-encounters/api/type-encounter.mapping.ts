/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TypeEncounter,
  NouveauTypeEncounterInput,
  ModificationTypeEncounterInput,
} from "../modele/type-encounter.types";
import {
  TypeEncounterApiOutput,
  CreateTypeEncounterApiInput,
  UpdateTypeEncounterApiInput,
} from "./type-encounter.contrats";

export function mapperTypeEncounter(brut: unknown): TypeEncounter | null {
  if (!brut || typeof brut !== "object") return null;
  const obj = brut as Record<string, unknown>;

  const id = Number(obj.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const typeServiceIds = Array.isArray(obj.typeServiceIds)
    ? obj.typeServiceIds.map(Number).filter((n): n is number => Number.isFinite(n) && n > 0)
    : [];

  return {
    id,
    code: String(obj.code ?? "")
      .trim()
      .toUpperCase(),
    libelle: String(obj.libelle ?? "").trim(),
    description: obj.description ? String(obj.description).trim() : null,
    actif: typeof obj.actif === "boolean" ? obj.actif : true,
    typeServiceIds,
  };
}

export function mapperNouveauVersApi(
  saisie: NouveauTypeEncounterInput,
): CreateTypeEncounterApiInput {
  return {
    code: saisie.code.trim().toUpperCase(),
    libelle: saisie.libelle.trim(),
    description: saisie.description?.trim() || null,
  };
}

export function mapperModificationVersApi(
  saisie: ModificationTypeEncounterInput,
): UpdateTypeEncounterApiInput {
  const payload: UpdateTypeEncounterApiInput = {};
  if (saisie.libelle !== undefined) payload.libelle = saisie.libelle.trim();
  if (saisie.description !== undefined) {
    const d = saisie.description?.trim() ?? "";
    payload.description = d === "" ? null : d;
  }
  return payload;
}
