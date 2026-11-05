/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientDossierResume {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  groupeSanguin?: string;
  telephone?: string;
  sexe?: string;
  dateNaissance?: string;
  entrepriseNom?: string;
}

export interface ObservationDossier {
  id: number;
  code: string;
  valeur: string;
  unite: string | null;
  interpretation: string | null;
}

export interface DiagnosticDossier {
  id: number;
  code: string | null;
  libelle: string;
  type: string;
  statut: string;
  commentaire: string | null;
  dateDiagnostic: string;
}

export interface ActeDossier {
  id: number;
  code: string;
  libelle: string;
  statut: string;
  dateRealisation: string;
  observations: ObservationDossier[];
}

export interface EncounterHistoriqueItem {
  id: number;
  dateDebut: string;
  dateFin: string | null;
  serviceId: number;
  siteId: number;
  statut: string;
  diagnostics: DiagnosticDossier[];
  actes: ActeDossier[];
}
