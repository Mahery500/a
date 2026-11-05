/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DefinitionRole {
  code: string;
  libelle: string;
}

export const ROLES_SYMFONY_DISPONIBLES: readonly DefinitionRole[] = [
  { code: "ROLE_ADMIN", libelle: "Administrateur" },
  { code: "ROLE_MEDECIN", libelle: "Médecin" },
  { code: "ROLE_INFIRMIER", libelle: "Infirmier" },
  { code: "ROLE_RECEPTION", libelle: "Accueil" },
  { code: "ROLE_SECRETAIRE", libelle: "Secrétaire" },
  { code: "ROLE_GESTIONNAIRE_STOCK", libelle: "Gestionnaire de stock" },
  { code: "ROLE_RESPONSABLE_STOCK", libelle: "Responsable de stock" },
  { code: "ROLE_DISPENSATEUR", libelle: "Dispensateur" },
] as const;

export const ROLES_PERSONNEL: readonly DefinitionRole[] = ROLES_SYMFONY_DISPONIBLES.filter(
  (r) => r.code !== "ROLE_ADMIN",
);

/**
 * Rôles qui exigent un profil médical (corps médical + optionnellement spécialité).
 * Doit rester aligné sur App\Staff\UseCase\CreateStaff\CreateStaff::ROLES_MEDICALES.
 */
export const ROLES_MEDICALES: readonly string[] = ["ROLE_MEDECIN", "ROLE_INFIRMIER"];

/**
 * Corps médical proposé par défaut selon le rôle choisi.
 * Sert au formulaire pour pré-sélectionner intelligemment.
 */
export const CORPS_PAR_ROLE: Readonly<Record<string, string>> = {
  ROLE_MEDECIN: "MEDECIN",
  ROLE_INFIRMIER: "INFIRMIER",
};

export function obtenirLibelleRole(codeRole?: string | null): string {
  if (!codeRole) return "Utilisateur";
  const trouve = ROLES_SYMFONY_DISPONIBLES.find((r) => r.code === codeRole);
  return trouve ? trouve.libelle : codeRole;
}

export function estRoleMedical(codeRole?: string | null): boolean {
  return !!codeRole && ROLES_MEDICALES.includes(codeRole);
}

/** Résumé sérialisable du profil médical, tel que renvoyé par StaffResponse. */
export interface PersonnelMedicalSummary {
  id: number;
  corpsMedicalId: number;
  corpsMedicalCode: string;
  corpsMedicalLibelle: string;
  specialiteId: number | null;
  specialiteCode: string | null;
  specialiteLibelle: string | null;
  dateDebutExercice: string;
  dateFinExercice: string | null;
  estEnExercice: boolean;
}

export interface UtilisateurCompte {
  /**
   * Identité stable et UNIQUE entre les comptes admin (venus de /users) et
   * personnel (venus de /staffs) : c'est toujours l'ID du User associé.
   * Utilisé pour les clés React et pour retrouver un compte dans la liste.
   */
  id: number;

  /**
   * Identifiant à utiliser pour les appels API (PATCH, POST .../activate,
   * DELETE, ...). Vaut `id` pour un admin, et le **staff id** pour un
   * personnel — c'est ce dernier que Symfony attend dans `/staffs/{id}`.
   */
  idApi: number;

  login: string;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
  rolePrincipal: string;
  libelleRole: string;
  actif: boolean;
  typeCompte: "admin" | "personnel";
  dateCreation?: string;
  /** null si le compte n'a pas de profil médical (admin, réception, …). */
  personnelMedical?: PersonnelMedicalSummary | null;
}

export interface NouveauCompteAdminInput {
  type: "admin";
  login: string;
  email: string;
  motDePasse: string;
}

/** Affectation créée juste après le compte (étape 4 du tiroir de création). */
export interface AffectationInitiale {
  serviceId: number;
  /** ISO YYYY-MM-DD. */
  dateDebut: string;
  dateFin?: string | null;
  estPrincipal: boolean;
}

export interface NouveauComptePersonnelInput {
  type: "personnel";
  prenom: string;
  nom: string;
  login: string;
  motDePasse: string;
  role: string;
  email?: string;
  telephone?: string;
  /** Obligatoire si rôle ∈ ROLES_MEDICALES. */
  corpsMedicalId?: number | null;
  /** Optionnel, nécessite corpsMedicalId. */
  specialiteId?: number | null;
  /** Optionnel, format ISO YYYY-MM-DD. Par défaut : aujourd'hui côté backend. */
  dateDebutExercice?: string | null;
  /** Optionnel : si fourni, une affectation est créée juste après le compte. */
  affectation?: AffectationInitiale | null;
}

export type NouveauCompteInput = NouveauCompteAdminInput | NouveauComptePersonnelInput;

export interface ModificationCompteInput {
  email?: string;
  roles?: string[];
  actif?: boolean;
}