/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { SiteHospitalier, NouveauSiteInput, ModificationSiteInput } from "../modele/site.types";
import { SiteOutputApi } from "./sites.contrats";
import { mapperSite, mapperVersApi } from "./sites.mapping";

export const sitesApi = {
  /**
   * GET /api/sites : Liste tous les sites hospitaliers enregistrés
   */
  lister: async (): Promise<SiteHospitalier[]> => {
    const reponse = await clientHttp<unknown>("/sites");
    const elements = extraireElementsCollection<unknown>(reponse);

    return elements.map(mapperSite).filter((s): s is SiteHospitalier => s !== null);
  },

  /**
   * GET /api/sites/{id} : Détail d'un site
   */
  obtenirParId: async (id: number): Promise<SiteHospitalier> => {
    const reponse = await clientHttp<unknown>(`/sites/${id}`);
    const site = mapperSite(reponse);
    if (!site) {
      throw new ErreurApi(404, `Site introuvable (ID: ${id})`);
    }
    return site;
  },

  /**
   * POST /api/sites : Création d'un site
   */
  creer: async (saisie: NouveauSiteInput): Promise<SiteHospitalier> => {
    const payload = mapperVersApi(saisie);
    const reponse = await clientHttp<SiteOutputApi>("/sites", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const site = mapperSite(reponse);
    if (!site) {
      throw new ErreurApi(500, "L'API a répondu sans identifiant valide pour le nouveau site.");
    }
    return site;
  },

  /**
   * PUT /api/sites/{id} : Modification complète d'un site
   */
  modifier: async (id: number, saisie: ModificationSiteInput): Promise<SiteHospitalier> => {
    const payload = mapperVersApi(saisie);
    const reponse = await clientHttp<SiteOutputApi>(`/sites/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const site = mapperSite(reponse);
    if (!site) {
      throw new ErreurApi(
        500,
        "L'API a répondu sans identifiant valide lors de la modification du site.",
      );
    }
    return site;
  },

  /**
   * DELETE /api/sites/{id} : Suppression d'un site
   */
  supprimer: async (id: number): Promise<void> => {
    await clientHttp<void>(`/sites/${id}`, {
      method: "DELETE",
    });
  },
};
