/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueInfirmerieHistorique: ManifesteBrique = definirBrique({
  id: "infirmerie-historique",
  nom: "Historique des Soins Infirmiers",
  description: "Consultation chronologique et filtrage médico-légal des actes et soins réalisés",
  ressource: "infirmerie_historique",
  version: "1.0.0",
});
