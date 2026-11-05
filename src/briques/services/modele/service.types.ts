/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ── Nouveau ────────────────────────────────────────────────────────────────
/** Miroir exact de App\Shared\Enum\DomaineService. */
export type DomaineService = "MEDICAL" | "MEDICO_TECHNIQUE" | "ADMINISTRATIF" | "LOGISTIQUE";

export const DOMAINES_SERVICE: readonly DomaineService[] = [
  "MEDICAL",
  "MEDICO_TECHNIQUE",
  "ADMINISTRATIF",
  "LOGISTIQUE",
];

export const LIBELLES_DOMAINE_SERVICE: Record<DomaineService, string> = {
  MEDICAL: "Médical",
  MEDICO_TECHNIQUE: "Médico-technique",
  ADMINISTRATIF: "Administratif",
  LOGISTIQUE: "Logistique",
};

export const DESCRIPTIONS_DOMAINE_SERVICE: Record<DomaineService, string> = {
  MEDICAL: "Consultations, hospitalisations, soins directs au patient",
  MEDICO_TECHNIQUE: "Laboratoire, imagerie, explorations fonctionnelles",
  ADMINISTRATIF: "Accueil, secrétariat, caisse, facturation",
  LOGISTIQUE: "Pharmacie, magasin, stérilisation",
};

/** Règle backend : seul un personnel avec profil médical peut être affecté
 *  à un service dont le domaine est MEDICAL ou MEDICO_TECHNIQUE.
 *  Utilisé côté UI pour prévenir avant la soumission. */
export function domaineEstMedical(d: DomaineService): boolean {
  return d === "MEDICAL" || d === "MEDICO_TECHNIQUE";
}

/** Classes Tailwind par domaine (réutilisées dans badges & cartes). */
export const COULEURS_DOMAINE_SERVICE: Record<
  DomaineService,
  { badge: string; card: string }
> = {
  MEDICAL: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    card: "border-l-emerald-500",
  },
  MEDICO_TECHNIQUE: {
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    card: "border-l-cyan-500",
  },
  ADMINISTRATIF: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    card: "border-l-slate-400",
  },
  LOGISTIQUE: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    card: "border-l-amber-500",
  },
};

// ── Existants : ajouter `domaine` ─────────────────────────────────────────

export interface TypeServiceMedical {
  id: number;
  code: string;
  nom: string;
  description: string;
  actif: boolean;
  supporteAiguillage: boolean;
  domaine: DomaineService; // ← NOUVEAU
}

export interface ServiceMedical {
  id: number;
  siteId: number;
  nomSite: string;
  typeServiceId: number;
  nomTypeService: string;
  description: string;
  actif: boolean;
  dateCreation?: string;
}

export interface NouveauServiceInput {
  siteId: number;
  typeServiceId: number;
  description?: string;
  /** Optionnel — si false, le service est désactivé juste après sa création. */
  actif?: boolean;
}

export interface ModificationServiceInput {
  siteId?: number;
  typeServiceId?: number;
  description?: string;
  actif?: boolean;
}

export interface NouveauTypeServiceInput {
  code: string;
  nom: string;
  description?: string;
  supporteAiguillage?: boolean;
  domaine: DomaineService; // ← NOUVEAU, requis (Assert\NotNull backend)
}

export interface ModificationTypeServiceInput {
  code?: string;
  nom?: string;
  description?: string;
  actif?: boolean;
  supporteAiguillage?: boolean;
  domaine?: DomaineService; // ← NOUVEAU ; requis en pratique (PUT remplace tout)
}
