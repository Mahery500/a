/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueObservationDefinitions: ManifesteBrique = definirBrique({
  id: "observation-definitions",
  nom: "Définitions d'Observations",
  description:
    "Nomenclature et référentiel des paramètres cliniques, constantes, unités de mesure et codifications",
  ressource: "observation_definition",
  version: "1.0.0",
});

export default briqueObservationDefinitions;
