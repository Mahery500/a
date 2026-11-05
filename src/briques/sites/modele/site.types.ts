/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SiteHospitalier {
  id: number;
  code: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  actif: boolean;
  dateCreation?: string;
}

export interface NouveauSiteInput {
  code: string;
  nom: string;
  ville: string;
  adresse?: string;
  telephone?: string;
}

export interface ModificationSiteInput {
  code?: string;
  nom?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  actif?: boolean;
}
