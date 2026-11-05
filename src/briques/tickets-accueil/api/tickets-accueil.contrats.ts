/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AiguillageApiOutput {
  id: number;
  ticket?: unknown;
  ticketId?: number;
  numTicket?: string;
  patient?: unknown;
  patientId?: number;
  service?: unknown;
  serviceId?: number;
  serviceNom?: string;
  encounter?: unknown;
  encounterId?: number | null;
  statut?: string;
  termine?: boolean;
  dateAiguillage?: string;
  date?: string;
  createdAt?: string;
  [cle: string]: unknown;
}

export interface EmettreTicketApiRequest {
  siteId: number;
  site?: string;
  patientId: number;
  patient?: string;
  premierServiceId: number;
  premierService?: string;
  serviceId?: number;
  service?: string;
  rendezVousId?: number | null;
  rendezVous?: string | null;
}

export interface TicketApiOutput {
  id: number;
  numTicket?: string;
  numero?: string;
  code?: string;
  statut?: string;
  dateEmission?: string;
  createdAt?: string;
  estAssocieAUnRendezVous?: boolean;
  patient?: unknown;
  site?: unknown;
  aiguillages?: unknown[];
  [cle: string]: unknown;
}

export interface PatientApiSummary {
  id: number;
  nom?: string;
  prenom?: string;
  nomComplet?: string;
  lastName?: string;
  firstName?: string;
  matricule?: string;
}

export interface ServiceApiSummary {
  id: number;
  siteId?: number;
  siteName?: string;
  typeServiceId?: number;
  typeServiceName?: string;
  description?: string | null;
  isActive?: boolean;
  nom?: string;
  libelle?: string;
  title?: string;
  codeFile?: string;
  idSite?: number;
}
