/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeReponseApi } from "./authentification.contrats";
import { UtilisateurConnecte } from "../modele/authentification.types";

/**
 * Mappe la réponse de /api/me et le jeton en modèle métier UtilisateurConnecte.
 * Règle n°1 : Renvoie null si l'id est absent ou invalide. Laisse les champs vides sans rien inventer.
 */
export function mapperUtilisateurConnecte(
  me: MeReponseApi,
  jeton: string,
  jetonRefresh?: string,
  rolesAdditionnels: string[] = [],
): UtilisateurConnecte | null {
  if (!me || typeof me.id !== "number" || me.id <= 0) {
    return null;
  }

  const ensembleRoles = new Set<string>();
  if (me.role) {
    ensembleRoles.add(me.role);
  }
  rolesAdditionnels.forEach((r) => {
    if (r) ensembleRoles.add(r);
  });

  const roles = Array.from(ensembleRoles);
  const rolePrincipal = me.role || roles[0] || "ROLE_USER";

  return {
    id: me.id,
    identifiant: me.login || "",
    nom: me.nom ? me.nom.trim() : "",
    prenom: me.prenom ? me.prenom.trim() : "",
    roles,
    rolePrincipal,
    siteId: typeof me.siteId === "number" ? me.siteId : null,
    serviceId: typeof me.serviceId === "number" ? me.serviceId : null,
    jeton,
    jetonRefresh,
    sansAffectation: me.sansAffectation === true,
  };
}
