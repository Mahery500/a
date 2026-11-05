/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueConsultationActive: ManifesteBrique = definirBrique({
  id: "consultation-active",
  nom: "Consultation Active",
  description:
    "Examen clinique médical, diagnostics CIM-10, prescriptions et clôture de consultation",
  ressource: "consultation_active",
  version: "1.0.0",
});


