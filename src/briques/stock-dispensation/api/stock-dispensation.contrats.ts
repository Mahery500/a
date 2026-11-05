/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MouvementResourceApiOutput {
  id: number | null;
  produitId: number | null;
  lotId: number | null;
  siteId: number | null;
  mouvementTypeId: number | null;
  quantite: number | null;
  dateMouvement: string | null;
}

export interface MouvementTypeResourceApiOutput {
  id: number | null;
  code: string | null;
  libelle: string | null;
  sens: number | null;
}

export interface ProduitResourceApiOutput {
  id: number | null;
  nomCommercial: string | null;
}

export interface StockLevelApiOutput {
  produitId: number | null;
  siteId: number | null;
  quantite: number | null;
}

export interface PatientApiOutput {
  id?: number;
  Id_Patient?: number;
  nom?: string;
  Nom?: string;
  prenom?: string;
  Prenom?: string;
  matricule?: string;
  Matricule?: string;
}
