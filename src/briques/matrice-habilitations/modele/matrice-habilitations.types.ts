/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OngletMatrice = "par_habilitation" | "par_cible";
export type TypeCible = "acte" | "diagnostic";
export type FiltreActivation = "toutes" | "actives" | "inactives";

export interface HabilitationResume {
  corpsMedicalCode: string;
  corpsMedicalLibelle: string;
  specialiteCode: string | null;
  specialiteLibelle: string | null;
  actif: boolean;
}

export interface CibleAvecHabilitations {
  id: number;
  code: string;
  libelle: string;
  type: TypeCible;
  categorieLibelle?: string;
  actif: boolean;
  habilitations: HabilitationResume[];
}