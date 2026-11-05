/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { estJetonExpire } from "./jwt";

const URL_PAR_DEFAUT =
  (import.meta.env?.VITE_API_URL as string | undefined) || "http://localhost:8000/api";

export const CLE_STOCKAGE_JWT = "asina_jwt_token";
export const CLE_STOCKAGE_REFRESH = "asina_refresh_token";
export const CLE_STOCKAGE_URL_API = "asina_api_base_url";
export const CLE_STOCKAGE_UTILISATEUR = "asina_logged_in_user";
export const CLE_STOCKAGE_SITE_ACTIF = "asina_staff_site_id";
export const CLE_STOCKAGE_SERVICE_ACTIF = "asina_staff_service_id";

const estNavigateur = typeof window !== "undefined";

export function obtenirUrlBaseApi(): string {
  if (estNavigateur) {
    const personnalisee = localStorage.getItem(CLE_STOCKAGE_URL_API);
    if (personnalisee && personnalisee.trim()) {
      return personnalisee.trim().replace(/\/+$/, "");
    }
  }
  return URL_PAR_DEFAUT.replace(/\/+$/, "");
}

export function definirUrlBaseApi(url: string): void {
  if (estNavigateur) {
    localStorage.setItem(CLE_STOCKAGE_URL_API, url.trim().replace(/\/+$/, ""));
  }
}

export function obtenirJetonJwt(): string | null {
  if (!estNavigateur) return null;
  const jeton = localStorage.getItem(CLE_STOCKAGE_JWT);
  if (!jeton) return null;

  if (estJetonExpire(jeton)) {
    effacerSession();
    return null;
  }
  return jeton;
}

export function definirJetonJwt(jeton: string): void {
  if (estNavigateur) {
    localStorage.setItem(CLE_STOCKAGE_JWT, jeton);
  }
}

export function obtenirJetonRefresh(): string | null {
  if (!estNavigateur) return null;
  return localStorage.getItem(CLE_STOCKAGE_REFRESH);
}

export function definirJetonRefresh(jetonRefresh: string): void {
  if (estNavigateur) {
    localStorage.setItem(CLE_STOCKAGE_REFRESH, jetonRefresh);
  }
}

export function obtenirSiteActifId(): number | null {
  if (!estNavigateur) return null;
  const val = localStorage.getItem(CLE_STOCKAGE_SITE_ACTIF);
  return val ? Number(val) || null : null;
}

export function definirSiteActifId(id: number | null): void {
  if (!estNavigateur) return;
  if (id !== null && id !== undefined) {
    localStorage.setItem(CLE_STOCKAGE_SITE_ACTIF, String(id));
  } else {
    localStorage.removeItem(CLE_STOCKAGE_SITE_ACTIF);
  }
}

export function obtenirServiceActifId(): number | null {
  if (!estNavigateur) return null;
  const val = localStorage.getItem(CLE_STOCKAGE_SERVICE_ACTIF);
  return val ? Number(val) || null : null;
}

export function definirServiceActifId(id: number | null): void {
  if (!estNavigateur) return;
  if (id !== null && id !== undefined) {
    localStorage.setItem(CLE_STOCKAGE_SERVICE_ACTIF, String(id));
  } else {
    localStorage.removeItem(CLE_STOCKAGE_SERVICE_ACTIF);
  }
}

export function effacerSession(): void {
  if (estNavigateur) {
    localStorage.removeItem(CLE_STOCKAGE_JWT);
    localStorage.removeItem(CLE_STOCKAGE_REFRESH);
    localStorage.removeItem(CLE_STOCKAGE_UTILISATEUR);
    localStorage.removeItem(CLE_STOCKAGE_SITE_ACTIF);
    localStorage.removeItem(CLE_STOCKAGE_SERVICE_ACTIF);
  }
}

type EcouteurSession = () => void;
const ecouteursNonAutorise = new Set<EcouteurSession>();

export function surSessionExpiree(ecouteur: EcouteurSession): () => void {
  ecouteursNonAutorise.add(ecouteur);
  return () => {
    ecouteursNonAutorise.delete(ecouteur);
  };
}

export function notifierSessionExpiree(): void {
  effacerSession();
  ecouteursNonAutorise.forEach((ecouteur) => {
    try {
      ecouteur();
    } catch (e) {
      console.error("[Session] Erreur dans un écouteur de session expirée :", e);
    }
  });
}
