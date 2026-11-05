/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Habilitation, HabilitationInput } from "@/noyau/referentiels/habilitations";

export interface CodificationDiagnostic {
  codeSystem: string;
  code: string;
  libelle?: string;
}

export interface CodeSystemeOption {
  id: number;
  code: string;
  libelle: string;
  uri: string | null;
  actif: boolean;
}

export interface NouveauCodeSystemeInput {
  code: string;
  libelle: string;
  uri?: string | null;
}

export interface DiagnosticDefinition {
  id: number;
  code: string;
  libelle: string;
  description: string | null;
  chapitre: string | null;
  actif: boolean;
  codifications: CodificationDiagnostic[];
  habilitations: Habilitation[];
  dateCreation?: string;
}

export interface NouvelleDiagnosticDefinitionInput {
  code: string;
  libelle: string;
  description?: string | null;
  chapitre?: string | null;
  actif?: boolean;
  codifications?: CodificationDiagnostic[];
  habilitations: HabilitationInput[];
}

export interface ModificationDiagnosticDefinitionInput {
  code?: string;
  libelle?: string;
  description?: string | null;
  chapitre?: string | null;
  actif?: boolean;
  codifications?: CodificationDiagnostic[];
  habilitations?: HabilitationInput[];
}
