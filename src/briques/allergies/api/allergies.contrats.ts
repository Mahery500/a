// src/briques/allergies/api/allergies.contrats.ts

import type {
  AllergieCategorie,
  AllergieCriticalite,
  AllergieStatut,
  AllergieType,
  AllergieVerificationStatut,
  SeveriteReaction,
} from "../modele/allergie.types";

export interface OptionOutputApi {
  valeur: string;
  libelle: string;
}

export interface CodificationApi {
  codeSystem: string;
  code: string;
}

export interface ReactionApiOutput {
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

export interface AllergieApiOutput {
  id: number;
  patientId: number;
  allergieDefinitionCode: string | null;
  allergieDefinitionLibelle: string | null;
  allergieDefinitionCodifications: CodificationApi[];
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
  reactions: ReactionApiOutput[];
}

export interface AllergieDefinitionApiOutput {
  id: number;
  code: string;
  libelle: string;
  categorie: AllergieCategorie;
  actif: boolean;
  codifications: CodificationApi[];
}

export interface AllergieDefinitionSummaryApiOutput {
  id: number;
  code: string;
  libelle: string;
  categorie: AllergieCategorie;
}

export interface ReferentielsAllergieApiOutput {
  types: OptionOutputApi[];
  criticalites: OptionOutputApi[];
  verificationStatuts: OptionOutputApi[];
  statuts: OptionOutputApi[];
  severites: OptionOutputApi[];
  categories: OptionOutputApi[];
}

export interface CreateAllergieApiInput {
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

export interface UpdateAllergieApiInput {
  type?: AllergieType;
  criticalite?: AllergieCriticalite;
  note?: string | null;
}

export interface CreateReactionApiInput {
  manifestation: string;
  severite: SeveriteReaction;
  allergieDefinitionCode?: string | null;
  description?: string | null;
  dateReaction?: string | null;
  exposition?: string | null;
}

export interface ChangeStatutApiInput {
  statut: AllergieStatut;
  dateFin?: string | null;
}

export interface CreateAllergieDefinitionApiInput {
  code: string;
  libelle: string;
  categorie: AllergieCategorie;
  codifications?: CodificationApi[];
}

export interface UpdateAllergieDefinitionApiInput {
  libelle?: string;
  categorie?: AllergieCategorie;
  codifications?: CodificationApi[];
}