/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DiagnosticApiOutput,
  ActeRealiseApiOutput,
  DemandeActeApiOutput,
  LigneDemandeApiOutput,
  DiagnosticDefinitionRefApiOutput,
} from "./consultation-active.contrats";
import {
  DiagnosticMedical,
  DiagnosticDefinitionItem,
  ActePrescritItem,
  DemandeActeItem,
  TypeDiagnostic,
  StatutDiagnostic,
} from "../modele/consultation-active.types";

export function extraireIdNumerique(valeur: unknown): number | null {
  if (typeof valeur === "number" && Number.isFinite(valeur) && valeur > 0) {
    return valeur;
  }
  if (typeof valeur === "string") {
    const s = valeur.trim();
    if (/^\d+$/.test(s)) {
      const n = parseInt(s, 10);
      return n > 0 ? n : null;
    }
    const match = s.match(/\/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      return n > 0 ? n : null;
    }
  }
  if (valeur && typeof valeur === "object") {
    const obj = valeur as Record<string, unknown>;
    return extraireIdNumerique(obj.id ?? obj["@id"]);
  }
  return null;
}

export function mapperDiagnostic(api: DiagnosticApiOutput): DiagnosticMedical {
  const type: TypeDiagnostic = api.type === "secondaire" ? "secondaire" : "principal";
  const statut: StatutDiagnostic =
    api.statut === "confirme" ? "confirme" : api.statut === "infirme" ? "infirme" : "provisoire";

  const codifs = Array.isArray(api.codifications)
    ? api.codifications.map((c) => ({
        codeSystem: String(c.codeSystem),
        code: String(c.code),
      }))
    : [];

  return {
    id: api.id,
    encounterId: api.encounterId,
    staffId: api.staffId,
    diagnosticDefinitionId: api.diagnosticDefinitionId,
    code: api.code,
    libelle: api.libelle,
    codifications: codifs,
    type,
    statut,
    dateDiagnostic: api.dateDiagnostic,
    commentaire: api.commentaire,
  };
}

export function mapperDiagnosticDefinitionRef(item: unknown): DiagnosticDefinitionItem {
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
        : true;

  const codificationsRaw = Array.isArray(obj.codifications) ? obj.codifications : [];
  const codifications = codificationsRaw.map((c: any) => ({
    codeSystem: String(c?.codeSystem ?? ""),
    code: String(c?.code ?? ""),
  }));

  return {
    id: idNum,
    code,
    libelle,
    description,
    chapitre,
    actif,
    codifications,
  };
}

export function mapperActePrescrit(api: ActeRealiseApiOutput): ActePrescritItem {
  return {
    id: api.id,
    encounterId: api.encounterId,
    acteDefinitionId: api.acteDefinitionId,
    code: api.acteDefinitionCode,
    libelle: api.acteDefinitionLibelle,
    statut: api.statut,
    commentaire: api.commentaire,
    dateRealisation: api.dateRealisation,
    observations: Array.isArray(api.observations)
      ? api.observations.map((o) => ({
          id: o.id,
          observationDefinitionId: o.observationDefinitionId,
          code: o.code,
          libelle: o.libelle,
          typeValeur: o.typeValeur,
          valeur: o.valeur,
          uniteCode: o.uniteCode ?? o.unite,
          interpretation: o.interpretation,
          dateObservation: o.dateObservation,
          statut: o.statut,
        }))
      : [],
    resultats: Array.isArray(api.resultats)
      ? api.resultats.map((r) => ({
          id: r.id,
          type: r.type,
          interpretation: r.interpretation,
          conclusion: r.conclusion,
          dateValidation: r.dateValidation,
          observations: Array.isArray(r.observations)
            ? r.observations.map((ro) => ({
                id: ro.id,
                observationDefinitionId: ro.observationDefinitionId,
                code: ro.code,
                libelle: ro.libelle,
                typeValeur: ro.typeValeur,
                valeur: ro.valeur,
                uniteCode: ro.uniteCode,
                interpretation: ro.interpretation,
                dateObservation: ro.dateObservation,
                statut: ro.statut,
              }))
            : [],
        }))
      : [],
  };
}

export function mapperDemandeActe(raw: unknown): DemandeActeItem | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const id = extraireIdNumerique(obj.id ?? obj.Id_Demande ?? obj.demandeId) ?? 0;
  if (!id) return null;

  const encounterId = extraireIdNumerique(obj.encounterId ?? obj.encounter) ?? 0;
  const patientId = extraireIdNumerique(obj.patientId ?? obj.patient) ?? undefined;
  const serviceId = extraireIdNumerique(obj.serviceId ?? obj.service) ?? undefined;

  // Lignes imbriquées éventuelles
  const premiereLigne =
    Array.isArray(obj.lignes) && obj.lignes.length > 0
      ? (obj.lignes[0] as Record<string, unknown>)
      : null;

  const acteDefObj = (premiereLigne?.acteDefinition ?? obj.acteDefinition) as
    Record<string, unknown> | undefined;
  const acteDefId =
    extraireIdNumerique(
      premiereLigne?.acteDefinitionId ??
        premiereLigne?.acteDefinition ??
        obj.acteDefinitionId ??
        obj.acteDefinition,
    ) ?? 0;

  const acteDefCode = String(
    premiereLigne?.acteDefinitionCode ?? obj.acteDefinitionCode ?? acteDefObj?.code ?? "",
  ).trim();

  const acteDefLibelle = String(
    premiereLigne?.acteDefinitionLibelle ??
      obj.acteDefinitionLibelle ??
      acteDefObj?.libelle ??
      obj.libelle ??
      `Acte #${acteDefId || id}`,
  ).trim();

  const priorite = String(premiereLigne?.priorite ?? obj.priorite ?? "NORMALE").toUpperCase();
  const urgente = Boolean(premiereLigne?.urgente ?? obj.urgente ?? priorite === "URGENTE");
  const commentaire =
    (premiereLigne?.commentaire ?? obj.commentaire)
      ? String(premiereLigne?.commentaire ?? obj.commentaire).trim()
      : null;

  const dateDemande = String(
    obj.dateDemande ?? obj.createdAt ?? obj.dateCreation ?? new Date().toISOString(),
  );

  const serviceObj = obj.service as Record<string, unknown> | undefined;
  const serviceNom = obj.serviceNom
    ? String(obj.serviceNom)
    : serviceObj?.nom
      ? String(serviceObj.nom)
      : serviceId === 3
        ? "Soins infirmiers"
        : undefined;

  return {
    id,
    demandeId: extraireIdNumerique(obj.demandeId) ?? id,
    encounterId,
    patientId,
    acteDefinitionId: acteDefId,
    acteDefinitionCode: acteDefCode || undefined,
    acteDefinitionLibelle: acteDefLibelle,
    priorite,
    urgente,
    serviceId,
    serviceNom,
    statut: String(obj.statut ?? "en_attente"),
    commentaire,
    dateDemande,
  };
}

import type { PieceJointeApiOutput } from "./consultation-active.contrats";
import type { PieceJointeItem } from "../modele/consultation-active.types";

export function mapperPieceJointe(api: PieceJointeApiOutput): PieceJointeItem {
  return {
    id: api.id,
    nomFichier: api.nomFichier,
    contentType: api.contentType,
    taille: api.taille,
    typePieceJointe: api.typePieceJointe,
    statut: api.statut,
    dateUpload: api.dateUpload,
  };
}
