/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistoriqueActeApiOutput } from "./infirmerie-historique.contrats";
import { ActeHistorique } from "../modele/infirmerie-historique.types";

export function mapperActeHistorique(
  api: HistoriqueActeApiOutput,
  nomPatient: string,
): ActeHistorique {
  return {
    id: api.id,
    encounterId: api.encounterId,
    patientId: api.patientId,
    patientNom: nomPatient || `Patient #${api.patientId}`,
    serviceId: api.serviceId,
    acteDefinitionId: api.acteDefinitionId,
    acteDefinitionCode: api.acteDefinitionCode,
    acteDefinitionLibelle: api.acteDefinitionLibelle,
    dateRealisation: api.dateRealisation,
    statut: api.statut,
    saisiParErreur: Boolean(api.saisiParErreur),
    commentaire: api.commentaire,
    observations: api.observations || [],
    resultats: api.resultats || [],
  };
}
