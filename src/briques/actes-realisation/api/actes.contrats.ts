// src/briques/actes-realisation/api/actes.contrats.ts
export interface ActeRealisableApi {
  id: number;
  code: string;
  libelle: string;
  actif?: boolean;
  categorie?: { id: number; code?: string; libelle?: string };
}

export interface MouleApi {
  acteDefinitionId: number;
  observations: {
    ordre: number;
    obligatoire: boolean;
    observation: {
      id: number;
      code: string;
      libelle: string;
      typeValeur: string;
      uniteCode: string | null;
      uniteLibelle: string | null;
    };
  }[];
}

export interface ActeRealiseApi {
  id: number;
  encounterId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  statut: string;
  commentaire: string | null;
  observations: {
    id: number;
    observationDefinitionId: number;
    code: string;
    libelle?: string;
    valeur: string;
    uniteCode?: string | null;
    interpretation?: string | null;
    statut: string;
  }[];
}

export interface LigneDemandeApi {
  id: number;
  demandeId: number;
  encounterId: number;
  patientId: number;
  acteDefinitionId: number;
  acteDefinitionCode: string;
  acteDefinitionLibelle: string;
  urgente: boolean;
  commentaire: string | null;
  dateDemande: string;
}