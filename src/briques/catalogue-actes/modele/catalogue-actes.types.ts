/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CategorieHierarchique } from "@/noyau/referentiels/categories";
import type { Habilitation, HabilitationInput } from "@/noyau/referentiels/habilitations";
import type { DomaineService } from "@/briques/services/modele/service.types";

/**
 * La catégorie d'acte est désormais hiérarchique côté backend :
 * la forme est strictement identique à celle des catégories d'observations.
 */
export type CategorieActe = CategorieHierarchique;

/**
 * Ré-export du contrat partagé pour éviter aux consommateurs du catalogue
 * d'avoir à importer depuis deux modules. La définition vit dans
 * `@/noyau/referentiels/categories` car elle est commune aux catégories
 * d'actes ET d'observations.
 */
export type { NouvelleCategorieInput } from "@/noyau/referentiels/categories";

export interface TypeServiceOption {
  id: number;
  code: string;
  nom: string;
  /**
   * Domaine du service (MEDICAL, MEDICO_TECHNIQUE, ADMINISTRATIF, LOGISTIQUE).
   * `null` si le backend renvoie un domaine inconnu ou absent : dans ce cas,
   * le service est considéré comme utilisable (comportement permissif).
   */
  domaine: DomaineService | null;
}

export interface CodificationActe {
  codeSystem: string;
  code: string;
  libelle?: string;
}

export interface CodeSystemeOption {
  id: number;
  code: string;
  libelle: string;
  uri: string | null;
  actif: boolean;
}

export interface NouveauCodeSystemeInput {
  code: string;
  libelle: string;
  uri?: string | null;
}

export interface ActeMedical {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
  /** Objet complet renvoyé par ActeDefinitionOutput::fromEntity(). */
  categorie: CategorieActe;
  habilitations: Habilitation[];
  typeServiceIds: number[];
  description?: string | null;
  tarif?: number | null;
  dureeMinutes?: number | null;
  necessitePrescription?: boolean;
  codifications?: CodificationActe[];
}

export interface NouvelActeInput {
  code: string;
  libelle: string;
  /** Le backend exige le CODE de la catégorie (feuille). */
  categorieCode: string;
  habilitations: HabilitationInput[];
  typeServiceIds?: number[];
  description?: string | null;
  tarif?: number | null;
  dureeMinutes?: number | null;
  necessitePrescription?: boolean;
  codifications?: CodificationActe[];
}

export interface ModificationActeInput {
  libelle?: string;
  categorieCode?: string;
  habilitations?: HabilitationInput[];
  typeServiceIds?: number[];
  actif?: boolean;
  description?: string | null;
  tarif?: number | null;
  dureeMinutes?: number | null;
  necessitePrescription?: boolean;
  codifications?: CodificationActe[];
}