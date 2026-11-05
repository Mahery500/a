// src/briques/allergies/brique.ts

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueAllergies: ManifesteBrique = definirBrique({
  id: "allergies",
  nom: "Allergies & Réactions",
  description:
    "Suivi des allergies du patient (substances, criticité, vérification) et des réactions documentées",
  ressource: "allergie",
  version: "1.0.0",
});

export default briqueAllergies;