/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitaires d'affichage des dates et heures.
 * Règle n°1 : Aucune date inventée. Si la valeur est absente ou invalide, renvoie "—".
 */

export function formaterDate(dateIso: string | null | undefined): string {
  if (!dateIso || !dateIso.trim()) {
    return "—";
  }

  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) {
      return "—";
    }
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
}

export function formaterDateHeure(dateIso: string | null | undefined): string {
  if (!dateIso || !dateIso.trim()) {
    return "—";
  }

  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) {
      return "—";
    }
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

export function formaterHeure(dateIso: string | null | undefined): string {
  if (!dateIso || !dateIso.trim()) {
    return "—";
  }

  try {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) {
      return "—";
    }
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}
