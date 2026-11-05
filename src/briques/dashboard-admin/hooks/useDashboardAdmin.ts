/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardAdminApi } from "../api/dashboard.api";
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
  SectionDashboard,
} from "../modele/dashboard.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

interface EtatChargement<T> {
  data: T | null;
  chargement: boolean;
  erreur: string | null;
}

const initial = <T>(): EtatChargement<T> => ({ data: null, chargement: false, erreur: null });

export function useDashboardAdmin() {
  const [filtres, setFiltres] = useState<DashboardFiltres>({
    periode: "jour",
    compare: false,
  });

  const [overview, setOverview] = useState<EtatChargement<DashboardOverviewResource>>(initial());
  const [alertes, setAlertes] = useState<EtatChargement<DashboardAlertesResource>>(initial());
  const [flux, setFlux] = useState<EtatChargement<DashboardFluxResource>>(initial());
  const [rdv, setRdv] = useState<EtatChargement<DashboardRdvResource>>(initial());
  const [activite, setActivite] = useState<EtatChargement<DashboardActiviteResource>>(initial());
  const [pharmacie, setPharmacie] = useState<EtatChargement<DashboardPharmacieResource>>(initial());
  const [prescriptions, setPrescriptions] = useState<EtatChargement<DashboardPrescriptionsResource>>(initial());
  const [epidemio, setEpidemio] = useState<EtatChargement<DashboardEpidemioResource>>(initial());
  const [allergies, setAllergies] = useState<EtatChargement<DashboardAllergiesResource>>(initial());
  const [population, setPopulation] = useState<EtatChargement<DashboardPopulationResource>>(initial());
  const [personnel, setPersonnel] = useState<EtatChargement<DashboardPersonnelResource>>(initial());
  const [qualite, setQualite] = useState<EtatChargement<DashboardQualiteResource>>(initial());

  const charger = useCallback(async () => {
    // On lance les appels en parallèle et on met à jour chaque bloc dès qu'il arrive
    const lancer = async <T,>(
      p: Promise<T>,
      set: React.Dispatch<React.SetStateAction<EtatChargement<T>>>,
    ) => {
      set((s) => ({ ...s, chargement: true, erreur: null }));
      try {
        const data = await p;
        set({ data, chargement: false, erreur: null });
      } catch (err) {
        set({ data: null, chargement: false, erreur: extraireMessageErreur(err) });
      }
    };

    await Promise.all([
      lancer(dashboardAdminApi.overview(filtres), setOverview),
      lancer(dashboardAdminApi.alertes(filtres), setAlertes),
      lancer(dashboardAdminApi.flux(filtres), setFlux),
      lancer(dashboardAdminApi.rendezVous(filtres), setRdv),
      lancer(dashboardAdminApi.activiteMedicale(filtres), setActivite),
      lancer(dashboardAdminApi.pharmacie(filtres), setPharmacie),
      lancer(dashboardAdminApi.prescriptions(filtres), setPrescriptions),
      lancer(dashboardAdminApi.epidemiologie(filtres), setEpidemio),
      lancer(dashboardAdminApi.allergies(filtres), setAllergies),
      lancer(dashboardAdminApi.population(filtres), setPopulation),
      lancer(dashboardAdminApi.personnel(filtres), setPersonnel),
      lancer(dashboardAdminApi.qualiteDonnees(filtres), setQualite),
    ]);
  }, [filtres]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const alertesCritiques = useMemo(
    () => (alertes.data?.alertes ?? []).filter((a) => a.niveau === "danger" && a.valeur > 0),
    [alertes.data],
  );

  return {
    filtres,
    setFiltres,
    charger,
    overview,
    alertes,
    alertesCritiques,
    flux,
    rdv,
    activite,
    pharmacie,
    prescriptions,
    epidemio,
    allergies,
    population,
    personnel,
    qualite,
  };
}