/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueConsultationFile: ManifesteBrique = definirBrique({
  id: "consultation-file",
  nom: "File d'Attente Médecin",
  description:
    "Gestion de la salle d'attente médicale, priorisation des consultations et prise en charge",
  ressource: "consultation_file",
  version: "1.0.0",
});
