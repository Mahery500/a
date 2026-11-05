/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TypeEncounter {
  id: number;
  code: string;
  libelle: string;
  description: string | null;
  actif: boolean;
  /**
   * Types de service dans lesquels ce type de prise en charge est autorisé.
   * Vide = autorisé nulle part (le backend refuse l'encounter dans ce cas).
   */
  typeServiceIds: number[];
}

export interface NouveauTypeEncounterInput {
  code: string;
  libelle: string;
  description?: string | null;
}

export interface ModificationTypeEncounterInput {
  libelle?: string;
  description?: string | null;
}
