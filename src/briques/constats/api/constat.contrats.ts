/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ObservationOutputApi {
  id: number;
  observationDefinitionId: number;
  code: string;
  libelle: string;
  typeValeur: string;
  valeur: string;
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
  interpretation: string | null;
  dateObservation: string;
  statut: string;
  commentaire: string | null;
  staffId: number | null;
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
  codifications: { codeSystem: string; code: string }[];
}

export interface CategorieObservationApiOutput {
  id: number;
  code: string;
  libelle: string;
  parentId: number | null;
}

export interface CreateConstatApiInput {
  observationDefinitionId: number;
  valeur: string;
  commentaire?: string | null;
  dateObservation?: string | null;
}