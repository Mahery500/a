// src/briques/categorie-observations/hooks/useCategoriesObservations.ts
import { useCategories } from "@/noyau/referentiels/categories";
import { categoriesObservationsApi } from "../brique";

export function useCategoriesObservations() {
  return useCategories(categoriesObservationsApi, "Catégorie d\u2019observation");
}
