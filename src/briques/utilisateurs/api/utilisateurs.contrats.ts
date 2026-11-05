/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersonnelMedicalSummaryApi {
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

export interface UserOutputApi {
  id: number;
  email: string | null;
  roles: (string | null)[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  login?: string;
  username?: string;
  nom?: string;
  prenom?: string;
}

export interface CreateUserInputApi {
  login: string;
  email: string;
  password: string;
  roles?: (string | null)[];
}

export interface UpdateUserInputApi {
  email?: string | null;
  isActive?: boolean | null;
}

export interface StaffOutputApi {
  id: number;
  prenom: string;
  nom: string;
  email: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  login?: string;
  firstName?: string;
  lastName?: string;
  personnelMedical?: PersonnelMedicalSummaryApi | null;
}

export interface CreateStaffInputApi {
  prenom: string;
  nom: string;
  login: string;
  password: string;
  roles: string[];
  /** Obligatoire si roles contient ROLE_MEDECIN ou ROLE_INFIRMIER. */
  corpsMedicalId?: number | null;
  specialiteId?: number | null;
  /** ISO YYYY-MM-DD. */
  dateDebutExercice?: string | null;
}

export interface UpdateStaffInputApi {
  prenom?: string | null;
  nom?: string | null;
  email?: string | null;
  roles?: string[] | null;
}

export interface UpdateStaffRolesInputApi {
  roles: string[];
}

export interface ResetStaffPasswordInputApi {
  newPassword: string;
}