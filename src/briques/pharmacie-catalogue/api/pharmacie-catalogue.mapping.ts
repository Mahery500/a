/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProduitResourceApi,
  MedicamentResourceApi,
  FournisseurResourceApi,
  PresentationResourceApi,
  ConditionnementResourceApi,
  FamilleResourceApi,
  PrincipeActifResourceApi,
} from "./pharmacie-catalogue.contrats";
import {
  ProduitPharmacie,
  MedicamentCatalogue,
  FournisseurPharmacie,
  PresentationGalenique,
  ReferentielSimple,
} from "../modele/pharmacie-catalogue.types";

export function mapperProduit(api: ProduitResourceApi): ProduitPharmacie {
  return {
    id: api.id ?? 0,
    nomCommercial: api.nomCommercial ?? "Produit sans nom",
    medicamentId: api.medicamentId ?? 0,
    conditionnementId: api.conditionnementId ?? null,
    conditionnementLibelle: api.conditionnementLibelle ?? null,
    principeActifIds: api.principeActifIds || [],
    principeActifLibelles: api.principeActifLibelles || [],
  };
}

export function mapperMedicament(api: MedicamentResourceApi): MedicamentCatalogue {
  return {
    id: api.id ?? 0,
    familleId: api.familleId ?? null,
    familleLibelle: api.familleLibelle ?? null,
    presentationId: api.presentationId ?? null,
    presentationLibelle: api.presentationLibelle ?? null,
    presentationCode: api.presentationCode ?? null,
  };
}

export function mapperFournisseur(api: FournisseurResourceApi): FournisseurPharmacie {
  return {
    id: api.id ?? 0,
    nom: api.nom ?? "Fournisseur",
    adresse: api.adresse ?? null,
    telephone: api.telephone ?? null,
    email: api.email ?? null,
  };
}

export function mapperPresentation(api: PresentationResourceApi): PresentationGalenique {
  return {
    id: api.id ?? 0,
    code: api.code,
    libelle: api.libelle,
  };
}

export function mapperReferentielSimple(
  api: FamilleResourceApi | ConditionnementResourceApi | PrincipeActifResourceApi,
): ReferentielSimple {
  return {
    id: api.id ?? 0,
    libelle: api.libelle,
  };
}
