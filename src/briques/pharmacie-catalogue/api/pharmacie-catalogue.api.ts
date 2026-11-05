/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
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
  mapperProduit,
  mapperMedicament,
  mapperFournisseur,
  mapperPresentation,
  mapperReferentielSimple,
} from "./pharmacie-catalogue.mapping";
import {
  ProduitPharmacie,
  MedicamentCatalogue,
  FournisseurPharmacie,
  PresentationGalenique,
  ReferentielSimple,
  NouveauProduitInput,
} from "../modele/pharmacie-catalogue.types";

export const pharmacieCatalogueApi = {
  async listerProduits(): Promise<ProduitPharmacie[]> {
    const raw = await clientHttp<unknown>("/produit_resources");
    const items = extraireElementsCollection<ProduitResourceApi>(raw);
    return items.map(mapperProduit);
  },

  async creerProduit(input: NouveauProduitInput): Promise<ProduitPharmacie> {
    const raw = await clientHttp<ProduitResourceApi>("/produit_resources", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapperProduit(raw);
  },

  async modifierProduit(id: number, input: NouveauProduitInput): Promise<ProduitPharmacie> {
    const raw = await clientHttp<ProduitResourceApi>(`/produit_resources/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return mapperProduit(raw);
  },

  async listerMedicaments(): Promise<MedicamentCatalogue[]> {
    const raw = await clientHttp<unknown>("/medicament_resources");
    const items = extraireElementsCollection<MedicamentResourceApi>(raw);
    return items.map(mapperMedicament);
  },

  async listerFournisseurs(): Promise<FournisseurPharmacie[]> {
    const raw = await clientHttp<unknown>("/fournisseur_resources");
    const items = extraireElementsCollection<FournisseurResourceApi>(raw);
    return items.map(mapperFournisseur);
  },

  async listerFamilles(): Promise<ReferentielSimple[]> {
    const raw = await clientHttp<unknown>("/famille_resources");
    const items = extraireElementsCollection<FamilleResourceApi>(raw);
    return items.map(mapperReferentielSimple);
  },

  async listerPresentations(): Promise<PresentationGalenique[]> {
    const raw = await clientHttp<unknown>("/presentation_resources");
    const items = extraireElementsCollection<PresentationResourceApi>(raw);
    return items.map(mapperPresentation);
  },

  async listerConditionnements(): Promise<ReferentielSimple[]> {
    const raw = await clientHttp<unknown>("/conditionnement_resources");
    const items = extraireElementsCollection<ConditionnementResourceApi>(raw);
    return items.map(mapperReferentielSimple);
  },

  async listerPrincipesActifs(): Promise<ReferentielSimple[]> {
    const raw = await clientHttp<unknown>("/principe_actif_resources");
    const items = extraireElementsCollection<PrincipeActifResourceApi>(raw);
    return items.map(mapperReferentielSimple);
  },
};
