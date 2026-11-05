/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import {
  MouvementResourceApiOutput,
  MouvementTypeResourceApiOutput,
  ProduitResourceApiOutput,
  StockLevelApiOutput,
  PatientApiOutput,
} from "./stock-dispensation.contrats";
import { mapperPatientOption, mapperProduitOption } from "./stock-dispensation.mapping";
import {
  PatientOptionDispensation,
  ProduitOptionDispensation,
  DispensationInput,
  DispensationResultat,
} from "../modele/stock-dispensation.types";

export const stockDispensationApi = {
  async listerPatients(): Promise<PatientOptionDispensation[]> {
    const raw = await clientHttp<unknown>("/patients");
    const items = extraireElementsCollection<PatientApiOutput>(raw);
    return items.map(mapperPatientOption);
  },

  async listerProduitsDisponibles(siteId?: number | null): Promise<ProduitOptionDispensation[]> {
    const [prodsRaw, stocksRaw] = await Promise.all([
      clientHttp<unknown>("/produit_resources"),
      clientHttp<unknown>("/stocks").catch(() => []),
    ]);

    const prods = extraireElementsCollection<ProduitResourceApiOutput>(prodsRaw);
    const stocks = extraireElementsCollection<StockLevelApiOutput>(stocksRaw);

    const mapStock = new Map<number, number>();
    stocks.forEach((s) => {
      if (s.produitId && (!siteId || s.siteId === siteId)) {
        mapStock.set(s.produitId, (mapStock.get(s.produitId) || 0) + (s.quantite || 0));
      }
    });

    return prods.map((p) => mapperProduitOption(p, mapStock.get(p.id ?? 0) || 0));
  },

  async trouverTypeMouvementSortie(): Promise<number> {
    const raw = await clientHttp<unknown>("/mouvement_type_resources");
    const types = extraireElementsCollection<MouvementTypeResourceApiOutput>(raw);
    const sortieType =
      types.find(
        (t) =>
          (t.sens && t.sens < 0) ||
          t.code?.toUpperCase().includes("SORTIE") ||
          t.code?.toUpperCase().includes("DISP"),
      ) ||
      types.find((t) => t.sens && t.sens < 0) ||
      types[0];

    if (!sortieType?.id) {
      throw new Error("Aucun type de mouvement de sortie n'est configuré dans le référentiel.");
    }

    return sortieType.id;
  },

  async enregistrerDispensation(input: DispensationInput): Promise<DispensationResultat> {
    const mouvementTypeId = await this.trouverTypeMouvementSortie();

    const raw = await clientHttp<MouvementResourceApiOutput>("/mouvement_resources", {
      method: "POST",
      body: JSON.stringify({
        produitId: input.produitId,
        siteId: input.siteId,
        mouvementTypeId,
        quantite: input.quantite,
      }),
    });

    return {
      mouvementId: raw.id ?? 0,
      produitNom: `Produit #${input.produitId}`,
      quantite: input.quantite,
      dateDispensation: raw.dateMouvement ?? "",
    };
  },
};
