/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatutActe = "planifie" | "en_cours" | "realise" | "annule" | "saisi_par_erreur";

export const LIBELLES_STATUT_ACTE: Record<StatutActe, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  realise: "Réalisé",
  annule: "Annulé",
  saisi_par_erreur: "Saisi par erreur",
};

export const TRANSITIONS_AUTORISEES: Record<StatutActe, StatutActe[]> = {
  planifie: ["en_cours", "annule", "saisi_par_erreur"],
  en_cours: ["realise", "annule", "saisi_par_erreur"],
  realise: ["saisi_par_erreur"],
  annule: [],
  saisi_par_erreur: [],
};

export interface ResultatActeItem {
  id: number;
  type: string;
  conclusion?: string | null;
  resultat?: string;
  interpretation?: string | null;
  dateValidation?: string | null;
}

export interface ObservationActeItem {
  id: number;
  observationDefinitionId?: number;
  code: string;
  libelle?: string;
  typeValeur?: string;
  valeur: string;
  unite?: string | null;
  uniteCode?: string | null;
  interpretation?: string | null;
  dateObservation?: string;
  statut?: string;
}

export interface ActeSaisiItem {
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
  observations: ObservationActeItem[];
  resultats: ResultatActeItem[];
}

export interface ActeDemandeItem {
  id: number;
  demandeId: number;
  encounterId: number;
  patientId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  priorite: string;
  urgente: boolean;
  commentaire: string | null;
  dateDemande: string;
}

export interface DefinitionActeCatalogue {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
  categorieId?: number;
  estSoinInfirmier?: boolean;
}

export interface SaisieNouveauSoin {
  encounterId: number;
  acteDefinitionId: number;
  statut: StatutActe;
  commentaire?: string | null;
  ligneDemandeId?: number | null;
}
