/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TicketAiguillage,
  StatutAiguillage,
  PatientOption,
  ServiceOption,
  TicketEmisResultat,
} from "../modele/tickets-accueil.types";
import {
  AiguillageApiOutput,
  TicketApiOutput,
  PatientApiSummary,
  ServiceApiSummary,
} from "./tickets-accueil.contrats";

export function calculerAttenteMinutes(dateIso: string): number {
  try {
    const debut = new Date(dateIso).getTime();
    const maintenant = Date.now();
    const diff = Math.floor((maintenant - debut) / (1000 * 60));
    return Math.max(0, diff);
  } catch {
    return 0;
  }
}

export function formaterHeure(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    // fallback
  }
  return "--:--";
}

export function extraireIdNumerique(valeur: unknown): number | null {
  if (typeof valeur === "number" && Number.isFinite(valeur) && valeur > 0) {
    return valeur;
  }
  if (typeof valeur === "string") {
    const s = valeur.trim();
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    const match = s.match(/\/(\d+)$/);
    if (match) {
      const n = Number(match[1]);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
  }
  if (valeur && typeof valeur === "object") {
    const obj = valeur as Record<string, unknown>;
    return extraireIdNumerique(obj.id ?? obj.Id ?? obj["@id"]);
  }
  return null;
}

export function mapperAiguillage(
  raw: unknown,
  statut: StatutAiguillage,
  patientsMap?: Map<number, PatientApiSummary>,
  servicesMap?: Map<number, ServiceApiSummary>,
): TicketAiguillage {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const id = extraireIdNumerique(obj.id ?? obj["@id"]) ?? 0;

  // Extraction ticket
  const ticketObj = (obj.ticket && typeof obj.ticket === "object" ? obj.ticket : null) as Record<
    string,
    unknown
  > | null;
  const ticketId =
    extraireIdNumerique(obj.ticketId) ??
    extraireIdNumerique(ticketObj?.id) ??
    extraireIdNumerique(obj.ticket) ??
    0;

  const numTicket = String(
    obj.numTicket ??
      ticketObj?.numTicket ??
      ticketObj?.numero ??
      ticketObj?.code ??
      (ticketId ? `T-${ticketId}` : `T-${id}`),
  );

  // Extraction patient
  let patientId =
    extraireIdNumerique(obj.patientId ?? obj.idPatient ?? obj.Id_Patient) ??
    extraireIdNumerique(ticketObj?.patientId ?? ticketObj?.patient);

  let patientNomDirect: string | undefined;
  let patientMatriculeDirect: string | undefined;

  const patientObj = (ticketObj?.patient ?? obj.patient) as
    Record<string, unknown> | string | undefined;
  if (patientObj && typeof patientObj === "object") {
    const idTrouve = extraireIdNumerique(patientObj.id ?? patientObj.Id_Patient);
    if (idTrouve) patientId = idTrouve;

    const nom = String(patientObj.nom ?? patientObj.lastName ?? "").trim();
    const prenom = String(patientObj.prenom ?? patientObj.firstName ?? "").trim();
    if (nom || prenom) {
      patientNomDirect = `${nom} ${prenom}`.trim();
    }
    if (typeof patientObj.matricule === "string" && patientObj.matricule.trim()) {
      patientMatriculeDirect = patientObj.matricule.trim();
    }
  } else if (typeof patientObj === "string") {
    const idTrouve = extraireIdNumerique(patientObj);
    if (idTrouve && !patientId) patientId = idTrouve;
  }

  const patientFromMap = patientId ? patientsMap?.get(patientId) : undefined;
  const patientNom =
    patientNomDirect ||
    (patientFromMap
      ? `${patientFromMap.nom || ""} ${patientFromMap.prenom || ""}`.trim()
      : undefined);
  const patientMatricule = patientMatriculeDirect || patientFromMap?.matricule;

  // Extraction service
  const serviceObj = (
    obj.service && typeof obj.service === "object" ? obj.service : null
  ) as Record<string, unknown> | null;
  const serviceId =
    extraireIdNumerique(obj.serviceId) ??
    extraireIdNumerique(serviceObj?.id) ??
    extraireIdNumerique(obj.service) ??
    0;

  const serviceFromMap = serviceId ? servicesMap?.get(serviceId) : undefined;
  const serviceNom = String(
    obj.serviceNom ??
      serviceObj?.typeServiceName ??
      serviceObj?.nom ??
      serviceObj?.libelle ??
      serviceObj?.title ??
      serviceFromMap?.typeServiceName ??
      serviceFromMap?.nom ??
      serviceFromMap?.libelle ??
      (serviceId ? `Service #${serviceId}` : "Accueil"),
  );

  const dateAiguillage = String(
    obj.dateAiguillage ??
      obj.date ??
      obj.createdAt ??
      ticketObj?.dateEmission ??
      new Date().toISOString(),
  );

  return {
    id,
    ticketId,
    numTicket,
    patientId: patientId ?? 0,
    patientNom: patientNom || (patientId ? `Patient #${patientId}` : undefined),
    patientMatricule,
    serviceId,
    serviceNom,
    statut,
    dateAiguillage,
    heureAffichee: formaterHeure(dateAiguillage),
    dureeAttenteMinutes: calculerAttenteMinutes(dateAiguillage),
  };
}

export function mapperTicketEmis(raw: unknown): TicketEmisResultat {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const id = extraireIdNumerique(obj.id ?? obj["@id"]) ?? 0;
  const numTicket = String(obj.numTicket ?? obj.numero ?? obj.code ?? (id ? `T-${id}` : "T-001"));

  const statut = String(obj.statut ?? "EN_ATTENTE");
  const dateEmission = String(obj.dateEmission ?? obj.createdAt ?? new Date().toISOString());
  const estAssocieAUnRendezVous = Boolean(
    obj.estAssocieAUnRendezVous || obj.rendezVous || obj.rendezVousId,
  );

  return {
    id,
    numTicket,
    statut,
    dateEmission,
    estAssocieAUnRendezVous,
  };
}

export function mapperPatientOption(raw: PatientApiSummary): PatientOption {
  const nom = (raw.nom ?? raw.lastName ?? "").trim();
  const prenom = (raw.prenom ?? raw.firstName ?? "").trim();
  const nomComplet = raw.nomComplet || `${nom} ${prenom}`.trim() || `Patient #${raw.id}`;

  return {
    id: raw.id,
    nomComplet,
    matricule: raw.matricule || `PAT-${raw.id}`,
  };
}

export function mapperServiceOption(raw: ServiceApiSummary): ServiceOption {
  const nom =
    (raw.typeServiceName && raw.typeServiceName.trim()) ||
    (raw.nom && raw.nom.trim()) ||
    (raw.libelle && raw.libelle.trim()) ||
    (raw.title && raw.title.trim()) ||
    `Service #${raw.id}`;
  return {
    id: raw.id,
    nom,
  };
}
