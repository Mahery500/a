/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatutRendezVous = "PLANIFIE" | "CONFIRME" | "HONORE" | "ANNULE" | "ABSENT";

export interface RendezVous {
  id: number;
  dateRdv: string;
  dateAffichee: string;
  heureAffichee: string;
  statut: StatutRendezVous;
  commentaire: string | null;
  patientId: number;
  patientNom?: string;
  patientMatricule?: string;
  encounterId: number | null;
  actionnable: boolean;
  estAujourdHui: boolean;
}

export interface NouveauRendezVousInput {
  patientId: number;
  dateRdv: string; // YYYY-MM-DD
  heureRdv: string; // HH:mm
  commentaire?: string;
  agendaId?: number;
}

export interface ConfirmationArriveeInput {
  rendezVousId: number;
  siteId: number;
  premierServiceId: number;
}

export interface PatientOption {
  id: number;
  nomComplet: string;
  matricule: string;
}

export interface ServiceOption {
  id: number;
  nom: string;
}

export interface PraticienOption {
  id: number;
  nomComplet: string;
  specialite?: string;
}

export interface RendezVousFiltres {
  recherche: string;
  statut: StatutRendezVous | "TOUS";
  filtreDate: "tous" | "aujourd_hui" | "a_venir" | "passes";
}
