/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatutQuantiteStock = "disponible" | "critique" | "rupture";

export interface LigneNiveauStock {
  id: string;
  produitId: number;
  produitLibelle: string;
  /** Nom normalisé du médicament associé au produit. */
  medicamentLibelle?: string | null;
  siteId: number;
  siteLibelle: string;
  /** Quantité en unités de base (comprimés). */
  quantite: number;
  statut: StatutQuantiteStock;
  /** Forme du produit : Comprimé, Gélule, Sirop, Injectable… */
  formeLibelle?: string | null;
  comprimesParPlaquette?: number | null;
  plaquettesParBoite?: number | null;
  lotId?: number | null;
  numLot?: string | null;
  datePeremption?: string | null;
  unitesParBoite?: number | null;
}

export interface SiteStock {
  id: number;
  libelle: string;
  adresse: string | null;
  contact: string | null;
}