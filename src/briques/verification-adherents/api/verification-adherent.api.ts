/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { extraireElementsCollection } from "@/noyau/http/collection";

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
import {
  AdherentComplet,
  RendezVousDuJour,
  ServiceOrientationOption,
  ResultatConfirmationArrivee,
  ResultatEmissionTicket,
} from "../modele/verification-adherent.types";
import {
  PatientApiOutput,
  RendezVousApiOutput,
  ConfirmerArriveeApiOutput,
  EmettreTicketApiOutput,
  ServiceApiOutput,
} from "./verification-adherent.contrats";
import {
  mapperAdherent,
  mapperRendezVous,
  mapperServiceOrientation,
  mapperResultatConfirmation,
  mapperResultatTicket,
} from "./verification-adherent.mapping";

export const verificationAdherentApi = {
  /**
   * Recherche dynamique de patients/adhérents par nom, prénom ou matricule.
   * GET /api/patients?recherche=...
   */
  async rechercher(terme: string, signal?: AbortSignal): Promise<AdherentComplet[]> {
    if (!terme.trim()) return [];
    const donnees = await requeteAvecFallback<unknown>("/api/patients", "/patients", {
      params: { recherche: terme.trim() },
      signal,
    });
    const items = extraireElementsCollection<PatientApiOutput>(donnees);
    return items.map(mapperAdherent);
  },

  /**
   * Récupère la fiche détaillée d'un adhérent.
   * GET /api/patients/{id}
   */
  async obtenirParId(patientId: number): Promise<AdherentComplet> {
    const raw = await requeteAvecFallback<PatientApiOutput>(
      `/api/patients/${patientId}`,
      `/patients/${patientId}`,
    );
    return mapperAdherent(raw);
  },

  /**
   * Récupère les rendez-vous d'un patient.
   * GET /api/rendez-vous?patientId=...
   */
  async listerRendezVous(patientId: number): Promise<RendezVousDuJour[]> {
    const donnees = await requeteAvecFallback<unknown>("/api/rendez-vous", "/rendez-vous", {
      params: { patientId },
    });
    const items = extraireElementsCollection<RendezVousApiOutput>(donnees);
    return items.map(mapperRendezVous);
  },

  /**
   * Confirme la présence physique de l'adhérent pour un rendez-vous planifié.
   * POST /api/rendez-vous/{id}/confirmer-arrivee
   * Génère atomiquement le ticket de file d'attente associé.
   */
  async confirmerArrivee(
    rendezVousId: number,
    siteId: number,
    premierServiceId: number,
  ): Promise<ResultatConfirmationArrivee> {
    const payload = {
      siteId: Number(siteId),
      site: `/api/sites/${siteId}`,
      premierServiceId: Number(premierServiceId),
      premierService: `/api/services/${premierServiceId}`,
      serviceId: Number(premierServiceId),
      service: `/api/services/${premierServiceId}`,
    };

    let raw: ConfirmerArriveeApiOutput;
    try {
      raw = await clientHttp<ConfirmerArriveeApiOutput>(
        `/api/rendez-vous/${rendezVousId}/confirmer-arrivee`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      if (err instanceof ErreurApi && err.statut === 404) {
        raw = await clientHttp<ConfirmerArriveeApiOutput>(
          `/rendez-vous/${rendezVousId}/confirmer-arrivee`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
      } else {
        throw err;
      }
    }
    return mapperResultatConfirmation(raw);
  },

  /**
   * Émet un ticket de file d'attente pour une visite spontanée (sans RDV).
   * POST /api/tickets
   */
  async emettreTicketSpontane(
    patientId: number,
    siteId: number,
    premierServiceId: number,
  ): Promise<ResultatEmissionTicket> {
    // Aligné strictement sur EmettreTicketRequest Symfony (supporte IDs scalaires et IRIs API Platform)
    const payload = {
      siteId: Number(siteId),
      site: `/api/sites/${siteId}`,
      patientId: Number(patientId),
      patient: `/api/patients/${patientId}`,
      premierServiceId: Number(premierServiceId),
      premierService: `/api/services/${premierServiceId}`,
      serviceId: Number(premierServiceId),
      service: `/api/services/${premierServiceId}`,
    };

    let raw: EmettreTicketApiOutput;
    try {
      raw = await clientHttp<EmettreTicketApiOutput>("/api/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      if (err instanceof ErreurApi && err.statut === 404) {
        raw = await clientHttp<EmettreTicketApiOutput>("/tickets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        throw err;
      }
    }
    return mapperResultatTicket(raw);
  },

  /**
   * Récupère les services disponibles pour orienter le patient.
   * GET /api/services
   */
  async listerServicesOrientation(siteId?: number): Promise<ServiceOrientationOption[]> {
    const donnees = await requeteAvecFallback<unknown>("/api/services", "/services");
    const items = extraireElementsCollection<ServiceApiOutput>(donnees);

    // Ne retenir que les services actifs
    const actifs = items.filter((s) => s.isActive !== false);

    // Filtrer par site si un identifiant de site est précisé
    const filtres = siteId
      ? actifs.filter((s) => s.siteId === siteId || s.idSite === siteId)
      : actifs;

    // Si des services sont configurés pour ce site, on les retourne.
    // Sinon repli gracieux sur l'ensemble des services actifs.
    const aConserver = filtres.length > 0 ? filtres : actifs;

    return aConserver.map(mapperServiceOrientation);
  },
};
