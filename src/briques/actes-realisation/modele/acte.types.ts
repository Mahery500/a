// src/briques/actes-realisation/modele/acte.types.ts
export type StatutActe = "planifie" | "en_cours" | "realise" | "annule" | "saisi_par_erreur";

export interface ActeRealisable {
  id: number;
  code: string;
  libelle: string;
  categorieCode?: string;
}

export interface ChampMoule {
  observationId: number; // = observationDefinitionId à envoyer au back
  code: string;
  libelle: string;
  typeValeur: "numerique" | "texte";
  unite: string | null;
  obligatoire: boolean;
  ordre: number;
}

export interface ObservationEnregistree {
  id: number;
  observationDefinitionId: number;
  code: string;
  libelle?: string;
  valeur: string;
  unite: string | null;
  interpretation: string | null;
  statut: string;
}

export interface ActeEnregistre {
  id: number;
  encounterId: number;
  acteDefinitionId: number;
  code: string;
  libelle: string;
  statut: StatutActe;
  commentaire: string | null;
  observations: ObservationEnregistree[];
}

export interface EnregistrementActeInput {
  encounterId: number;
  acteDefinitionId: number;
  moule: ChampMoule[];
  valeurs: Record<number, string>;
  interpretations?: Record<number, string>;
  commentaire?: string;
  ligneDemandeId?: number | null;
  /** Si renseigné, on complète cet acte au lieu d'en créer un. */
  acteExistantId?: number | null;
}

/** Une ligne de demande d'acte (prescription) à exécuter. */
export interface ActeDemande {
  id: number; // = ligneDemandeId à envoyer à la création de l'acte
  demandeId: number;
  encounterId: number;
  patientId: number;
  acteDefinitionId: number;
  code: string;
  libelle: string;
  urgente: boolean;
  commentaire: string | null;
  dateDemande: string;
}

export const OBSERVATIONS_ACTIVES = ["preliminaire", "final"];