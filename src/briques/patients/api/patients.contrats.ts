/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Schémas bruts des requêtes et réponses de l'API Symfony pour /api/patients, /api/import-patients, /api/agents.
 */

export interface PatientOutputApi {
  id: string | null;
  matricule: string | null;
  nom: string | null;
  prenom: string | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  sexe?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  groupeSanguin?: string | null;
  nir?: string | null;
  idEntreprise?: number | null;
  nomEntreprise?: string | null;
  entreprise?: { id?: number; nom?: string; name?: string } | string | null;
  company?: { id?: number; nom?: string; name?: string } | string | null;
  statut?: string | null;
  statutAffiliation?: string | null;
  qualite?: string | null;
  idAgent?: number | null;
  matriculeAgent?: string | null;
  agent?: { id?: number; matricule?: string; entreprise?: unknown; company?: unknown } | null;
  // Variantes legacy & alias
  Id_Patient?: number | string;
  lastName?: string;
  firstName?: string;
  DateN?: string;
  date_naissance?: string;
  LieuN?: string;
  GS?: string;
  groupe_sanguin?: string;
  tel?: string;
  phone?: string;
  mail?: string;
  Id_Entreprise?: number | null;
  entrepriseId?: number | null;
  companyId?: number | null;
}

export interface CompleterFichePatientPayloadApi {
  matricule?: string | null;
  dateN?: string | null;
  lieuNaissance?: string | null;
  adresse?: string | null;
  groupeSanguin?: string | null;
  sexe?: string | null;
  email?: string | null;
  telephone?: string | null;
  nir?: string | null;
}

export interface CreateAgentPayloadApi {
  idPatient: number;
  idEntreprise: number;
  patientId?: number;
  entrepriseId?: number;
  patient?: string;
  entreprise?: string;
  company?: string;
  cnaps?: string | null;
  fonction?: string | null;
}

export interface AgentOutputApi {
  id: number;
  idPatient: number;
  idEntreprise: number;
  cnaps?: string | null;
  fonction?: string | null;
}
