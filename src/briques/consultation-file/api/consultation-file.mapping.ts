/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FileAttenteItemApi,
  PatientEnCoursApi,
  PatientDetailsApi,
} from "./consultation-file.contrats";
import { PatientFileMedecin, ConsultationEnCours } from "../modele/consultation-file.types";

export function mapperPatientFile(
  api: FileAttenteItemApi,
  details?: PatientDetailsApi | null,
): PatientFileMedecin {
  const nom = details
    ? [details.Prenom || details.prenom, details.Nom || details.nom]
        .filter(Boolean)
        .join(" ")
        .trim()
    : `Patient #${api.patientId}`;

  return {
    position: api.position,
    aiguillageId: api.aiguillageId,
    ticketId: api.ticketId,
    numTicket: api.numTicket,
    patientId: api.patientId,
    patientNom: nom || `Patient #${api.patientId}`,
    matricule: details?.Matricule || details?.matricule,
    groupeSanguin: details?.GS || details?.gs,
    type: api.type === "RDV" ? "RDV" : "SANS_RDV",
    dateAiguillage: api.dateAiguillage,
    attenteMinutes: api.attenteMinutes,
    appele: Boolean(api.appele),
    appelExpire: Boolean(api.appelExpire),
    dateAppel: api.dateAppel ?? null,
  };
}

export function mapperConsultationEnCours(
  api: PatientEnCoursApi,
  nomPatient?: string | null,
): ConsultationEnCours {
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

import {
  FileAttenteItemApi,
  PatientEnCoursApi,
  PatientDetailsApi,
  RendezVousDuJourApi,
} from "./consultation-file.contrats";
import {
  PatientFileMedecin,
  ConsultationEnCours,
  RendezVousDuJourMedecin,
} from "../modele/consultation-file.types";

export function mapperRendezVousDuJour(
  api: RendezVousDuJourApi,
  nomPatient: string | null,
): RendezVousDuJourMedecin {
  return {
    id: api.id,
    heure: api.heure,
    patientId: api.patientId,
    patientNom: nomPatient ?? `Patient #${api.patientId}`,
    motif: api.motif?.trim() || "Consultation médicale",
    statut: api.statut,
    etat: api.etat,
    numTicket: api.numTicket ?? null,
    encounterId: api.encounterId ?? null,
  };
}