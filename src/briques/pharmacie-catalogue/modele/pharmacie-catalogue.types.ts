/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReferentielSimple {
  id: number;
  libelle: string;
}

export interface PresentationGalenique {
  id: number;
  code: string;
  libelle: string;
}

export interface FournisseurPharmacie {
  id: number;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
}

export interface MedicamentCatalogue {
  id: number;
  familleId: number | null;
  familleLibelle: string | null;
  presentationId: number | null;
  presentationLibelle: string | null;
  presentationCode: string | null;
}

export interface ProduitPharmacie {
  id: number;
  nomCommercial: string;
  medicamentId: number;
  conditionnementId: number | null;
  conditionnementLibelle: string | null;
  principeActifIds: number[];
  principeActifLibelles: string[];
}

export interface NouveauProduitInput {
  nomCommercial: string;
  medicamentId: number;
  conditionnementId?: number | null;
  principeActifIds?: number[];
}
