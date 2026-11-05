/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import {
  DiagnosticApiOutput,
  CreateDiagnosticApiInput,
  ActeRealiseApiOutput,
  ActeDefinitionApiOutput,
  CreateActeRealiseApiInput,
  AddObservationApiInput,
  EncounterTermineApiOutput,
  DemandeActeApiInput,
  DemandeActeApiOutput,
} from "./consultation-active.contrats";
import {
  DiagnosticMedical,
  NouveauDiagnosticInput,
  DiagnosticDefinitionItem,
  ActePrescritItem,
  PrescriptionActeInput,
  EnregistrerActeEncounterInput,
  ExamenCliniqueInput,
  DemandeActeInput,
  DemandeActeItem,
  ObservationResultatInput,
} from "../modele/consultation-active.types";
import {
  mapperDiagnostic,
  mapperDiagnosticDefinitionRef,
  mapperActePrescrit,
  mapperDemandeActe,
} from "./consultation-active.mapping";

import { obtenirUrlBaseApi, obtenirJetonJwt } from "@/noyau/http/session";
import { ErreurApi } from "@/noyau/http/erreurApi";
import type {
  AddObservationResultatApiInput,
  ChangePieceJointeStatutApiInput,
  PieceJointeApiOutput,
} from "./consultation-active.contrats";
import type {
  NouvelActeExterneInput,
  NouvellePieceJointe,
  PieceJointeItem,
  TypePieceJointe,
} from "../modele/consultation-active.types";
import { mapperPieceJointe } from "./consultation-active.mapping";
import type { ChampMouleObservation, TypeValeurObservation } from "../modele/consultation-active.types"

// --- Limites (miroir du backend, AddPieceJointeRequest) ---
const TAILLE_MAX_PJ = 10 * 1024 * 1024; // 10 Mo
const MIMES_AUTORISES = ["application/pdf", "image/jpeg", "image/png"];

