/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModeAffichage, Permission } from "./types";
import { MATRICE_PERMISSIONS } from "./matricePermissions";

/**
 * Détermine si la liste des rôles d'un utilisateur possède une permission donnée.
 */
export function aPermission(
  rolesUtilisateur: string[] | undefined,
  permissionVoulue: Permission,
): boolean {
  if (!rolesUtilisateur || rolesUtilisateur.length === 0) {
    return false;
  }

  // L'administrateur a un accès absolu
  const estAdmin = rolesUtilisateur.some(
    (r) =>
      typeof r === "string" &&
      (r.toUpperCase() === "ROLE_ADMIN" ||
        r.toUpperCase() === "ROLE_SUPER_ADMIN" ||
        r.toUpperCase().includes("ADMIN")),
  );
  if (estAdmin) {
    return true;
  }

  // Vérification dans la matrice des permissions
  for (const role of rolesUtilisateur) {
    const permissionsRole = MATRICE_PERMISSIONS[role];
    if (permissionsRole && permissionsRole.includes(permissionVoulue)) {
      return true;
    }
  }

  return false;
}

/**
 * Résout le mode d'affichage d'une brique ('edition' | 'lecture' | 'masque')
 * en fonction des droits de l'utilisateur sur la ressource.
 */
export function resoudreModeBrique(
  rolesUtilisateur: string[] | undefined,
  ressource: string,
  actionLecture: string = "lire",
  actionEdition: string = "ecrire",
): ModeAffichage {
  const permEdition: Permission = `${ressource}:${actionEdition}`;
  const permLecture: Permission = `${ressource}:${actionLecture}`;

  const peutEcrire = aPermission(rolesUtilisateur, permEdition);
  if (peutEcrire) {
    return "edition";
  }

  const peutLire = aPermission(rolesUtilisateur, permLecture);
  if (peutLire) {
    return "lecture";
  }

  return "masque";
}
