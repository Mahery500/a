/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OptionsRequete extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

export interface JetonJwtPayload {
  username?: string;
  identifier?: string;
  user_id?: number | string;
  id?: number | string;
  email?: string;
  roles?: string[];
  nom?: string;
  prenom?: string;
  siteId?: number | null;
  serviceId?: number | null;
  exp?: number;
  iat?: number;
  [cle: string]: unknown;
}
