/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DiagnosticDefinition,
  CodificationDiagnostic,
  CodeSystemeOption,
} from "../modele/diagnostic-definition.types";
import {
  DiagnosticDefinitionApiOutput,
  CodeSystemApiOutput,
} from "./diagnostic-definition.contrats";
import type { Habilitation } from "@/noyau/referentiels/habilitations";

export function mapperDiagnosticDefinition(item: unknown): DiagnosticDefinition {
  const obj = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;

  const idNum = Number(obj.id ?? 0);
  const code = String(obj.code ?? "");
  const libelle = String(obj.libelle ?? obj.nom ?? obj.name ?? code);
  const description = obj.description ? String(obj.description) : null;
  const chapitre = obj.chapitre
    ? String(obj.chapitre)
    : obj.categorie
      ? String(obj.categorie)
      : obj.famille
        ? String(obj.famille)
        : null;

  const actif =
    obj.actif !== undefined
      ? Boolean(obj.actif)
      : obj.isActive !== undefined
        ? Boolean(obj.isActive)
        : obj.active !== undefined
          ? Boolean(obj.active)
          : true;

  const codifications: CodificationDiagnostic[] = Array.isArray(obj.codifications)
    ? obj.codifications
        .map((c: unknown): CodificationDiagnostic | null => {
          if (typeof c === "object" && c !== null) {
            const co = c as Record<string, unknown>;
            return {
              codeSystem: String(co.codeSystem ?? co.code_system ?? ""),
              code: String(co.code ?? ""),
              libelle: co.libelle ? String(co.libelle) : undefined,
            };
          }
          return null;
        })
        .filter((c): c is CodificationDiagnostic => Boolean(c && c.code && c.codeSystem))
    : [];

  const habilitations: Habilitation[] = Array.isArray(obj.habilitations)
    ? obj.habilitations
        .filter((h): h is Record<string, unknown> => Boolean(h && typeof h === "object"))
        .map((h) => ({
          corpsMedicalCode: String(h.corpsMedicalCode ?? "").trim().toUpperCase(),
          corpsMedicalLibelle: h.corpsMedicalLibelle
            ? String(h.corpsMedicalLibelle).trim()
            : undefined,
          specialiteCode: h.specialiteCode ? String(h.specialiteCode).trim().toUpperCase() : null,
          specialiteLibelle: h.specialiteLibelle
            ? String(h.specialiteLibelle).trim()
            : undefined,
          actif: typeof h.actif === "boolean" ? h.actif : true,
        }))
        .filter((h) => h.corpsMedicalCode.length > 0)
    : [];


  return {
    id: idNum,
    code,
    libelle,
    description,
    chapitre,
    actif,
    codifications,
    habilitations,
    dateCreation: obj.createdAt ? String(obj.createdAt) : undefined,
  };
}

export function mapperCodeSystem(item: CodeSystemApiOutput): CodeSystemeOption {
  return {
    id: Number(item.id),
    code: String(item.code || ""),
    libelle: String(item.libelle || item.code || ""),
    uri: item.uri || null,
    actif:
      item.actif !== undefined
        ? Boolean(item.actif)
        : item.isActive !== undefined
          ? Boolean(item.isActive)
          : true,
  };
}
