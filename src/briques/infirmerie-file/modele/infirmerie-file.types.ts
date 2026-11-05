/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TypeAdmission = "RDV" | "SANS_RDV";

export type EtatRendezVous = "PAS_ENCORE_ARRIVE" | "ARRIVE" | "EN_ATTENTE" | "EN_COURS" | "TERMINE";

export interface PatientFileAttente {
  position: number;
  aiguillageId: number;
  ticketId: number;
  numTicket: string;
  patientId: number;
  patientNom: string;
  type: TypeAdmission;
  dateAiguillage: string;
  attenteMinutes: number;
  appele: boolean;
  appelExpire: boolean;
  dateAppel?: string | null;
}

export interface PatientEnCours {
  enCours: boolean;
  aiguillageId: number | null;
  encounterId: number | null;
  ticketId: number | null;
  numTicket: string | null;
  patientId: number | null;
  patientNom: string | null;
  debut: string | null;
  dureeMinutes: number | null;
}

export interface RendezVousDuJour {
  id: number;
  heure: string;
  patientId: number;
  patientNom: string;
  statut: string;
  etat: EtatRendezVous;
}

export interface ActeAFaire {
  id: number;
  demandeId: number;
  encounterId: number;
  patientId: number;
  patientNom: string;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  urgente: boolean;
  priorite: string;
  commentaire: string | null;
  dateDemande: string;
}

export interface PriseEnChargeResultat {
  aiguillageId: number;
  ticketId: number;
  numTicket: string;
  patientId: number;
  encounterId: number;
}

export interface TableauDeBordInfirmier {
  fileAttente: PatientFileAttente[];
  patientEnCours: PatientEnCours | null;
  prochainPatient: PatientFileAttente | null;
  rendezVous: RendezVousDuJour[];
  rdvArrives: number;
  actesAFaire: ActeAFaire[];
  actesUrgents: ActeAFaire[];
}
