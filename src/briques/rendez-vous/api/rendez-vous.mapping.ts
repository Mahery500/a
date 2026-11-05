/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RendezVous,
  NouveauRendezVousInput,
  PatientOption,
  ServiceOption,
  StatutRendezVous,
} from "../modele/rendez-vous.types";
import {
  RendezVousApiOutput,
  ReserverRendezVousApiRequest,
  PatientApiSummary,
  ServiceApiSummary,
} from "./rendez-vous.contrats";

export function estAujourdHui(dateRdvIso: string): boolean {
  try {
    const d = new Date(dateRdvIso);
    const mnt = new Date();
    return (
      d.getFullYear() === mnt.getFullYear() &&
      d.getMonth() === mnt.getMonth() &&
      d.getDate() === mnt.getDate()
    );
  } catch {
    return false;
  }
}

export function estPasse(dateRdvIso: string): boolean {
  try {
    const d = new Date(dateRdvIso);
    const mnt = new Date();
    mnt.setHours(0, 0, 0, 0);
    return d < mnt;
  } catch {
    return false;
  }
}

export function formaterDate(dateRdvIso: string): { dateAffichee: string; heureAffichee: string } {
  try {
    const d = new Date(dateRdvIso);
    if (!isNaN(d.getTime())) {
      const dateAffichee = d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const heureAffichee = d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return { dateAffichee, heureAffichee };
    }
  } catch {
    // fallback
  }
  return { dateAffichee: dateRdvIso, heureAffichee: "00:00" };
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
    return extraireIdNumerique(obj.id ?? obj.Id_Patient ?? obj.Id_RendezVous ?? obj["@id"]);
  }
  return null;
}

export function mapperRendezVous(
  raw: unknown,
  patientsMap?: Map<number, PatientApiSummary>,
): RendezVous {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const id = extraireIdNumerique(obj.id ?? obj.Id_RendezVous ?? obj["@id"]) ?? 0;

  const dateIso =
    (typeof obj.dateRdv === "string" && obj.dateRdv.trim()) ||
    (typeof obj.date_rdv === "string" && obj.date_rdv.trim()) ||
    (typeof obj.creneauDebut === "string" && obj.creneauDebut.trim()) ||
    (typeof obj.creneau_debut === "string" && obj.creneau_debut.trim()) ||
    (typeof obj.date === "string" && obj.date.trim()) ||
    new Date().toISOString();

  const { dateAffichee, heureAffichee } = formaterDate(dateIso);

  // Normalisation du statut
  const statutBrut = String(obj.statut ?? obj.status ?? "PLANIFIE")
    .toUpperCase()
    .trim();
  let statut: StatutRendezVous = "PLANIFIE";
  if (statutBrut === "CONFIRME") statut = "CONFIRME";
  else if (statutBrut === "HONORE") statut = "HONORE";
  else if (statutBrut === "ANNULE") statut = "ANNULE";
  else if (statutBrut === "ABSENT") statut = "ABSENT";

  // Extraction patient
  let patientId = extraireIdNumerique(obj.patientId ?? obj.idPatient ?? obj.Id_Patient);
  let patientNomDirect: string | undefined;
  let patientMatriculeDirect: string | undefined;

  const patientObj = obj.patient as Record<string, unknown> | string | undefined;
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
    if (idTrouve) patientId = idTrouve;
  }

  const patientFromMap = patientId ? patientsMap?.get(patientId) : undefined;
  const patientNom =
    patientNomDirect ||
    (patientFromMap
      ? `${patientFromMap.nom || ""} ${patientFromMap.prenom || ""}`.trim()
      : undefined);
  const patientMatricule = patientMatriculeDirect || patientFromMap?.matricule;

  // Extraction encounter
  const encounterId = extraireIdNumerique(obj.encounterId ?? obj.encounter);

  const commentaire =
    typeof obj.commentaire === "string"
      ? obj.commentaire
      : typeof obj.motif === "string"
        ? obj.motif
        : null;

  return {
    id,
    dateRdv: dateIso,
    dateAffichee,
    heureAffichee,
    statut,
    commentaire,
    patientId: patientId ?? 0,
    patientNom: patientNom || (patientId ? `Patient #${patientId}` : undefined),
    patientMatricule,
    encounterId,
    actionnable: statut === "PLANIFIE",
    estAujourdHui: estAujourdHui(dateIso),
  };
}

export function mapperNouveauRendezVousVersApi(
  input: NouveauRendezVousInput,
): ReserverRendezVousApiRequest {
  const debutIso = `${input.dateRdv}T${input.heureRdv}:00`;
  const dDebut = new Date(debutIso);
  const dFin = new Date(dDebut.getTime() + 30 * 60 * 1000);
  const finIso = isNaN(dFin.getTime()) ? debutIso : dFin.toISOString();

  const agendaId = input.agendaId ?? 1;

  return {
    patient: `/api/patients/${input.patientId}`,
    patientId: input.patientId,
    agenda: `/api/agendas/${agendaId}`,
    agendaId,
    creneauDebut: debutIso,
    creneauFin: finIso,
    dateRdv: debutIso,
    statut: "PLANIFIE",
    commentaire: input.commentaire?.trim() || null,
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

export function libelleStatut(statut: StatutRendezVous): string {
  switch (statut) {
    case "PLANIFIE":
      return "Planifié";
    case "CONFIRME":
      return "Arrivée confirmée";
    case "HONORE":
      return "Consultation honorée";
    case "ANNULE":
      return "Annulé";
    case "ABSENT":
      return "Patient absent";
    default:
      return statut;
  }
}

export function styleStatut(statut: StatutRendezVous): {
  fond: string;
  texte: string;
  bordure: string;
} {
  switch (statut) {
    case "PLANIFIE":
      return {
        fond: "bg-blue-50",
        texte: "text-blue-700",
        bordure: "border-blue-200",
      };
    case "CONFIRME":
      return {
        fond: "bg-amber-50",
        texte: "text-amber-700",
        bordure: "border-amber-200",
      };
    case "HONORE":
      return {
        fond: "bg-emerald-50",
        texte: "text-emerald-700",
        bordure: "border-emerald-200",
      };
    case "ANNULE":
      return {
        fond: "bg-rose-50",
        texte: "text-rose-700",
        bordure: "border-rose-200",
      };
    case "ABSENT":
      return {
        fond: "bg-slate-100",
        texte: "text-slate-600",
        bordure: "border-slate-300",
      };
  }
}
