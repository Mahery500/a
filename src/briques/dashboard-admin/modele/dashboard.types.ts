/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PeriodeDashboard = "jour" | "7j" | "30j" | "90j" | "annee" | "custom";

export interface DashboardFiltres {
  periode: PeriodeDashboard;
  du?: string;
  au?: string;
  siteId?: number | null;
  entrepriseIds?: number[];
  compare?: boolean;
}

export type NiveauAlerte = "info" | "warning" | "danger";

export interface AlerteItem {
  nom: string;
  valeur: number;
  niveau: NiveauAlerte;
}

export interface PointNomValeur {
  nom: string;
  valeur: number;
}

export interface PointHeure {
  heure: string;
  tickets: number;
  rdv: number;
}

export interface PointHeatmap {
  jour: string;
  heure: string;
  tickets: number;
}

// ─── Section API resources ─────────────────────────────────────
export interface DashboardOverviewResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  evolution: Array<{
    jour: string;
    patients: number;
    rdv: number;
    consultations: number;
    ordonnances: number;
  }>;
}

export interface DashboardAlertesResource {
  id: string;
  alertes: AlerteItem[];
  total: number;
}

export interface DashboardFluxResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  affluenceParHeure: PointHeure[];
  heatmap: PointHeatmap[];
  repartition: PointNomValeur[];
}

export interface DashboardRdvResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  rdvParStatut: PointNomValeur[];
  demandesEnAttenteParSpecialite: PointNomValeur[];
  delaiDemandeRdvParJour: Array<{ jour: string; delaiMoyenHeures: number }>;
}

export interface DashboardActiviteResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  topActes: PointNomValeur[];
  activiteParMedecin: PointNomValeur[];
  evolution: Array<{ jour: string; encounters: number; actes: number }>;
}

export interface PeremptionProche {
  numLot: string;
  produit: string;
  datePeremption: string;
  stock: number;
  joursRestants: number;
}

export interface DashboardPharmacieResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  topMedicaments: PointNomValeur[];
  peremptionsProches: PeremptionProche[];
}

export interface DashboardPrescriptionsResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  evolution: Array<{ jour: string; creees: number; dispensees: number; annulees: number }>;
}

export interface Cim10Item {
  codeCim10: string;
  libelle: string;
  valeur: number;
}

export interface DashboardEpidemioResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  topCim10: Cim10Item[];
  parTrancheAge: PointNomValeur[];
  parSexe: PointNomValeur[];
}

export interface DashboardAllergiesResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  parCategorie: PointNomValeur[];
}

export interface TranchePyramide {
  tranche: string;
  hommes: number;
  femmes: number;
  nonRenseigne: number;
}

export interface DashboardPopulationResource {
  id: string;
  kpis: Record<string, number>;
  pyramideAges: TranchePyramide[];
  parSexe: PointNomValeur[];
  parGroupeSanguin: PointNomValeur[];
}

export interface DashboardPersonnelResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
  chargeParStaff: PointNomValeur[];
}

export interface DashboardQualiteResource {
  id: string;
  kpis: Record<string, number>;
  comparaison?: Record<string, number> | null;
}

// ─── Catalogue des onglets ────────────────────────────────────
export type SectionDashboard =
  | "overview"
  | "flux"
  | "rendez-vous"
  | "activite-medicale"
  | "pharmacie"
  | "prescriptions"
  | "epidemiologie"
  | "allergies"
  | "population"
  | "personnel"
  | "qualite-donnees";

export interface DefinitionSection {
  id: SectionDashboard;
  libelle: string;
  description: string;
  /** URL d'export CSV pour cette section */
  exportPath: string;
}