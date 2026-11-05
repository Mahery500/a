// src/briques/categorie-observations/brique.ts
import { definirBrique, ManifesteBrique } from "@/noyau/brique";
import { creerApiCategories } from "@/noyau/referentiels/categories";

export const briqueCategoriesObservations: ManifesteBrique = definirBrique({
  id: "categorie-observations",
  nom: "Catégories d'Observations",
  description:
    "Arborescence des catégories d\u2019observations (Constantes vitales, Mesures anthropomorphiques…)",
  ressource: "categorie_observation",
  version: "1.0.0",
});

export const categoriesObservationsApi = creerApiCategories("/categorie_observations");
export default briqueCategoriesObservations;
