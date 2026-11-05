/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatutActe } from "../modele/infirmerie-historique.types";

export interface HistoriqueActeApiOutput {
  id: number;
  encounterId: number;
  patientId: number;
  serviceId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  dateRealisation: string;
  statut: StatutActe;
  saisiParErreur: boolean;
  commentaire: string | null;
  observations: {
    id: number;
    code: string;
    valeur: string;
    unite: string | null;
    interpretation: string | null;
  }[];
  resultats: {
    id: number;
    type: string;
    resultat: string;
    interpretation: string | null;
  }[];
}

export interface PatientApiSummary {
  id?: number;
  nom?: string;
  Nom?: string;
  prenom?: string;
  Prenom?: string;
}
