/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TypeEncounterApiOutput {
  id: number;
  code: string;
  libelle: string;
  description: string | null;
  actif: boolean;
  /** Ajouté côté backend (TypeEncounterOutput::typeServiceIds). */
  typeServiceIds?: number[];
}

export interface CreateTypeEncounterApiInput {
  code: string;
  libelle: string;
  description?: string | null;
}

export interface UpdateTypeEncounterApiInput {
  libelle?: string;
  description?: string | null;
}

export interface DefinirTypesServiceApiInput {
  typeServiceIds: number[];
}

export interface ChangeActivationApiInput {
  actif: boolean;
}
