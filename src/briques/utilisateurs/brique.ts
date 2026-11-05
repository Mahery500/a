/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueUtilisateurs: ManifesteBrique = definirBrique({
  id: "utilisateurs",
  nom: "Utilisateurs & Accès",
  description: "Gestion des comptes applicatifs, attribution des rôles et contrôle d’activation",
  ressource: "utilisateur",
  version: "1.0.0",
});

export default briqueUtilisateurs;
