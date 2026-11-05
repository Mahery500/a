/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DomaineService } from "@/briques/services/modele/service.types";

export interface OptionPersonnel {
  id: number;
  nom: string;
  prenom: string;
  role: string;
  /** Vrai si le staff a un profil médical (corps médical renseigné côté backend). */
  estMedical: boolean;
  /** Libellé du corps médical si `estMedical` (ex. "Médecin", "Infirmier"). */
  corpsMedicalLibelle?: string | null;
}

export interface OptionSite {
  id: number;
  nom: string;
  code: string;
}

export interface OptionServiceSite {
  serviceId: number;
  nomService: string;
  siteId: number;
  nomSite: string;
  /** ID du type de service : permet de résoudre le domaine via /type-services. */
  typeServiceId: number;
  /** Domaine du service. `null` si le type est inconnu ou inactif. */
  domaine: DomaineService | null;
}

export interface AffectationPersonnel {
  id: number;
  staffId: number;
  nomPersonnel: string;
  prenomPersonnel: string;
  rolePersonnel: string;
  serviceId: number;
  nomService: string;
  siteId: number;
  nomSite: string;
  dateDebut: string;
  dateFin?: string | null;
  estPrincipal: boolean;
  actif: boolean;
  dateCreation?: string;
}

export interface NouvelleAffectationInput {
  staffId: number;
  serviceId: number;
  dateDebut: string;
  dateFin?: string | null;
  estPrincipal?: boolean;
}

export interface ModificationAffectationInput {
  staffId: number;
  serviceId: number;
  dateDebut: string;
  dateFin?: string | null;
  estPrincipal: boolean;
  actif?: boolean;
}
