// src/briques/allergies/modele/allergie.types.ts

export type AllergieStatut = "active" | "inactive" | "resolved";
export type AllergieType = "allergy" | "intolerance";
export type AllergieCategorie = "food" | "medication" | "environment" | "biologic";
export type AllergieCriticalite = "low" | "high" | "unable-to-assess";
export type AllergieVerificationStatut =
  | "unconfirmed"
  | "confirmed"
  | "refuted"
  | "entered-in-error";
export type SeveriteReaction = "mild" | "moderate" | "severe";

export interface OptionReferentiel {
  valeur: string;
  libelle: string;
}

export interface CodificationAllergie {
  codeSystem: string;
  code: string;
}

export interface ReactionAllergie {
  id: number;
  allergieId: number;
  allergieDefinitionCode: string | null;
  allergieDefinitionLibelle: string | null;
  manifestation: string;
  severite: SeveriteReaction;
  description: string | null;
  dateReaction: string | null;
  exposition: string | null;
}

export interface Allergie {
  id: number;
  patientId: number;
  allergieDefinitionCode: string | null;
  allergieDefinitionLibelle: string | null;
  allergieDefinitionCodifications: CodificationAllergie[];
  principeActifId: number | null;
  principeActifLibelle: string | null;
  type: AllergieType;
  categorie: AllergieCategorie;
  criticalite: AllergieCriticalite;
  verificationStatut: AllergieVerificationStatut;
  statut: AllergieStatut;
  dateDebut: string | null;
  dateFin: string | null;
  derniereOccurrence: string | null;
  note: string | null;
  reactions: ReactionAllergie[];
}

export interface AllergieDefinition {
  id: number;
  code: string;
  libelle: string;
  categorie: AllergieCategorie;
  actif: boolean;
  codifications: CodificationAllergie[];
}

export interface AllergieDefinitionSummary {
  id: number;
  code: string;
  libelle: string;
  categorie: AllergieCategorie;
}

export interface ReferentielsAllergie {
  types: OptionReferentiel[];
  criticalites: OptionReferentiel[];
  verificationStatuts: OptionReferentiel[];
  statuts: OptionReferentiel[];
  severites: OptionReferentiel[];
  categories: OptionReferentiel[];
}

export interface PrincipeActifOption {
  id: number;
  libelle: string;
}

export interface NouvelleAllergieInput {
  patientId: number;
  allergieDefinitionCode?: string | null;
  principeActifId?: number | null;
  type: AllergieType;
  criticalite: AllergieCriticalite;
  verificationStatut: AllergieVerificationStatut;
  statut: AllergieStatut;
  dateDebut?: string | null;
  dateFin?: string | null;
  note?: string | null;
}

export interface ModificationAllergieInput {
  type?: AllergieType;
  criticalite?: AllergieCriticalite;
  note?: string | null;
}

export interface NouvelleReactionInput {
  manifestation: string;
  severite: SeveriteReaction;
  allergieDefinitionCode?: string | null;
  description?: string | null;
  dateReaction?: string | null;
  exposition?: string | null;
}

export interface ChangerStatutInput {
  statut: AllergieStatut;
  dateFin?: string | null;
}

export interface NouvelleAllergieDefinitionInput {
  code: string;
  libelle: string;
  categorie: AllergieCategorie;
  codifications?: CodificationAllergie[];
}

export interface ModificationAllergieDefinitionInput {
  libelle?: string;
  categorie?: AllergieCategorie;
  codifications?: CodificationAllergie[];
}

/* ── Helpers d'affichage (badges, couleurs) ──────────────────────────── */

export const LIBELLES_CATEGORIE: Record<AllergieCategorie, string> = {
  food: "Alimentaire",
  medication: "Médicament",
  environment: "Environnement",
  biologic: "Produit biologique",
};

export const COULEURS_STATUT: Record<
  AllergieStatut,
  { chip: string; label: string }
> = {
  active: {
    chip: "bg-rose-50 text-rose-700 border border-rose-200",
    label: "Active",
  },
  inactive: {
    chip: "bg-slate-100 text-slate-600 border border-slate-200",
    label: "Inactive",
  },
  resolved: {
    chip: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    label: "Résolue",
  },
};

export const COULEURS_CRITICITE: Record<
  AllergieCriticalite,
  { chip: string; label: string }
> = {
  low: { chip: "bg-emerald-50 text-emerald-700", label: "Faible" },
  high: { chip: "bg-rose-50 text-rose-700", label: "Élevée" },
  "unable-to-assess": {
    chip: "bg-slate-100 text-slate-600",
    label: "Non évaluable",
  },
};

export const COULEURS_SEVERITE: Record<
  SeveriteReaction,
  { chip: string; label: string }
> = {
  mild: { chip: "bg-emerald-50 text-emerald-700", label: "Légère" },
  moderate: { chip: "bg-amber-50 text-amber-700", label: "Modérée" },
  severe: { chip: "bg-rose-50 text-rose-700", label: "Sévère" },
};

export const COULEURS_VERIFICATION: Record<
  AllergieVerificationStatut,
  { chip: string; label: string }
> = {
  unconfirmed: {
    chip: "bg-amber-50 text-amber-700",
    label: "Non confirmée",
  },
  confirmed: {
    chip: "bg-emerald-50 text-emerald-700",
    label: "Confirmée",
  },
  refuted: {
    chip: "bg-slate-100 text-slate-600",
    label: "Réfutée",
  },
  "entered-in-error": {
    chip: "bg-slate-100 text-slate-500 line-through",
    label: "Saisie par erreur",
  },
};