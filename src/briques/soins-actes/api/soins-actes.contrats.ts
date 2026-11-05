/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatutActe } from "../modele/soin-acte.types";

export interface ActeRealiseApiOutput {
  id: number;
  encounterId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  staffId: number;
  dateRealisation: string;
  statut: StatutActe;
  commentaire: string | null;
  ligneDemandeId: number | null;
  observations: {
    id: number;
    observationDefinitionId?: number;
    code: string;
    libelle?: string;
    typeValeur?: string;
    valeur: string;
    unite?: string | null;
    uniteCode?: string | null;
    interpretation: string | null;
    dateObservation?: string;
    statut?: string;
  }[];
  resultats: {
    id: number;
    type: string;
    conclusion?: string | null;
    resultat?: string;
    interpretation: string | null;
    dateValidation?: string | null;
  }[];
}

export interface LigneDemandeApiOutput {
  id: number;
  demandeId: number;
  encounterId: number;
  patientId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  serviceId: number;
  priorite: string;
  urgente: boolean;
  commentaire: string | null;
  dateDemande: string;
}

export interface ActeDefinitionApiOutput {
  id: number;
  code: string;
  libelle: string;
  actif?: boolean;
  isActive?: boolean;
  categorieId?: number;
  categorie?: { id: number; code?: string; libelle?: string } | number | string;
  rolesAutorises?: string[];
  typeServiceIds?: number[];
}

export interface SaisieActeApiInput {
  encounterId: number;
  acteDefinitionId: number;
  statut: StatutActe;
  commentaire?: string | null;
  ligneDemandeId?: number | null;
}

export interface AddObservationApiInput {
  observationDefinitionId: number;
  valeur: string;
  interpretation?: string | null;
}

export interface AddResultatApiInput {
  type: string;
  conclusion?: string | null;
  interpretation?: string | null;
}

export interface EncounterTermineApiOutput {
  id: number;
  patientId: number;
  serviceId: number;
  siteId: number;
  dateDebut: string;
  dateFin: string | null;
  statut: string;
}

export interface OrienterPatientApiInput {
  serviceId: number;
}
