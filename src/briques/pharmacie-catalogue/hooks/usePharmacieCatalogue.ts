/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { pharmacieCatalogueApi } from "../api/pharmacie-catalogue.api";
import {
  ProduitPharmacie,
  MedicamentCatalogue,
  FournisseurPharmacie,
  ReferentielSimple,
  PresentationGalenique,
  NouveauProduitInput,
} from "../modele/pharmacie-catalogue.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function usePharmacieCatalogue() {
  const [produits, setProduits] = useState<ProduitPharmacie[]>([]);
  const [medicaments, setMedicaments] = useState<MedicamentCatalogue[]>([]);
  const [fournisseurs, setFournisseurs] = useState<FournisseurPharmacie[]>([]);
  const [conditionnements, setConditionnements] = useState<ReferentielSimple[]>([]);
  const [principesActifs, setPrincipesActifs] = useState<ReferentielSimple[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerCatalogue = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const [prods, meds, fourns, conds, pas] = await Promise.all([
        pharmacieCatalogueApi.listerProduits(),
        pharmacieCatalogueApi.listerMedicaments().catch(() => []),
        pharmacieCatalogueApi.listerFournisseurs().catch(() => []),
        pharmacieCatalogueApi.listerConditionnements().catch(() => []),
        pharmacieCatalogueApi.listerPrincipesActifs().catch(() => []),
      ]);

      setProduits(prods);
      setMedicaments(meds);
      setFournisseurs(fourns);
      setConditionnements(conds);
      setPrincipesActifs(pas);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerCatalogue();
  }, [chargerCatalogue]);

  const creerProduit = async (input: NouveauProduitInput) => {
    const res = await pharmacieCatalogueApi.creerProduit(input);
    await chargerCatalogue();
    return res;
  };

  const modifierProduit = async (id: number, input: NouveauProduitInput) => {
    const res = await pharmacieCatalogueApi.modifierProduit(id, input);
    await chargerCatalogue();
    return res;
  };

  return {
    produits,
    medicaments,
    fournisseurs,
    conditionnements,
    principesActifs,
    chargement,
    erreur,
    creerProduit,
    modifierProduit,
    rafraichir: chargerCatalogue,
  };
}
