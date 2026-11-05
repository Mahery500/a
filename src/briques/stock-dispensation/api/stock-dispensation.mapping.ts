/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatientApiOutput, ProduitResourceApiOutput } from "./stock-dispensation.contrats";
import {
  PatientOptionDispensation,
  ProduitOptionDispensation,
} from "../modele/stock-dispensation.types";

export function mapperPatientOption(api: PatientApiOutput): PatientOptionDispensation {
  const id = api.id ?? api.Id_Patient ?? 0;
  const nom = api.nom ?? api.Nom ?? "";
  const prenom = api.prenom ?? api.Prenom ?? "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ").trim() || `Patient #${id}`;
  const matricule = api.matricule ?? api.Matricule ?? `#${id}`;

  return {
    id,
    nomComplet,
    matricule,
  };
}

export function mapperProduitOption(
  api: ProduitResourceApiOutput,
  quantiteEnStock = 0,
): ProduitOptionDispensation {
  return {
    id: api.id ?? 0,
    nomCommercial: api.nomCommercial ?? `Produit #${api.id}`,
    quantiteEnStock,
  };
}
