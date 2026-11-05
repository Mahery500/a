/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueDiagnosticDefinitions: ManifesteBrique = definirBrique({
  id: "diagnostic-definitions",
  nom: "Définitions de Diagnostics",
  description:
    "Nomenclature et référentiel nosologique des diagnostics médicaux, classification CIM-10 et codifications",
  ressource: "diagnostic_definition",
  version: "1.0.0",
});

export default briqueDiagnosticDefinitions;
