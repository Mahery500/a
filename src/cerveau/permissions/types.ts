/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModeAffichage = "edition" | "lecture" | "masque";

export type PermissionCanonique =
  // Référentiels & Administration
  | "site:lire"
  | "site:ecrire"
  | "service:lire"
  | "service:ecrire"
  | "entreprise:lire"
  | "entreprise:ecrire"
  // Catégories hiérarchiques (référentiels partagés)
  | "categorie_acte:lire"
  | "categorie_acte:ecrire"
  | "categorie_observation:lire"
  | "categorie_observation:ecrire"
  // Nomenclatures cliniques
  | "catalogue_actes:lire"
  | "catalogue_actes:ecrire"
  | "observation_definition:lire"
  | "observation_definition:ecrire"
  | "diagnostic_definition:lire"
  | "diagnostic_definition:ecrire"
  | "type_encounter:lire"
  | "type_encounter:ecrire"
  | "utilisateur:lire"
  | "utilisateur:ecrire"
  | "affectation:lire"
  | "affectation:ecrire"
  // Accueil & Patients
  | "patient:lire"
  | "patient:ecrire"
  | "verification_adherent:lire"
  | "verification_adherent:ecrire"
  | "rendez_vous:lire"
  | "rendez_vous:ecrire"
  | "ticket_file:lire"
  | "ticket_file:ecrire"
  | "ticket_file:appeler"
  // Infirmerie
  | "infirmerie_file:lire"
  | "infirmerie_file:ecrire"
  | "constante_vitale:lire"
  | "constante_vitale:ecrire"
  | "soin_acte:lire"
  | "soin_acte:ecrire"
  | "infirmerie_historique:lire"
  // Consultation
  | "consultation_file:lire"
  | "consultation_file:ecrire"
  | "consultation_active:lire"
  | "consultation_active:ecrire"
  | "dossier_medical:lire"
  | "dossier_medical:ecrire"
  // Pharmacie & Stock
  | "stock_catalogue:lire"
  | "stock_catalogue:ecrire"
  | "stock_niveau:lire"
  | "stock_niveau:ecrire"
  | "stock_dispensation:lire"
  | "stock_dispensation:ecrire"
  | "stock_mouvement:lire"
  | "stock_mouvement:ecrire"
  | "stock_ajustement:lire"
  | "stock_ajustement:ecrire"
  | "acte_realise:lire"
  | "acte_realise:ecrire"
  | "corps_medical:lire"
  | "corps_medical:ecrire";
    


export type Permission = PermissionCanonique | `${string}:${string}`;

export interface ConfigurationPermissionsBrique {
  ressource: string;
  actionLecture?: string;
  actionEdition?: string;
}
