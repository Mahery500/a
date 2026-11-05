/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdherentComplet,
  AdherentPatient,
  AdherentAffiliation,
  AdherentEligibilite,
  RendezVousDuJour,
  ServiceOrientationOption,
  ResultatConfirmationArrivee,
  ResultatEmissionTicket,
  TypeAffiliation,
} from "../modele/verification-adherent.types";
import {
  PatientApiOutput,
  RendezVousApiOutput,
  RendezVousStatutApi,
  ConfirmerArriveeApiOutput,
  EmettreTicketApiOutput,
  ServiceApiOutput,
} from "./verification-adherent.contrats";

export function devinerCodeFile(
  libelle: string,
): "INFIRMERIE" | "CONSULTATION" | "PHARMACIE" | "SECRETARIAT" | "APTITUDE" {
  const l = (libelle || "").toLowerCase();
  if (l.includes("infirm") || l.includes("constante") || l.includes("soin")) {
    return "INFIRMERIE";
  }
  if (l.includes("aptitude") || l.includes("travail") || l.includes("embauche")) {
    return "APTITUDE";
  }
  if (l.includes("pharma")) {
    return "PHARMACIE";
  }
  if (l.includes("secr") || l.includes("accueil") || l.includes("renseignement")) {
    return "SECRETARIAT";
  }
  return "CONSULTATION";
}

export function mapperAdherent(patient: PatientApiOutput): AdherentComplet {
  const patientDomain: AdherentPatient = {
    id: patient.id,
    matricule: patient.matricule || `PAT-${patient.id}`,
    nom: patient.nom || "",
    prenom: patient.prenom || "",
    dateNaissance: patient.dateNaissance || patient.date_naissance,
    sexe: patient.sexe,
    telephone: patient.telephone,
    email: patient.email,
    adresse: patient.adresse,
    groupeSanguin: patient.groupeSanguin,
    nir: patient.nir,
  };

  const rawStatut = patient.statut || "Agent";
  const statutAffiliation: TypeAffiliation =
    rawStatut === "Agent" ||
    rawStatut === "Conjoint" ||
    rawStatut === "Enfant" ||
    rawStatut === "Indépendant"
      ? rawStatut
      : "Autre";

  // Extraction cohérente de l'entreprise
  let idEntreprise = patient.idEntreprise;
  let nomEntreprise = patient.nomEntreprise;

  const entObj = patient.entreprise || patient.company;
  if (entObj && typeof entObj === "object") {
    if (!idEntreprise && entObj.id) idEntreprise = Number(entObj.id);
    if (!nomEntreprise) nomEntreprise = entObj.nom || entObj.name;
  } else if (typeof entObj === "string") {
    const match = entObj.match(/\/(\d+)$/);
    if (!idEntreprise && match) idEntreprise = Number(match[1]);
  }

  const aEntreprise = Boolean(nomEntreprise || (idEntreprise && idEntreprise > 0));
  const estActif = patient.actif !== false;

  const affiliationDomain: AdherentAffiliation = {
    statut: statutAffiliation,
    nomEntreprise: nomEntreprise || undefined,
    idEntreprise: idEntreprise && idEntreprise > 0 ? idEntreprise : undefined,
    cnaps: patient.nir || undefined,
    matriculeAgent: patient.matriculeAgent,
    actif: estActif,
  };

  // Règle d'éligibilité santé au travail :
  // - Convention entreprise existante + actif -> Éligible
  // - Ayant droit déclaré rattaché -> Éligible
  // - Sans entreprise conventionnée -> Non éligible (visite privée ou en attente d'affiliation)
  let eligibiliteDomain: AdherentEligibilite;

  if (aEntreprise && estActif) {
    eligibiliteDomain = {
      statut: "ELIGIBLE",
      label: "Adhérent Éligible",
      droitsOuverts: true,
      conventionActive: true,
      motif: `Couverture médicale active via l'entreprise ${patient.nomEntreprise || "partenaire"}.`,
    };
  } else if (!aEntreprise) {
    eligibiliteDomain = {
      statut: "NON_ELIGIBLE",
      label: "Non affilié entreprise",
      droitsOuverts: false,
      conventionActive: false,
      motif:
        "Aucune entreprise conventionnée rattachée à cet adhérent. Facturation ou affiliation requise.",
    };
  } else {
    eligibiliteDomain = {
      statut: "EN_ATTENTE",
      label: "Affiliation à régulariser",
      droitsOuverts: false,
      conventionActive: false,
      motif: "Dossier d'adhésion en cours de validation ou suspendu.",
    };
  }

  return {
    patient: patientDomain,
    affiliation: affiliationDomain,
    eligibilite: eligibiliteDomain,
  };
}

