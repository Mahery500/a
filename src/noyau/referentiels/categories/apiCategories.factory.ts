/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import type { CategorieHierarchique, NouvelleCategorieInput } from "./hierarchie.types";

export interface ApiCategories {
  lister(feuillesUniquement?: boolean): Promise<CategorieHierarchique[]>;
  creer(input: NouvelleCategorieInput): Promise<CategorieHierarchique>;
  changerParent(id: number, parentCode: string | null): Promise<CategorieHierarchique>;
}

function mapper(brut: unknown): CategorieHierarchique | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;

  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    code: String(o.code ?? "")
      .trim()
      .toUpperCase(),
    libelle: String(o.libelle ?? "").trim(),
    parentId: typeof o.parentId === "number" ? o.parentId : null,
    parentCode: typeof o.parentCode === "string" ? o.parentCode : null,
    niveau: typeof o.niveau === "number" ? o.niveau : 1,
    feuille: typeof o.feuille === "boolean" ? o.feuille : true,
    chemin: Array.isArray(o.chemin) ? o.chemin.map(String) : [],
  };
}

/**
 * Fabrique une API de catégories pour un chemin donné
 * (`/categorie_actes`, `/categorie_observations`). Les deux ressources
 * backend partagent strictement le même contrat, d'où la factorisation.
 */
export function creerApiCategories(chemin: string): ApiCategories {
  const base = "/" + chemin.replace(/^\/+|\/+$/g, "");

  return {
    async lister(feuillesUniquement = false): Promise<CategorieHierarchique[]> {
      const rep = await clientHttp<unknown>(base, {
        params: feuillesUniquement ? { feuilles: 1 } : undefined,
      });
      return extraireElementsCollection<unknown>(rep)
        .map(mapper)
        .filter((c): c is CategorieHierarchique => c !== null)
        .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
    },

    async creer(input: NouvelleCategorieInput): Promise<CategorieHierarchique> {
      const rep = await clientHttp<unknown>(base, {
        method: "POST",
        body: JSON.stringify({
          code: input.code.trim().toUpperCase(),
          libelle: input.libelle.trim(),
          parentCode: input.parentCode,
        }),
      });
      const c = mapper(rep);
      if (!c) throw new ErreurApi(500, "Réponse invalide à la création de la catégorie.");
      return c;
    },

    async changerParent(id: number, parentCode: string | null): Promise<CategorieHierarchique> {
      const rep = await clientHttp<unknown>(`${base}/${id}/parent`, {
        method: "POST",
        body: JSON.stringify({ parentCode }),
      });
      const c = mapper(rep);
      if (!c) throw new ErreurApi(500, "Réponse invalide au changement de parent.");
      return c;
    },
  };
}
