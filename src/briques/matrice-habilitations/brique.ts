/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueMatriceHabilitations: ManifesteBrique = definirBrique({
  id: "matrice-habilitations",
  nom: "Matrice des Habilitations",
  description:
    "Vue croisée : actes et diagnostics autorisés par corps médical / spécialité, et habilitations par acte",
  ressource: "matrice_habilitations",
  version: "1.0.0",
});

export default briqueMatriceHabilitations;