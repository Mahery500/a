/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatutAiguillage = "EN_ATTENTE" | "EN_COURS" | "TERMINE";

export interface TicketAiguillage {
  id: number;
  ticketId: number;
  numTicket: string;
  patientId: number;
  patientNom?: string;
  patientMatricule?: string;
  serviceId: number;
  serviceNom: string;
  statut: StatutAiguillage;
  dateAiguillage: string;
  heureAffichee: string;
  dureeAttenteMinutes: number;
}

export interface NouveauTicketInput {
  patientId: number;
  premierServiceId: number;
  siteId: number;
  rendezVousId?: number | null;
}

export interface TicketEmisResultat {
  id: number;
  numTicket: string;
  statut: string;
  dateEmission: string;
  estAssocieAUnRendezVous: boolean;
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

export interface StatistiquesFile {
  totalEnAttente: number;
  totalEnCours: number;
}
