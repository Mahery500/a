/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import {
  PatientApiOutput,
  EncounterApiOutput,
  DiagnosticApiOutput,
  ActeRealiseApiOutput,
} from "./dossier-medical.contrats";
import {
  mapperPatientDossier,
  mapperDiagnosticDossier,
  mapperActeDossier,
} from "./dossier-medical.mapping";
import { PatientDossierResume, EncounterHistoriqueItem } from "../modele/dossier-medical.types";

export const dossiersMedicauxApi = {
  async rechercherPatients(recherche?: string): Promise<PatientDossierResume[]> {
    const raw = await clientHttp<unknown>("/patients", {
      params: recherche?.trim() ? { recherche: recherche.trim() } : undefined,
    });
    const items = extraireElementsCollection<PatientApiOutput>(raw);
    return items.map(mapperPatientDossier);
  },

  async obtenirPatient(patientId: number): Promise<PatientDossierResume> {
    const raw = await clientHttp<PatientApiOutput>(`/patients/${patientId}`);
    return mapperPatientDossier(raw);
  },

  async listerEncountersPatient(patientId: number): Promise<EncounterHistoriqueItem[]> {
    const raw = await clientHttp<unknown>("/encounters", {
      params: { patientId },
    });
    const encounters = extraireElementsCollection<EncounterApiOutput>(raw);

    // Charger les diagnostics et actes associés à chaque encounter
    return Promise.all(
      encounters.map(async (enc) => {
        const [diagsRaw, actesRaw] = await Promise.all([
          clientHttp<unknown>("/diagnostics", { params: { encounterId: enc.id } }).catch(() => []),
          clientHttp<unknown>("/acte_realises", { params: { encounterId: enc.id } }).catch(
            () => [],
          ),
        ]);

        const diags =
          extraireElementsCollection<DiagnosticApiOutput>(diagsRaw).map(mapperDiagnosticDossier);
        const actes =
          extraireElementsCollection<ActeRealiseApiOutput>(actesRaw).map(mapperActeDossier);

        return {
          id: enc.id,
          dateDebut: enc.dateDebut,
          dateFin: enc.dateFin,
          serviceId: enc.serviceId,
          siteId: enc.siteId,
          statut: enc.statut,
          diagnostics: diags,
          actes,
        };
      }),
    );
  },
};
