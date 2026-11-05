/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp, telechargerFichierBlob } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  EntreprisePartenaire,
  NouvelleEntrepriseInput,
  ModificationEntrepriseInput,
} from "../modele/entreprise.types";
import { mapperEntreprise, mapperCreateVersApi, mapperUpdateVersApi } from "./entreprises.mapping";

async function requeteAvecFallback<T>(
  cheminPrincipal: string,
  cheminRepli: string,
  options?: Parameters<typeof clientHttp>[1],
): Promise<T> {
  try {
    return await clientHttp<T>(cheminPrincipal, options);
  } catch (err) {
    if (err instanceof ErreurApi && err.statut === 404) {
      return await clientHttp<T>(cheminRepli, options);
    }
    throw err;
  }
}

export const entreprisesApi = {
  /**
   * GET /api/entreprises (ou /api/companies) : Liste des entreprises conventionnées
   */
  lister: async (): Promise<EntreprisePartenaire[]> => {
    const reponse = await requeteAvecFallback<unknown>("/entreprises", "/companies");
    const elements = extraireElementsCollection<unknown>(reponse);

    return elements.map(mapperEntreprise).filter((e): e is EntreprisePartenaire => e !== null);
  },

  /**
   * GET /api/entreprises/{id} : Détail d'une entreprise
   */
  obtenirParId: async (id: number): Promise<EntreprisePartenaire> => {
    const reponse = await requeteAvecFallback<unknown>(`/entreprises/${id}`, `/companies/${id}`);
    const entreprise = mapperEntreprise(reponse);
    if (!entreprise) {
      throw new ErreurApi(404, `Entreprise introuvable (ID: ${id})`);
    }
    return entreprise;
  },

  /**
   * POST /api/entreprises : Création d'une entreprise conventionnée
   */
  creer: async (saisie: NouvelleEntrepriseInput): Promise<EntreprisePartenaire> => {
    const payload = mapperCreateVersApi(saisie); // ⬅️ mapper dédié, avec smie
    const reponse = await requeteAvecFallback<unknown>("/entreprises", "/companies", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const entreprise = mapperEntreprise(reponse);
    if (!entreprise) {
      throw new ErreurApi(
        500,
        "L'API a répondu sans identifiant valide pour la nouvelle entreprise.",
      );
    }
    return entreprise;
  },

  /**
   * GET /api/entreprises/{id}/cartes-adherents : Téléchargement du carnet de cartes d'adhérents (PDF)
   */
  telechargerCartesAdherentsPdf: async (id: number, nomEntreprise?: string): Promise<void> => {
    const nomFichier = nomEntreprise
      ? `cartes-adherents-${nomEntreprise.toLowerCase().replace(/[^a-z0-9_-]+/g, "-")}.pdf`
      : `cartes-adherents-entreprise-${id}.pdf`;
    return telechargerFichierBlob(`/entreprises/${id}/cartes-adherents`, nomFichier);
  },

  modifier: async (
    id: number,
    saisie: ModificationEntrepriseInput,
  ): Promise<EntreprisePartenaire> => {
    const payload = mapperUpdateVersApi(saisie); // ⬅️ mapper dédié, sans smie
    let reponse: unknown;
    try {
      reponse = await requeteAvecFallback<unknown>(`/entreprises/${id}`, `/companies/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ErreurApi && (err.statut === 405 || err.statut === 501)) {
        reponse = await requeteAvecFallback<unknown>(`/entreprises/${id}`, `/companies/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/merge-patch+json" },
          body: JSON.stringify(payload),
        });
      } else {
        throw err;
      }
    }

    const entreprise = mapperEntreprise(reponse);
    if (!entreprise) {
      throw new ErreurApi(
        500,
        "L'API a répondu sans identifiant valide lors de la modification de l'entreprise.",
      );
    }
    return entreprise;
  },

  /**
   * DELETE /api/entreprises/{id} : Suppression d'une entreprise conventionnée
   */
  supprimer: async (id: number): Promise<void> => {
    await requeteAvecFallback<void>(`/entreprises/${id}`, `/companies/${id}`, {
      method: "DELETE",
    });
  },
};

export default entreprisesApi;
