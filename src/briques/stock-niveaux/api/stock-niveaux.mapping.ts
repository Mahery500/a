/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StockLevelApiOutput, StockSiteApiOutput } from "./stock-niveaux.contrats";
import { LigneNiveauStock, SiteStock, StatutQuantiteStock } from "../modele/stock-niveaux.types";

export function mapperLigneStock(api: StockLevelApiOutput): LigneNiveauStock {
  const quantite = api.quantite ?? 0;
  let statut: StatutQuantiteStock = "disponible";
  if (quantite <= 0) {
    statut = "rupture";
  } else if (quantite < 10) {
    statut = "critique";
  }

  const pId = api.produitId ?? 0;
  const sId = api.siteId ?? 0;

  return {
    id: `${pId}-${sId}`,
    produitId: pId,
    produitLibelle: api.produitLibelle ?? `Produit #${pId}`,
    medicamentLibelle: api.medicamentLibelle ?? null,
    siteId: sId,
    siteLibelle: api.siteLibelle ?? `Site #${sId}`,
    quantite,
    statut,
    formeLibelle: api.formeLibelle ?? null,
    comprimesParPlaquette: api.comprimesParPlaquette ?? null,
    plaquettesParBoite: api.plaquettesParBoite ?? null,
    lotId: api.lotId ?? null,
    numLot: api.numLot ?? null,
    datePeremption: api.datePeremption ?? null,
    unitesParBoite: api.unitesParBoite ?? null,
  };
}

export function mapperSiteStock(api: StockSiteApiOutput): SiteStock {
  const id = api.id ?? 0;
  return {
    id,
    libelle: api.name || api.code || `Site #${id}`,
    adresse: api.address ?? null,
    contact: api.phone ?? null,
  };
}