/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Schémas bruts des requêtes et réponses de l'API Symfony (Auth).
 */

export interface LoginRequeteApi {
  identifier: string;
  password: string;
}

export interface LoginReponseApi {
  role?: string | null;
  roles?: string[];
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  nom?: string | null;
  prenom?: string | null;
  siteId?: number | null;
  serviceId?: number | null;
  jwt?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  sansAffectation?: boolean;
}

export interface MeReponseApi {
  id: number;
  login: string;
  role: string | null;
  nom: string | null;
  prenom: string | null;
  siteId: number | null;
  serviceId: number | null;
  sansAffectation?: boolean;
}

export interface RefreshRequeteApi {
  refreshToken: string;
}

export interface RefreshReponseApi {
  token?: string;
  jwt?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  expiresIn?: number;
}

export interface LogoutRequeteApi {
  refreshToken: string;
}
