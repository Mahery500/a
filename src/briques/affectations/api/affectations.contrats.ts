/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Schémas bruts des requêtes et réponses de l'API Symfony pour /api/assignments, /api/staffs, /api/services, /api/sites.
 */

export interface AssignmentOutputApi {
  id?: number;
  "@id"?: string;
  staffId?: number;
  serviceId?: number;
  siteId?: number;
  dateDebut?: string;
  dateFin?: string | null;
  estPrincipal?: boolean;
  isPrincipal?: boolean;
  active?: boolean;
  isActive?: boolean;
  createdAt?: string;
  // Variantes relationnelles et imbriquées
  staff?:
    | {
        id?: number;
        firstName?: string;
        lastName?: string;
        prenom?: string;
        nom?: string;
        roles?: string[];
        role?: string;
      }
    | string;
  service?:
    | {
        id?: number;
        name?: string;
        nom?: string;
        libelle?: string;
        typeServiceName?: string;
        site?: { id?: number; name?: string; nom?: string } | string;
        siteId?: number;
      }
    | string;
  site?: { id?: number; name?: string; nom?: string; Libelle?: string } | string;
  user?: { id?: number; prenom?: string; nom?: string; login?: string; roles?: string[] } | string;
  // Variantes legacy
  Id_Affectation?: number;
  id_affectation?: number;
  DateA?: string;
  Id_staff_profile?: number;
  id_staff_profile?: number;
  staff_id?: number;
  Id_Service?: number;
  id_service?: number;
  service_id?: number;
  Id_Site?: number;
  id_site?: number;
  site_id?: number;
  nomPersonnel?: string;
  prenomPersonnel?: string;
  nomService?: string;
  nomSite?: string;
}

export interface AssignmentInputApi {
  staffId: number;
  serviceId: number;
  dateDebut: string;
  dateFin?: string | null;
  estPrincipal: boolean;
}

export interface AssignmentPatchInputApi {
  staffId: number;
  serviceId: number;
  dateDebut: string;
  dateFin?: string | null;
  estPrincipal: boolean;
}

export interface StaffListItemApi {
  id: number;
  firstName?: string;
  lastName?: string;
  prenom?: string;
  nom?: string;
  roles?: (string | null)[];
  isActive?: boolean;
}

export interface ServiceListItemApi {
  id: number;
  siteId: number;
  siteName?: string;
  typeServiceName?: string;
  description?: string | null;
  isActive?: boolean;
  // Variantes
  Id_Service?: number;
  Id_Site?: number;
  Libelle?: string;
}

export interface SiteListItemApi {
  id: number;
  name?: string;
  code?: string;
  city?: string;
  isActive?: boolean;
  // Variantes
  Id_Site?: number;
  Libelle?: string;
}
