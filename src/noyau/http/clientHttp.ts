/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErreurApi } from "./erreurApi";
import { OptionsRequete } from "./types";
import { obtenirUrlBaseApi, obtenirJetonJwt, notifierSessionExpiree } from "./session";

function construireUrl(endpoint: string, parametres?: OptionsRequete["params"]): string {
  const base = obtenirUrlBaseApi().replace(/\/+$/, "");
  let endpointNettoye = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Si l'URL de base se termine déjà par /api et que le chemin commence par /api/, éviter le dédoublement /api/api/
  if (base.endsWith("/api") && endpointNettoye.startsWith("/api/")) {
    endpointNettoye = endpointNettoye.slice(4);
  }

  let url = `${base}${endpointNettoye}`;

  if (parametres) {
    const query = new URLSearchParams();
    Object.entries(parametres).forEach(([cle, val]) => {
      if (val === undefined || val === null) return;
      const str = String(val).trim();
      if (str !== "") query.append(cle, str);
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  return url;
}

async function extraireCorpsErreur(
  reponse: Response,
): Promise<{ message: string; donnees: unknown }> {
  let donnees: unknown = null;
  let message = `Erreur HTTP ${reponse.status} : ${reponse.statusText}`;

  try {
    donnees = await reponse.json();
    const corps = donnees as Record<string, unknown>;
    if (typeof corps?.message === "string" && corps.message.trim()) {
      message = corps.message.trim();
    } else if (typeof corps?.detail === "string" && corps.detail.trim()) {
      message = corps.detail.trim();
    } else if (corps?.error) {
      message = typeof corps.error === "string" ? corps.error : JSON.stringify(corps.error);
    }
  } catch {
    const texte = await reponse.text().catch(() => "");
    if (texte) message = texte;
  }

  return { message, donnees };
}

/**
 * Client HTTP de base pour consommer l'API Symfony.
 * Gère le jeton JWT Bearer, les en-têtes JSON et les erreurs de transport.
 */
export async function clientHttp<T>(endpoint: string, options: OptionsRequete = {}): Promise<T> {
  const { params, headers: entetesPersonnalisees, skipAuth, ...optionsFetch } = options;
  const url = construireUrl(endpoint, params);
  const endpointNettoye = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const entetes = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json, application/ld+json",
    ...entetesPersonnalisees,
  });

  if (!skipAuth) {
    const jeton = obtenirJetonJwt();
    if (jeton) {
      entetes.set("Authorization", `Bearer ${jeton}`);
    }
  }

  let reponse: Response;
  try {
    reponse = await fetch(url, { ...optionsFetch, headers: entetes });
  } catch (erreurReseau) {
    throw new ErreurApi(
      0,
      `Impossible de joindre l'API Symfony sur ${obtenirUrlBaseApi()}. Vérifiez la connexion réseau et les autorisations CORS.`,
      erreurReseau,
      endpointNettoye,
    );
  }

  if (!reponse.ok) {
    const { message, donnees } = await extraireCorpsErreur(reponse);

    if (reponse.status === 401) {
      if (!skipAuth) notifierSessionExpiree();
      throw new ErreurApi(
        401,
        message || "Session expirée ou identifiants invalides (401)",
        donnees,
        endpointNettoye,
      );
    }

    if (reponse.status === 403) {
      throw new ErreurApi(
        403,
        message || "Accès refusé par le serveur (rôle ou permission manquante)",
        donnees,
        endpointNettoye,
      );
    }

    throw new ErreurApi(reponse.status, message, donnees, endpointNettoye);
  }

  if (reponse.status === 204) {
    return {} as T;
  }

  return (await reponse.json()) as T;
}

/**
 * Télécharge un fichier binaire (ex. PDF de cartes d'adhérents) depuis l'API Symfony.
 */
export async function telechargerFichierBlob(
  endpoint: string,
  nomFichierParDefaut: string,
): Promise<void> {
  const url = construireUrl(endpoint);
  const entetes = new Headers({
    Accept: "application/pdf, application/octet-stream, */*",
  });

  const jeton = obtenirJetonJwt();
  if (jeton) {
    entetes.set("Authorization", `Bearer ${jeton}`);
  }

  let reponse: Response;
  try {
    reponse = await fetch(url, { method: "GET", headers: entetes });
  } catch (erreurReseau) {
    throw new ErreurApi(
      0,
      `Impossible de joindre l'API pour le téléchargement du fichier.`,
      erreurReseau,
      endpoint,
    );
  }

  if (!reponse.ok) {
    const { message, donnees } = await extraireCorpsErreur(reponse);
    throw new ErreurApi(reponse.status, message, donnees, endpoint);
  }

  let nomFichier = nomFichierParDefaut;
  const disposition = reponse.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const correspond = disposition.match(/filename="?([^";]+)"?/);
    if (correspond && correspond[1]) {
      nomFichier = correspond[1].trim();
    }
  }

  const blob = await reponse.blob();
  const lien = document.createElement("a");
  const urlBlob = URL.createObjectURL(blob);
  lien.href = urlBlob;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  setTimeout(() => URL.revokeObjectURL(urlBlob), 1000);
}

export default clientHttp;
