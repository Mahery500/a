/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TypeAdmission = "RDV" | "SANS_RDV";

export interface PatientFileMedecin {
  position: number;
  aiguillageId: number;
  ticketId: number;
  numTicket: string;
  patientId: number;
  patientNom: string;
  matricule?: string;
  groupeSanguin?: string;
  type: TypeAdmission;
  dateAiguillage: string;
  attenteMinutes: number;
  appele: boolean;
  appelExpire: boolean;
  dateAppel?: string | null;
}

export interface ConsultationEnCours {
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

export type EtatRdvDuJour =
  | "PAS_ENCORE_ARRIVE"
  | "ARRIVE"
  | "EN_ATTENTE"
  | "EN_COURS"
  | "TERMINE";

export interface RendezVousDuJourMedecin {
  id: number;
  heure: string;
  patientId: number;
  patientNom: string;
  motif: string;
  statut: string;
  etat: EtatRdvDuJour;
  numTicket?: string | null;
  encounterId?: number | null;
}