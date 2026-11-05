/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const ASINA_COLORS = {
  // Couleurs principales de la marque
  brand: {
    primary: "#24B04E", // Vert médical emblématique ASINA #24B04E
    primaryHover: "#1e903f", // Teinte au survol
    primaryActive: "#15803d", // Teinte à l'état actif
    secondary: "#0ea5e9", // Accent Bleu Ciel
    secondaryHover: "#0284c7", // Bleu Ciel au survol
  },

  // Échelle tonale complète du Vert ASINA (50 à 950)
  asina: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#24B04E", // Couleur primaire de référence
    700: "#1e903f",
    800: "#15803d",
    900: "#166534",
    950: "#14532d",
  },

  // Couleurs sémantiques et d'états
  semantic: {
    success: "#10b981",
    successBg: "#ecfdf5",
    danger: "#ef4444",
    dangerBg: "#fef2f2",
    warning: "#f59e0b",
    warningBg: "#fffbeb",
    info: "#0ea5e9",
    infoBg: "#f0f9ff",
  },

  // Couleurs des composants d'interface (Boutons, surfaces, bordures)
  ui: {
    btnPrimaryBg: "#24B04E",
    btnPrimaryText: "#ffffff",
    btnPrimaryHoverBg: "#1e903f",
    btnPrimaryShadow: "rgba(36, 176, 78, 0.15)",
    btnSecondaryBg: "#ffffff",
    btnSecondaryText: "#334155",
    btnSecondaryBorder: "#e2e8f0",
    btnSecondaryHoverBg: "#f8fafc",
    btnSecondaryHoverText: "#0f172a",
    btnSecondaryHoverBorder: "#cbd5e1",
  },
} as const;

export type AsinaColors = typeof ASINA_COLORS;

export function getThemeCssVariables(
  colors: typeof ASINA_COLORS = ASINA_COLORS,
): Record<string, string> {
  return {
    "--app-primary": colors.brand.primary,
    "--app-primary-hover": colors.brand.primaryHover,
    "--app-primary-active": colors.brand.primaryActive,
    "--app-secondary": colors.brand.secondary,
    "--app-secondary-hover": colors.brand.secondaryHover,

    "--app-asina-50": colors.asina[50],
    "--app-asina-100": colors.asina[100],
    "--app-asina-200": colors.asina[200],
    "--app-asina-300": colors.asina[300],
    "--app-asina-400": colors.asina[400],
    "--app-asina-500": colors.asina[500],
    "--app-asina-600": colors.asina[600],
    "--app-asina-700": colors.asina[700],
    "--app-asina-800": colors.asina[800],
    "--app-asina-900": colors.asina[900],
    "--app-asina-950": colors.asina[950],

    "--app-success": colors.semantic.success,
    "--app-success-bg": colors.semantic.successBg,
    "--app-danger": colors.semantic.danger,
    "--app-danger-bg": colors.semantic.dangerBg,
    "--app-warning": colors.semantic.warning,
    "--app-warning-bg": colors.semantic.warningBg,
    "--app-info": colors.semantic.info,
    "--app-info-bg": colors.semantic.infoBg,

    "--btn-primary-bg": colors.ui.btnPrimaryBg,
    "--btn-primary-text": colors.ui.btnPrimaryText,
    "--btn-primary-hover-bg": colors.ui.btnPrimaryHoverBg,
    "--btn-primary-shadow": colors.ui.btnPrimaryShadow,
    "--btn-secondary-bg": colors.ui.btnSecondaryBg,
    "--btn-secondary-text": colors.ui.btnSecondaryText,
    "--btn-secondary-border": colors.ui.btnSecondaryBorder,
    "--btn-secondary-hover-bg": colors.ui.btnSecondaryHoverBg,
    "--btn-secondary-hover-text": colors.ui.btnSecondaryHoverText,
    "--btn-secondary-hover-border": colors.ui.btnSecondaryHoverBorder,
  };
}

export function applyThemeColors(colors: typeof ASINA_COLORS = ASINA_COLORS): void {
  if (typeof document === "undefined") return;

  const vars = getThemeCssVariables(colors);
  const root = document.documentElement;

  Object.entries(vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  let styleEl = document.getElementById("asina-theme-vars") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "asina-theme-vars";
    document.head.prepend(styleEl);
  }

  const cssRules = Object.entries(vars)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join("\n");
  styleEl.textContent = `:root {\n${cssRules}\n}`;
}

if (typeof window !== "undefined") {
  applyThemeColors(ASINA_COLORS);
}

/**
 * ASINA Medical - Configuration visuelle des rôles, statuts et utilitaires
 */
