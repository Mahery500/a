/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientOptionDispensation {
  id: number;
  nomComplet: string;
  matricule: string;
}

export interface ProduitOptionDispensation {
  id: number;
  nomCommercial: string;
  quantiteEnStock: number;
}

export interface DispensationInput {
  patientId: number;
  produitId: number;
  siteId: number;
  quantite: number;
  commentaire?: string;
}

export interface DispensationResultat {
  mouvementId: number;
  produitNom: string;
  quantite: number;
  dateDispensation: string;
}
