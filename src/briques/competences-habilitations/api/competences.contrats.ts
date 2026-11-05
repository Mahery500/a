/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Réponse brute de GET /{corps_medicaux,specialites} et de leur POST/PATCH. */
export interface CompetenceApiOutput {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
  actif?: boolean;
}

export interface CreateCompetenceApiInput {
  code: string;
  libelle: string;
}

/**
 * `actif` est OBLIGATOIRE dans ce payload :
 * - le DTO backend n'accepte pas `actif: null`,
 * - un PATCH sans `actif` réactive la ressource (défaut `true` sur le DTO).
 * Le mapper garantit qu'on envoie toujours la valeur courante ou la nouvelle.
 */
export interface UpdateCompetenceApiInput {
  libelle: string;
  actif: boolean;
}