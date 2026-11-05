/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TypeDiagnostic = "principal" | "secondaire";
export type StatutDiagnostic = "provisoire" | "confirme" | "infirme";

export interface CodificationItem {
  codeSystem: string;
  code: string;
}

export interface DiagnosticMedical {
  id: number;
  encounterId: number;
  staffId: number;
  diagnosticDefinitionId: number;
  code: string;
  libelle: string;
  codifications: CodificationItem[];
  type: TypeDiagnostic;
  statut: StatutDiagnostic;
  dateDiagnostic: string;
  commentaire: string | null;
}

export interface DiagnosticDefinitionItem {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
  codifications: CodificationItem[];
  description?: string | null;
  chapitre?: string | null;
}

export interface NouveauDiagnosticInput {
  encounterId: number;
  diagnosticDefinitionId: number;
  code?: string | null;
  libelle?: string;
  type?: TypeDiagnostic;
  statut?: StatutDiagnostic;
  dateDiagnostic?: string;
  commentaire?: string | null;
}

export interface ObservationActeItem {
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
}

export interface ResultatActeItem {
  id: number;
  type: string;
  interpretation?: string | null;
  conclusion?: string | null;
  dateValidation?: string | null;
  observations?: ObservationActeItem[];
}

export interface ActePrescritItem {
  id: number;
  encounterId: number;
  acteDefinitionId: number;
  code: string;
  libelle: string;
  statut: string;
  commentaire: string | null;
  dateRealisation: string;
  observations: ObservationActeItem[];
  resultats: ResultatActeItem[];
}

export interface EnregistrerActeEncounterInput {
  encounterId: number;
  acteDefinitionId: number;
  statut?: "realise" | "en_cours" | "planifie";
  commentaire?: string | null;
  dateRealisation?: string;
}

export interface PrescriptionActeInput {
  encounterId: number;
  acteDefinitionId: number;
  statut?: "planifie" | "en_cours" | "realise";
  commentaire?: string | null;
}

export interface AjouterResultatActeInput {
  acteRealiseId: number;
  type: string;
  interpretation?: string | null;
  conclusion?: string | null;
}

export interface AjouterObservationActeInput {
  acteRealiseId: number;
  observationDefinitionId: number;
  valeur: string;
  interpretation?: string | null;
}

export interface ExamenCliniqueInput {
  encounterId: number;
  ta?: string;
  temp?: string;
  fc?: string;
  spo2?: string;
  poids?: string;
  noteClinique?: string;
}

export type PrioriteDemande = "NORMALE" | "URGENTE" | "TRES_URGENTE";

export interface DemandeActeInput {
  encounterId: number;
  patientId?: number;
  acteDefinitionId: number;
  priorite?: PrioriteDemande;
  urgente?: boolean;
  serviceId?: number;
  commentaire?: string | null;
}

export interface DemandeActeItem {
  id: number;
  demandeId?: number;
  encounterId: number;
  patientId?: number;
  acteDefinitionId: number;
  acteDefinitionCode?: string;
  acteDefinitionLibelle: string;
  priorite: string;
  urgente: boolean;
  serviceId?: number;
  serviceNom?: string;
  statut?: string;
  commentaire: string | null;
  dateDemande: string;
}

// ---------- Pièces jointes ----------

export type TypePieceJointe = "compte_rendu" | "image" | "scan" | "autre";

export interface PieceJointeItem {
  id: number;
  nomFichier: string;
  contentType: string;
  taille: number;
  typePieceJointe: TypePieceJointe;
  statut: "actif" | "saisi_par_erreur";
  dateUpload: string;
}

/** Ressource côté UI pour une PJ à uploader. */
export interface NouvellePieceJointe {
  fichier: File;
  typePieceJointe: TypePieceJointe;
}

// ---------- Acte externe ----------

export interface ObservationResultatInput {
  observationDefinitionId: number;
  valeur: string;
  uniteId?: number | null;
  interpretation?: string | null;
}

export interface NouvelActeExterneInput {
  encounterId: number;
  acteDefinitionId: number;
  /** Date réelle à laquelle l'acte a été réalisé à l'extérieur (ISO). */
  dateRealisation: string;
  resultat: {
    type: string;
    interpretation?: string | null;
    conclusion?: string | null;
  };
  observations?: ObservationResultatInput[];
  piecesJointes?: NouvellePieceJointe[];
}

/* ---------- Moule d'observations d'un acte ---------- */

export type TypeValeurObservation = "numerique" | "texte";

export interface ChampMouleObservation {
  ordre: number;
  obligatoire: boolean;
  observation: {
    id: number;
    code: string;
    libelle: string;
    typeValeur: TypeValeurObservation;   // ← union stricte préservée
    actif: boolean;
    uniteId: number | null;
    uniteCode: string | null;
    uniteLibelle: string | null;
  };
}

export const LIBELLES_TYPE_PIECE_JOINTE: Record<TypePieceJointe, string> = {
  compte_rendu: "Compte-rendu",
  image: "Image",
  scan: "Scan",
  autre: "Autre",
};

export const ORDRE_TYPES_PIECE_JOINTE: TypePieceJointe[] = [
  "compte_rendu",
  "image",
  "scan",
  "autre",
];