/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatutEligibilite = "ELIGIBLE" | "NON_ELIGIBLE" | "EN_ATTENTE";

export type TypeAffiliation = "Agent" | "Conjoint" | "Enfant" | "Indépendant" | "Autre";

export interface AdherentPatient {
  id: number;
  matricule?: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  groupeSanguin?: string;
  nir?: string;
}

export interface AdherentAffiliation {
  statut: TypeAffiliation;
  nomEntreprise?: string;
  idEntreprise?: number;
  cnaps?: string;
  matriculeAgent?: string;
  actif: boolean;
  dateValidite?: string;
}

export interface AdherentEligibilite {
  statut: StatutEligibilite;
  label: string;
  droitsOuverts: boolean;
  motif?: string;
  conventionActive: boolean;
}

export interface AdherentComplet {
  patient: AdherentPatient;
  affiliation: AdherentAffiliation;
  eligibilite: AdherentEligibilite;
}

export interface RendezVousDuJour {
  id: number;
  dateRdv: string;
  heureRdv: string;
  statut: "PLANIFIE" | "CONFIRME" | "HONORE" | "ANNULE" | "ABSENT";
  commentaire: string | null;
  actionnable: boolean;
  encounterId: number | null;
}

export interface ServiceOrientationOption {
  id: number;
  nom: string;
  codeFile: "INFIRMERIE" | "CONSULTATION" | "PHARMACIE" | "SECRETARIAT" | "APTITUDE";
  siteId?: number;
  siteName?: string;
  typeServiceId?: number;
  typeServiceName?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ResultatConfirmationArrivee {
  rendezVousId: number;
  ticketId: number;
  numTicket: string;
  dateEmission: string;
}

export interface ResultatEmissionTicket {
  ticketId: number;
  numTicket: string;
  dateEmission: string;
}

export interface OptionsCarteAdherent {
  couleurTheme: "teal" | "navy" | "emerald" | "burgundy";
  afficherQrCode: boolean;
  afficherCodeBarre: boolean;
  anneesValidite: number;
  telephoneUrgence: string;
  mentionsMedicales: string;
}
