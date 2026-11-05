/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueDossiersMedicaux: ManifesteBrique = definirBrique({
  id: "dossiers-medicaux",
  nom: "Dossiers Médicaux",
  description:
    "Répertoire clinique, historique chronologique des consultations, diagnostics et constantes antérieures",
  ressource: "dossier_medical",
  version: "1.0.0",
});
