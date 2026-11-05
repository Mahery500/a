/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StockLevelApiOutput {
  id: number | null;
  produitId: number | null;
  produitLibelle: string | null;
  /** Nom normalisé du médicament associé au produit. */
  medicamentLibelle?: string | null;
  siteId: number | null;
  siteLibelle: string | null;
  /** Quantité en unités de base (comprimés). */
  quantite: number | null;
  /** Forme du produit : Comprimé, Gélule, Sirop, Injectable… */
  formeLibelle?: string | null;
  /** Conditionnement du produit. */
  comprimesParPlaquette?: number | null;
  plaquettesParBoite?: number | null;
  unitesParBoite?: number | null;
  lotId?: number | null;
  numLot?: string | null;
  /** Format « YYYY-MM-DD ». */
  datePeremption?: string | null;
}

export interface StockSiteApiOutput {
  id: number | null;
  code?: string | null;
  name: string | null;
  city?: string | null;
  address: string | null;
  phone: string | null;
  isActive?: boolean | null;
}