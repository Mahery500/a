/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IdentifiantsConnexion {
  identifiant: string;
  motDePasse: string;
}

export interface UtilisateurConnecte {
  id: number;
  identifiant: string;
  nom: string;
  prenom: string;
  email?: string;
  roles: string[];
  rolePrincipal: string;
  siteId: number | null;
  serviceId: number | null;
  jeton: string;
  jetonRefresh?: string;
  sansAffectation?: boolean;
}
