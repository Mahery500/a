/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { ErreurApi } from "@/noyau/http/erreurApi";
import type {
  DashboardFiltres,
  DashboardOverviewResource,
  DashboardAlertesResource,
  DashboardFluxResource,
  DashboardRdvResource,
  DashboardActiviteResource,
  DashboardPharmacieResource,
  DashboardPrescriptionsResource,
  DashboardEpidemioResource,
  DashboardAllergiesResource,
  DashboardPopulationResource,
  DashboardPersonnelResource,
  DashboardQualiteResource,
} from "../modele/dashboard.types";

/** Construit la query string commune à tous les endpoints dashboard. */
function parametres(filtres: DashboardFiltres): Record<string, string | number | boolean> {
  const p: Record<string, string | number | boolean> = {
    periode: filtres.periode,
  };
  if (filtres.du) p.du = filtres.du;
  if (filtres.au) p.au = filtres.au;
  if (filtres.siteId) p.siteId = filtres.siteId;
  if (filtres.compare) p.compare = 1;
  if (filtres.entrepriseIds && filtres.entrepriseIds.length > 0) {
    // API Platform : entrepriseIds[]=1&entrepriseIds[]=2 → on utilise une clé suffixée
    // Symfony/PHP comprend `entrepriseIds[]` ; clientHttp sérialise clé=val
    // On utilise plusieurs clés pour rester compatible.
    p["entrepriseIds"] = filtres.entrepriseIds.join(",");
  }
  return p;
}

async function appel<T>(endpoint: string, filtres: DashboardFiltres): Promise<T> {
  try {
    return await clientHttp<T>(`/dashboard/${endpoint}`, { params: parametres(filtres) });
  } catch (err) {
    if (err instanceof ErreurApi && err.statut === 404) {
      // Tolérance : si l'API renvoie 404 sans préfixe /api, clientHttp gère déjà
      throw err;
    }
    throw err;
  }
}

export const dashboardAdminApi = {
  overview: (f: DashboardFiltres) =>
    appel<DashboardOverviewResource>("overview", f),
  alertes: (f: DashboardFiltres) =>
    appel<DashboardAlertesResource>("alertes", f),
  flux: (f: DashboardFiltres) =>
    appel<DashboardFluxResource>("flux", f),
  rendezVous: (f: DashboardFiltres) =>
    appel<DashboardRdvResource>("rendez-vous", f),
  activiteMedicale: (f: DashboardFiltres) =>
    appel<DashboardActiviteResource>("activite-medicale", f),
  pharmacie: (f: DashboardFiltres) =>
    appel<DashboardPharmacieResource>("pharmacie", f),
  prescriptions: (f: DashboardFiltres) =>
    appel<DashboardPrescriptionsResource>("prescriptions", f),
  epidemiologie: (f: DashboardFiltres) =>
    appel<DashboardEpidemioResource>("epidemiologie", f),
  allergies: (f: DashboardFiltres) =>
    appel<DashboardAllergiesResource>("allergies", f),
  population: (f: DashboardFiltres) =>
    appel<DashboardPopulationResource>("population", f),
  personnel: (f: DashboardFiltres) =>
    appel<DashboardPersonnelResource>("personnel", f),
  qualiteDonnees: (f: DashboardFiltres) =>
    appel<DashboardQualiteResource>("qualite-donnees", f),
};

/** Construit l'URL d'export CSV (respecte les mêmes filtres). */
export function urlExportCsv(section: string, filtres: DashboardFiltres): string {
  const base = (import.meta.env?.VITE_API_URL as string | undefined) || "http://localhost:8000/api";
  const params = new URLSearchParams();
  params.set("periode", filtres.periode);
  if (filtres.du) params.set("du", filtres.du);
  if (filtres.au) params.set("au", filtres.au);
  if (filtres.siteId) params.set("siteId", String(filtres.siteId));
  if (filtres.compare) params.set("compare", "1");
  (filtres.entrepriseIds ?? []).forEach((id) =>
    params.append("entrepriseIds[]", String(id)),
  );
  return `${base}/dashboard/${section}/export.csv?${params.toString()}`;
}