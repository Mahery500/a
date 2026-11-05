/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientApiOutput {
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
  telephone?: string;
  Telephone?: string;
  sexe?: string;
  Sexe?: string;
  dateNaissance?: string;
  Date_Naissance?: string;
  entreprise?: {
    id?: number;
    nom?: string;
    Nom?: string;
    raisonSociale?: string;
  };
}

export interface EncounterApiOutput {
  id: number;
  patientId: number;
  serviceId: number;
  siteId: number;
  dateDebut: string;
  dateFin: string | null;
  statut: string;
}

export interface DiagnosticApiOutput {
  id: number;
  encounterId: number;
  staffId: number;
  code: string | null;
  libelle: string;
  type: string;
  statut: string;
  dateDiagnostic: string;
  commentaire: string | null;
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
  observations: {
    id: number;
    code: string;
    valeur: string;
    unite: string | null;
    interpretation: string | null;
  }[];
}
