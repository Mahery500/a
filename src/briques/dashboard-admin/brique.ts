/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { definirBrique, ManifesteBrique } from "@/noyau/brique";

export const briqueDashboardAdmin: ManifesteBrique = definirBrique({
  id: "dashboard-admin",
  nom: "Tableau de bord administrateur",
  description:
    "Indicateurs consolidés, alertes, flux patients, activité médicale, qualité des données.",
  ressource: "dashboard_admin",
  version: "1.0.0",
});