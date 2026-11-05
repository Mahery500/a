/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatutActe = "planifie" | "en_cours" | "realise" | "annule" | "saisi_par_erreur";

export interface ObservationHistorique {
  id: number;
  code: string;
  valeur: string;
  unite: string | null;
  interpretation: string | null;
}

export interface ResultatHistorique {
  id: number;
  type: string;
  resultat: string;
  interpretation: string | null;
}

export interface ActeHistorique {
  id: number;
  encounterId: number;
  patientId: number;
  patientNom: string;
  serviceId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  dateRealisation: string;
  statut: StatutActe;
  saisiParErreur: boolean;
  commentaire: string | null;
  observations: ObservationHistorique[];
  resultats: ResultatHistorique[];
}

export interface FiltresHistorique {
  patientId?: number;
  du?: string;
  au?: string;
}
