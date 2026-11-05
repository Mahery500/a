/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  FileAttenteItemApi,
  PatientEnCoursApi,
  RendezVousDuJourApi,
  LigneActeAFaireApi,
  PriseEnChargeApi,
  PatientSummaryApi,
  AppelerPatientApiOutput,
} from "./infirmerie-file.contrats";
import {
  mapperItemFileAttente,
  mapperPatientEnCours,
  mapperRendezVousDuJour,
  mapperActeAFaire,
  mapperPriseEnCharge,
} from "./infirmerie-file.mapping";
import {
  PatientFileAttente,
  PatientEnCours,
  RendezVousDuJour,
  ActeAFaire,
  PriseEnChargeResultat,
} from "../modele/infirmerie-file.types";

async function requeteAvecFallback<T>(
  cheminPrincipal: string,
  cheminRepli: string,
  options?: Parameters<typeof clientHttp>[1],
): Promise<T> {
  try {
    return await clientHttp<T>(cheminPrincipal, options);
  } catch (err) {
    if (err instanceof ErreurApi && err.statut === 404) {
      return await clientHttp<T>(cheminRepli, options);
    }
    throw err;
  }
}

const cacheNoms = new Map<number, string>();
const requetesNoms = new Map<number, Promise<string>>();

export async function resoudreNomPatient(id: number): Promise<string> {
  if (cacheNoms.has(id)) return cacheNoms.get(id)!;
  let promise = requetesNoms.get(id);
  if (!promise) {
    promise = requeteAvecFallback<PatientSummaryApi>(`/api/patients/${id}`, `/patients/${id}`)
      .then((p) => {
        const nom = [p.Prenom || p.prenom, p.Nom || p.nom].filter(Boolean).join(" ").trim();
        const final = nom || `Patient #${id}`;
        cacheNoms.set(id, final);
        return final;
      })
      .catch(() => `Patient #${id}`)
      .finally(() => requetesNoms.delete(id));
    requetesNoms.set(id, promise);
  }
  return promise;
}

export const infirmerieFileApi = {
  async obtenirFileAttente(): Promise<PatientFileAttente[]> {
    const raw = await requeteAvecFallback<unknown>("/api/me/file_attente", "/me/file_attente");
    const items = extraireElementsCollection<FileAttenteItemApi>(raw);
    return Promise.all(
      items.map(async (item) => {
        const nom = await resoudreNomPatient(item.patientId);
        return mapperItemFileAttente(item, nom);
      }),
    );
  },

  async obtenirPatientEnCours(): Promise<PatientEnCours> {
    const raw = await requeteAvecFallback<PatientEnCoursApi>(
      "/api/me/patient_en_cours",
      "/me/patient_en_cours",
    );
    let nom: string | null = null;
    if (raw.patientId) {
      nom = await resoudreNomPatient(raw.patientId);
    }
    return mapperPatientEnCours(raw, nom);
  },

  async obtenirRendezVousDuJour(): Promise<RendezVousDuJour[]> {
    const raw = await requeteAvecFallback<unknown>(
      "/api/me/rendez_vous_du_jour",
      "/me/rendez_vous_du_jour",
    );
    const items = extraireElementsCollection<RendezVousDuJourApi>(raw);
    return Promise.all(
      items.map(async (item) => {
        const nom = await resoudreNomPatient(item.patientId);
        return mapperRendezVousDuJour(item, nom);
      }),
    );
  },

  async obtenirActesAFaire(urgentes?: boolean): Promise<ActeAFaire[]> {
    const raw = await requeteAvecFallback<unknown>("/api/me/actes_a_faire", "/me/actes_a_faire", {
      params: urgentes ? { urgentes: 1 } : undefined,
    });
    const items = extraireElementsCollection<LigneActeAFaireApi>(raw);
    return Promise.all(
      items.map(async (item) => {
        const nom = await resoudreNomPatient(item.patientId);
        return mapperActeAFaire(item, nom);
      }),
    );
  },

  async prendreEnCharge(
    aiguillageId: number,
    typeEncounterId: number,
  ): Promise<PriseEnChargeResultat> {
    if (!Number.isInteger(typeEncounterId) || typeEncounterId <= 0) {
      throw new Error(
        "typeEncounterId manquant ou invalide — vérifier le flux de prise en charge.",
      );
    }
    const raw = await requeteAvecFallback<PriseEnChargeApi>(
      `/api/aiguillages/${aiguillageId}/prendre_en_charge`,
      `/aiguillages/${aiguillageId}/prendre_en_charge`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeEncounterId: Number(typeEncounterId) }),
      },
    );
    return mapperPriseEnCharge(raw);
  },

  async appelerPatient(aiguillageId: number): Promise<AppelerPatientApiOutput> {
    return requeteAvecFallback<AppelerPatientApiOutput>(
      `/api/aiguillages/${aiguillageId}/appeler`,
      `/aiguillages/${aiguillageId}/appeler`,
      { method: "POST" },
    );
  },

  async orienterPatient(encounterId: number, serviceId: number): Promise<void> {
    await requeteAvecFallback<void>(
      `/api/encounters/${encounterId}/orienter`,
      `/encounters/${encounterId}/orienter`,
      {
        method: "POST",
        body: JSON.stringify({ serviceId }),
      },
    );
  },
};
