/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";
import { creerApiCategories } from "@/noyau/referentiels/categories";

export const briqueCategoriesActes: ManifesteBrique = definirBrique({
  id: "categorie-actes",
  nom: "Catégories d'Actes",
  description:
    "Arborescence des catégories d\u2019actes médicaux (Consultation, Acte diagnostique, Soins…)",
  ressource: "categorie_acte",
  version: "1.0.0",
});

export const categoriesActesApi = creerApiCategories("/categorie_actes");
export default briqueCategoriesActes;
