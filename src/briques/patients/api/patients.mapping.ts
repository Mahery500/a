/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PatientFiche,
  CompleterFicheInput,
  RattacherAgentInput,
  EntrepriseOption,
} from "../modele/patient.types";
import { CompleterFichePatientPayloadApi, CreateAgentPayloadApi } from "./patients.contrats";

export function mapperPatientDepuisApi(brut: unknown): PatientFiche | null {
  if (!brut || typeof brut !== "object") {
    return null;
  }

  const obj = brut as Record<string, unknown>;
  const idBrut = obj.id ?? obj.Id_Patient;
  if (!idBrut) {
    return null;
  }

  const id = String(idBrut).trim();
  if (!id) {
    return null;
  }

  const matricule = String(obj.matricule ?? "").trim();
  const nom = String(obj.nom ?? obj.lastName ?? "")
    .trim()
    .toUpperCase();
  const prenom = String(obj.prenom ?? obj.firstName ?? "").trim();

  const dateNaissance =
    typeof obj.dateNaissance === "string"
      ? obj.dateNaissance.trim()
      : typeof obj.date_naissance === "string"
        ? obj.date_naissance.trim()
        : typeof obj.DateN === "string"
          ? obj.DateN.trim()
          : null;

  const lieuNaissance =
    typeof obj.lieuNaissance === "string"
      ? obj.lieuNaissance.trim()
      : typeof obj.LieuN === "string"
        ? obj.LieuN.trim()
        : null;

  const sexe = typeof obj.sexe === "string" ? obj.sexe.trim() : null;
  const adresse = typeof obj.adresse === "string" ? obj.adresse.trim() : null;
  const telephone =
    typeof obj.telephone === "string"
      ? obj.telephone.trim()
      : typeof obj.tel === "string"
        ? obj.tel.trim()
        : typeof obj.phone === "string"
          ? obj.phone.trim()
          : null;

  const email =
    typeof obj.email === "string"
      ? obj.email.trim()
      : typeof obj.mail === "string"
        ? obj.mail.trim()
        : null;

  const groupeSanguin =
    typeof obj.groupeSanguin === "string"
      ? obj.groupeSanguin.trim()
      : typeof obj.groupe_sanguin === "string"
        ? obj.groupe_sanguin.trim()
        : typeof obj.GS === "string"
          ? obj.GS.trim()
          : null;

  const nir =
    typeof obj.nir === "string"
      ? obj.nir.trim()
      : typeof obj.numeroCnaps === "string"
        ? obj.numeroCnaps.trim()
        : null;

  // Extraction robuste de l'entreprise rattachée
  let idEntreprise: number | null = null;
  let nomEntreprise: string | null = null;

  // 1. Depuis un objet imbriqué "entreprise" ou "company"
  const entrepriseObj = (obj.entreprise ?? obj.company) as
    Record<string, unknown> | string | undefined;
  if (entrepriseObj && typeof entrepriseObj === "object") {
    const entId = Number(
      entrepriseObj.id ?? entrepriseObj.Id_Entreprise ?? entrepriseObj.companyId,
    );
    if (Number.isFinite(entId) && entId > 0) idEntreprise = entId;
    const entNom = String(
      entrepriseObj.nom ??
        entrepriseObj.Nom ??
        entrepriseObj.name ??
        entrepriseObj.raisonSociale ??
        "",
    ).trim();
    if (entNom) nomEntreprise = entNom;
  } else if (typeof entrepriseObj === "string") {
    const matchIri = entrepriseObj.match(/\/(\d+)$/);
    if (matchIri) idEntreprise = Number(matchIri[1]);
  }

  // 2. Si pas encore d'ID, regarder les champs directs
  if (!idEntreprise) {
    const entIdDirect = Number(
      obj.idEntreprise ?? obj.Id_Entreprise ?? obj.entrepriseId ?? obj.companyId,
    );
    if (Number.isFinite(entIdDirect) && entIdDirect > 0) {
      idEntreprise = entIdDirect;
    }
  }

  // 3. Si pas encore de nom d'entreprise, regarder les champs directs
  if (!nomEntreprise) {
    const directNom =
      obj.nomEntreprise ??
      obj.NomEntreprise ??
      obj.nom_entreprise ??
      obj.companyName ??
      obj.company_name;
    if (typeof directNom === "string" && directNom.trim()) {
      nomEntreprise = directNom.trim();
    }
  }

  // 4. Depuis l'agent si présent (patient agent ou ayant droit)
  const agentObj = (obj.agent ?? obj.Agent) as Record<string, unknown> | undefined;
  if (agentObj && typeof agentObj === "object") {
    if (!idEntreprise) {
      const entAgent = (agentObj.entreprise ?? agentObj.company) as
        Record<string, unknown> | undefined;
      if (entAgent && typeof entAgent === "object") {
        const entId = Number(entAgent.id ?? entAgent.Id_Entreprise);
        if (Number.isFinite(entId) && entId > 0) idEntreprise = entId;
        if (!nomEntreprise) {
          const entNom = String(entAgent.nom ?? entAgent.Nom ?? entAgent.name ?? "").trim();
          if (entNom) nomEntreprise = entNom;
        }
      } else {
        const entIdDirect = Number(agentObj.idEntreprise ?? agentObj.companyId);
        if (Number.isFinite(entIdDirect) && entIdDirect > 0) idEntreprise = entIdDirect;
      }
    }
  }

  // Extraction du statut d'affiliation
  let statut: string | null = null;
  if (typeof obj.statut === "string" && obj.statut.trim()) {
    statut = obj.statut.trim();
  } else if (typeof obj.statutAffiliation === "string" && obj.statutAffiliation.trim()) {
    statut = obj.statutAffiliation.trim();
  } else if (typeof obj.qualite === "string" && obj.qualite.trim()) {
    statut = obj.qualite.trim();
  } else if (typeof obj.lienParente === "string" && obj.lienParente.trim()) {
    statut = obj.lienParente.trim();
  } else if (obj.isAgent === true || obj.idAgent || obj.agent) {
    statut = "Agent";
  }

  let idAgent: number | null = null;
  const idAgentDirect = Number(obj.idAgent ?? obj.agentId);
  if (Number.isFinite(idAgentDirect) && idAgentDirect > 0) {
    idAgent = idAgentDirect;
  } else if (agentObj && typeof agentObj === "object") {
    const idAg = Number(agentObj.id);
    if (Number.isFinite(idAg) && idAg > 0) idAgent = idAg;
  }

  let matriculeAgent: string | null = null;
  if (typeof obj.matriculeAgent === "string" && obj.matriculeAgent.trim()) {
    matriculeAgent = obj.matriculeAgent.trim();
  } else if (agentObj && typeof agentObj.matricule === "string" && agentObj.matricule.trim()) {
    matriculeAgent = agentObj.matricule.trim();
  }

  return {
    id,
    matricule,
    nom,
    prenom,
    dateNaissance,
    lieuNaissance,
    sexe,
    adresse,
    telephone,
    email,
    groupeSanguin,
    nir,
    idEntreprise:
      Number.isFinite(idEntreprise) && (idEntreprise as number) > 0 ? idEntreprise : null,
    nomEntreprise: nomEntreprise || null,
    statut: statut || null,
    idAgent: Number.isFinite(idAgent) && (idAgent as number) > 0 ? idAgent : null,
    matriculeAgent: matriculeAgent || null,
  };
}

