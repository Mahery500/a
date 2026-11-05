/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueVerificationAdherents: ManifesteBrique = definirBrique({
  id: "verification-adherents",
  nom: "Vérification Adhérents",
  description:
    "Contrôle d'éligibilité, CNAPS, entreprise conventionnée, rendez-vous du jour et carte d'adhérent",
  ressource: "verification_adherent",
  version: "1.0.0",
});
