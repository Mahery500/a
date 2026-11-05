/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FileAttenteItemApi {
  position: number;
  aiguillageId: number;
  ticketId: number;
  numTicket: string;
  patientId: number;
  type: "RDV" | "WALK_IN";
  dateAiguillage: string;
  attenteMinutes: number;
  appele?: boolean;
  appelExpire?: boolean;
  dateAppel?: string | null;
}

export interface PatientEnCoursApi {
  enCours: boolean;
  aiguillageId: number | null;
  encounterId: number | null;
  ticketId: number | null;
  numTicket: string | null;
  patientId: number | null;
  debut: string | null;
  dureeMinutes: number | null;
}

export interface PriseEnChargeApi {
  aiguillageId: number;
  ticketId: number;
  numTicket: string;
  patientId: number;
  serviceId: number;
  encounterId: number;
}

export interface PatientDetailsApi {
  id?: number;
  Id_Patient?: number;
  nom?: string;
  Nom?: string;
  prenom?: string;
  Prenom?: string;
  matricule?: string;
  Matricule?: string;
  gs?: string;
  GS?: string;
}

export interface AppelerPatientApiOutput {
  aiguillageId: number;
  ticketId: number;
  numTicket: string;
  patientId: number;
  serviceId: number;
  dateAppel: string;
  dateExpirationAppel: string;
  appelExpire: boolean;
}

export interface RendezVousDuJourApi {
  id: number;
  heure: string;
  patientId: number;
  statut: string;
  etat: "PAS_ENCORE_ARRIVE" | "ARRIVE" | "EN_ATTENTE" | "EN_COURS" | "TERMINE";
  motif?: string | null;
  numTicket?: string | null;
  encounterId?: number | null;
}