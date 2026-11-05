/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueStockDispensation: ManifesteBrique = definirBrique({
  id: "stock-dispensation",
  nom: "Dispensation Pharmaceutique",
  description:
    "Délivrance de médicaments au comptoir, déstockage tracé et contrôle de disponibilité",
  ressource: "stock_dispensation",
  version: "1.0.0",
});
