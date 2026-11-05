/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briquePatients: ManifesteBrique = definirBrique({
  id: "patients",
  nom: "Patients & Dossiers Administratifs",
  description:
    "Identification des patients, recherche multicritères, complétion de fiche et import de salariés",
  ressource: "patient",
  version: "1.0.0",
});

export default briquePatients;
