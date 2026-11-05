/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { NouveauRendezVousInput, PatientOption, ServiceOption } from "../modele/rendez-vous.types";
import {
  RendezVousApiOutput,
  ConfirmerArriveeApiOutput,
  PatientApiSummary,
  ServiceApiSummary,
} from "./rendez-vous.contrats";
import {
  mapperNouveauRendezVousVersApi,
  mapperPatientOption,
  mapperServiceOption,
  extraireIdNumerique,
} from "./rendez-vous.mapping";

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

export const rendezVousApi = {
  /**
   * Récupère la collection des rendez-vous.
   * GET /api/rendez-vous?patientId=...
   */
  async lister(patientId?: number): Promise<RendezVousApiOutput[]> {
    const params: Record<string, string | number | boolean> = {};
    if (patientId !== undefined) {
      params.patientId = patientId;
      params.patient = patientId;
    }

    const reponse = await requeteAvecFallback<unknown>("/api/rendez-vous", "/rendez-vous", {
      params,
    });
    return extraireElementsCollection<RendezVousApiOutput>(reponse);
  },

  /**
   * Récupère un rendez-vous par son identifiant.
   * GET /api/rendez-vous/{id}
   */
  async obtenirParId(id: number): Promise<RendezVousApiOutput> {
    return requeteAvecFallback<RendezVousApiOutput>(`/api/rendez-vous/${id}`, `/rendez-vous/${id}`);
  },

  /**
   * Crée / réserve un nouveau rendez-vous.
   * POST /api/rendez-vous
   */
  async reserver(input: NouveauRendezVousInput): Promise<RendezVousApiOutput> {
    const payload = mapperNouveauRendezVousVersApi(input);
    return requeteAvecFallback<RendezVousApiOutput>("/api/rendez-vous", "/rendez-vous", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Annule un rendez-vous.
   * DELETE /api/rendez-vous/{id} avec basculement en PATCH statut: ANNULE si DELETE non supporté.
   */
  async annuler(id: number): Promise<void> {
    try {
      await requeteAvecFallback<void>(`/api/rendez-vous/${id}`, `/rendez-vous/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      // Si DELETE retourne 405 (Method Not Allowed) ou 501, passer en PATCH statut ANNULE
      if (
        err instanceof ErreurApi &&
        (err.statut === 405 || err.statut === 501 || err.statut === 400)
      ) {
        try {
          await clientHttp<unknown>(`/api/rendez-vous/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/merge-patch+json" },
            body: JSON.stringify({ statut: "ANNULE" }),
          });
          return;
        } catch {
          // Essai variante POST /api/rendez-vous/{id}/annuler
          await clientHttp<unknown>(`/api/rendez-vous/${id}/annuler`, {
            method: "POST",
          });
          return;
        }
      }
      throw err;
    }
  },

  /**
   * Confirme l'arrivée physique de l'adhérent et génère le ticket.
   * POST /api/rendez-vous/{id}/confirmer-arrivee
   */
  async confirmerArrivee(
    id: number,
    siteId: number,
    premierServiceId: number,
  ): Promise<ConfirmerArriveeApiOutput> {
    const payload = {
      siteId,
      site: `/api/sites/${siteId}`,
      premierServiceId,
      premierService: `/api/services/${premierServiceId}`,
      serviceId: premierServiceId,
      service: `/api/services/${premierServiceId}`,
    };

    const reponse = await requeteAvecFallback<ConfirmerArriveeApiOutput>(
      `/api/rendez-vous/${id}/confirmer-arrivee`,
      `/rendez-vous/${id}/confirmer-arrivee`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    // Extraction uniforme des données du ticket généré
    const repObj = (reponse && typeof reponse === "object" ? reponse : {}) as Record<
      string,
      unknown
    >;
    const ticketObj = (
      repObj.ticket && typeof repObj.ticket === "object" ? repObj.ticket : null
    ) as Record<string, unknown> | null;

    const ticketId =
      extraireIdNumerique(repObj.ticketId) ??
      extraireIdNumerique(ticketObj?.id) ??
      extraireIdNumerique(repObj.id) ??
      0;

    const numTicket = String(
      repObj.numTicket ??
        ticketObj?.numTicket ??
        ticketObj?.numero ??
        repObj.numero ??
        (ticketId ? `T-${ticketId}` : "T-001"),
    );

    const statutTicket = String(
      repObj.statutTicket ?? ticketObj?.statut ?? repObj.statut ?? "EN_ATTENTE",
    );

    const dateEmissionTicket = String(
      repObj.dateEmissionTicket ??
        ticketObj?.dateEmission ??
        repObj.dateEmission ??
        new Date().toISOString(),
    );

    return {
      rendezVousId: id,
      ticketId,
      numTicket,
      statutTicket,
      dateEmissionTicket,
    };
  },

  /**
   * Récupère les patients pour le formulaire de planification.
   * GET /api/patients
   */
  async listerPatients(): Promise<PatientOption[]> {
    const reponse = await requeteAvecFallback<unknown>("/api/patients", "/patients");
    const items = extraireElementsCollection<PatientApiSummary>(reponse);
    return items.map(mapperPatientOption);
  },

  /**
   * Récupère les services d'orientation pour le site actif.
   * GET /api/services
   */
  async listerServices(siteId?: number): Promise<ServiceOption[]> {
    const reponse = await requeteAvecFallback<unknown>("/api/services", "/services");
    const items = extraireElementsCollection<ServiceApiSummary>(reponse);
    const actifs = items.filter((s) => s.isActive !== false);
    const filtres = siteId
      ? actifs.filter((s) => s.siteId === siteId || s.idSite === siteId)
      : actifs;
    const aConserver = filtres.length > 0 ? filtres : actifs;
    return aConserver.map(mapperServiceOption);
  },
};
