/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { OrienterPatientApiInput } from "./soins-actes.contrats";
import { extraireElementsCollection } from "@/noyau/http/collection";
import {
  ActeRealiseApiOutput,
  LigneDemandeApiOutput,
  ActeDefinitionApiOutput,
  SaisieActeApiInput,
  AddObservationApiInput,
  AddResultatApiInput,
  EncounterTermineApiOutput,
} from "./soins-actes.contrats";
import {
  mapperActeSaisi,
  mapperActeDemande,
  mapperDefinitionCatalogue,
} from "./soins-actes.mapping";
import {
  ActeSaisiItem,
  ActeDemandeItem,
  DefinitionActeCatalogue,
  StatutActe,
} from "../modele/soin-acte.types";

export const soinsActesApi = {
  async listerActesEncounter(encounterId: number): Promise<ActeSaisiItem[]> {
    const raw = await clientHttp<unknown>("/acte_realises", {
      params: { encounterId },
    });
    const items = extraireElementsCollection<ActeRealiseApiOutput>(raw);
    return items.map(mapperActeSaisi);
  },

  async listerActesAFaire(patientId?: number, urgentes?: boolean): Promise<ActeDemandeItem[]> {
    const raw = await clientHttp<unknown>("/me/actes_a_faire", {
      params: {
        patientId,
        urgentes: urgentes ? 1 : undefined,
      },
    });
    const items = extraireElementsCollection<LigneDemandeApiOutput>(raw);
    return items.map(mapperActeDemande);
  },

  /**
   * Actes que le soignant connecté peut réaliser sur cette prise en charge.
   * Le filtrage par rôle + type de service est fait par le backend
   * (ActeDefinition::estRealisablePar), on ne fait AUCUN filtre ici.
   *
   * Endpoint : GET /api/me/actes_realisables?encounterId=X
   */
  async listerCatalogueRealisable(encounterId: number): Promise<DefinitionActeCatalogue[]> {
    const raw = await clientHttp<unknown>("/me/actes_realisables", {
      params: { encounterId },
    });
    const items = extraireElementsCollection<ActeDefinitionApiOutput>(raw);
    return items
      .map(mapperDefinitionCatalogue)
      .filter((a) => a.actif)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },

  async recupererObservationsAttendues(acteDefinitionId: number) {
    interface ActeObsReponse {
      acteDefinitionId: number;
      observations: {
        ordre: number;
        obligatoire: boolean;
        observation: {
          id: number;
          code: string;
          libelle: string;
          typeValeur: string;
          actif: boolean;
          uniteId: number | null;
          uniteCode: string | null;
          uniteLibelle: string | null;
        };
      }[];
    }
    const raw = await clientHttp<ActeObsReponse>(
      `/acte_definitions/${acteDefinitionId}/observations`,
    );
    return raw?.observations || [];
  },

  async saisirActe(input: SaisieActeApiInput): Promise<ActeSaisiItem> {
    const raw = await clientHttp<ActeRealiseApiOutput>("/acte_realises", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapperActeSaisi(raw);
  },

  async changerStatut(acteId: number, statut: StatutActe): Promise<ActeSaisiItem> {
    const raw = await clientHttp<ActeRealiseApiOutput>(`/acte_realises/${acteId}/statut`, {
      method: "POST",
      body: JSON.stringify({ statut }),
    });
    return mapperActeSaisi(raw);
  },

  async ajouterObservation(acteId: number, input: AddObservationApiInput): Promise<ActeSaisiItem> {
    const raw = await clientHttp<ActeRealiseApiOutput>(`/acte_realises/${acteId}/observations`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapperActeSaisi(raw);
  },

  async ajouterResultat(acteId: number, input: AddResultatApiInput): Promise<ActeSaisiItem> {
    const raw = await clientHttp<ActeRealiseApiOutput>(`/acte_realises/${acteId}/resultats`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapperActeSaisi(raw);
  },

  async terminerEncounter(encounterId: number, forcer = false): Promise<EncounterTermineApiOutput> {
    return clientHttp<EncounterTermineApiOutput>(`/encounters/${encounterId}/terminer`, {
      method: "POST",
      params: { forcer: forcer ? 1 : undefined },
    });
  },

  /** Réoriente le patient vers un autre service (même ticket, nouvel aiguillage). */
  async orienterPatient(encounterId: number, serviceId: number): Promise<void> {
    await clientHttp<void>(`/encounters/${encounterId}/orienter`, {
      method: "POST",
      body: JSON.stringify({ serviceId } satisfies OrienterPatientApiInput),
    });
  },
};
