/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TypeValeurConstat = "numerique" | "texte" | "booleen";

export type StatutConstat =
  | "preliminaire"
  | "final"
  | "corrige"
  | "saisi_par_erreur";

/** Statuts considérés comme « actifs » (visibles par défaut côté liste). */
export const STATUTS_ACTIFS: StatutConstat[] = ["preliminaire", "final"];
export const estStatutActif = (s: StatutConstat): boolean =>
  STATUTS_ACTIFS.includes(s);

export interface ConstatEnregistre {
  id: number;
  observationDefinitionId: number;
  code: string;
  libelle: string;
  typeValeur: TypeValeurConstat;
  valeur: string;
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
  interpretation: string | null;
  dateObservation: string;
  statut: StatutConstat;
  commentaire: string | null;
  staffId: number | null;
}

export interface DefinitionConstat {
  id: number;
  code: string;
  libelle: string;
  typeValeur: TypeValeurConstat;
  uniteCode: string | null;
  uniteLibelle: string | null;
  categorieCode: string;
  categorieLibelle: string;
}

export interface NouveauConstatInput {
  observationDefinitionId: number;
  valeur: string;
  commentaire?: string | null;
  /** ISO 8601. null = maintenant (côté serveur). */
  dateObservation?: string | null;
}

// src/briques/constats/modele/constat.types.ts  (ajout en fin de fichier)

/**
 * Code de la définition spéciale « constat libre ».
 * Utilisée par le formulaire pour adapter le placeholder et afficher
 * le compteur de caractères (255 max — colonne `valeur` partagée).
 */
export const CODE_CONSTAT_LIBRE = "CONSTAT_LIBRE";

export const estConstatLibre = (code: string): boolean =>
  code.toUpperCase() === CODE_CONSTAT_LIBRE;