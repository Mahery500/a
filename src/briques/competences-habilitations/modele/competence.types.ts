/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SousVueCompetence = "corps_medicaux" | "specialites";

/** Élément de référentiel (corps médical ou spécialité) côté UI. */
export interface CompetenceItem {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
}

export interface NouvelleCompetenceInput {
  code: string;
  libelle: string;
}

export interface ModificationCompetenceInput {
  libelle?: string;
  /** Optionnel : si absent, l'état courant est conservé. */
  actif?: boolean;
}