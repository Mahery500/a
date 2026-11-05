/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientFiche {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
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
  statut?: string | null; // 'Agent' | 'Conjoint' | 'Enfant' | autre
  idAgent?: number | null;
  matriculeAgent?: string | null;
}

export interface CompleterFicheInput {
  matricule?: string;
  dateN?: string;
  lieuNaissance?: string;
  adresse?: string;
  groupeSanguin?: string;
  sexe?: string;
  telephone?: string;
  email?: string;
  nir?: string;
}

export interface RattacherAgentInput {
  idPatient: number;
  idEntreprise: number;
  cnaps?: string;
  fonction?: string;
}

export interface EntrepriseOption {
  id: number;
  nom: string;
}

export function libelleAffiliationPatient(patient: PatientFiche): {
  libelle: string;
  classeCouleur: string;
} {
  if (patient.statut === "Agent") {
    return {
      libelle: "Agent Salarié",
      classeCouleur: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }
  if (patient.statut) {
    return {
      libelle: `Ayant Droit (${patient.statut})`,
      classeCouleur: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  return {
    libelle: "Patient Simple",
    classeCouleur: "bg-purple-50 text-purple-700 border-purple-200",
  };
}
