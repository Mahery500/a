/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LIBELLES_DOMAINE_SERVICE } from "@/briques/services/modele/service.types";
import type { OptionServiceSite } from "./affectation.types";

export interface ProfilAffectable {
  /** Nom affiché dans le message, ex. « Jean RAKOTO ». */
  nomComplet: string;
  /** Vrai si la personne a (ou aura) un profil médical (médecin, infirmier…). */
  estMedical: boolean;
  /** Libellé du corps médical, ex. « Médecin ». */
  corpsMedicalLibelle?: string | null;
}

/**
 * Règle métier : un personnel médical ne peut être affecté qu'à un service
 * MEDICAL ou MEDICO_TECHNIQUE, et inversement.
 * Retourne le message d'incompatibilité, ou `null` si l'affectation est possible.
 */
export function detecterIncompatibiliteAffectation(
  profil: ProfilAffectable,
  service: OptionServiceSite | null | undefined,
): string | null {
  if (!service) return null;

  const domaine = service.domaine;

  if (domaine == null) {
    return (
      `Le service « ${service.nomService} » pointe vers un type de service ` +
      "introuvable ou inactif. Le backend peut refuser cette affectation."
    );
  }

  const serviceEstMedical = domaine === "MEDICAL" || domaine === "MEDICO_TECHNIQUE";

  if (profil.estMedical && !serviceEstMedical) {
    const corps = profil.corpsMedicalLibelle ? ` (${profil.corpsMedicalLibelle})` : "";
    return (
      `${profil.nomComplet} a un profil médical${corps}. Un personnel médical ne peut être ` +
      `affecté qu’à un service médical ou médico-technique, pas au service ` +
      `« ${service.nomService} » (domaine ${LIBELLES_DOMAINE_SERVICE[domaine]}).`
    );
  }

  if (!profil.estMedical && serviceEstMedical) {
    return (
      `Le service « ${service.nomService} » est de domaine ${LIBELLES_DOMAINE_SERVICE[domaine]}. ` +
      `Un service médical ou médico-technique ne peut accueillir que du personnel médical : ` +
      `${profil.nomComplet} n’a pas de profil médical.`
    );
  }

  return null;
}
