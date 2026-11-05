/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DomaineService } from "../modele/service.types";

export interface ServiceInputApi {
  siteId: number;
  typeServiceId: number;
  description?: string | null;
}

export interface ServiceOutputApi {
  id: number;
  siteId: number;
  siteName?: string;
  typeServiceId: number;
  typeServiceName?: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  Id_Service?: number;
  Id_Site?: number;
  Libelle?: string;
  libelle?: string;
}

export interface TypeServiceInputApi {
  code: string;
  name: string;
  description?: string | null;
  supporteAiguillage?: boolean;
  domaine: DomaineService; // ← requis (NonNullable côté backend)
}

export interface TypeServiceOutputApi {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  supporteAiguillage?: boolean;
  domaine: DomaineService; // ← désormais présent dans la réponse
}