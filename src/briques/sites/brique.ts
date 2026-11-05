/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueSites: ManifesteBrique = definirBrique({
  id: "sites",
  nom: "Sites Médicaux",
  description: "Gestion des établissements et centres cliniques hospitaliers",
  ressource: "site",
  version: "1.0.0",
});

export default briqueSites;
