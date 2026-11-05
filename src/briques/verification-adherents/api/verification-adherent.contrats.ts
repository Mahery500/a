/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Schémas bruts des réponses et requêtes pour les endpoints de vérification des adhérents.
 */

export interface PatientApiOutput {
  id: number;
  matricule?: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  date_naissance?: string;
  lieuNaissance?: string;
  sexe?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  groupeSanguin?: string;
  nir?: string;
  statut?: string;
  nomEntreprise?: string;
  idEntreprise?: number;
  entreprise?: { id?: number; nom?: string; name?: string } | string;
  company?: { id?: number; nom?: string; name?: string } | string;
  idAgent?: number;
  matriculeAgent?: string;
  agent?: { id?: number; matricule?: string; entreprise?: unknown; company?: unknown };
  actif?: boolean;
}

export type RendezVousStatutApi = "PLANIFIE" | "CONFIRME" | "HONORE" | "ANNULE" | "ABSENT";

export interface RendezVousApiOutput {
  id: number;
  dateRdv?: string | null;
  date_rdv?: string | null;
  creneauDebut?: string | null;
  creneau_debut?: string | null;
  date?: string | null;
  statut?: RendezVousStatutApi | string | null;
  status?: RendezVousStatutApi | string | null;
  commentaire?: string | null;
  motif?: string | null;
  patient?: unknown;
  patientId?: number | null;
  encounterId?: number | null;
  [cle: string]: unknown;
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
  ticket?: unknown;
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

export interface EmettreTicketApiOutput {
  id: number;
  numTicket?: string;
  numero?: string;
  code?: string;
  statut?: string;
  dateEmission?: string;
  estAssocieAUnRendezVous?: boolean;
  [cle: string]: unknown;
}

export interface ServiceApiOutput {
  id: number;
  siteId?: number;
  siteName?: string;
  typeServiceId?: number;
  typeServiceName?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  // Variantes / legacy
  nom?: string;
  libelle?: string;
  idSite?: number;
}

export interface EntrepriseApiOutput {
  id: number;
  nom: string;
  numeroCnaps?: string;
  adresse?: string;
  contact?: string;
}
