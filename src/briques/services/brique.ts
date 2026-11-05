/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueServices: ManifesteBrique = definirBrique({
  id: "services",
  nom: "Services Médicaux",
  description: "Cartographie des services hospitaliers et catalogue des spécialités cliniques",
  ressource: "service",
  version: "1.0.0",
});

export default briqueServices;
