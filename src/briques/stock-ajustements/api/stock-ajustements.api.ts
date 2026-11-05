/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import {
  AjustementTypeResourceApi,
  StockResourceApi,
  MouvementTypeApi,
} from "./stock-ajustements.contrats";
import { mapperMotifAjustement, mapperLigneInventaire } from "./stock-ajustements.mapping";
import {
  MotifAjustement,
  LigneInventaireStock,
  NouveauMotifAjustementInput,
  RegularisationStockInput,
} from "../modele/stock-ajustements.types";

export const stockAjustementsApi = {
  async listerMotifs(): Promise<MotifAjustement[]> {
    const raw = await clientHttp<unknown>("/ajustement_type_resources");
    const items = extraireElementsCollection<AjustementTypeResourceApi>(raw);
    return items.map(mapperMotifAjustement);
  },

  async creerMotif(input: NouveauMotifAjustementInput): Promise<MotifAjustement> {
    const raw = await clientHttp<AjustementTypeResourceApi>("/ajustement_type_resources", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapperMotifAjustement(raw);
  },

  async supprimerMotif(id: number): Promise<void> {
    await clientHttp<void>(`/ajustement_type_resources/${id}`, {
      method: "DELETE",
    });
  },

  async listerLignesInventaire(): Promise<LigneInventaireStock[]> {
    const raw = await clientHttp<unknown>("/stocks");
    const items = extraireElementsCollection<StockResourceApi>(raw);
    return items.map(mapperLigneInventaire);
  },

  async listerTypesMouvement(): Promise<{ id: number; libelle: string; sens: number }[]> {
    const raw = await clientHttp<unknown>("/mouvement_type_resources");
    const items = extraireElementsCollection<MouvementTypeApi>(raw);
    return items.map((t) => ({
      id: t.id ?? 0,
      libelle: t.libelle || t.code || "Mouvement",
      sens: t.sens ?? 1,
    }));
  },

  async regulariserStock(input: RegularisationStockInput): Promise<void> {
    await clientHttp<unknown>("/mouvement_resources", {
      method: "POST",
      body: JSON.stringify({
        produitId: input.produitId,
        siteId: input.siteId,
        mouvementTypeId: input.mouvementTypeId,
        quantite: input.quantite,
      }),
    });
  },
};
