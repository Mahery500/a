/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueCompetencesHabilitations: ManifesteBrique = definirBrique({
  id: "competences-habilitations",
  nom: "Compétences & Habilitations",
  description: "Référentiels des corps médicaux et spécialités",
  ressource: "corps_medical",
  version: "1.0.0",
});

export default briqueCompetencesHabilitations;