/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueAffectations: ManifesteBrique = definirBrique({
  id: "affectations",
  nom: "Affectations du Personnel",
  description:
    "Répartition opérationnelle et assignation du personnel soignant aux sites et services",
  ressource: "affectation",
  version: "1.0.0",
});

export default briqueAffectations;
