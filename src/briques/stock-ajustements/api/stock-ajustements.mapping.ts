/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AjustementTypeResourceApi, StockResourceApi } from "./stock-ajustements.contrats";
import { MotifAjustement, LigneInventaireStock } from "../modele/stock-ajustements.types";

export function mapperMotifAjustement(api: AjustementTypeResourceApi): MotifAjustement {
  return {
    id: api.id ?? 0,
    libelle: api.libelle || "Motif sans libellé",
  };
}

export function mapperLigneInventaire(api: StockResourceApi): LigneInventaireStock {
  return {
    id: api.id ?? 0,
    produitId: api.produitId ?? 0,
    produitNom: api.produitLibelle || `Produit #${api.produitId}`,
    siteId: api.siteId ?? 0,
    siteNom: api.siteLibelle || `Site #${api.siteId}`,
    quantiteTheorique: api.quantite ?? 0,
  };
}
