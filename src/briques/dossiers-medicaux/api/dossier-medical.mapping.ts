/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PatientApiOutput,
  DiagnosticApiOutput,
  ActeRealiseApiOutput,
} from "./dossier-medical.contrats";
import {
  PatientDossierResume,
  DiagnosticDossier,
  ActeDossier,
} from "../modele/dossier-medical.types";

export function mapperPatientDossier(api: PatientApiOutput): PatientDossierResume {
  const id = api.id ?? api.Id_Patient ?? 0;
  const nom = api.nom ?? api.Nom ?? "";
  const prenom = api.prenom ?? api.Prenom ?? "";
  const matricule = api.matricule ?? api.Matricule ?? `#${id}`;
  const groupeSanguin = api.gs ?? api.GS ?? undefined;
  const telephone = api.telephone ?? api.Telephone ?? undefined;
  const sexe = api.sexe ?? api.Sexe ?? undefined;
  const dateNaissance = api.dateNaissance ?? api.Date_Naissance ?? undefined;
  const entrepriseNom =
    api.entreprise?.raisonSociale ?? api.entreprise?.nom ?? api.entreprise?.Nom ?? undefined;

  return {
    id,
    nom,
    prenom,
    matricule,
    groupeSanguin,
    telephone,
    sexe,
    dateNaissance,
    entrepriseNom,
  };
}

export function mapperDiagnosticDossier(api: DiagnosticApiOutput): DiagnosticDossier {
  return {
    id: api.id,
    code: api.code,
    libelle: api.libelle,
    type: api.type,
    statut: api.statut,
    commentaire: api.commentaire,
    dateDiagnostic: api.dateDiagnostic,
  };
}

export function mapperActeDossier(api: ActeRealiseApiOutput): ActeDossier {
  return {
    id: api.id,
    code: api.acteDefinitionCode,
    libelle: api.acteDefinitionLibelle,
    statut: api.statut,
    dateRealisation: api.dateRealisation,
    observations: api.observations || [],
  };
}
