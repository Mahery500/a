/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UtilisateurCompte,
  NouveauCompteAdminInput,
  NouveauComptePersonnelInput,
  ModificationCompteInput,
  PersonnelMedicalSummary,
  obtenirLibelleRole,
} from "../modele/utilisateur.types";
import {
  CreateUserInputApi,
  UpdateUserInputApi,
  CreateStaffInputApi,
  PersonnelMedicalSummaryApi,
  UpdateStaffInputApi,
} from "./utilisateurs.contrats";

/** Mappe le personnelMedical renvoyé par StaffResponse. */
function mapperPersonnelMedicalSummary(brut: unknown): PersonnelMedicalSummary | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as PersonnelMedicalSummaryApi & Record<string, unknown>;

  const id = Number(o.id);
  const corpsMedicalId = Number(o.corpsMedicalId);
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(corpsMedicalId) || corpsMedicalId <= 0) return null;

  return {
    id,
    corpsMedicalId,
    corpsMedicalCode: String(o.corpsMedicalCode ?? "").trim().toUpperCase(),
    corpsMedicalLibelle: String(o.corpsMedicalLibelle ?? "").trim(),
    specialiteId:
      typeof o.specialiteId === "number" && o.specialiteId > 0 ? o.specialiteId : null,
    specialiteCode: o.specialiteCode ? String(o.specialiteCode).trim().toUpperCase() : null,
    specialiteLibelle: o.specialiteLibelle ? String(o.specialiteLibelle).trim() : null,
    dateDebutExercice: String(o.dateDebutExercice ?? ""),
    dateFinExercice: o.dateFinExercice ? String(o.dateFinExercice) : null,
    estEnExercice: o.estEnExercice === true,
  };
}

/**
 * Normalise un objet renvoyé par /users ou /staffs vers UtilisateurCompte.
 *
 * Règles d'identité (correction du bug "admin affiché deux fois") :
 *
 *  - `id`    = ID du **User** (unique entre tous les comptes).
 *  - `idApi` = ID à envoyer aux endpoints HTTP :
 *              → user id  pour un admin (PATCH /users/{id})
 *              → staff id pour un personnel (PATCH /staffs/{id})
 *
 * @param typeHint Forcé par l'appelant quand il sait ce qu'il traite
 *                 (POST /users → admin, POST /staffs → personnel).
 */
