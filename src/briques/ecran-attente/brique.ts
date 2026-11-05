/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueEcranAttente: ManifesteBrique = definirBrique({
  id: "ecran-attente",
  nom: "Écran Salle d'Attente",
  description:
    "Affichage grand écran autonome des tickets appelés et en cours pour la salle d'attente",
  ressource: "ticket_file",
  version: "1.0.0",
});
