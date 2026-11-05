/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Schémas bruts des requêtes et réponses de l'API Symfony pour /api/sites.
 */

export interface SiteInputApi {
  code: string;
  name: string;
  city: string;
  address?: string | null;
  phone?: string | null;
}

export interface SiteOutputApi {
  id: number;
  code: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt?: string;
  // Variantes legacy de compatibilité
  Id_Site?: number;
  Libelle?: string;
  libelle?: string;
}
