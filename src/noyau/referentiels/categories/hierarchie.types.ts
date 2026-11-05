/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Profondeur maximale des arbres de catégories (aligné sur HierarchieCategorie::PROFONDEUR_MAX). */
export const PROFONDEUR_MAX = 3;

/**
 * Vue hiérarchique d'une catégorie. Utilisée à la fois pour CategorieActe
 * et CategorieObservation, qui partagent exactement la même forme côté backend.
 */
export interface CategorieHierarchique {
  id: number;
  code: string;
  libelle: string;
  parentId: number | null;
  parentCode: string | null;
  /** 1 = racine. */
  niveau: number;
  /** Vrai si aucun enfant : seule une feuille peut recevoir actes/observations. */
  feuille: boolean;
  /** Chemin des libellés depuis la racine : ['Surveillance / Soins', 'Prise de constantes']. */
  chemin: string[];
}

export interface NouvelleCategorieInput {
  code: string;
  libelle: string;
  /** null pour une racine. */
  parentCode: string | null;
}

export interface ArbreCategorie<T extends CategorieHierarchique> {
  categorie: T;
  enfants: ArbreCategorie<T>[];
}

/**
 * Construit un arbre depuis une liste plate renvoyée par l'API.
 * Un élément dont le parent est absent est traité comme racine pour ne pas
 * le faire disparaître silencieusement de l'écran.
 */
export function construireArbre<T extends CategorieHierarchique>(items: T[]): ArbreCategorie<T>[] {
  const map = new Map<number, ArbreCategorie<T>>();
  items.forEach((c) => map.set(c.id, { categorie: c, enfants: [] }));

  const racines: ArbreCategorie<T>[] = [];
  map.forEach((node) => {
    if (node.categorie.parentId === null) {
      racines.push(node);
      return;
    }
    const parent = map.get(node.categorie.parentId);
    if (parent) parent.enfants.push(node);
    else racines.push(node);
  });

  const trier = (list: ArbreCategorie<T>[]): ArbreCategorie<T>[] =>
    list
      .sort((a, b) => a.categorie.libelle.localeCompare(b.categorie.libelle, "fr"))
      .map((n) => ({ ...n, enfants: trier(n.enfants) }));

  return trier(racines);
}
