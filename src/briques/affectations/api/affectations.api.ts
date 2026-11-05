/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";

import type { DomaineService } from "@/briques/services/modele/service.types";

import {
  AffectationPersonnel,
  OptionPersonnel,
  OptionServiceSite,
  OptionSite,
  NouvelleAffectationInput,
  ModificationAffectationInput,
} from "../modele/affectation.types";

import { AssignmentOutputApi } from "./affectations.contrats";

import {
  mapperOptionPersonnel,
  mapperOptionSite,
  mapperOptionServiceSite,
  mapperAffectationDepuisApi,
  mapperNouvelleAffectationVersApi,
  mapperModificationAffectationVersApi,
} from "./affectations.mapping";

export const affectationsApi = {
  /**
   * Récupère les affectations et les référentiels nécessaires
   * (personnel, services, sites et types de services).
   */
  listerDonnees: async (): Promise<{
    affectations: AffectationPersonnel[];
    optionsPersonnel: OptionPersonnel[];
    optionsServices: OptionServiceSite[];
    optionsSites: OptionSite[];
  }> => {
    const [
      resAssignments,
      resStaffs,
      resServices,
      resSites,
      resTypeServices,
    ] = await Promise.allSettled([
      clientHttp<unknown>("/assignments", {
        params: { limit: 100 },
      }),
      clientHttp<unknown>("/staffs", {
        params: { limit: 100 },
      }),
      clientHttp<unknown>("/services"),
      clientHttp<unknown>("/sites"),
      clientHttp<unknown>("/type-services"),
    ]);

    // Extraction des sites en premier pour enrichir services et affectations.
    const elementsSites =
      resSites.status === "fulfilled"
        ? extraireElementsCollection<unknown>(resSites.value)
        : [];

    const optionsSites = elementsSites
      .map(mapperOptionSite)
      .filter((site): site is OptionSite => site !== null)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

    const dictSites = new Map<number, OptionSite>();

    optionsSites.forEach((site) => {
      dictSites.set(site.id, site);
    });

    // Construction du dictionnaire des domaines par type de service.
    const domainesParTypeService = new Map<number, DomaineService>();

    if (resTypeServices.status === "fulfilled") {
      const typeServicesRaw =
        extraireElementsCollection<Record<string, unknown>>(
          resTypeServices.value,
        );

      for (const typeService of typeServicesRaw) {
        const id = Number(typeService.id);

        const domaineBrut = String(typeService.domaine ?? "")
          .trim()
          .toUpperCase();

        if (
          Number.isFinite(id) &&
          id > 0 &&
          (
            domaineBrut === "MEDICAL" ||
            domaineBrut === "MEDICO_TECHNIQUE" ||
            domaineBrut === "ADMINISTRATIF" ||
            domaineBrut === "LOGISTIQUE"
          )
        ) {
          domainesParTypeService.set(
            id,
            domaineBrut as DomaineService,
          );
        }
      }
    }

    // Extraction du personnel depuis /staffs.
    // Tout membre du personnel peut être affecté, sauf les administrateurs.
    const elementsStaffs =
      resStaffs.status === "fulfilled"
        ? extraireElementsCollection<unknown>(resStaffs.value)
        : [];

    const dictStaff = new Map<number, OptionPersonnel>();
    const optionsPersonnelEligibles: OptionPersonnel[] = [];

    elementsStaffs.forEach((raw) => {
      // Dictionnaire complet pour résoudre les noms dans l'historique.
      const personnelComplet = mapperOptionPersonnel(raw, false);

      if (personnelComplet) {
        dictStaff.set(personnelComplet.id, personnelComplet);
      }

      // Options de la liste déroulante, sans les administrateurs.
      const personnelEligible = mapperOptionPersonnel(raw, true);

      if (personnelEligible) {
        optionsPersonnelEligibles.push(personnelEligible);
      }
    });

    const optionsPersonnel = optionsPersonnelEligibles.sort(
      (a, b) => a.nom.localeCompare(b.nom, "fr"),
    );

    // Extraction des services et enrichissement avec les sites et les domaines.
    const elementsServices =
      resServices.status === "fulfilled"
        ? extraireElementsCollection<unknown>(resServices.value)
        : [];

    const optionsServices = elementsServices
      .map((service) =>
        mapperOptionServiceSite(
          service,
          dictSites,
          domainesParTypeService,
        ),
      )
      .filter(
        (service): service is OptionServiceSite => service !== null,
      )
      .sort((a, b) =>
        a.nomService.localeCompare(b.nomService, "fr"),
      );

    const dictServices = new Map<number, OptionServiceSite>();

    optionsServices.forEach((service) => {
      dictServices.set(service.serviceId, service);
    });

    // Extraction et enrichissement des affectations.
    let elementsAssignments: unknown[] = [];

    if (resAssignments.status === "fulfilled") {
      elementsAssignments = extraireElementsCollection<unknown>(
        resAssignments.value,
      );
    } else {
      // Fallback sur /affectations si /assignments est indisponible.
      try {
        const fallbackAssignments =
          await clientHttp<unknown>("/affectations");

        elementsAssignments =
          extraireElementsCollection<unknown>(
            fallbackAssignments,
          );
      } catch {
        elementsAssignments = [];
      }
    }

    const affectations = elementsAssignments
      .map((item) =>
        mapperAffectationDepuisApi(
          item,
          dictStaff,
          dictServices,
          dictSites,
        ),
      )
      .filter(
        (affectation): affectation is AffectationPersonnel =>
          affectation !== null,
      )
      .sort((a, b) =>
        b.dateDebut.localeCompare(a.dateDebut),
      );

    return {
      affectations,
      optionsPersonnel,
      optionsServices,
      optionsSites,
    };
  },

  /**
   * Enregistre une nouvelle affectation de personnel.
   */
  creer: async (
    saisie: NouvelleAffectationInput,
  ): Promise<AssignmentOutputApi> => {
    const payload = mapperNouvelleAffectationVersApi(saisie);

    let reponse: AssignmentOutputApi;

    try {
      reponse = await clientHttp<AssignmentOutputApi>(
        "/assignments",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    } catch (err: unknown) {
      if (
        err instanceof ErreurApi &&
        (err.statut === 404 || err.statut === 405)
      ) {
        reponse = await clientHttp<AssignmentOutputApi>(
          "/affectations",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
      } else if (
        err instanceof ErreurApi &&
        err.statut === 400 &&
        /date/i.test(err.message)
      ) {
        // Secours si l'API attend strictement YYYY-MM-DD.
        const payloadDateBrute = {
          ...payload,
          dateDebut: saisie.dateDebut.trim(),
          dateFin: saisie.dateFin
            ? saisie.dateFin.trim()
            : null,
        };

        reponse = await clientHttp<AssignmentOutputApi>(
          "/assignments",
          {
            method: "POST",
            body: JSON.stringify(payloadDateBrute),
          },
        );
      } else {
        throw err;
      }
    }

    const reponseObj = reponse as
      | Record<string, unknown>
      | undefined;

    const atId =
      typeof reponseObj?.["@id"] === "string"
        ? (reponseObj["@id"] as string)
        : undefined;

    const idExtrait = Number(
      reponse?.id ??
        reponse?.Id_Affectation ??
        (atId ? atId.split("/").pop() : undefined),
    );

    return {
      ...reponse,
      id:
        Number.isFinite(idExtrait) && idExtrait > 0
          ? idExtrait
          : 1,
    };
  },

  /**
   * Met à jour une affectation via PATCH /assignments/{id}
   * avec PUT en secours.
   */
  modifier: async (
    id: number,
    saisie: ModificationAffectationInput,
  ): Promise<AssignmentOutputApi> => {
    const payload = mapperModificationAffectationVersApi(saisie);

    let reponse: AssignmentOutputApi | undefined;

    try {
      reponse = await clientHttp<AssignmentOutputApi>(
        `/assignments/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/merge-patch+json",
          },
          body: JSON.stringify(payload),
        },
      );
    } catch (err: unknown) {
      if (
        err instanceof ErreurApi &&
        (
          err.statut === 405 ||
          err.statut === 415 ||
          err.statut === 404
        )
      ) {
        try {
          reponse = await clientHttp<AssignmentOutputApi>(
            `/assignments/${id}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            },
          );
        } catch {
          reponse = await clientHttp<AssignmentOutputApi>(
            `/affectations/${id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/merge-patch+json",
              },
              body: JSON.stringify(payload),
            },
          );
        }
      } else {
        throw err;
      }
    }

    return reponse ?? { id };
  },

  /**
   * Supprime une affectation via DELETE /assignments/{id}
   * ou /affectations/{id} en secours.
   */
  supprimer: async (id: number): Promise<void> => {
    try {
      await clientHttp<void>(
        `/assignments/${id}`,
        {
          method: "DELETE",
        },
      );
    } catch (err: unknown) {
      if (err instanceof ErreurApi && err.statut === 404) {
        await clientHttp<void>(
          `/affectations/${id}`,
          {
            method: "DELETE",
          },
        );
      } else {
        throw err;
      }
    }
  },
};
