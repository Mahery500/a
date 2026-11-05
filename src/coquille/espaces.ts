/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ComponentType, CSSProperties } from "react";
import {
  Users,
  UserCheck,
  HeartPulse,
  Stethoscope,
  Syringe,
  History,
  Clock,
  CheckCircle2,
  FolderHeart,
  Ticket,
  ShieldCheck,
  Calendar,
  Tv,
  Layers,
  LayoutDashboard,
  Truck,
  PackagePlus,
  Repeat,
  ClipboardCheck,
  BookOpen,
  BookOpenCheck,
  Briefcase,
  FolderTree,
  Activity,
  FileText,
  Sliders,
  Building2,
  Package,
  Pill,
  Award,
  Workflow,
  ShieldAlert,
} from "lucide-react";

export type VueCoquille =
  | "accueil"
  | "infirmerie"
  | "consultation"
  | "pharmacie"
  | "stock"
  | "administration";

export type IconeLucide = ComponentType<{
  className?: string;
  style?: CSSProperties;
}>;

export interface ItemEcran {
  id: string;
  libelle: string;
  description: string;
  icone: IconeLucide;
  badge?: string;
  /** Titre de section dans la sidebar (les écrans d'un même groupe doivent se suivre). */
  groupe?: string;
}

export interface ConfigurationEspace {
  id: VueCoquille;
  titre: string;
  /** Nom court affiché dans le fil d'Ariane du header. */
  nomCourt: string;
  roleNom: string;
  icone: IconeLucide;
  /** Utilisé uniquement pour la pastille du sélecteur d'espace. */
  couleurHex: string;
  ecrans: ItemEcran[];
}

/** Identifiant de l'écran d'ouverture de l'espace Stock. */
export const ECRAN_STOCK_DEFAUT = "tableau-bord";

/** Identifiant de l'écran d'ouverture de l'espace Accueil. */
export const ECRAN_ACCUEIL_DEFAUT = "dashboard";

/** Identifiant de l'écran d'ouverture de l'espace Pharmacie. */
export const ECRAN_PHARMACIE_DEFAUT = "tableau-bord";

/** Identifiant de l'écran d'ouverture de l'espace Infirmerie. */
export const ECRAN_INFIRMERIE_DEFAUT = "tableau-bord";

/** Identifiant de l'écran d'ouverture de l'espace Médecin. */
export const ECRAN_CONSULTATION_DEFAUT = "tableau-bord";

