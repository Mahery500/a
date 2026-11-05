/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueRendezVous: ManifesteBrique = definirBrique({
  id: "rendez-vous",
  nom: "Rendez-Vous",
  description: "Planning, prise de rendez-vous, confirmation de présence et annulation",
  ressource: "rendez_vous",
  version: "1.0.0",
});