export const ASINA_THEME = {
  brand: ASINA_COLORS.brand,
  asina: ASINA_COLORS.asina,
  semantic: ASINA_COLORS.semantic,
  ui: ASINA_COLORS.ui,

  // Mappage des couleurs de rôles dans la plateforme ASINA
  roleColors: {
    ADMIN: {
      bg: "bg-rose-50 border-rose-100",
      text: "text-rose-700",
      badge: "bg-rose-50 text-rose-700 border border-rose-100",
    },
    ACCUEIL: {
      bg: "bg-sky-50 border-sky-100",
      text: "text-sky-700",
      badge: "bg-sky-50 text-sky-700 border border-sky-100",
    },
    SECRETAIRE: {
      bg: "bg-teal-50 border-teal-100",
      text: "text-teal-700",
      badge: "bg-teal-50 text-teal-700 border border-teal-100",
    },
    INFIRMIER: {
      bg: "bg-amber-50 border-amber-100",
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700 border border-amber-100",
    },
    MED_GEN: {
      bg: "bg-asina-50 border-asina-100",
      text: "text-asina-700",
      badge: "bg-asina-50 text-asina-700 border border-asina-100",
    },
    MED_CHEF: {
      bg: "bg-violet-50 border-violet-100",
      text: "text-violet-700",
      badge: "bg-violet-50 text-violet-700 border border-violet-100",
    },
    STOCK_CENTRAL: {
      bg: "bg-purple-50 border-purple-100",
      text: "text-purple-700",
      badge: "bg-purple-50 text-purple-700 border border-purple-100",
    },
  },

  // Statuts des consultations
  encounterStatusColors: {
    "En attente": {
      bg: "bg-amber-50 text-amber-700 border-amber-100",
      badge: "bg-amber-50 text-amber-700 border border-amber-150",
      dot: "bg-amber-500",
    },
    "En consultation": {
      bg: "bg-asina-50 text-asina-700 border-asina-100",
      badge: "bg-asina-50 text-asina-700 border border-asina-150",
      dot: "bg-asina-600",
    },
    Terminé: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
      badge: "bg-emerald-50 text-emerald-700 border border-emerald-150",
      dot: "bg-emerald-500",
    },
  },

  // Statuts des rendez-vous
  appointmentStatusColors: {
    Confirmé: { bg: "bg-sky-50 text-sky-700 border-sky-100" },
    Annulé: { bg: "bg-rose-50 text-rose-700 border-rose-100" },
    Réalisé: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    Absent: { bg: "bg-slate-100 text-slate-600 border-slate-200" },
    Reporté: { bg: "bg-amber-50 text-amber-700 border-amber-100" },
  },

  // Classes utilitaires partagées
  classes: {
    card: "bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 transition-all duration-200",
    input:
      "w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-asina-500 focus:border-asina-500 transition",
    select:
      "w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-asina-500 transition",
    th: "p-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100",
    td: "p-3 text-xs border-b border-slate-50 text-slate-700 font-medium",
  },
};

export type EspaceCode =
  | "accueil"
  | "soins"
  | "pharmacie"
  | "stock"
  | "administration"
  | "pilotage";

export interface ConfigEspace {
  id: EspaceCode;
  nom: string;
  description: string;
  couleurHex: string;
  couleurNom: string;
  badgeBg: string;
  badgeText: string;
  rolesAutorises: string[];
}

export const CONFIG_ESPACES: Record<EspaceCode, ConfigEspace> = {
  accueil: {
    id: "accueil",
    nom: "Espace Accueil",
    description: "Salle d'attente, émission de tickets & RDV",
    couleurHex: "#0ea5e9", // Bleu ciel
    couleurNom: "sky",
    badgeBg: "bg-sky-50 border-sky-200",
    badgeText: "text-sky-700",
    rolesAutorises: ["ROLE_RECEPTION", "ROLE_SECRETAIRE", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
  },
  soins: {
    id: "soins",
    nom: "Espace Soins",
    description: "Mon patient, file d'attente soignante & workspace clinique",
    couleurHex: "#10b981", // Vert émeraude
    couleurNom: "emerald",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    rolesAutorises: ["ROLE_MEDECIN", "ROLE_INFIRMIER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
  },
  pharmacie: {
    id: "pharmacie",
    nom: "Espace Pharmacie",
    description: "File de dispensation ordonnances & contrôle FEFO",
    couleurHex: "#8b5cf6", // Violet
    couleurNom: "violet",
    badgeBg: "bg-purple-50 border-purple-200",
    badgeText: "text-purple-700",
    rolesAutorises: ["ROLE_DISPENSATEUR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
  },
  stock: {
    id: "stock",
    nom: "Espace Stock",
    description: "Gestion multi-sites ou locale, réceptions & inventaires",
    couleurHex: "#f59e0b", // Ambre
    couleurNom: "amber",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-700",
    rolesAutorises: [
      "ROLE_GESTIONNAIRE_STOCK",
      "ROLE_RESPONSABLE_STOCK",
      "ROLE_ADMIN",
      "ROLE_SUPER_ADMIN",
    ],
  },
  administration: {
    id: "administration",
    nom: "Espace Administration",
    description: "Comptes utilisateurs, affectations, sites & catalogues",
    couleurHex: "#475569", // Gris ardoise
    couleurNom: "slate",
    badgeBg: "bg-slate-100 border-slate-200",
    badgeText: "text-slate-700",
    rolesAutorises: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
  },
  pilotage: {
    id: "pilotage",
    nom: "Espace Pilotage",
    description: "Tableaux de bord KPI, statistiques d'activité & performance",
    couleurHex: "#6366f1", // Indigo
    couleurNom: "indigo",
    badgeBg: "bg-indigo-50 border-indigo-200",
    badgeText: "text-indigo-700",
    rolesAutorises: ["ROLE_ADMIN", "ROLE_SUPER_ADMIN"],
  },
};

/**
 * Détermine l'espace de travail unique assigné au rôle de l'utilisateur
 * (Contrainte stricte : 1 utilisateur = 1 seul rôle métier)
 */
export function determinerEspaceParRole(role?: string | null): EspaceCode {
  if (!role) return "accueil";
  switch (role) {
    case "ROLE_RECEPTION":
    case "ROLE_SECRETAIRE":
      return "accueil";
    case "ROLE_MEDECIN":
    case "ROLE_INFIRMIER":
      return "soins";
    case "ROLE_DISPENSATEUR":
      return "pharmacie";
    case "ROLE_GESTIONNAIRE_STOCK":
    case "ROLE_RESPONSABLE_STOCK":
      return "stock";
    case "ROLE_ADMIN":
    case "ROLE_SUPER_ADMIN":
      return "administration";
    default:
      return "accueil";
  }
}
