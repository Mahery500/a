/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import type { HistoriqueMedicalPatientApiOutput } from "./historique-medical.contrats";

export const historiqueMedicalApi = {
  /**
   * Endpoint Symfony : GET /patients/{id}/historique_medical?page=&limit=
   * Réponse : un seul objet (pas une collection Hydra), donc pas d'extraireElementsCollection.
   */
  async recuperer(
    patientId: number,
    page = 1,
    limit = 10,
  ): Promise<HistoriqueMedicalPatientApiOutput> {
    return clientHttp<HistoriqueMedicalPatientApiOutput>(
      `/patients/${patientId}/historique_medical`,
      { params: { page, limit } },
    );
  },
};