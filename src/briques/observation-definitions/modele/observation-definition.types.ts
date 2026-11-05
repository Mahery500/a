/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TypeValeurObservation = "numerique" | "texte";
import type { CategorieHierarchique } from "@/noyau/referentiels/categories";

export interface CodificationItem {
  codeSystem: string;
  code: string;
}

export interface UniteMesure {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
}

export interface CodeSysteme {
  id: number;
  code: string;
  libelle: string;
  uri: string | null;
  actif: boolean;
}

export interface ObservationDefinition {
  id: number;
  code: string;
  libelle: string;
  typeValeur: TypeValeurObservation;
  actif: boolean;
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
  codifications: CodificationItem[];
}

export interface NouvelleObservationDefinitionInput {
  code: string;
  libelle: string;
  typeValeur: TypeValeurObservation;
  uniteId?: number | null;
  codifications?: CodificationItem[];
}

export interface ModificationObservationDefinitionInput {
  libelle?: string | null;
  code?: string | null;
  typeValeur?: TypeValeurObservation | null;
  uniteId?: number | null;
}

export interface NouvelleUniteInput {
  code: string;
  libelle: string;
}

export interface NouveauCodeSystemeInput {
  code: string;
  libelle: string;
  uri?: string | null;
}

export interface ActeObservationLiaison {
  ordre: number;
  obligatoire: boolean;
  observationId: number;
  observation?: ObservationDefinition;
}

export interface ObservationDefinition {
  id: number;
  code: string;
  libelle: string;
  typeValeur: TypeValeurObservation;
  actif: boolean;
  /** Catégorie obligatoire côté backend. */
  categorie: CategorieHierarchique;
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
  codifications: CodificationItem[];
}

export interface NouvelleObservationDefinitionInput {
  code: string;
  libelle: string;
  typeValeur: TypeValeurObservation;
  categorieCode: string; // <-- nouveau, obligatoire
  uniteId?: number | null;
  codifications?: CodificationItem[];
}

export interface ModificationObservationDefinitionInput {
  libelle?: string | null;
  code?: string | null;
  typeValeur?: TypeValeurObservation | null;
  categorieCode?: string | null; // <-- nouveau
  uniteId?: number | null;
}
