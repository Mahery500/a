/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ObservationOutputApi,
  ObservationDefinitionApiOutput,
} from "./constat.contrats";
import type {
  ConstatEnregistre,
  DefinitionConstat,
  StatutConstat,
  TypeValeurConstat,
} from "../modele/constat.types";

const mapperTypeValeur = (v: string): TypeValeurConstat => {
  const tv = String(v ?? "").toLowerCase();
  if (tv === "texte") return "texte";
  if (tv === "booleen" || tv === "boolean") return "booleen";
  return "numerique";
};

const STATUTS_VALIDES: StatutConstat[] = [
  "preliminaire",
  "final",
  "corrige",
  "saisi_par_erreur",
];

const mapperStatut = (v: string): StatutConstat => {
  const s = String(v ?? "").toLowerCase() as StatutConstat;
  return STATUTS_VALIDES.includes(s) ? s : "final";
};

export function mapperConstat(api: ObservationOutputApi): ConstatEnregistre {
  return {
    id: api.id,
    observationDefinitionId: api.observationDefinitionId,
    code: api.code,
    libelle: api.libelle,
    typeValeur: mapperTypeValeur(api.typeValeur),
    valeur: api.valeur,
    uniteId: api.uniteId ?? null,
    uniteCode: api.uniteCode ?? null,
    uniteLibelle: api.uniteLibelle ?? null,
    interpretation: api.interpretation,
    dateObservation: api.dateObservation,
    statut: mapperStatut(api.statut),
    commentaire: api.commentaire,
    staffId: api.staffId,
  };
}

export function mapperDefinitionConstat(
  api: ObservationDefinitionApiOutput,
): DefinitionConstat | null {
  if (!api.actif || !api.categorie) return null;
  return {
    id: api.id,
    code: api.code,
    libelle: api.libelle,
    typeValeur: mapperTypeValeur(api.typeValeur),
    uniteCode: api.uniteCode,
    uniteLibelle: api.uniteLibelle,
    categorieCode: api.categorie.code,
    categorieLibelle: api.categorie.libelle,
  };
}