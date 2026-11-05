/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueStockNiveaux: ManifesteBrique = definirBrique({
  id: "stock-niveaux",
  nom: "État des Stocks",
  description:
    "Visualisation consolidée multi-sites des inventaires, alertes de rupture et supervision",
  ressource: "stock_niveau",
  version: "1.0.0",
});
