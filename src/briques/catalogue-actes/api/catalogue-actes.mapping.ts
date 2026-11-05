/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CategorieActe,
  ActeMedical,
  TypeServiceOption,
  NouvelActeInput,
  ModificationActeInput,
  CodificationActe,
  CodeSystemeOption,
  NouveauCodeSystemeInput,
} from "../modele/catalogue-actes.types";
import {
  CreateActeDefinitionPayloadApi,
  PatchActeDefinitionPayloadApi,
  CodeSystemApiOutput,
  CreateCodeSystemApiInput,
} from "./catalogue-actes.contrats";
import type { Habilitation } from "@/noyau/referentiels/habilitations";
import {
  DOMAINES_SERVICE,
  type DomaineService,
} from "@/briques/services/modele/service.types";

export function mapperCategorieActe(brut: unknown): CategorieActe | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    code: String(o.code ?? "")
      .trim()
      .toUpperCase(),
    libelle: String(o.libelle ?? "").trim(),
    parentId: typeof o.parentId === "number" ? o.parentId : null,
    parentCode: typeof o.parentCode === "string" ? o.parentCode : null,
    niveau: typeof o.niveau === "number" ? o.niveau : 1,
    feuille: typeof o.feuille === "boolean" ? o.feuille : true,
    chemin: Array.isArray(o.chemin) ? o.chemin.map(String) : [],
  };
}

export function mapperActeMedical(brut: unknown): ActeMedical | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;

  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const code = String(o.code ?? "")
    .trim()
    .toUpperCase();
  const libelle = String(o.libelle ?? "").trim();
  if (!code || !libelle) return null;

  const categorie = mapperCategorieActe(o.categorie);
  if (!categorie) return null;

  const habilitations: Habilitation[] = Array.isArray(o.habilitations)
    ? o.habilitations
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

  const typeServiceIds = Array.isArray(o.typeServiceIds)
    ? o.typeServiceIds.map(Number).filter((n): n is number => Number.isFinite(n) && n > 0)
    : [];

  const codifications: CodificationActe[] = Array.isArray(o.codifications)
    ? o.codifications
        .map((c: unknown) => {
          if (!c || typeof c !== "object") return null;
          const co = c as Record<string, unknown>;
          const codeSystem = String(co.codeSystem ?? "")
            .trim()
            .toUpperCase();
          const codeVal = String(co.code ?? "").trim();
          if (!codeVal || !codeSystem) return null;
          return {
            codeSystem,
            code: codeVal,
            libelle: co.libelle ? String(co.libelle).trim() : undefined,
          } as CodificationActe;
        })
        .filter((c): c is CodificationActe => c !== null)
    : [];

  return {
    id,
    code,
    libelle,
    actif: typeof o.actif === "boolean" ? o.actif : true,
    categorie,
    habilitations,
    typeServiceIds,
    codifications,
  };
}

export function mapperTypeServiceOption(brut: unknown): TypeServiceOption | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  // Le backend peut renvoyer `domaine` en majuscules (enum PHP) ou en clair.
  const domaineBrut = String(o.domaine ?? "").trim().toUpperCase();
  const domaine: DomaineService | null = (DOMAINES_SERVICE as readonly string[]).includes(
    domaineBrut,
  )
    ? (domaineBrut as DomaineService)
    : null;

  return {
    id,
    code: String(o.code ?? "").trim(),
    nom: String(o.name ?? o.nom ?? o.libelle ?? `Service #${id}`).trim(),
    domaine,
  };
}

export function mapperCodeSystemDepuisApi(brut: unknown): CodeSystemeOption | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const code = String(o.code ?? "")
    .trim()
    .toUpperCase();
  if (!code) return null;
  return {
    id,
    code,
    libelle: String(o.libelle ?? o.name ?? code).trim(),
    uri: o.uri ? String(o.uri).trim() : null,
    actif: typeof o.actif === "boolean" ? o.actif : true,
  };
}

export function mapperNouvelActeVersApi(saisie: NouvelActeInput): CreateActeDefinitionPayloadApi {
  return {
    code: saisie.code.trim().toUpperCase(),
    libelle: saisie.libelle.trim(),
    categorieCode: saisie.categorieCode.trim().toUpperCase(),
    habilitations: saisie.habilitations.map((h) => ({
      corpsMedicalCode: h.corpsMedicalCode.trim().toUpperCase(),
      specialiteCode: h.specialiteCode ? h.specialiteCode.trim().toUpperCase() : null,
    })),
    typeServiceIds:
      saisie.typeServiceIds && saisie.typeServiceIds.length > 0 ? saisie.typeServiceIds : undefined,
    codifications:
      saisie.codifications && saisie.codifications.length > 0
        ? saisie.codifications.map((c) => ({
            codeSystem: c.codeSystem.trim().toUpperCase(),
            code: c.code.trim(),
            libelle: c.libelle?.trim(),
          }))
        : undefined,
  };
}

export function mapperModificationActeVersApi(
  saisie: ModificationActeInput,
): PatchActeDefinitionPayloadApi {
  const payload: PatchActeDefinitionPayloadApi = {};
  if (saisie.libelle !== undefined) payload.libelle = saisie.libelle.trim();
  if (saisie.categorieCode !== undefined)
    payload.categorieCode = saisie.categorieCode.trim().toUpperCase();
  if (saisie.habilitations !== undefined) {
    payload.habilitations = saisie.habilitations.map((h) => ({
      corpsMedicalCode: h.corpsMedicalCode.trim().toUpperCase(),
      specialiteCode: h.specialiteCode ? h.specialiteCode.trim().toUpperCase() : null,
    }));
  }
  if (saisie.typeServiceIds !== undefined) payload.typeServiceIds = [...saisie.typeServiceIds];
  if (saisie.actif !== undefined) payload.actif = saisie.actif;
  if (saisie.codifications !== undefined) {
    payload.codifications = saisie.codifications.map((c) => ({
      codeSystem: c.codeSystem.trim().toUpperCase(),
      code: c.code.trim(),
      libelle: c.libelle?.trim(),
    }));
  }
  return payload;
}

export function mapperNouveauCodeSystemVersApi(
  saisie: NouveauCodeSystemeInput,
): CreateCodeSystemApiInput {
  return {
    code: saisie.code.trim().toUpperCase(),
    libelle: saisie.libelle.trim(),
    uri: saisie.uri ? saisie.uri.trim() : null,
  };
}