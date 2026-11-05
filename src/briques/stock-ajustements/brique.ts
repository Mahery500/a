/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueStockAjustements: ManifesteBrique = definirBrique({
  id: "stock-ajustements",
  nom: "Inventaires & Ajustements",
  description: "Régularisation physique des stocks, inventaires tournants et motifs d’ajustement",
  ressource: "stock_ajustement",
  version: "1.0.0",
});
