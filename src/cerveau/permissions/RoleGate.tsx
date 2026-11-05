/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useRole } from "./usePermissions";

export interface RoleGateProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Composant d'affichage conditionnel (sans redirection).
 * Affiche les enfants uniquement si le rôle connecté fait partie de la liste autorisée.
 * Permet de masquer des onglets, boutons d'actions ou sections.
 */
export const RoleGate: React.FC<RoleGateProps> = ({ roles, children, fallback = null }) => {
  const roleActuel = useRole();

  if (!roleActuel || !roles.includes(roleActuel)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGate;
