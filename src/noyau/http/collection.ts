/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function estObjetPaginationSeule(element: unknown): boolean {
  if (!element || typeof element !== "object") {
    return false;
  }
  const obj = element as Record<string, unknown>;
  return "page" in obj && "total" in obj && !("id" in obj) && !("Id_" in obj);
}

/**
 * Extrait la liste d'éléments d'une réponse de collection API Platform / Symfony :
 *  - Collection JSON-LD Hydra : { "hydra:member": [...] } ou { "member": [...] }
 *  - Collection avec métadonnées imbriquées : { member: [[Item, ...], { total, page }] }
 *  - Format enveloppé : { items: [...] } ou { data: [...] }
 *  - Tableaux directs : [...]
 */
export function extraireElementsCollection<T = unknown>(donneesBrutes: unknown): T[] {
  if (!donneesBrutes) {
    return [];
  }

  // Cas tableau direct
  if (Array.isArray(donneesBrutes)) {
    if (donneesBrutes.length > 0 && Array.isArray(donneesBrutes[0])) {
      return donneesBrutes[0] as T[];
    }
    if (
      donneesBrutes.length === 1 &&
      donneesBrutes[0] &&
      typeof donneesBrutes[0] === "object" &&
      Array.isArray((donneesBrutes[0] as { items?: unknown }).items)
    ) {
      return (donneesBrutes[0] as { items: T[] }).items;
    }
    return donneesBrutes.filter(
      (item) => item && typeof item === "object" && !estObjetPaginationSeule(item),
    ) as T[];
  }

  // Cas objet avec enveloppe
  const corps = donneesBrutes as Record<string, unknown>;
  const listeMembres = (corps["hydra:member"] ?? corps.member) as unknown[] | undefined;

  if (Array.isArray(listeMembres)) {
    if (listeMembres.length > 0 && Array.isArray(listeMembres[0])) {
      return listeMembres[0] as T[];
    }
    return listeMembres.filter(
      (item) => item && typeof item === "object" && !estObjetPaginationSeule(item),
    ) as T[];
  }

  if (Array.isArray(corps.items)) {
    return corps.items as T[];
  }

  if (Array.isArray(corps.data)) {
    return corps.data as T[];
  }

  return [];
}

export default extraireElementsCollection;
