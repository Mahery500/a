/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueSoinsActes: ManifesteBrique = definirBrique({
  id: "soins-actes",
  nom: "Réalisation d’Actes & Soins",
  description:
    "Exécution des actes demandés, saisie libre de soins, gestion des résultats et clôture de consultation",
  ressource: "soin_acte",
  version: "1.0.0",
});
