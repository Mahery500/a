/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueEntreprises: ManifesteBrique = definirBrique({
  id: "entreprises",
  nom: "Entreprises Partenaires",
  description: "Gestion des entreprises partenaires sous convention médicale ASINA",
  ressource: "entreprise",
  version: "1.0.0",
});

export default briqueEntreprises;
