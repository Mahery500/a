/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueInfirmerieFile: ManifesteBrique = definirBrique({
  id: "infirmerie-file",
  nom: "File d'Attente Infirmerie",
  description:
    "Suivi de la file d'attente du poste de soins, tableau de bord des rendez-vous et prise en charge des patients",
  ressource: "infirmerie_file",
  version: "1.0.0",
});
