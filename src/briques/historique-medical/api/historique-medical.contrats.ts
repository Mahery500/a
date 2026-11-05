/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Miroir de GET /api/patients/{id}/historique_medical (HistoriqueMedicalPatientOutput)

export interface ObservationHistoriqueApi {
  id: number;
  observationDefinitionId: number;
  code: string;
  libelle: string;
  typeValeur: string;
  valeur: string;
  uniteId: number | null;
  uniteCode: string | null;
  uniteLibelle: string | null;
  interpretation: string | null;
  dateObservation: string;
  /** preliminaire | final | corrige | saisi_par_erreur */
  statut: string;
  commentaire: string | null;
  staffId: number | null;
}

export interface PieceJointeHistoriqueApi {
  id: number;
  nomFichier: string;
  contentType: string;
  taille: number;
  typePieceJointe: string;
  statut: string;
  dateUpload: string;
}

export interface ResultatHistoriqueApi {
  id: number;
  type: string;
  interpretation: string | null;
  conclusion: string | null;
  dateValidation: string | null;
  acteRealiseId: number | null;
  patientId: number;
  observations: ObservationHistoriqueApi[];
  piecesJointes: PieceJointeHistoriqueApi[];
}

export interface ActeHistoriqueApi {
  id: number;
  encounterId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  staffId: number;
  dateRealisation: string;
  /** planifie | en_cours | realise | annule | saisi_par_erreur */
  statut: string;
  commentaire: string | null;
  ligneDemandeId: number | null;
  observations: ObservationHistoriqueApi[];
  resultats: ResultatHistoriqueApi[];
}

export interface DiagnosticHistoriqueApi {
  id: number;
  encounterId: number;
  staffId: number;
  diagnosticDefinitionId: number;
  code: string;
  libelle: string;
  codifications: { codeSystem: string; code: string }[];
  /** provisoire | confirme | infirme */
  statut: string;
  dateDiagnostic: string;
  commentaire: string | null;
}

export interface EncounterHistoriqueApi {
  id: number;
  patientId: number;
  serviceId: number;
  siteId: number;
  typeEncounterId: number;
  typeEncounterCode: string;
  typeEncounterLibelle: string;
  dateDebut: string;
  dateFin: string | null;
  /** planifie | en_cours | termine | annule */
  statut: string;
}

export interface HistoriqueEncounterApiOutput {
  encounter: EncounterHistoriqueApi;
  actes: ActeHistoriqueApi[];
  diagnostics: DiagnosticHistoriqueApi[];
  constats: ObservationHistoriqueApi[];
}

export interface HistoriqueMedicalPatientApiOutput {
  patientId: number;
  page: number;
  limit: number;
  total: number;
  encounters: HistoriqueEncounterApiOutput[];
  resultatsExternes: ResultatHistoriqueApi[];
}