export function mapperUtilisateurDepuisApi(
  brut: unknown,
  typeHint?: "admin" | "personnel",
  correspondanceStaff?: { prenom?: string; nom?: string; login?: string },
): UtilisateurCompte | null {
  if (!brut || typeof brut !== "object") {
    return null;
  }

  const obj = brut as Record<string, unknown>;
  const idBrut = obj.id ?? obj.Id_User ?? obj.Id_staff_profile ?? obj.staffId;
  const idNum = typeof idBrut === "number" ? idBrut : Number(idBrut);

  if (!Number.isFinite(idNum) || idNum <= 0) {
    return null;
  }

  // `user` imbriqué n'est présent que pour un objet venu de /staffs.
  const userObj =
    typeof obj.user === "object" && obj.user !== null
      ? (obj.user as Record<string, unknown>)
      : null;

  // 1. Déterminer le type de compte
  let typeCompte: "admin" | "personnel";
  if (typeHint) {
    typeCompte = typeHint;
  } else if (userObj !== null) {
    typeCompte = "personnel";
  } else if (
    typeof obj.prenom === "string" &&
    typeof obj.nom === "string" &&
    typeof obj.login === "string"
  ) {
    // Heuristique pour un POST /staffs qui ne renvoie pas `user`.
    typeCompte = "personnel";
  } else {
    typeCompte = "admin";
  }

  // 2. Extraire idUser (identité) et idApi (identifiant HTTP)
  let idUser: number;
  let idApi: number;

  if (typeCompte === "personnel") {
    // obj.id = staff id
    idApi = idNum;
    // user id : depuis `user.id` si présent, sinon on retombe sur le staff id
    // (compte temporaire juste après POST /staffs — corrigé au prochain lister()).
    const userIdFromObj = userObj ? Number(userObj.id ?? userObj.Id_User) : NaN;
    idUser = Number.isFinite(userIdFromObj) && userIdFromObj > 0 ? userIdFromObj : idNum;
  } else {
    idUser = idNum;
    idApi = idNum;
  }

  // 3. Champs de contact et d'affichage
  const email = typeof obj.email === "string" ? obj.email.trim() : "";

  const loginDirect = typeof obj.login === "string" ? obj.login.trim().toLowerCase() : "";
  const username = typeof obj.username === "string" ? obj.username.trim().toLowerCase() : "";
  const loginStaff = correspondanceStaff?.login?.trim().toLowerCase() ?? "";
  const loginDepuisEmail = email ? email.split("@")[0].trim().toLowerCase() : "";
  const login = loginDirect || username || loginStaff || loginDepuisEmail || `user_${idUser}`;

  // 4. Rôles
  const rolesBruts = Array.isArray(obj.roles) ? obj.roles : [];
  const roles = rolesBruts
    .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
    .map((r) => r.trim().toUpperCase());

  if (roles.length === 0) roles.push("ROLE_USER");

  const estSuperAdmin = roles.includes("ROLE_SUPER_ADMIN");
  const estAdmin =
    typeCompte === "admin" ||
    estSuperAdmin ||
    roles.includes("ROLE_ADMIN") ||
    login === "admin";

  if (estAdmin && !roles.includes("ROLE_ADMIN") && !roles.includes("ROLE_SUPER_ADMIN")) {
    roles.push("ROLE_ADMIN");
  }

  const rolePrincipal = estSuperAdmin ? "ROLE_SUPER_ADMIN" : estAdmin ? "ROLE_ADMIN" : roles[0];
  const libelleRole = obtenirLibelleRole(rolePrincipal);

  // 5. Nom / prénom (avec les mêmes replis que la version précédente)
  let nomBrut = String(obj.nom ?? obj.lastName ?? "").trim();
  let prenomBrut = String(obj.prenom ?? obj.firstName ?? "").trim();

  if (!nomBrut && correspondanceStaff?.nom) nomBrut = correspondanceStaff.nom.trim();
  if (!prenomBrut && correspondanceStaff?.prenom) prenomBrut = correspondanceStaff.prenom.trim();

  if (!nomBrut && login.includes(".")) {
    const parts = login.split(".");
    prenomBrut = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    nomBrut = parts.slice(1).join(" ").toUpperCase();
  }

  const nom = nomBrut.toUpperCase();
  const prenom = prenomBrut;

  const actif = typeof obj.isActive === "boolean" ? obj.isActive : true;
  const dateCreation = typeof obj.createdAt === "string" ? obj.createdAt : undefined;

  const personnelMedical = mapperPersonnelMedicalSummary(obj.personnelMedical);

  return {
    id: idUser,
    idApi,
    login,
    email,
    nom,
    prenom,
    roles,
    rolePrincipal,
    libelleRole,
    actif,
    typeCompte: estAdmin ? "admin" : "personnel",
    dateCreation,
    personnelMedical,
  };
}

export function mapperAdminVersApi(saisie: NouveauCompteAdminInput): CreateUserInputApi {
  return {
    login: saisie.login.trim().toLowerCase(),
    email: saisie.email.trim(),
    password: saisie.motDePasse.trim(),
    roles: ["ROLE_ADMIN"],
  };
}

export function mapperPersonnelVersApi(saisie: NouveauComptePersonnelInput): CreateStaffInputApi {
  const payload: CreateStaffInputApi = {
    prenom: saisie.prenom.trim(),
    nom: saisie.nom.trim().toUpperCase(),
    login: saisie.login.trim().toLowerCase(),
    password: saisie.motDePasse.trim(),
    roles: [saisie.role],
  };

  if (saisie.corpsMedicalId) payload.corpsMedicalId = saisie.corpsMedicalId;
  if (saisie.specialiteId) payload.specialiteId = saisie.specialiteId;
  if (saisie.dateDebutExercice) payload.dateDebutExercice = saisie.dateDebutExercice;

  return payload;
}

export function mapperModificationVersApi(
  saisie: ModificationCompteInput,
  typeCompte: "admin" | "personnel" = "admin",
): UpdateUserInputApi | UpdateStaffInputApi {
  const payload: UpdateUserInputApi & UpdateStaffInputApi = {};

  if (saisie.email !== undefined) {
    payload.email = saisie.email.trim() || null;
  }

  if (typeCompte === "personnel") {
    if (saisie.roles !== undefined) {
      payload.roles = [...saisie.roles];
    }
  } else {
    if (saisie.actif !== undefined) {
      payload.isActive = saisie.actif;
    }
  }

  return payload;
}