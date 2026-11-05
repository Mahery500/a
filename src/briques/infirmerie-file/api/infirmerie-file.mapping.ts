/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FileAttenteItemApi,
  PatientEnCoursApi,
  RendezVousDuJourApi,
  LigneActeAFaireApi,
  PriseEnChargeApi,
} from "./infirmerie-file.contrats";
import {
  PatientFileAttente,
  PatientEnCours,
  RendezVousDuJour,
  ActeAFaire,
  PriseEnChargeResultat,
} from "../modele/infirmerie-file.types";

export function mapperItemFileAttente(
  api: FileAttenteItemApi,
  nomPatient: string,
): PatientFileAttente {
  return {
    position: api.position,
    aiguillageId: api.aiguillageId,
    ticketId: api.ticketId,
    numTicket: api.numTicket,
    patientId: api.patientId,
    patientNom: nomPatient || `Patient #${api.patientId}`,
    type: api.type === "RDV" ? "RDV" : "SANS_RDV",
    dateAiguillage: api.dateAiguillage,
    attenteMinutes: api.attenteMinutes,
    appele: Boolean(api.appele),
    appelExpire: Boolean(api.appelExpire),
    dateAppel: api.dateAppel ?? null,
  };
}

export function mapperPatientEnCours(
  api: PatientEnCoursApi,
  nomPatient?: string | null,
): PatientEnCours {
  return {
    enCours: Boolean(api.enCours),
    aiguillageId: api.aiguillageId,
    encounterId: api.encounterId,
    ticketId: api.ticketId,
    numTicket: api.numTicket,
    patientId: api.patientId,
    patientNom: nomPatient ?? (api.patientId ? `Patient #${api.patientId}` : null),
    debut: api.debut,
    dureeMinutes: api.dureeMinutes,
  };
}

export function mapperRendezVousDuJour(
  api: RendezVousDuJourApi,
  nomPatient: string,
): RendezVousDuJour {
  return {
    id: api.id,
    heure: api.heure,
    patientId: api.patientId,
    patientNom: nomPatient || `Patient #${api.patientId}`,
    statut: api.statut,
    etat: api.etat,
  };
}

export function mapperActeAFaire(api: LigneActeAFaireApi, nomPatient: string): ActeAFaire {
  return {
    id: api.id,
    demandeId: api.demandeId,
    encounterId: api.encounterId,
    patientId: api.patientId,
    patientNom: nomPatient || `Patient #${api.patientId}`,
    acteDefinitionId: api.acteDefinitionId,
    acteDefinitionCode: api.acteDefinitionCode,
    acteDefinitionLibelle: api.acteDefinitionLibelle,
    urgente: Boolean(api.urgente),
    priorite: api.priorite,
    commentaire: api.commentaire,
    dateDemande: api.dateDemande,
  };
}

export function mapperPriseEnCharge(api: PriseEnChargeApi): PriseEnChargeResultat {
  return {
    aiguillageId: api.aiguillageId,
    ticketId: api.ticketId,
    numTicket: api.numTicket,
    patientId: api.patientId,
    encounterId: api.encounterId,
  };
}
