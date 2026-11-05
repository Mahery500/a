/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ObservationApiOutput,
  ActeObservationItemApi,
  ActeDefinitionRealisableApi,
} from "./constante-vitale.contrats";
import {
  MesureObservation,
  ChampObservationMoule,
  ActeConstanteOption,
} from "../modele/constante-vitale.types";

export function mapperObservation(api: ObservationApiOutput): MesureObservation {
  return {
    id: api.id,
    observationDefinitionId: api.observationDefinitionId,
    code: api.code || "",
    libelle: api.libelle,
    valeur: String(api.valeur ?? "").trim(),
    unite: api.uniteCode || api.unite || api.uniteLibelle || null,
    interpretation: api.interpretation || null,
    dateObservation: api.dateObservation,
    statut: api.statut,
  };
}

export function mapperChampObservationMoule(item: ActeObservationItemApi): ChampObservationMoule {
  const def = item.observation;
  return {
    observationId: def.id,
    code: def.code,
    libelle: def.libelle,
    typeValeur: def.typeValeur === "texte" ? "texte" : "numerique",
    unite: def.uniteCode || def.uniteLibelle || null,
    obligatoire: Boolean(item.obligatoire),
    ordre: item.ordre ?? 1,
  };
}

export function extraireIdCategorie(valeur: unknown): number | null {
  if (typeof valeur === "number") return valeur;
  if (typeof valeur === "string") {
    const num = parseInt(valeur, 10);
    if (!isNaN(num) && String(num) === valeur.trim()) return num;
    const match = valeur.match(/\/(\d+)\/?$/);
    if (match) return parseInt(match[1], 10);
  }
  if (typeof valeur === "object" && valeur !== null) {
    const obj = valeur as Record<string, unknown>;
    if (typeof obj.id === "number") return obj.id;
    if (typeof obj["@id"] === "string") {
      const match = (obj["@id"] as string).match(/\/(\d+)\/?$/);
      if (match) return parseInt(match[1], 10);
    }
  }
  return null;
}

export function mapperActeConstante(raw: ActeDefinitionRealisableApi): ActeConstanteOption {
  const catObj = typeof raw.categorie === "object" && raw.categorie ? raw.categorie : null;
  const catId = extraireIdCategorie(raw.categorie) ?? extraireIdCategorie(raw.categorieId) ?? 0;

  return {
    id: raw.id,
    code: raw.code,
    libelle: raw.libelle,
    categorieId: catId,
    categorieLibelle: catObj?.libelle || catObj?.code,
  };
}
