/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErreurApi } from "@/noyau/http/erreurApi";
import { obtenirUrlBaseApi, obtenirJetonJwt } from "@/noyau/http/session";

/**
 * Récupère un PDF servi par l'API (jeton JWT requis) et le renvoie sous forme de Blob.
 *
 * - Le format "pdf" est négocié par l'en-tête Accept ; le JSON sert aux messages d'erreur.
 * - En cas d'erreur (404, 422...), une ErreurApi est levée avec le message renvoyé
 *   par le backend.
 */
export async function chargerPdf(chemin: string): Promise<Blob> {
  const jeton = obtenirJetonJwt();
  const reponse = await fetch(`${obtenirUrlBaseApi()}${chemin}`, {
    headers: {
      Accept: "application/pdf, application/ld+json;q=0.8, application/json;q=0.7",
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
  });

  if (!reponse.ok) {
    let detail = `Erreur HTTP ${reponse.status} lors de la génération du PDF.`;
    try {
      const corps = await reponse.json();
      if (typeof corps?.detail === "string") detail = corps.detail;
      else if (typeof corps?.message === "string") detail = corps.message;
    } catch {
      /* corps non JSON : message par défaut */
    }
    throw new ErreurApi(reponse.status, detail, null, chemin);
  }

  return new Blob([await reponse.blob()], { type: "application/pdf" });
}

/**
 * Récupère un PDF servi par l'API (jeton JWT requis) et l'ouvre dans un nouvel onglet.
 *
 * - L'onglet est ouvert AVANT l'appel réseau : sinon le bloqueur de fenêtres du
 *   navigateur refuse le window.open() fait après un await.
 * - En cas d'erreur, l'onglet est refermé et l'ErreurApi de chargerPdf est relancée.
 * - Si le navigateur a quand même bloqué l'onglet, le PDF est téléchargé.
 */
export async function ouvrirPdf(chemin: string, nomFichier = "document.pdf"): Promise<void> {
  const fenetre = window.open("", "_blank");

  try {
    const blob = await chargerPdf(chemin);
    const url = URL.createObjectURL(blob);

    if (fenetre) {
      fenetre.location.href = url;
    } else {
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = nomFichier;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    fenetre?.close();
    throw err;
  }
}