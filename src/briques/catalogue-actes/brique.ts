/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueCatalogueActes: ManifesteBrique = definirBrique({
  id: "catalogue-actes",
  nom: "Catalogue d'Actes Médicaux",
  description: "Nomenclature officielle des actes cliniques, examens et soins infirmiers",
  ressource: "catalogue_actes",
  version: "1.0.0",
});

export default briqueCatalogueActes;
