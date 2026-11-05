/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  EntreprisePartenaire,
  NouvelleEntrepriseInput,
  ModificationEntrepriseInput,
  Smie,
} from "../modele/entreprise.types";
import type {
  EntrepriseCreateApi,
  EntrepriseUpdateApi,
  EntrepriseOutputApi,
} from "./entreprises.contrats";

/** POST /api/entreprises — smie obligatoire. */
export function mapperCreateVersApi(saisie: NouvelleEntrepriseInput): EntrepriseCreateApi {
  return {
    nom: saisie.nom.trim(),
    raisonSociale: saisie.raisonSociale?.trim() || null,
    adresse: saisie.adresse?.trim() || null,
    contact: saisie.contact?.trim() || null,
    numeroCnaps: saisie.numeroCnaps?.trim() || null,
    matriculeAsina: saisie.matriculeAsina?.trim().toUpperCase() || null,
    smie: saisie.smie,
  };
}

/** PUT /api/entreprises/{id} — PAS de smie (figée). */
export function mapperUpdateVersApi(saisie: ModificationEntrepriseInput): EntrepriseUpdateApi {
  return {
    nom: (saisie.nom ?? "").trim(),
    raisonSociale: saisie.raisonSociale?.trim() || null,
    adresse: saisie.adresse?.trim() || null,
    contact: saisie.contact?.trim() || null,
    numeroCnaps: saisie.numeroCnaps?.trim() || null,
    matriculeAsina: saisie.matriculeAsina?.trim().toUpperCase() || null,
  };
}

export function mapperEntreprise(brut: unknown): EntreprisePartenaire | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as EntrepriseOutputApi;
  if (typeof o.id !== "number" || o.id <= 0) return null;

  return {
    id: o.id,
    nom: (o.nom ?? "").trim(),
    raisonSociale: o.raisonSociale ?? undefined,
    adresse: o.adresse ?? "",
    contact: o.contact ?? "",
    numeroCnaps: o.numeroCnaps ?? undefined,
    matriculeAsina: o.matriculeAsina ?? undefined,
    smie: (o.smie ?? undefined) as Smie | undefined,
    nombreAgents: typeof o.nombreAgents === "number" ? o.nombreAgents : undefined,
  };
}
