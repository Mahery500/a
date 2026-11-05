/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueStockMouvements: ManifesteBrique = definirBrique({
  id: "stock-mouvements",
  nom: "Mouvements & Approvisionnements",
  description:
    "Gestion des approvisionnements, réceptions, commandes fournisseurs et transferts de stocks",
  ressource: "stock_mouvement",
  version: "1.0.0",
});
