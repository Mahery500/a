/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueTicketsAccueil: ManifesteBrique = definirBrique({
  id: "tickets-accueil",
  nom: "Tickets & File d'Attente Accueil",
  description:
    "Émission de tickets de file d'attente, suivi des aiguillages par service et appel sonore au guichet",
  ressource: "ticket_file",
  version: "1.0.0",
});
