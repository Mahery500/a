/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueTypeEncounters: ManifesteBrique = definirBrique({
  id: "type-encounters",
  nom: "Types de Prise en Charge",
  description:
    "Référentiel des types de rencontre clinique (consultation, hospitalisation, vaccination, téléconsultation…)",
  ressource: "type_encounter",
  version: "1.0.0",
});

export default briqueTypeEncounters;