export const construireEspaces = (
  estGestionnaireStock: boolean,
): Record<VueCoquille, ConfigurationEspace> => ({
  accueil: {
    id: "accueil",
    titre: "Espace Accueil",
    nomCourt: "Accueil",
    roleNom: "Accueil & Réception",
    icone: Users,
    couleurHex: "#0ea5e9",
    ecrans: [
      {
        id: ECRAN_ACCUEIL_DEFAUT,
        libelle: "Tableau de bord",
        description: "Affluence, attente et rendez-vous",
        icone: LayoutDashboard,
      },
      {
        id: "tickets",
        libelle: "Salle d'Attente & Tickets",
        description: "File active, guichets et appels",
        icone: Ticket,
      },
      {
        id: "verification",
        libelle: "Vérification Adhérents",
        description: "Contrôle d'éligibilité & émission",
        icone: ShieldCheck,
      },
      {
        id: "rendezvous",
        libelle: "Agenda des Rendez-vous",
        description: "Planning semaine par soignant",
        icone: Calendar,
      },
      {
        id: "patients",
        libelle: "Fiches & Dossiers Patients",
        description: "Ayants droit & cartes adhérents",
        icone: Users,
      },
      {
        id: "ecran",
        libelle: "Écran Salle d'Attente",
        description: "Affichage public & vocal",
        icone: Tv,
        badge: "TV",
      },
    ],
  },

  consultation: {
    id: "consultation",
    titre: "Espace Soins (Médecin)",
    nomCourt: "Médecin",
    roleNom: "Médecin Clinicien",
    icone: Stethoscope,
    couleurHex: "#10b981",
    ecrans: [
      {
        id: ECRAN_CONSULTATION_DEFAUT,
        libelle: "Tableau de Bord",
        description: "File, consultation en cours et rendez-vous du jour",
        icone: LayoutDashboard,
      },
      {
        id: "file",
        libelle: "File d'Attente Médecin",
        description: "Prochains patients & temps d'attente",
        icone: Users,
      },
      {
        id: "active",
        libelle: "Consultation Active",
        description: "Mon patient, actes & diagnostics",
        icone: Stethoscope,
        badge: "Direct",
      },
      {
        id: "dossiers",
        libelle: "Dossiers Médicaux",
        description: "Historique clinique & antécédents",
        icone: FolderHeart,
      },
    ],
  },

  infirmerie: {
    id: "infirmerie",
    titre: "Espace Soins (Infirmerie)",
    nomCourt: "Infirmerie",
    roleNom: "Infirmier de Soins",
    icone: HeartPulse,
    couleurHex: "#14b8a6",
    ecrans: [
      {
        id: ECRAN_INFIRMERIE_DEFAUT,
        libelle: "Tableau de Bord",
        description: "File, patient en cours et activité du jour",
        icone: LayoutDashboard,
      },
      {
        id: "file",
        libelle: "File de Soins",
        description: "Patients en attente de prise en charge",
        icone: Users,
      },
      {
        id: "soins",
        libelle: "Actes & Constantes",
        description: "TA, température, pansements & soins",
        icone: Syringe,
        badge: "Soins",
      },
      {
        id: "historique",
        libelle: "Historique des Actes",
        description: "Registre des soins réalisés",
        icone: History,
      },
    ],
  },

  pharmacie: {
    id: "pharmacie",
    titre: "Espace Pharmacie",
    nomCourt: "Pharmacie",
    roleNom: "Pharmacie & Dispensation",
    icone: Pill,
    couleurHex: "#f97316",
    ecrans: [
      {
        id: ECRAN_PHARMACIE_DEFAUT,
        libelle: "Tableau de Bord",
        description: "File, attente et alertes stock",
        icone: LayoutDashboard,
      },
      {
        id: "a_dispenser",
        libelle: "File de Dispensation",
        description: "Ordonnances en attente de délivrance",
        icone: Clock,
        badge: "FEFO",
      },
      {
        id: "dispensees",
        libelle: "Dispensées Aujourd'hui",
        description: "Historique des délivrances comptoir",
        icone: CheckCircle2,
      },
    ],
  },

  stock: {
    id: "stock",
    titre: estGestionnaireStock ? "Espace Stock Multi-sites" : "Espace Stock Local",
    nomCourt: "Stock",
    roleNom: estGestionnaireStock
      ? "Gestionnaire Stock Multi-sites"
      : "Responsable Stock Local",
    icone: Package,
    couleurHex: "#f59e0b",
    ecrans: estGestionnaireStock
      ? [
          {
            id: ECRAN_STOCK_DEFAUT,
            libelle: "Tableau de Bord",
            description: "Alertes, péremptions & activité multi-sites",
            icone: LayoutDashboard,
            groupe: "Suivi",
          },
          {
            id: "niveaux",
            libelle: "Stock Consolidé & Niveaux",
            description: "Alertes seuil & stocks multi-sites",
            icone: Layers,
            groupe: "Suivi",
          },
          {
            id: "commandes",
            libelle: "Commandes Fournisseurs",
            description: "Création, suivi & validation",
            icone: Truck,
            groupe: "Flux",
          },
          {
            id: "appro",
            libelle: "Approvisionnements",
            description: "Réceptions & création de lots",
            icone: PackagePlus,
            groupe: "Flux",
          },
          {
            id: "transferts",
            libelle: "Transferts Inter-Sites",
            description: "Mouvements entre établissements",
            icone: Repeat,
            groupe: "Flux",
          },
          {
            id: "ajustements",
            libelle: "Inventaires & Ajustements",
            description: "Comptages physiques & régularisations",
            icone: ClipboardCheck,
            groupe: "Contrôle & référentiel",
          },
          {
            id: "catalogue",
            libelle: "Référentiel Médicaments",
            description: "Catalogue produits & nomenclatures",
            icone: BookOpen,
            groupe: "Contrôle & référentiel",
          },
        ]
      : [
          {
            id: ECRAN_STOCK_DEFAUT,
            libelle: "Tableau de Bord",
            description: "Alertes, péremptions & activité du site",
            icone: LayoutDashboard,
            groupe: "Suivi",
          },
          {
            id: "niveaux",
            libelle: "Stock Local de mon Site",
            description: "Produits, lots & péremptions",
            icone: Layers,
            groupe: "Suivi",
          },
          {
            id: "appro",
            libelle: "Réceptions d'Appros",
            description: "Réception des lots destinés au site",
            icone: PackagePlus,
            groupe: "Réceptions",
          },
          {
            id: "transferts",
            libelle: "Transferts Reçus",
            description: "Entrées et réceptions de transferts",
            icone: Repeat,
            groupe: "Réceptions",
          },
          {
            id: "ajustements",
            libelle: "Inventaires & Écarts",
            description: "Comptages physiques & saisie d'écarts",
            icone: ClipboardCheck,
            groupe: "Contrôle & référentiel",
          },
          {
            id: "catalogue",
            libelle: "Catalogue Médicaments",
            description: "Consultation en lecture seule",
            icone: BookOpen,
            groupe: "Contrôle & référentiel",
          },
        ],
  },

  administration: {
    id: "administration",
    titre: "Espace Administration",
    nomCourt: "Administration",
    roleNom: "Administrateur SIH",
    icone: Sliders,
    couleurHex: "#6366f1",
    ecrans: [
      // Dans administration.ecrans[], juste avant "utilisateurs"
      {
        id: "tableau-bord-admin",
        libelle: "Tableau de bord",
        description: "KPIs, alertes et indicateurs consolidés de la structure",
        icone: LayoutDashboard,   // ← import déjà existant
        groupe: "Pilotage",
      },
      {
        id: "utilisateurs",
        libelle: "Comptes Utilisateurs",
        description: "Comptes, accès et réinitialisation",
        icone: Users,
        groupe: "Accès & personnel",
      },
      {
        id: "affectations",
        libelle: "Affectations Personnel",
        description: "Rattachement soignants & services",
        icone: UserCheck,
        groupe: "Accès & personnel",
      },
      {
        id: "sites",
        libelle: "Sites Hospitaliers",
        description: "Centres de santé & établissements",
        icone: Building2,
        groupe: "Structure",
      },
      {
        id: "services",
        libelle: "Services Médicaux",
        description: "Unités de soins & spécialités",
        icone: FolderTree,
        groupe: "Structure",
      },
      {
        id: "entreprises",
        libelle: "Entreprises Adhérentes",
        description: "Conventions & santé au travail",
        icone: Briefcase,
        groupe: "Structure",
      },
      {
        id: "catalogue",
        libelle: "Catalogue des Actes",
        description: "Nomenclatures & droits d'actes",
        icone: BookOpenCheck,
        groupe: "Référentiels cliniques",
      },
      {
        id: "observations",
        libelle: "Observations Cliniques",
        description: "Modèles d'observations par acte",
        icone: Activity,
        groupe: "Référentiels cliniques",
      },
      {
        id: "diagnostics",
        libelle: "Définitions CIM-10",
        description: "Nomenclature nosologique internationale",
        icone: FileText,
        groupe: "Référentiels cliniques",
      },
      {
        id: "allergies_ref",
        libelle: "Référentiel des Allergies",
        description: "Substances allergènes & codifications",
        icone: ShieldAlert,
        groupe: "Référentiels cliniques",
      },
      {
        id: "typeEncounters",
        libelle: "Types de Prise en Charge",
        description: "Motifs & parcours de soins",
        icone: Sliders,
        groupe: "Référentiels cliniques",
      },
      {
        id: "competences",
        libelle: "Compétences & Habilitations",
        description: "Corps médicaux & spécialités du personnel",
        icone: Award,
        groupe: "Référentiels cliniques",
      },
      {
        id: "matrice",
        libelle: "Matrice des Habilitations",
        description: "Actes et diagnostics par corps médical",
        icone: Workflow,
        groupe: "Habilitations croisées",
      },
    ],
  },
});

/** Ordre et couleurs du sélecteur rapide de supervision (admin). */
export const ESPACES_SELECTEUR: { id: VueCoquille; libelle: string; couleurHex: string }[] = [
  { id: "accueil", libelle: "Espace Accueil", couleurHex: "#0ea5e9" },
  { id: "consultation", libelle: "Espace Soins (Médecin)", couleurHex: "#10b981" },
  { id: "infirmerie", libelle: "Espace Soins (Infirmerie)", couleurHex: "#14b8a6" },
  { id: "pharmacie", libelle: "Espace Pharmacie", couleurHex: "#f97316" },
  { id: "stock", libelle: "Espace Stock", couleurHex: "#f59e0b" },
  { id: "administration", libelle: "Espace Administration", couleurHex: "#6366f1" },
];