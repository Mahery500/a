/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AjustementTypeResourceApi {
  id?: number | null;
  libelle?: string | null;
}

export interface StockResourceApi {
  id?: number | null;
  produitId?: number | null;
  produitLibelle?: string | null;
  siteId?: number | null;
  siteLibelle?: string | null;
  quantite?: number | null;
}

export interface MouvementTypeApi {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
  sens?: number | null;
}

export interface RegularisationMouvementApiInput {
  produitId: number;
  siteId: number;
  mouvementTypeId: number;
  quantite: number;
}
