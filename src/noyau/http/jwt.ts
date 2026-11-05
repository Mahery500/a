/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JetonJwtPayload } from "./types";

/**
 * Décode le payload d'un jeton JWT sans bibliothèque externe.
 */
export function decoderJetonJwt(jeton: string): JetonJwtPayload | null {
  try {
    if (!jeton || typeof jeton !== "string") return null;
    const parties = jeton.split(".");
    if (parties.length < 2) return null;

    const base64Url = parties[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const chargeUtile = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    return JSON.parse(chargeUtile) as JetonJwtPayload;
  } catch {
    return null;
  }
}

/**
 * Vérifie si le jeton JWT a expiré selon son champ exp.
 * Marge de tolérance de 5 secondes pour les délais réseau.
 */
export function estJetonExpire(jeton: string): boolean {
  const charge = decoderJetonJwt(jeton);
  if (!charge || typeof charge.exp !== "number") {
    return false;
  }
  const dateExpirationMs = charge.exp * 1000;
  return dateExpirationMs <= Date.now() + 5000;
}
