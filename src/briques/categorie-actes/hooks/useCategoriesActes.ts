/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCategories } from "@/noyau/referentiels/categories";
import { categoriesActesApi } from "../brique";

export function useCategoriesActes() {
  return useCategories(categoriesActesApi, "Catégorie d\u2019acte");
}
