// src/briques/allergies/api/allergies.mapping.ts

import type {
  Allergie,
  AllergieDefinition,
  AllergieDefinitionSummary,
  CodificationAllergie,
  PrincipeActifOption,
  ReactionAllergie,
  ReferentielsAllergie,
} from "../modele/allergie.types";

import type {
  AllergieApiOutput,
  AllergieDefinitionApiOutput,
  AllergieDefinitionSummaryApiOutput,
  ReactionApiOutput,
  ReferentielsAllergieApiOutput,
  OptionOutputApi,
} from "./allergies.contrats";

const mapperCodifications = (raw: unknown): CodificationAllergie[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      const codeSystem = String(o.codeSystem ?? "").trim().toUpperCase();
      const code = String(o.code ?? "").trim();
      return codeSystem && code ? { codeSystem, code } : null;
    })
    .filter((c): c is CodificationAllergie => c !== null);
};

export const mapperReaction = (raw: ReactionApiOutput): ReactionAllergie => ({
  id: raw.id,
  allergieId: raw.allergieId,
  allergieDefinitionCode: raw.allergieDefinitionCode,
  allergieDefinitionLibelle: raw.allergieDefinitionLibelle,
  manifestation: raw.manifestation,
  severite: raw.severite,
  description: raw.description,
  dateReaction: raw.dateReaction,
  exposition: raw.exposition,
});

export const mapperAllergie = (raw: AllergieApiOutput): Allergie => ({
  id: raw.id,
  patientId: raw.patientId,
  allergieDefinitionCode: raw.allergieDefinitionCode,
  allergieDefinitionLibelle: raw.allergieDefinitionLibelle,
  allergieDefinitionCodifications: mapperCodifications(
    raw.allergieDefinitionCodifications,
  ),
  principeActifId: raw.principeActifId,
  principeActifLibelle: raw.principeActifLibelle,
  type: raw.type,
  categorie: raw.categorie,
  criticalite: raw.criticalite,
  verificationStatut: raw.verificationStatut,
  statut: raw.statut,
  dateDebut: raw.dateDebut,
  dateFin: raw.dateFin,
  derniereOccurrence: raw.derniereOccurrence,
  note: raw.note,
  reactions: (raw.reactions ?? []).map(mapperReaction),
});

export const mapperDefinition = (
  raw: AllergieDefinitionApiOutput,
): AllergieDefinition => ({
  id: raw.id,
  code: raw.code,
  libelle: raw.libelle,
  categorie: raw.categorie,
  actif: raw.actif,
  codifications: mapperCodifications(raw.codifications),
});

export const mapperDefinitionSummary = (
  raw: AllergieDefinitionSummaryApiOutput,
): AllergieDefinitionSummary => ({
  id: raw.id,
  code: raw.code,
  libelle: raw.libelle,
  categorie: raw.categorie,
});

const mapperOptions = (raw: OptionOutputApi[] | undefined) =>
  (raw ?? []).map((o) => ({ valeur: o.valeur, libelle: o.libelle }));

export const mapperReferentiels = (
  raw: ReferentielsAllergieApiOutput,
): ReferentielsAllergie => ({
  types: mapperOptions(raw.types),
  criticalites: mapperOptions(raw.criticalites),
  verificationStatuts: mapperOptions(raw.verificationStatuts),
  statuts: mapperOptions(raw.statuts),
  severites: mapperOptions(raw.severites),
  categories: mapperOptions(raw.categories),
});

export const mapperPrincipeActif = (raw: unknown): PrincipeActifOption | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id ?? o.Id_Principe_Actif);
  if (!Number.isFinite(id) || id <= 0) return null;
  const libelle = String(o.libelle ?? o.nom ?? "").trim();
  if (!libelle) return null;
  return { id, libelle };
};