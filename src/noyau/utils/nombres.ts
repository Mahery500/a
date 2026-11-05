/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitaires de mise en forme des valeurs numériques.
 * Règle n°1 : Si absent ou non numérique, affiche "—" sans inventer de valeur.
 */

export function formaterNombre(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) {
    return "—";
  }

  return new Intl.NumberFormat("fr-FR").format(valeur);
}

export function formaterMontant(valeur: number | null | undefined, devise: string = "Ar"): string {
  if (valeur === null || valeur === undefined || Number.isNaN(valeur)) {
    return "—";
  }

  const formate = new Intl.NumberFormat("fr-FR").format(valeur);
  return devise ? `${formate} ${devise}` : formate;
}
