/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatutRendezVous } from "../modele/rendez-vous.types";

export interface RendezVousApiOutput {
  id: number;
  dateRdv?: string | null;
  date_rdv?: string | null;
  creneauDebut?: string | null;
  creneau_debut?: string | null;
  creneauFin?: string | null;
  creneau_fin?: string | null;
  date?: string | null;
  statut?: StatutRendezVous | string | null;
  status?: StatutRendezVous | string | null;
  commentaire?: string | null;
  motif?: string | null;
  patient?: unknown;
  patientId?: number | null;
  idPatient?: number | null;
  Id_Patient?: number | null;
  agenda?: unknown;
  agendaId?: number | null;
  encounter?: unknown;
  encounterId?: number | null;
  ligneDemandeActe?: unknown;
  ligneDemandeActeId?: number | null;
  [cle: string]: unknown;
}

export interface ReserverRendezVousApiRequest {
  patient?: string;
  patientId: number;
  agenda?: string;
  agendaId?: number;
  creneauDebut?: string;
  creneauFin?: string;
  dateRdv?: string;
  statut?: string;
  commentaire?: string | null;
  ligneDemandeActe?: string | null;
  ligneDemandeActeId?: number | null;
}

export interface ConfirmerArriveeApiRequest {
  siteId: number;
  site?: string;
  premierServiceId: number;
  premierService?: string;
  serviceId?: number;
  service?: string;
}

export interface ConfirmerArriveeApiOutput {
  rendezVousId?: number;
  ticketId?: number;
  numTicket?: string;
  statutTicket?: string;
  dateEmissionTicket?: string;
  id?: number;
  numero?: string;
  statut?: string;
  dateEmission?: string;
  ticket?: unknown;
  rendezVous?: unknown;
  [cle: string]: unknown;
}

export interface PatientApiSummary {
  id: number;
  matricule?: string;
  nom?: string;
  prenom?: string;
  nomComplet?: string;
  lastName?: string;
  firstName?: string;
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

export interface StaffApiSummary {
  id: number;
  firstName?: string;
  lastName?: string;
  nom?: string;
  prenom?: string;
  roles?: (string | null)[];
}
