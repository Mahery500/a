/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ObservationDefinitionApi {
  id: number;
  code: string;
  libelle: string;
  typeValeur: string; // 'numerique' | 'texte'
  actif: boolean;
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
}

export interface ActeObservationItemApi {
  ordre: number;
  obligatoire: boolean;
  observation: ObservationDefinitionApi;
}

export interface ActeObservationsReponseApi {
  acteDefinitionId: number;
  observations: ActeObservationItemApi[];
}

export interface CategorieActeApi {
  id: number;
  code: string;
  libelle: string;
}

export interface ActeDefinitionRealisableApi {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
  categorie?: CategorieActeApi | number;
  categorieId?: number;
  rolesAutorises?: string[];
  typeServiceIds?: number[];
}

export interface ObservationApiOutput {
  id: number;
  observationDefinitionId?: number;
  code?: string;
  libelle?: string;
  typeValeur?: string;
  valeur: string;
  uniteId?: number | null;
  uniteCode?: string | null;
  uniteLibelle?: string | null;
  unite?: string | null;
  interpretation?: string | null;
  dateObservation?: string;
  statut?: string;
}

export interface AddObservationApiInput {
  observationDefinitionId: number;
  valeur: string;
  interpretation?: string | null;
}

export interface ActeRealiseApiOutput {
  id: number;
  encounterId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  staffId: number;
  dateRealisation: string;
  statut: string;
  commentaire: string | null;
  observations: ObservationApiOutput[];
}
