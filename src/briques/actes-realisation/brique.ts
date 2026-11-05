// src/briques/actes-realisation/brique.ts
import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueActesRealisation: ManifesteBrique = definirBrique({
  id: "actes-realisation",
  nom: "Réalisation d'actes",
  description: "Sélection d'un acte, saisie de son moule d'observations et enregistrement",
  ressource: "acte_realise",
  version: "1.0.0",
});