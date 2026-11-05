/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extrait un message d'erreur clair et lisible pour l'utilisateur
 * à partir de n'importe quelle erreur interceptée (ApiError, Error, string, etc.).
 */
export function messageErreur(
  erreur: unknown,
  messageSecours: string = "Une erreur inattendue est survenue.",
): string {
  if (!erreur) {
    return messageSecours;
  }

  if (typeof erreur === "string") {
    return erreur.trim() || messageSecours;
  }

  if (typeof erreur === "object") {
    const obj = erreur as Record<string, unknown>;

    // Erreurs de validation API Platform / Hydra violations
    if (Array.isArray(obj.violations) && obj.violations.length > 0) {
      const messages = obj.violations
        .map((v: unknown) => {
          if (typeof v === "object" && v && "message" in v) {
            return String((v as Record<string, unknown>).message);
          }
          return "";
        })
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join(" ; ");
      }
    }

    // Détail API Platform Hydra (RFC 7807)
    if (typeof obj.detail === "string" && obj.detail.trim()) {
      return obj.detail.trim();
    }

    // Message standard Error ou ApiError
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message.trim();
    }

    // Propriété error générique
    if (typeof obj.error === "string" && obj.error.trim()) {
      return obj.error.trim();
    }
  }

  return messageSecours;
}

export const extraireMessageErreur = messageErreur;
