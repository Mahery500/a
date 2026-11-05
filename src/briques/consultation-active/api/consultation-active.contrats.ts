/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DiagnosticApiOutput {
  id: number;
  encounterId: number;
  staffId: number;
  diagnosticDefinitionId: number;
  code: string;
  libelle: string;
  codifications?: { codeSystem: string; code: string }[];
  statut: string;
  dateDiagnostic: string;
  commentaire: string | null;
  type?: string;
}

export interface CreateDiagnosticApiInput {
  encounterId: number;
  diagnosticDefinitionId: number;
  statut?: "provisoire" | "confirme" | "infirme";
  dateDiagnostic?: string;
  commentaire?: string | null;
}

export interface DiagnosticDefinitionRefApiOutput {
  id: number;
  code: string;
  libelle?: string;
  nom?: string;
  name?: string;
  actif?: boolean;
  isActive?: boolean;
  codifications?: { codeSystem: string; code: string }[];
  description?: string | null;
  chapitre?: string | null;
}

export interface ActeRealiseApiOutput {
  id: number;
  encounterId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  staffId: number;
  dateRealisation: string;
  statut: string;
  commentaire: string | null;
  ligneDemandeId?: number | null;
  observations?: {
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
  resultats?: {
    id: number;
    type: string;
    conclusion?: string | null;
    interpretation?: string | null;
    dateValidation?: string | null;
    observations?: {
      id: number;
      observationDefinitionId?: number;
      code: string;
      libelle?: string;
      typeValeur?: string;
      valeur: string;
      uniteCode?: string | null;
      interpretation?: string | null;
      dateObservation?: string;
      statut?: string;
    }[];
  }[];
}

export interface ActeDefinitionApiOutput {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
  categorie?: { id: number; code: string; libelle: string };
  rolesAutorises?: string[];
  typeServiceIds?: number[];
}

export interface CreateActeRealiseApiInput {
  encounterId: number;
  acteDefinitionId: number;
  statut?: "planifie" | "en_cours" | "realise";
  commentaire?: string | null;
  dateRealisation?: string;
  ligneDemandeId?: number | null;
}

export interface AddObservationApiInput {
  observationDefinitionId?: number;
  code?: string;
  valeur: string;
  unite?: string | null;
  interpretation?: string | null;
}

export interface AddResultatActeApiInput {
  type: string;
  interpretation?: string | null;
  conclusion?: string | null;
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

export interface DemandeActeApiInput {
  encounterId: number;
  lignes: {
    acteDefinitionId: number;
    serviceId?: number;
    priorite?: "normale" | "urgente";
    commentaire?: string | null;
  }[];
}

export interface DemandeActeApiOutput {
  id: number;
  encounterId: number;
  staffId: number;
  dateDemande: string;
  lignes: {
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
  }[];
}

// ---------- Observations sur un résultat ----------

export interface AddObservationResultatApiInput {
  observationDefinitionId: number;
  valeur: string;
  /** Unité alternative (externe uniquement — acteRealise null). */
  uniteId?: number | null;
  interpretation?: string | null;
}

// ---------- Pièces jointes ----------

export interface PieceJointeApiOutput {
  id: number;
  resultatActeId: number;
  nomFichier: string;
  contentType: string;
  taille: number;
  hash: string;
  typePieceJointe: "compte_rendu" | "image" | "scan" | "autre";
  statut: "actif" | "saisi_par_erreur";
  dateUpload: string;
}

export interface ChangePieceJointeStatutApiInput {
  statut: "actif" | "saisi_par_erreur";
}
