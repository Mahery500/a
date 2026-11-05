/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briquePharmacieCatalogue: ManifesteBrique = definirBrique({
  id: "pharmacie-catalogue",
  nom: "Référentiel Médicaments & Produits",
  description:
    "Gestion du catalogue pharmaceutique, formes galéniques, conditionnements et fournisseurs",
  ressource: "stock_catalogue",
  version: "1.0.0",
});
