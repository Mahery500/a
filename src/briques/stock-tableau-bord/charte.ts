/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Charte graphique ASINA Médical : couleurs et styles partagés
 * par les tableaux de bord.
 */

export const CHARTE = {
  /* Surfaces et traits */
  surface: "#ffffff",
  bordure: "#e5e7eb",
  separateur: "#f0f2f1",
  overlay: "rgba(15, 23, 42, 0.55)",

  /* Texte */
  encre: "#1f2937",
  secondaire: "#5b6472",

  /* Couleur principale (vert) */
  primaire: "#1f9d55",
  primaireClair: "#e7f6ed",
  primaireFonce: "#14703c",

  /* Alertes (ambre) */
  alerteFond: "#fff4e0",
  alerteTexte: "#8a5300",

  /* Badges neutres */
  badgeFond: "#f1f5f9",
  badgeTexte: "#475569",

  /* Erreur */
  erreur: "#b42318",
} as const;

/**
 * Anneau de focus clavier commun.
 * La chaîne doit rester littérale pour que Tailwind détecte les classes.
 */
export const CLASSE_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";