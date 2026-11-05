/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Entrée telle qu'envoyée au backend pour Create{Acte,Diagnostic}DefinitionInput.
 * Le backend exige au moins une habilitation par acte/diagnostic.
 */
export interface HabilitationInput {
  corpsMedicalCode: string;
  specialiteCode?: string | null;
}

/**
 * Entrée telle que renvoyée par ActeDefinitionOutput / DiagnosticDefinitionOutput.
 * `actif` = état de l'habilitation (pas du corps médical).
 */
export interface Habilitation extends HabilitationInput {
  corpsMedicalLibelle?: string;
  specialiteLibelle?: string;
  actif?: boolean;
}

/** Référentiel exposé par GET /corps_medicaux. */
export interface CorpsMedicalOption {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
}

/** Référentiel exposé par GET /specialites. */
export interface SpecialiteOption {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
}