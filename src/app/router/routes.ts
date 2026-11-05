/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Configuration centralisée de la navigation :
 *   - AppView : les grands panneaux de l'application
 *   - CATEGORIES : les sections de la sidebar, groupées par thème
 *   - helper filterCategoriesForRoles() : applique les `requiredRoleCode`
 *
 * Cette définition est la source de vérité consommée par `CoquilleApplicative`
 * (sidebar desktop + menu mobile). Le rendu des icônes se fait dans
 * `icons.tsx` pour ne pas coupler ce fichier au framework UI.
 */

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type AppView =
  | "accueil"
  | "doctor"
  | "infirmerie"
  | "pharmacie"
  | "stock"
  | "ticketing"
  | "admin"
  | "analysis"
  | "api_config";

export interface RouteItem {
  /** Panneau principal à activer */
  view: AppView;
  /** Sous-onglet à présélectionner dans ce panneau (ex. "utilisateurs") */
  subTab?: string;
  /** Libellé de la sidebar (et du menu mobile) */
  label: string;
  /** Clé du registre d'icônes (voir `icons.tsx`) */
  iconName: IconName;
  /** Rôles requis pour voir cette entrée. Absent = visible par tout utilisateur connecté. */
  requiredRoleCode?: string[];
}

export interface RouteCategory {
  /** Titre de section dans la sidebar */
  title: string;
  /** Panneau de rattachement (permet de filtrer sidebar quand l'utilisateur est dans un module) */
  requiredPanel: AppView;
  items: RouteItem[];
}

// Registre de noms d'icônes supportés par `icons.tsx`.
// Ajouter ici + dans icons.tsx quand une nouvelle entrée de menu est ajoutée.
export type IconName =
  | "Ticket"
  | "UserCheck"
  | "CalendarClock"
  | "CalendarPlus"
  | "Users"
  | "Monitor"
  | "ListOrdered"
  | "Stethoscope"
  | "FolderHeart"
  | "Syringe"
  | "Activity"
  | "History"
  | "Pill"
  | "CheckCircle2"
  | "Layers"
  | "Truck"
  | "PackagePlus"
  | "Repeat"
  | "ClipboardCheck"
  | "BookOpen"
  | "Volume2"
  | "Building2"
  | "LayoutGrid"
  | "FileText"
  | "ShieldAlert"
  | "Award"
  | "Settings"
  | "Terminal";

// ─────────────────────────────────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────────────────────────────────

