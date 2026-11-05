/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueAuthentification: ManifesteBrique = definirBrique({
  id: "authentification",
  nom: "Authentification & Portail",
  description: "Écran de connexion JWT et gestion de la session utilisateur",
  ressource: "auth",
  version: "1.0.0",
});

export default briqueAuthentification;
