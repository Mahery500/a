/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodificationApiItem {
  codeSystem: string;
  code: string;
}

export interface ObservationDefinitionApiOutput {
  id: number;
  code: string;
  libelle: string;
  typeValeur: string;
  actif: boolean;
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
  codifications: CodificationApiItem[];
}

export interface CreateObservationDefinitionApiInput {
  code: string;
  libelle: string;
  typeValeur: string;
  uniteId?: number | null;
}

export interface UpdateObservationDefinitionApiInput {
  libelle?: string | null;
  code?: string | null;
  typeValeur?: string | null;
  uniteId?: number | null;
}

export interface DefinirCodificationsObservationApiInput {
  codifications: CodificationApiItem[];
}

export interface UniteApiOutput {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
}

export interface CreateUniteApiInput {
  code: string;
  libelle: string;
}

export interface CodeSystemApiOutput {
  id: number;
  code: string;
  libelle: string;
  uri: string | null;
  actif: boolean;
}

export interface CreateCodeSystemApiInput {
  code: string;
  libelle: string;
  uri?: string | null;
}

export interface ChangeActivationApiInput {
  actif: boolean;
}

export interface ActeObservationApiItem {
  ordre: number;
  obligatoire: boolean;
  observation: ObservationDefinitionApiOutput;
}

export interface ActeObservationsApiOutput {
  acteDefinitionId: number;
  observations: ActeObservationApiItem[];
}

export interface DefinirObservationsActeApiInput {
  observations: {
    observationId: number;
    ordre: number;
    obligatoire: boolean;
  }[];
}

export interface ObservationDefinitionApiOutput {
  id: number;
  code: string;
  libelle: string;
  typeValeur: string;
  actif: boolean;
  categorie: {
    id: number;
    code: string;
    libelle: string;
    parentId: number | null;
    parentCode: string | null;
    niveau: number;
    feuille: boolean;
    chemin: string[];
  };
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
  codifications: CodificationApiItem[];
}

export interface CreateObservationDefinitionApiInput {
  code: string;
  libelle: string;
  typeValeur: string;
  categorieCode: string;
  uniteId?: number | null;
}

export interface UpdateObservationDefinitionApiInput {
  libelle?: string | null;
  code?: string | null;
  typeValeur?: string | null;
  categorieCode?: string | null;
  uniteId?: number | null;
}
