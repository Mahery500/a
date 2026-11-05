/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canal de synchronisation pour les terminologies / systèmes de codification.
 *
 * Les briques Catalogue, Observations et Diagnostics consomment toutes le même
 * endpoint backend `/code_systems`, mais via des hooks indépendants. Sans
 * synchronisation, une création dans l'une n'apparaît pas dans les autres
 * tant que la page n'est pas rechargée.
 *
 * On utilise un CustomEvent sur `window` : léger, aucun store global à
 * installer, fonctionne dès que les hooks sont montés dans la même page.
 */

export const EVT_CODE_SYSTEMS_CHANGED = "asina:code-systems:changed";

export function notifierCodeSystemsChanges(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT_CODE_SYSTEMS_CHANGED));
}

export function abonnerCodeSystemsChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVT_CODE_SYSTEMS_CHANGED, handler);
  return () => window.removeEventListener(EVT_CODE_SYSTEMS_CHANGED, handler);
}
