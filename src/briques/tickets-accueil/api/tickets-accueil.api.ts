/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  NouveauTicketInput,
  TicketEmisResultat,
  PatientOption,
  ServiceOption,
} from "../modele/tickets-accueil.types";
import {
  AiguillageApiOutput,
  TicketApiOutput,
  PatientApiSummary,
  ServiceApiSummary,
} from "./tickets-accueil.contrats";
import {
  mapperTicketEmis,
  mapperPatientOption,
  mapperServiceOption,
} from "./tickets-accueil.mapping";

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

export const ticketsAccueilApi = {
  /**
   * Récupère la liste des aiguillages d'un site selon leur statut.
   * GET /api/aiguillages?siteId=...&statut=EN_ATTENTE|EN_COURS
   */
  async listerAiguillages(
    siteId: number,
    statut: "EN_ATTENTE" | "EN_COURS",
  ): Promise<AiguillageApiOutput[]> {
    const params: Record<string, string | number> = {
      siteId,
      site: siteId,
      statut,
    };

    const reponse = await requeteAvecFallback<unknown>("/api/aiguillages", "/aiguillages", {
      params,
    });
    return extraireElementsCollection<AiguillageApiOutput>(reponse);
  },

  /**
   * Émet un nouveau ticket de file d'attente (visite spontanée ou rendez-vous).
   * POST /api/tickets
   */
  async emettreTicket(input: NouveauTicketInput): Promise<TicketEmisResultat> {
    const payload = {
      siteId: Number(input.siteId),
      site: `/api/sites/${input.siteId}`,
      patientId: Number(input.patientId),
      patient: `/api/patients/${input.patientId}`,
      premierServiceId: Number(input.premierServiceId),
      premierService: `/api/services/${input.premierServiceId}`,
      serviceId: Number(input.premierServiceId),
      service: `/api/services/${input.premierServiceId}`,
    };

    const raw = await requeteAvecFallback<TicketApiOutput>("/api/tickets", "/tickets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapperTicketEmis(raw);
  },

  /**
   * Récupère la liste des patients pour le guichet d'émission.
   * GET /api/patients
   */
  async listerPatients(): Promise<PatientOption[]> {
    const reponse = await requeteAvecFallback<unknown>("/api/patients", "/patients");
    const items = extraireElementsCollection<PatientApiSummary>(reponse);
    return items.map(mapperPatientOption);
  },

  /**
   * Récupère les services disponibles sur le site pour l'aiguillage initial.
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
