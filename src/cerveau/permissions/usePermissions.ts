/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSession } from "@/cerveau/session";

/**
 * Hook personnalisé renvoyant le rôle unique de l'utilisateur connecté
 * (extrait du JWT à la connexion).
 */
export function useRole(): string | null {
  const { utilisateur } = useSession();
  return utilisateur?.roles?.[0] ?? null;
}

export interface PermissionsBooleennes {
  role: string | null;
  /** Médecin uniquement (ou SuperAdmin) */
  canPrescrire: boolean;
  /** Médecin uniquement (ou SuperAdmin) */
  canPoserDiagnostic: boolean;
  /** Médecin ou Infirmier */
  canRealiserActe: boolean;
  /** Dispensateur uniquement */
  canDispenser: boolean;
  /** Gestionnaire stock uniquement */
  canCommanderFournisseur: boolean;
  /** Gestionnaire stock uniquement */
  canTransfererInterSite: boolean;
  /** Responsable stock ou Gestionnaire stock */
  canRecevoirAppro: boolean;
  /** Responsable stock uniquement */
  canAjusterInventaire: boolean;
  /** Admin ou SuperAdmin */
  canParametrer: boolean;
  /** Gestionnaire stock ou Admin */
  canVoirTousSites: boolean;
  /** Réception ou Secrétaire */
  canEmettreTicket: boolean;
  /** Réception, Secrétaire ou Médecin */
  canGererRdv: boolean;
}

/**
 * Hook fournissant un objet de permissions booléennes directement dérivées du rôle
 * selon les contraintes métiers strictes du backend.
 */
export function usePermissions(): PermissionsBooleennes {
  const role = useRole();

  const isSuperAdmin = role === "ROLE_SUPER_ADMIN";
  const isAdmin = role === "ROLE_ADMIN" || isSuperAdmin;
  const isMedecin = role === "ROLE_MEDECIN";
  const isInfirmier = role === "ROLE_INFIRMIER";
  const isDispensateur = role === "ROLE_DISPENSATEUR";
  const isGestionnaireStock = role === "ROLE_GESTIONNAIRE_STOCK";
  const isResponsableStock = role === "ROLE_RESPONSABLE_STOCK";
  const isReception = role === "ROLE_RECEPTION" || role === "ROLE_SECRETAIRE";

  return {
    role,
    canPrescrire: isMedecin || isSuperAdmin,
    canPoserDiagnostic: isMedecin || isSuperAdmin,
    canRealiserActe: isMedecin || isInfirmier || isAdmin,
    canDispenser: isDispensateur || isSuperAdmin,
    canCommanderFournisseur: isGestionnaireStock || isSuperAdmin,
    canTransfererInterSite: isGestionnaireStock || isSuperAdmin,
    canRecevoirAppro: isResponsableStock || isGestionnaireStock || isSuperAdmin,
    canAjusterInventaire: isResponsableStock || isSuperAdmin,
    canParametrer: isAdmin,
    canVoirTousSites: isGestionnaireStock || isAdmin,
    canEmettreTicket: isReception || isAdmin,
    canGererRdv: isReception || isMedecin || isAdmin,
  };
}

export default usePermissions;
