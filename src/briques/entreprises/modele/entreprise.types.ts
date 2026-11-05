/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** SMIE de l'entreprise : valeurs identiques à l'enum PHP CardBrand. */
export type Smie = "serenite" | "asina";

export interface EntreprisePartenaire {
  id: number;
  nom: string;
  raisonSociale?: string;
  adresse: string;
  contact: string;
  numeroCnaps?: string;
  /** Nom historique côté backend : c'est en fait le SIGLE de l'entreprise. */
  matriculeAsina?: string;
  smie?: Smie | null;
  nombreAgents?: number;
}

/** Création : `smie` est OBLIGATOIRE. */
export interface NouvelleEntrepriseInput {
  nom: string;
  raisonSociale?: string;
  adresse?: string;
  contact?: string;
  numeroCnaps?: string;
  matriculeAsina?: string;
  smie: Smie;
}

/**
 * Modification : `smie` est FIGÉE et donc INTERDITE dans le payload.
 * Le backend refuse (ou ignore) ce champ sur PUT.
 */
export interface ModificationEntrepriseInput {
  nom?: string;
  raisonSociale?: string;
  adresse?: string;
  contact?: string;
  numeroCnaps?: string;
  matriculeAsina?: string;
  // ⚠️ pas de `smie` ici, volontairement
}
