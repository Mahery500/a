/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Smie } from "../modele/entreprise.types";

/** Payload exact attendu par POST /api/entreprises (CreateEntrepriseInput). */
export interface EntrepriseCreateApi {
  nom: string;
  raisonSociale?: string | null;
  adresse?: string | null;
  contact?: string | null;
  numeroCnaps?: string | null;
  matriculeAsina?: string | null;
  smie: Smie; // requis
}

/** Payload exact attendu par PUT /api/entreprises/{id} (UpdateEntrepriseRequest). */
export interface EntrepriseUpdateApi {
  nom: string;
  raisonSociale?: string | null;
  adresse?: string | null;
  contact?: string | null;
  numeroCnaps?: string | null;
  matriculeAsina?: string | null;
  // pas de smie
}

/** Réponse backend d'une entreprise. */
export interface EntrepriseOutputApi {
  id: number;
  nom: string | null;
  raisonSociale: string | null;
  adresse: string | null;
  contact: string | null;
  numeroCnaps: string | null;
  matriculeAsina: string | null;
  smie: Smie | null;
  nombreAgents: number;
}
