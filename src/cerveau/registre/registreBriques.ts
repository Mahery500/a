/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ManifesteBrique } from "@/noyau/brique";
import { briqueAuthentification } from "@/briques/authentification";
import { briqueSites } from "@/briques/sites";
import { briqueServices } from "@/briques/services";
import { briqueEntreprises } from "@/briques/entreprises";
import { briqueCategoriesActes } from "@/briques/categorie-actes";
import { briqueCategoriesObservations } from "@/briques/categorie-observations";
import { briqueCatalogueActes } from "@/briques/catalogue-actes";
import { briqueObservationDefinitions } from "@/briques/observation-definitions";
import { briqueDiagnosticDefinitions } from "@/briques/diagnostic-definitions";
import { briqueUtilisateurs } from "@/briques/utilisateurs";
import { briqueAffectations } from "@/briques/affectations";
import { briquePatients } from "@/briques/patients";
import { briqueVerificationAdherents } from "@/briques/verification-adherents";
import { briqueRendezVous } from "@/briques/rendez-vous";
import { briqueTicketsAccueil } from "@/briques/tickets-accueil";
import { briqueEcranAttente } from "@/briques/ecran-attente";
import { briqueInfirmerieFile } from "@/briques/infirmerie-file";
import { briqueConstantesVitales } from "@/briques/constantes-vitales";
import { briqueSoinsActes } from "@/briques/soins-actes";
import { briqueInfirmerieHistorique } from "@/briques/infirmerie-historique";
import { briqueConsultationFile } from "@/briques/consultation-file";
import { briqueConsultationActive } from "@/briques/consultation-active";
import { briqueDossiersMedicaux } from "@/briques/dossiers-medicaux";
import { briquePharmacieCatalogue } from "@/briques/pharmacie-catalogue";
import { briqueStockNiveaux } from "@/briques/stock-niveaux";
import { briqueStockDispensation } from "@/briques/stock-dispensation";
import { briqueStockMouvements } from "@/briques/stock-mouvements";
import { briqueStockAjustements } from "@/briques/stock-ajustements";
import { briqueTypeEncounters } from "@/briques/type-encounters";
// En haut, avec les autres imports
import { briqueCompetencesHabilitations } from "@/briques/competences-habilitations";

/**
 * Registre central des briques Lego disponibles dans l'application ASINA SIH.
 * Chaque nouvelle brique migrée s'enregistre ici.
 */
const BRIQUES_ENREGISTREES: ManifesteBrique[] = [
  briqueAuthentification,
  briqueSites,
  briqueServices,
  briqueTypeEncounters,
    briqueTypeEncounters,
  briqueCompetencesHabilitations,


  // Référentiels cliniques hiérarchiques (avant Catalogue/Observations,
  // qui en dépendent pour la sélection de catégorie feuille).
  briqueCategoriesActes,
  briqueCategoriesObservations,

  briqueEntreprises,
  briqueCatalogueActes,
  briqueObservationDefinitions,
  briqueDiagnosticDefinitions,
  briqueUtilisateurs,
  briqueAffectations,
  briquePatients,
  briqueVerificationAdherents,
  briqueRendezVous,
  briqueTicketsAccueil,
  briqueEcranAttente,
  briqueInfirmerieFile,
  briqueConstantesVitales,
  briqueSoinsActes,
  briqueInfirmerieHistorique,
  briqueConsultationFile,
  briqueConsultationActive,
  briqueDossiersMedicaux,
  briquePharmacieCatalogue,
  briqueStockNiveaux,
  briqueStockDispensation,
  briqueStockMouvements,
  briqueStockAjustements,
];

export function listerBriques(): ManifesteBrique[] {
  return [...BRIQUES_ENREGISTREES];
}

export function obtenirBrique(id: string): ManifesteBrique | undefined {
  return BRIQUES_ENREGISTREES.find((b) => b.id === id);
}

export function obtenirBriqueParRessource(ressource: string): ManifesteBrique | undefined {
  return BRIQUES_ENREGISTREES.find((b) => b.ressource === ressource);
}
