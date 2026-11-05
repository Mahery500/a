/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { StockLevelApiOutput, StockSiteApiOutput } from "./stock-niveaux.contrats";
import { mapperLigneStock, mapperSiteStock } from "./stock-niveaux.mapping";
import { LigneNiveauStock, SiteStock } from "../modele/stock-niveaux.types";

export const stockNiveauxApi = {
  /** `date` (AAAA-MM-JJ) : état enregistré à une date passée ; absent = stock actuel. */
  async listerNiveauxStock(date?: string): Promise<LigneNiveauStock[]> {
    const url = date ? `/stocks?date=${encodeURIComponent(date)}` : "/stocks";
    const raw = await clientHttp<unknown>(url);
    const items = extraireElementsCollection<StockLevelApiOutput>(raw);
    return items.map(mapperLigneStock);
  },

  async listerSitesStock(): Promise<SiteStock[]> {
    const raw = await clientHttp<unknown>("/sites");
    const items = extraireElementsCollection<StockSiteApiOutput>(raw);
    return items.map(mapperSiteStock);
  },
};