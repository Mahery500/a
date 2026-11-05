/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ServiceMedical,
  TypeServiceMedical,
  NouveauServiceInput,
  ModificationServiceInput,
  NouveauTypeServiceInput,
  ModificationTypeServiceInput,
  DomaineService,
  DOMAINES_SERVICE,
} from "../modele/service.types";
import { ServiceInputApi, TypeServiceInputApi } from "./services.contrats";

// ─────────────────────────────────────────────────────────────────────────────
// mapperService
// ─────────────────────────────────────────────────────────────────────────────
export function mapperService(brut: unknown): ServiceMedical | null {
  if (!brut || typeof brut !== "object") {
    return null;
  }

  const obj = brut as Record<string, unknown>;
  const idBrut = obj.id ?? obj.Id_Service;
  const idNum = typeof idBrut === "number" ? idBrut : Number(idBrut);

  if (!Number.isFinite(idNum) || idNum <= 0) {
    return null;
  }

  const siteIdBrut = obj.siteId ?? obj.Id_Site;
  const siteId = typeof siteIdBrut === "number" ? siteIdBrut : Number(siteIdBrut);

  const typeServiceIdBrut = obj.typeServiceId;
  const typeServiceId =
    typeof typeServiceIdBrut === "number" ? typeServiceIdBrut : Number(typeServiceIdBrut);

  const nomSite = typeof obj.siteName === "string" ? obj.siteName.trim() : "";
  const nomTypeService =
    typeof obj.typeServiceName === "string"
      ? obj.typeServiceName.trim()
      : typeof obj.Libelle === "string"
        ? obj.Libelle.trim()
        : "";

  const description = typeof obj.description === "string" ? obj.description.trim() : "";
  const actif = typeof obj.isActive === "boolean" ? obj.isActive : true;
  const dateCreation = typeof obj.createdAt === "string" ? obj.createdAt : undefined;

  return {
    id: idNum,
    siteId: Number.isFinite(siteId) ? siteId : 0,
    nomSite,
    typeServiceId: Number.isFinite(typeServiceId) ? typeServiceId : 0,
    nomTypeService,
    description,
    actif,
    dateCreation,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// mapperTypeService — avec `domaine`
// ─────────────────────────────────────────────────────────────────────────────
export function mapperTypeService(brut: unknown): TypeServiceMedical | null {
  if (!brut || typeof brut !== "object") {
    return null;
  }

  const obj = brut as Record<string, unknown>;
  const idBrut = obj.id ?? obj.Id_Type_Service;
  const idNum = typeof idBrut === "number" ? idBrut : Number(idBrut);

  if (!Number.isFinite(idNum) || idNum <= 0) {
    return null;
  }

  const code = String(obj.code ?? "").trim();
  const nom = String(obj.name ?? obj.Libelle ?? obj.libelle ?? "").trim();
  const description = typeof obj.description === "string" ? obj.description.trim() : "";
  const actif = typeof obj.isActive === "boolean" ? obj.isActive : true;

  // Lecture + repli défensif pour les anciennes données / vieux back
  const domaineBrut = String(obj.domaine ?? "")
    .trim()
    .toUpperCase();
  const domaine: DomaineService = (DOMAINES_SERVICE as readonly string[]).includes(domaineBrut)
    ? (domaineBrut as DomaineService)
    : "ADMINISTRATIF";

  return {
    id: idNum,
    code,
    nom,
    description,
    actif,
    supporteAiguillage: typeof obj.supporteAiguillage === "boolean" ? obj.supporteAiguillage : true,
    domaine,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// mapperServiceVersApi
// ─────────────────────────────────────────────────────────────────────────────
export function mapperServiceVersApi(
  saisie: NouveauServiceInput | ModificationServiceInput,
): ServiceInputApi {
  return {
    siteId: Number(saisie.siteId),
    typeServiceId: Number(saisie.typeServiceId),
    description: saisie.description?.trim() ? saisie.description.trim() : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// mapperTypeServiceVersApi — avec `domaine`
// ─────────────────────────────────────────────────────────────────────────────
export function mapperTypeServiceVersApi(
  saisie: NouveauTypeServiceInput | ModificationTypeServiceInput,
): TypeServiceInputApi {
  // Le backend exige `domaine` sur POST **et** PUT (Assert\NotNull).
  // On refuse tôt côté front plutôt que d'envoyer un 422 confus.
  if (!saisie.domaine) {
    throw new Error(
      "Le domaine du service est obligatoire (requis par l'API Symfony).",
    );
  }

  return {
    code: (saisie.code ?? "").trim(),
    name: (saisie.nom ?? "").trim(),
    description: saisie.description?.trim() ? saisie.description.trim() : null,
    supporteAiguillage: saisie.supporteAiguillage ?? true,
    domaine: saisie.domaine,
  };
}