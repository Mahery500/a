/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FamilleResourceApi {
  id: number | null;
  libelle: string;
}

export interface PrincipeActifResourceApi {
  id: number | null;
  libelle: string;
}

export interface PresentationResourceApi {
  id: number | null;
  libelle: string;
  code: string;
}

export interface ConditionnementResourceApi {
  id: number | null;
  libelle: string;
}

export interface FournisseurResourceApi {
  id: number | null;
  nom: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
}

export interface MedicamentResourceApi {
  id: number | null;
  familleId: number | null;
  familleLibelle: string | null;
  presentationId: number | null;
  presentationLibelle: string | null;
  presentationCode: string | null;
}

export interface ProduitResourceApi {
  id: number | null;
  nomCommercial: string | null;
  medicamentId: number | null;
  conditionnementId: number | null;
  conditionnementLibelle: string | null;
  principeActifIds: number[];
  principeActifLibelles: string[];
}