export const consultationActiveApi = {
  async listerDiagnostics(encounterId: number): Promise<DiagnosticMedical[]> {
    const raw = await clientHttp<unknown>("/diagnostics", {
      params: { encounterId },
    });
    const items = extraireElementsCollection<DiagnosticApiOutput>(raw);
    return items.map(mapperDiagnostic);
  },

  async listerDiagnosticDefinitions(): Promise<DiagnosticDefinitionItem[]> {
    try {
      const raw = await clientHttp<unknown>("/diagnostic_definitions");
      const items = extraireElementsCollection<unknown>(raw);
      return items.map(mapperDiagnosticDefinitionRef).filter((d) => d.actif);
    } catch {
      try {
        const rawAlt = await clientHttp<unknown>("/diagnostics_definitions");
        const items = extraireElementsCollection<unknown>(rawAlt);
        return items.map(mapperDiagnosticDefinitionRef).filter((d) => d.actif);
      } catch {
        return [];
      }
    }
  },

  async creerDiagnostic(input: NouveauDiagnosticInput): Promise<DiagnosticMedical> {
    const raw = await clientHttp<DiagnosticApiOutput>("/diagnostics", {
      method: "POST",
      body: JSON.stringify({
        encounterId: input.encounterId,
        diagnosticDefinitionId: input.diagnosticDefinitionId,
        statut: input.statut || "provisoire",
        dateDiagnostic: input.dateDiagnostic || undefined,
        commentaire: input.commentaire || null,
      } as CreateDiagnosticApiInput),
    });
    return mapperDiagnostic(raw);
  },

  async changerStatutDiagnostic(
    diagnosticId: number,
    statut: "provisoire" | "confirme" | "infirme",
  ): Promise<DiagnosticMedical> {
    const raw = await clientHttp<DiagnosticApiOutput>(`/diagnostics/${diagnosticId}/statut`, {
      method: "POST",
      body: JSON.stringify({ statut }),
    });
    return mapperDiagnostic(raw);
  },

  async listerActes(encounterId: number): Promise<ActePrescritItem[]> {
    const raw = await clientHttp<unknown>("/acte_realises", {
      params: { encounterId },
    });
    const items = extraireElementsCollection<ActeRealiseApiOutput>(raw);
    return items.map(mapperActePrescrit);
  },

  /**
   * Liste les actes que le soignant connecté peut RÉELLEMENT réaliser sur cette
   * prise en charge. Le backend (ListActesRealisables) applique la règle
   * actif + rôle autorisé + type de service accepté.
   *
   * Endpoint : GET /api/me/actes_realisables?encounterId=X
   * Réponse : ActeDefinitionOutput[] (id, code, libelle, actif, categorie,
   *           rolesAutorises, typeServiceIds, codifications)
   */
  async listerCatalogueActes(encounterId: number): Promise<ActeDefinitionApiOutput[]> {
    const raw = await clientHttp<unknown>("/me/actes_realisables", {
      params: { encounterId },
    });
    return extraireElementsCollection<ActeDefinitionApiOutput>(raw).filter((a) => a.actif);
  },

  async prescrireActe(input: PrescriptionActeInput): Promise<ActePrescritItem> {
    const raw = await clientHttp<ActeRealiseApiOutput>("/acte_realises", {
      method: "POST",
      body: JSON.stringify({
        encounterId: input.encounterId,
        acteDefinitionId: input.acteDefinitionId,
        statut: input.statut || "planifie",
        commentaire: input.commentaire || null,
      } as CreateActeRealiseApiInput),
    });
    return mapperActePrescrit(raw);
  },

  /**
   * Enregistrement diut d'un acte médical exécuté lors de la consultation (Encounter médecin généraliste).
   */
  async enregistrerActeEncounter(input: EnregistrerActeEncounterInput): Promise<ActePrescritItem> {
    const payload: CreateActeRealiseApiInput = {
      encounterId: input.encounterId,
      acteDefinitionId: input.acteDefinitionId,
      statut: input.statut || "realise",
      commentaire: input.commentaire || null,
      dateRealisation: input.dateRealisation || new Date().toISOString(),
    };

    const raw = await clientHttp<ActeRealiseApiOutput>("/acte_realises", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapperActePrescrit(raw);
  },

  /**
   * Ajoute un résultat clinique ou compte-rendu (ex: analyse, imagerie, examen) à un acte réalisé.
   * Endpoint Symfony : POST /acte_realises/{id}/resultats
   */
  async ajouterResultatActe(
    acteRealiseId: number,
    input: { type: string; interpretation?: string | null; conclusion?: string | null },
  ): Promise<ActePrescritItem> {
    const raw = await clientHttp<ActeRealiseApiOutput>(
      `/acte_realises/${acteRealiseId}/resultats`,
      {
        method: "POST",
        body: JSON.stringify({
          type: input.type.trim(),
          interpretation: input.interpretation?.trim() || null,
          conclusion: input.conclusion?.trim() || null,
        }),
      },
    );
    return mapperActePrescrit(raw);
  },

  /**
   * Ajoute une observation clinique directement à un acte réalisé.
   * Endpoint Symfony : POST /acte_realises/{id}/observations
   */
  async ajouterObservationActe(
    acteRealiseId: number,
    input: { observationDefinitionId: number; valeur: string; interpretation?: string | null },
  ): Promise<ActePrescritItem> {
    const raw = await clientHttp<ActeRealiseApiOutput>(
      `/acte_realises/${acteRealiseId}/observations`,
      {
        method: "POST",
        body: JSON.stringify({
          observationDefinitionId: input.observationDefinitionId,
          valeur: input.valeur.trim(),
          interpretation: input.interpretation?.trim() || null,
        }),
      },
    );
    return mapperActePrescrit(raw);
  },

  /**
   * Récupère le moule d'observations attendues pour un acte.
   * Endpoint Symfony : GET /acte_definitions/{id}/observations
   */
  async recupererObservationsAttendues(
  acteDefinitionId: number,
): Promise<ChampMouleObservation[]> {
  interface ActeObsReponse {
    acteDefinitionId: number;
    observations: ChampMouleObservation[];
  }

  const raw = await clientHttp<ActeObsReponse>(
    `/acte_definitions/${acteDefinitionId}/observations`,
  );

  const items = raw?.observations ?? [];

  // Normalisation : le backend renvoie `typeValeur: string`,
  // on le contraint à l'union métier "numerique" | "texte".
  return items.map((item) => {
    const tv = String(item.observation.typeValeur).toLowerCase();
    const typeValeur: TypeValeurObservation = tv === "texte" ? "texte" : "numerique";

    return {
      ordre: item.ordre,
      obligatoire: Boolean(item.obligatoire),
      observation: {
        id: item.observation.id,
        code: item.observation.code,
        libelle: item.observation.libelle,
        typeValeur,
        actif: item.observation.actif !== false,
        uniteId: item.observation.uniteId ?? null,
        uniteCode: item.observation.uniteCode ?? null,
        uniteLibelle: item.observation.uniteLibelle ?? null,
      },
    };
  });
},

  /**
   * Met à jour le statut d'un acte réalisé (ex: marquer comme réalisé ou saisi par erreur).
   * Endpoint Symfony : POST /acte_realises/{id}/statut
   */
  async changerStatutActe(
    acteId: number,
    statut: "realise" | "saisi_par_erreur" | "en_cours" | "annule",
  ): Promise<void> {
    await clientHttp(`/acte_realises/${acteId}/statut`, {
      method: "POST",
      body: JSON.stringify({ statut }),
    });
  },

  async enregistrerExamenClinique(input: ExamenCliniqueInput): Promise<void> {
    // 1. Trouver ou créer un acte support de consultation
    const actes = await this.listerActes(input.encounterId);
    let acteId: number | null = actes.length > 0 ? actes[0].id : null;

    if (!acteId) {
      const catalogue = await this.listerCatalogueActes();
      const defConsult =
        catalogue.find(
          (c) =>
            c.code.toLowerCase().includes("cons") || c.libelle.toLowerCase().includes("consult"),
        ) || catalogue[0];

      if (defConsult) {
        const nouvelActe = await this.prescrireActe({
          encounterId: input.encounterId,
          acteDefinitionId: defConsult.id,
          statut: "realise",
          commentaire: input.noteClinique || "Examen clinique médical",
        });
        acteId = nouvelActe.id;
      }
    }

    if (!acteId) return;

    const observations: AddObservationApiInput[] = [];
    if (input.ta?.trim()) observations.push({ code: "TA", valeur: input.ta.trim(), unite: "mmHg" });
    if (input.temp?.trim())
      observations.push({ code: "TEMP", valeur: input.temp.trim(), unite: "°C" });
    if (input.fc?.trim()) observations.push({ code: "FC", valeur: input.fc.trim(), unite: "bpm" });
    if (input.spo2?.trim())
      observations.push({ code: "SPO2", valeur: input.spo2.trim(), unite: "%" });
    if (input.poids?.trim())
      observations.push({ code: "POIDS", valeur: input.poids.trim(), unite: "kg" });
    if (input.noteClinique?.trim()) {
      observations.push({
        code: "OBS_CLINIQUE",
        valeur: input.noteClinique.trim(),
        interpretation: "Observations cliniques et anamnèse",
      });
    }

    for (const obs of observations) {
      await clientHttp(`/acte_realises/${acteId}/observations`, {
        method: "POST",
        body: JSON.stringify(obs),
      });
    }
  },

  async terminerConsultation(
    encounterId: number,
    forcer = false,
  ): Promise<EncounterTermineApiOutput> {
    return clientHttp<EncounterTermineApiOutput>(`/encounters/${encounterId}/terminer`, {
      method: "POST",
      params: { forcer: forcer ? 1 : undefined },
    });
  },

  /**
   * Récupère la liste des demandes d'actes et de soins émises pour cette consultation.
   */
  async listerDemandesActes(encounterId: number, patientId?: number): Promise<DemandeActeItem[]> {
    const resultats: DemandeActeItem[] = [];
    const idsVus = new Set<number>();

    // 1. Tenter /demandes ou /demande_actes par encounterId
    try {
      const raw = await clientHttp<unknown>("/demandes", {
        params: { encounterId },
      });
      const items = extraireElementsCollection<unknown>(raw);
      for (const item of items) {
        const d = mapperDemandeActe(item);
        if (d && !idsVus.has(d.id)) {
          idsVus.add(d.id);
          resultats.push(d);
        }
      }
    } catch {
      // Ignorer si l'entité globale demandes n'est pas exposée directement
    }

    if (resultats.length === 0) {
      try {
        const rawDem = await clientHttp<unknown>("/demande_actes", {
          params: { encounterId },
        });
        const items = extraireElementsCollection<unknown>(rawDem);
        for (const item of items) {
          const d = mapperDemandeActe(item);
          if (d && !idsVus.has(d.id)) {
            idsVus.add(d.id);
            resultats.push(d);
          }
        }
      } catch {
        // Ignorer
      }
    }

    // 2. Si patientId est fourni, récupérer également /me/actes_a_faire
    if (patientId) {
      try {
        const rawMe = await clientHttp<unknown>("/me/actes_a_faire", {
          params: { patientId },
        });
        const items = extraireElementsCollection<unknown>(rawMe);
        for (const item of items) {
          const d = mapperDemandeActe(item);
          if (d && !idsVus.has(d.id)) {
            idsVus.add(d.id);
            resultats.push(d);
          }
        }
      } catch {
        // Ignorer
      }
    }

    // 3. Compléter avec les actes prescrits planifiés sur cet encounter
    try {
      const actes = await this.listerActes(encounterId);
      for (const a of actes) {
        if (!idsVus.has(a.id)) {
          idsVus.add(a.id);
          resultats.push({
            id: a.id,
            encounterId: a.encounterId,
            acteDefinitionId: a.acteDefinitionId,
            acteDefinitionCode: a.code,
            acteDefinitionLibelle: a.libelle,
            priorite: "NORMALE",
            urgente: false,
            statut: a.statut,
            commentaire: a.commentaire,
            dateDemande: a.dateRealisation || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignorer
    }

    return resultats.sort((a, b) => {
      if (a.urgente && !b.urgente) return -1;
      if (!a.urgente && b.urgente) return 1;
      return new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime();
    });
  },

  /**
   * Émet une nouvelle demande d'acte / prescription pour le médecin (ex: soins infirmiers, examens).
   * Endpoint Symfony : POST /demande_actes
   */
  async creerDemandeActe(input: DemandeActeInput): Promise<DemandeActeItem> {
    const prioriteSymfony: "normale" | "urgente" =
      input.urgente || input.priorite === "URGENTE" || input.priorite === "TRES_URGENTE"
        ? "urgente"
        : "normale";

    const payload: DemandeActeApiInput = {
      encounterId: input.encounterId,
      lignes: [
        {
          acteDefinitionId: input.acteDefinitionId,
          serviceId: input.serviceId ?? undefined,
          priorite: prioriteSymfony,
          commentaire: input.commentaire?.trim() || null,
        },
      ],
    };

    let itemDemande: DemandeActeItem | null = null;

    try {
      const rawDem = await clientHttp<DemandeActeApiOutput>("/demande_actes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      itemDemande = mapperDemandeActe(rawDem);
    } catch {
      // Fallback si l'endpoint alias /demandes existe
      try {
        const rawAlt = await clientHttp<DemandeActeApiOutput>("/demandes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        itemDemande = mapperDemandeActe(rawAlt);
      } catch {
        // Enregistrer au moins comme acte prescrit / planifié si non aiguillé
      }
    }

    if (!itemDemande) {
      const actePrescrit = await this.prescrireActe({
        encounterId: input.encounterId,
        acteDefinitionId: input.acteDefinitionId,
        statut: "planifie",
        commentaire: input.commentaire || null,
      });

      itemDemande = {
        id: actePrescrit.id,
        demandeId: actePrescrit.id,
        encounterId: actePrescrit.encounterId,
        patientId: input.patientId,
        acteDefinitionId: actePrescrit.acteDefinitionId,
        acteDefinitionCode: actePrescrit.code,
        acteDefinitionLibelle: actePrescrit.libelle,
        priorite: prioriteSymfony.toUpperCase(),
        urgente: prioriteSymfony === "urgente",
        serviceId: input.serviceId ?? undefined,
        serviceNom: input.serviceId === 3 ? "Soins infirmiers" : undefined,
        statut: "planifie",
        commentaire: input.commentaire || null,
        dateDemande: new Date().toISOString(),
      };
    }

    return itemDemande;
  },
  /* ================================================================ *
   * ACTE EXTERNE — orchestration complète
   * ================================================================ */

  /**
   * Enregistre un acte réalisé à l'extérieur :
   * 1. crée l'ActeRealise (statut en_cours : tolère les obs. obligatoires manquantes)
   * 2. crée le ResultatActe
   * 3. ajoute les observations au résultat
   * 4. tente de passer l'acte en "realise"
   * 5. upload les pièces jointes
   *
   * Renvoie l'acte final (avec tout son contenu) et un flag
   * `finalise` (false = reste en_cours, l'utilisateur devra compléter).
   */
  async enregistrerActeExterneComplet(
    input: NouvelActeExterneInput,
  ): Promise<{ acte: ActePrescritItem; finalise: boolean }> {
    // 1. Acte réalisé en "en_cours" (tolère un moule non encore satisfait)
    const acteCree = await clientHttp<ActeRealiseApiOutput>("/acte_realises", {
      method: "POST",
      body: JSON.stringify({
        encounterId: input.encounterId,
        acteDefinitionId: input.acteDefinitionId,
        dateRealisation: input.dateRealisation,
        statut: "en_cours",
        commentaire: `Acte externe — ${input.resultat.type}`,
      }),
    });

    // 2. Résultat attaché à l'acte
    const acteAvecResultat = await clientHttp<ActeRealiseApiOutput>(
      `/acte_realises/${acteCree.id}/resultats`,
      {
        method: "POST",
        body: JSON.stringify({
          type: input.resultat.type,
          interpretation: input.resultat.interpretation ?? null,
          conclusion: input.resultat.conclusion ?? null,
        }),
      },
    );

    const resultats = acteAvecResultat.resultats ?? [];
    const resultatId = resultats[resultats.length - 1]?.id;
    if (!resultatId) {
      throw new ErreurApi(
        500,
        "Le backend n'a pas renvoyé l'identifiant du résultat créé.",
      );
    }

    // 3. Observations sur le résultat
    for (const obs of input.observations ?? []) {
      await clientHttp(`/resultat_actes/${resultatId}/observations`, {
        method: "POST",
        body: JSON.stringify({
          observationDefinitionId: obs.observationDefinitionId,
          valeur: obs.valeur,
          uniteId: obs.uniteId ?? null,
          interpretation: obs.interpretation ?? null,
        } satisfies AddObservationResultatApiInput),
      });
    }

    // 4. Pièces jointes (upload multipart)
    for (const pj of input.piecesJointes ?? []) {
      await consultationActiveApi.ajouterPieceJointe(resultatId, pj);
    }

    // 5. Tentative de passage à "realise" (peut échouer si obs. obligatoires manquantes)
    let finalise = false;
    try {
      await clientHttp(`/acte_realises/${acteCree.id}/statut`, {
        method: "POST",
        body: JSON.stringify({ statut: "realise" }),
      });
      finalise = true;
    } catch {
      // reste en_cours, l'utilisateur pourra compléter plus tard
    }

    // Relit l'acte final pour renvoyer un objet à jour
    const acteFinal = await clientHttp<ActeRealiseApiOutput>(
      `/acte_realises/${acteCree.id}`,
    );

    return { acte: mapperActePrescrit(acteFinal), finalise };
  },

  /* ================================================================ *
   * OBSERVATIONS SUR RÉSULTAT
   * ================================================================ */

  async ajouterObservationResultat(
    resultatId: number,
    obs: ObservationResultatInput,
  ): Promise<void> {
    await clientHttp(`/resultat_actes/${resultatId}/observations`, {
      method: "POST",
      body: JSON.stringify({
        observationDefinitionId: obs.observationDefinitionId,
        valeur: obs.valeur,
        uniteId: obs.uniteId ?? null,
        interpretation: obs.interpretation ?? null,
      } satisfies AddObservationResultatApiInput),
    });
  },

  /* ================================================================ *
   * PIÈCES JOINTES
   * ================================================================ */

  async listerPiecesJointes(resultatId: number): Promise<PieceJointeItem[]> {
    const raw = await clientHttp<unknown>(
      `/resultat_actes/${resultatId}/pieces_jointes`,
    );
    const items = extraireElementsCollection<PieceJointeApiOutput>(raw);
    return items.map(mapperPieceJointe);
  },

  /** Upload multipart — on bypasse clientHttp qui force application/json. */
  async ajouterPieceJointe(
    resultatId: number,
    pj: NouvellePieceJointe,
  ): Promise<PieceJointeItem> {
    const { fichier, typePieceJointe } = pj;

    if (!MIMES_AUTORISES.includes(fichier.type)) {
      throw new ErreurApi(
        415,
        `Type de fichier non autorisé : ${fichier.type}. Autorisés : PDF, JPEG, PNG.`,
      );
    }
    if (fichier.size > TAILLE_MAX_PJ) {
      throw new ErreurApi(413, `Fichier trop volumineux (max 10 Mo).`);
    }

    const formData = new FormData();
    formData.append("fichier", fichier);
    formData.append("typePieceJointe", typePieceJointe);

    const jeton = obtenirJetonJwt();
    const entetes: HeadersInit = {};
    if (jeton) entetes.Authorization = `Bearer ${jeton}`;

    const url = `${obtenirUrlBaseApi()}/resultat_actes/${resultatId}/pieces_jointes`;
    const reponse = await fetch(url, {
      method: "POST",
      headers: entetes,
      body: formData,
    });

    if (!reponse.ok) {
      let message = `Erreur HTTP ${reponse.status} lors du téléversement.`;
      try {
        const corps = await reponse.json();
        if (typeof corps?.detail === "string") message = corps.detail;
        else if (typeof corps?.message === "string") message = corps.message;
      } catch {
        /* ignore */
      }
      throw new ErreurApi(
        reponse.status,
        message,
        null,
        `/resultat_actes/${resultatId}/pieces_jointes`,
      );
    }

    return mapperPieceJointe((await reponse.json()) as PieceJointeApiOutput);
  },

  async changerStatutPieceJointe(
    pieceJointeId: number,
    statut: "actif" | "saisi_par_erreur",
  ): Promise<PieceJointeItem> {
    const raw = await clientHttp<PieceJointeApiOutput>(
      `/piece_jointes/${pieceJointeId}/statut`,
      {
        method: "POST",
        body: JSON.stringify({ statut } satisfies ChangePieceJointeStatutApiInput),
      },
    );
    return mapperPieceJointe(raw);
  },

  /** Téléchargement du fichier binaire (StreamedResponse backend). */
  async telechargerPieceJointeBlob(pieceJointeId: number): Promise<Blob> {
    const jeton = obtenirJetonJwt();
    const entetes: HeadersInit = {
      Accept: "application/pdf,image/jpeg,image/png,application/octet-stream,*/*",
    };
    if (jeton) entetes.Authorization = `Bearer ${jeton}`;

    const url = `${obtenirUrlBaseApi()}/piece_jointes/${pieceJointeId}/fichier`;
    const reponse = await fetch(url, { headers: entetes });

    if (!reponse.ok) {
      throw new ErreurApi(
        reponse.status,
        `Impossible de récupérer le fichier (HTTP ${reponse.status}).`,
      );
    }
    return reponse.blob();
  },
};
