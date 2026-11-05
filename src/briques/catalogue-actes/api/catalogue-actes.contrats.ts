/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CategorieActeApi {
  id: number;
  code: string;
  libelle: string;
  parentId: number | null;
  parentCode: string | null;
  niveau: number;
  feuille: boolean;
  chemin: string[];
}

export interface CreateCategorieActePayloadApi {
  code: string;
  libelle: string;
  parentCode?: string | null;
}

export interface CodificationActeApi {
  codeSystem: string;
  code: string;
  libelle?: string;
}

export interface ActeDefinitionApi {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
  categorie: CategorieActeApi;
  habilitations?: HabilitationApi[];
  typeServiceIds: number[];
  codifications?: CodificationActeApi[];
}

export interface CreateActeDefinitionPayloadApi {
  code: string;
  libelle: string;
  categorieCode: string;
  habilitations: { corpsMedicalCode: string; specialiteCode?: string | null }[];
  typeServiceIds?: number[];
  codifications?: CodificationActeApi[];
}

export interface PatchActeDefinitionPayloadApi {
  libelle?: string;
  categorieCode?: string;
  habilitations?: { corpsMedicalCode: string; specialiteCode?: string | null }[];
  typeServiceIds?: number[];
  actif?: boolean;
  codifications?: CodificationActeApi[];
}

export interface ChangeActivationApiInput {
  actif: boolean;
}

export interface TypeServiceApi {
  id: number;
  code: string;
  name?: string;
  nom?: string;
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

export interface HabilitationApi {
  corpsMedicalCode: string;
  corpsMedicalLibelle?: string;
  specialiteCode?: string | null;
  specialiteLibelle?: string;
  actif?: boolean;
}
