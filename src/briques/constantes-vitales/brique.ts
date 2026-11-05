/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueConstantesVitales: ManifesteBrique = definirBrique({
  id: "constantes-vitales",
  nom: "Constantes Vitales",
  description:
    "Saisie clinique, alertes de vigilance et enregistrement des paramètres vitaux du patient",
  ressource: "constante_vitale",
  version: "1.0.0",
});
