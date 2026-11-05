/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompetenceItem, NouvelleCompetenceInput, ModificationCompetenceInput } from "../modele/competence.types";
import {
  CompetenceApiOutput,
  CreateCompetenceApiInput,
  UpdateCompetenceApiInput,
} from "./competences.contrats";

export function mapperCompetence(brut: unknown): CompetenceItem | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;

  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    code: String(o.code ?? "").trim().toUpperCase(),
    libelle: String(o.libelle ?? "").trim(),
    actif: typeof o.actif === "boolean" ? o.actif : true,
  };
}

export function mapperCreation(input: NouvelleCompetenceInput): CreateCompetenceApiInput {
  return {
    code: input.code.trim().toUpperCase(),
    libelle: input.libelle.trim(),
  };
}

/**
 * Construit le payload PATCH en garantissant `actif` non nul.
 *
 * Règle backend : `$actif` a une valeur par défaut `true` dans le DTO, donc
 * un PATCH qui n'envoie pas `actif` réactive la ressource. On préserve donc
 * explicitement l'état courant quand on ne veut que changer le libellé.
 */
export function mapperModification(
  input: ModificationCompetenceInput,
  courante: CompetenceItem,
): UpdateCompetenceApiInput {
  return {
    libelle: (input.libelle ?? courante.libelle).trim(),
    actif: input.actif ?? courante.actif,
  };
}