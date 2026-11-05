/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActeRealiseApiOutput,
  LigneDemandeApiOutput,
  ActeDefinitionApiOutput,
} from "./soins-actes.contrats";
import { ActeSaisiItem, ActeDemandeItem, DefinitionActeCatalogue } from "../modele/soin-acte.types";

export function mapperActeSaisi(api: ActeRealiseApiOutput): ActeSaisiItem {
  return {
    id: api.id,
    encounterId: api.encounterId,
    acteDefinitionId: api.acteDefinitionId,
    acteDefinitionCode: api.acteDefinitionCode,
    acteDefinitionLibelle: api.acteDefinitionLibelle,
    staffId: api.staffId,
    dateRealisation: api.dateRealisation,
    statut: api.statut,
    commentaire: api.commentaire,
    ligneDemandeId: api.ligneDemandeId,
    observations: (api.observations || []).map((o) => ({
      id: o.id,
      observationDefinitionId: o.observationDefinitionId,
      code: o.code,
      libelle: o.libelle,
      typeValeur: o.typeValeur,
      valeur: o.valeur,
      unite: o.uniteCode || o.unite || null,
      uniteCode: o.uniteCode || o.unite || null,
      interpretation: o.interpretation,
      dateObservation: o.dateObservation,
      statut: o.statut,
    })),
    resultats: (api.resultats || []).map((r) => ({
      id: r.id,
      type: r.type,
      conclusion: r.conclusion || r.resultat || null,
      resultat: r.conclusion || r.resultat || "",
      interpretation: r.interpretation,
      dateValidation: r.dateValidation || null,
    })),
  };
}

export function mapperActeDemande(api: LigneDemandeApiOutput): ActeDemandeItem {
  return {
    id: api.id,
    demandeId: api.demandeId,
    encounterId: api.encounterId,
    patientId: api.patientId,
    acteDefinitionId: api.acteDefinitionId,
    acteDefinitionCode: api.acteDefinitionCode,
    acteDefinitionLibelle: api.acteDefinitionLibelle,
    priorite: api.priorite,
    urgente: Boolean(api.urgente),
    commentaire: api.commentaire,
    dateDemande: api.dateDemande,
  };
}

export function mapperDefinitionCatalogue(api: ActeDefinitionApiOutput): DefinitionActeCatalogue {
  const catObj = typeof api.categorie === "object" && api.categorie ? api.categorie : null;
  const catId =
    typeof api.categorie === "number" ? api.categorie : Number(api.categorieId ?? catObj?.id ?? 0);
  const catCode = String(catObj?.code ?? "").toUpperCase();
  const catLibelle = String(catObj?.libelle ?? "").toLowerCase();

  const estSoin = catId === 3 || catCode === "SOINS" || catLibelle.includes("soin");

  return {
    id: api.id,
    code: api.code,
    libelle: api.libelle,
    actif: api.actif !== false && api.isActive !== false,
    categorieId: Number.isFinite(catId) && catId > 0 ? catId : undefined,
    estSoinInfirmier: estSoin,
  };
}