export const CATEGORIES: RouteCategory[] = [
  // =================== ACCUEIL & FLUX PATIENTS ===================
  {
    title: "Accueil & flux patients",
    requiredPanel: "accueil",
    items: [
      {
        view: "accueil",
        subTab: "tickets",
        label: "Tickets du jour",
        iconName: "Ticket",
      },
      {
        view: "accueil",
        subTab: "verification",
        label: "Vérification adhérents",
        iconName: "UserCheck",
      },
      {
        view: "accueil",
        subTab: "rendezvous",
        label: "Rendez-vous",
        iconName: "CalendarClock",
      },
      {
        view: "accueil",
        subTab: "patients",
        label: "Patients",
        iconName: "Users",
      },
      {
        view: "accueil",
        subTab: "ecran",
        label: "Écran salle d'attente",
        iconName: "Monitor",
      },
    ],
  },

  // =================== CONSULTATION MÉDICALE ===================
  {
    title: "Consultation médicale",
    requiredPanel: "doctor",
    items: [
      {
        view: "doctor",
        subTab: "file",
        label: "File d'attente",
        iconName: "ListOrdered",
      },
      {
        view: "doctor",
        subTab: "active",
        label: "Consultation en cours",
        iconName: "Stethoscope",
      },
      {
        view: "doctor",
        subTab: "dossiers",
        label: "Dossiers patients",
        iconName: "FolderHeart",
      },
    ],
  },

  // =================== INFIRMERIE ===================
  {
    title: "Infirmerie",
    requiredPanel: "infirmerie",
    items: [
      {
        view: "infirmerie",
        subTab: "file",
        label: "File de soins",
        iconName: "Syringe",
      },
      {
        view: "infirmerie",
        subTab: "soins",
        label: "Actes et soins",
        iconName: "Activity",
      },
      {
        view: "infirmerie",
        subTab: "historique",
        label: "Historique",
        iconName: "History",
      },
    ],
  },

  // =================== PHARMACIE ===================
  {
    title: "Pharmacie",
    requiredPanel: "pharmacie",
    items: [
      {
        view: "pharmacie",
        subTab: "a_dispenser",
        label: "À dispenser",
        iconName: "Pill",
      },
      {
        view: "pharmacie",
        subTab: "dispensees",
        label: "Dispensées",
        iconName: "CheckCircle2",
      },
    ],
  },

  // =================== STOCK ===================
  {
    title: "Stock",
    requiredPanel: "stock",
    items: [
      {
        view: "stock",
        subTab: "niveaux",
        label: "État des stocks",
        iconName: "Layers",
      },
      {
        view: "stock",
        subTab: "dispensation",
        label: "Dispensation comptoir",
        iconName: "Pill",
      },
      {
        view: "stock",
        subTab: "commandes",
        label: "Commandes & Réceptions",
        iconName: "Truck",
      },
      {
        view: "stock",
        subTab: "appro",
        label: "Approvisionnements",
        iconName: "PackagePlus",
      },
      {
        view: "stock",
        subTab: "transferts",
        label: "Transferts",
        iconName: "Repeat",
      },
      {
        view: "stock",
        subTab: "ajustements",
        label: "Inventaires & Ajustements",
        iconName: "ClipboardCheck",
      },
      {
        view: "stock",
        subTab: "catalogue",
        label: "Référentiel médicaments",
        iconName: "BookOpen",
      },
    ],
  },

  // =================== TICKETING ===================
  {
    title: "Ticketing",
    requiredPanel: "ticketing",
    items: [
      {
        view: "ticketing",
        subTab: "tickets",
        label: "Tickets",
        iconName: "Ticket",
      },
      {
        view: "ticketing",
        subTab: "file_attente",
        label: "File d'attente",
        iconName: "Users",
      },
      {
        view: "ticketing",
        subTab: "appeles",
        label: "Appels",
        iconName: "Volume2",
      },
    ],
  },

  // =================== ADMINISTRATION ===================
  {
    title: "Administration",
    requiredPanel: "admin",
    items: [
      // ACCÈS & PERSONNEL
      {
        view: "admin",
        subTab: "utilisateurs",
        label: "Comptes utilisateurs",
        iconName: "Users",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "affectations",
        label: "Affectations personnel",
        iconName: "Activity",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },

      // STRUCTURE
      {
        view: "admin",
        subTab: "sites",
        label: "Sites hospitaliers",
        iconName: "Building2",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "services",
        label: "Services médicaux",
        iconName: "LayoutGrid",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "entreprises",
        label: "Entreprises adhérentes",
        iconName: "Building2",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },

      // RÉFÉRENTIELS CLINIQUES
      {
        view: "admin",
        subTab: "catalogue",
        label: "Catalogue des actes",
        iconName: "FileText",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "observations",
        label: "Observations cliniques",
        iconName: "Activity",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "diagnostics",
        label: "Diagnostics CIM-10",
        iconName: "FileText",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "allergies_ref",
        label: "Référentiel allergies",
        iconName: "ShieldAlert",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "type-encounters",
        label: "Types de prise en charge",
        iconName: "LayoutGrid",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "competences",
        label: "Compétences & habilitations",
        iconName: "Award",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "admin",
        subTab: "matrice",
        label: "Matrice des habilitations",
        iconName: "Award",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
    ],
  },

  // =================== SYSTÈME ===================
  {
    title: "Système",
    requiredPanel: "admin",
    items: [
      {
        view: "analysis",
        subTab: "diag",
        label: "Diagnostic application",
        iconName: "Terminal",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
      {
        view: "api_config",
        subTab: "config",
        label: "Configuration API",
        iconName: "Settings",
        requiredRoleCode: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Filtre les catégories et items selon les rôles de l'utilisateur.
 * - Un item sans `requiredRoleCode` est toujours visible.
 * - Une catégorie dont tous les items sont filtrés disparaît.
 */
export function filterCategoriesForRoles(
  categories: RouteCategory[],
  userRoles: string[],
): RouteCategory[] {
  const roleSet = new Set(userRoles);

  return categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (!item.requiredRoleCode || item.requiredRoleCode.length === 0) {
          return true;
        }
        return item.requiredRoleCode.some((r) => roleSet.has(r));
      }),
    }))
    .filter((cat) => cat.items.length > 0);
}

/**
 * Retrouve l'item actif à partir de la vue et du sous-onglet courants.
 * Renvoie `null` si aucune correspondance.
 */
export function findActiveItem(
  categories: RouteCategory[],
  view: AppView,
  subTab?: string | null,
): RouteItem | null {
  for (const cat of categories) {
    for (const item of cat.items) {
      if (item.view !== view) continue;
      // Quand subTab n'est pas fourni, on accepte le premier item de la vue.
      if (subTab == null) return item;
      if (item.subTab === subTab) return item;
    }
  }
  return null;
}