export function mapperRendezVous(raw: unknown): RendezVousDuJour {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const id =
    typeof obj.id === "number"
      ? obj.id
      : Number(String(obj.id ?? obj["@id"] ?? "0").replace(/\D/g, "")) || 0;

  const dateIso =
    (typeof obj.dateRdv === "string" && obj.dateRdv.trim()) ||
    (typeof obj.date_rdv === "string" && obj.date_rdv.trim()) ||
    (typeof obj.creneauDebut === "string" && obj.creneauDebut.trim()) ||
    (typeof obj.creneau_debut === "string" && obj.creneau_debut.trim()) ||
    (typeof obj.date === "string" && obj.date.trim()) ||
    new Date().toISOString();

  let heureRdv = "00:00";
  try {
    const d = new Date(dateIso);
    if (!isNaN(d.getTime())) {
      heureRdv = d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    // format fallback
  }

  const statutBrut = String(obj.statut ?? obj.status ?? "PLANIFIE")
    .toUpperCase()
    .trim();
  let statut: RendezVousStatutApi = "PLANIFIE";
  if (statutBrut === "CONFIRME") statut = "CONFIRME";
  else if (statutBrut === "HONORE") statut = "HONORE";
  else if (statutBrut === "ANNULE") statut = "ANNULE";
  else if (statutBrut === "ABSENT") statut = "ABSENT";

  const commentaire =
    typeof obj.commentaire === "string"
      ? obj.commentaire
      : typeof obj.motif === "string"
        ? obj.motif
        : null;

  const encounterId =
    typeof obj.encounterId === "number"
      ? obj.encounterId
      : obj.encounter && typeof obj.encounter === "object"
        ? Number((obj.encounter as { id?: unknown }).id) || null
        : null;

  return {
    id,
    dateRdv: dateIso,
    heureRdv,
    statut,
    commentaire,
    actionnable: statut === "PLANIFIE",
    encounterId,
  };
}

export function mapperServiceOrientation(raw: ServiceApiOutput): ServiceOrientationOption {
  const nom =
    (raw.typeServiceName && raw.typeServiceName.trim()) ||
    (raw.nom && raw.nom.trim()) ||
    (raw.libelle && raw.libelle.trim()) ||
    `Service #${raw.id}`;

  return {
    id: raw.id,
    nom,
    codeFile: devinerCodeFile(nom),
    siteId: raw.siteId ?? raw.idSite,
    siteName: raw.siteName,
    typeServiceId: raw.typeServiceId,
    typeServiceName: raw.typeServiceName,
    description: raw.description,
    isActive: raw.isActive ?? true,
  };
}

export function mapperResultatConfirmation(raw: unknown): ResultatConfirmationArrivee {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ticketObj = (obj.ticket && typeof obj.ticket === "object" ? obj.ticket : null) as Record<
    string,
    unknown
  > | null;

  const ticketId = Number(obj.ticketId ?? ticketObj?.id ?? obj.id) || 0;
  const numTicket = String(
    obj.numTicket ??
      ticketObj?.numTicket ??
      ticketObj?.numero ??
      obj.numero ??
      (ticketId ? `T-${ticketId}` : "T-001"),
  );

  const dateEmission = String(
    obj.dateEmissionTicket ??
      ticketObj?.dateEmission ??
      obj.dateEmission ??
      new Date().toISOString(),
  );

  const rendezVousId = Number(obj.rendezVousId ?? obj.idRendezVous ?? 0);

  return {
    rendezVousId,
    ticketId,
    numTicket,
    dateEmission,
  };
}

export function mapperResultatTicket(raw: unknown): ResultatEmissionTicket {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const ticketId = Number(obj.id ?? obj.ticketId) || 0;
  const numTicket = String(
    obj.numTicket ?? obj.numero ?? obj.code ?? (ticketId ? `T-${ticketId}` : "T-001"),
  );

  const dateEmission = String(obj.dateEmission ?? obj.createdAt ?? new Date().toISOString());

  return {
    ticketId,
    numTicket,
    dateEmission,
  };
}