export function mapperCompleterFicheVersApi(
  saisie: CompleterFicheInput,
): CompleterFichePatientPayloadApi {
  const payload: CompleterFichePatientPayloadApi = {};

  if (saisie.matricule?.trim()) payload.matricule = saisie.matricule.trim();
  if (saisie.dateN?.trim()) payload.dateN = saisie.dateN.trim();
  if (saisie.lieuNaissance?.trim()) payload.lieuNaissance = saisie.lieuNaissance.trim();
  if (saisie.adresse?.trim()) payload.adresse = saisie.adresse.trim();
  if (saisie.groupeSanguin?.trim()) payload.groupeSanguin = saisie.groupeSanguin.trim();
  if (saisie.sexe?.trim()) payload.sexe = saisie.sexe.trim();
  if (saisie.email?.trim()) payload.email = saisie.email.trim();
  if (saisie.telephone?.trim()) payload.telephone = saisie.telephone.trim();
  if (saisie.nir?.trim()) payload.nir = saisie.nir.trim();

  return payload;
}

export function mapperRattacherAgentVersApi(saisie: RattacherAgentInput): CreateAgentPayloadApi {
  const idPatient = Number(saisie.idPatient);
  const idEntreprise = Number(saisie.idEntreprise);

  return {
    idPatient,
    idEntreprise,
    patientId: idPatient,
    entrepriseId: idEntreprise,
    patient: `/api/patients/${idPatient}`,
    entreprise: `/api/entreprises/${idEntreprise}`,
    company: `/api/companies/${idEntreprise}`,
    cnaps: saisie.cnaps?.trim() || null,
    fonction: saisie.fonction?.trim() || null,
  };
}

export function mapperEntrepriseOption(brut: unknown): EntrepriseOption | null {
  if (!brut || typeof brut !== "object") return null;
  const obj = brut as Record<string, unknown>;
  const id = Number(obj.id ?? obj.Id_Entreprise ?? obj.companyId ?? obj.entrepriseId);
  if (!Number.isFinite(id) || id <= 0) return null;
  const nom = String(
    obj.nom ??
      obj.name ??
      obj.Nom ??
      obj.Name ??
      obj.raisonSociale ??
      obj.RaisonSociale ??
      `Entreprise #${id}`,
  ).trim();
  return { id, nom };
}
