/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MotifAjustement {
  id: number;
  libelle: string;
}

export interface LigneInventaireStock {
  id: number;
  produitId: number;
  produitNom: string;
  siteId: number;
  siteNom: string;
  quantiteTheorique: number;
}

export interface NouveauMotifAjustementInput {
  libelle: string;
}

export interface RegularisationStockInput {
  produitId: number;
  siteId: number;
  motifAjustementId: number;
  mouvementTypeId: number;
  quantite: number;
}
