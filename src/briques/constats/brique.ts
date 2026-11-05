/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueConstats: ManifesteBrique = definirBrique({
  id: "constats",
  nom: "Constats Cliniques",
  description:
    "Observations faites par le soignant pendant la prise en charge, sans acte (signes cliniques, examen physique)",
  ressource: "constat",
  version: "1.0.0",
});

export default briqueConstats;