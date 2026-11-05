/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueHistoriqueMedical: ManifesteBrique = definirBrique({
  id: "historique-medical",
  nom: "Historique médical",
  description:
    "Dossier médical d'un patient : prises en charge passées avec actes, diagnostics, constats et résultats externes",
  ressource: "historique_medical",
  version: "1.0.0",
});