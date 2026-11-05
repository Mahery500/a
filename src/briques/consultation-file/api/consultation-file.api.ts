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
  PriseEnChargeApi,
  PatientDetailsApi,
  AppelerPatientApiOutput,
  RendezVousDuJourApi, 
} from "./consultation-file.contrats";
import { mapperPatientFile, mapperConsultationEnCours ,mapperRendezVousDuJour,  } from "./consultation-file.mapping";
import { PatientFileMedecin, ConsultationEnCours, RendezVousDuJourMedecin,  } from "../modele/consultation-file.types";

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

const cachePatients = new Map<number, PatientDetailsApi>();
const requetesPatients = new Map<number, Promise<PatientDetailsApi>>();

export async function resoudrePatientDetails(id: number): Promise<PatientDetailsApi | null> {
  if (cachePatients.has(id)) return cachePatients.get(id)!;
  let p = requetesPatients.get(id);
  if (!p) {
    p = requeteAvecFallback<PatientDetailsApi>(`/api/patients/${id}`, `/patients/${id}`)
      .then((res) => {
        cachePatients.set(id, res);
        return res;
      })
      .catch(() => ({}) as PatientDetailsApi)
      .finally(() => requetesPatients.delete(id));
    requetesPatients.set(id, p);
  }
  return p;
}

export const consultationFileApi = {
  async obtenirFileAttente(): Promise<PatientFileMedecin[]> {
    const raw = await requeteAvecFallback<unknown>("/api/me/file_attente", "/me/file_attente");
    const items = extraireElementsCollection<FileAttenteItemApi>(raw);
    return Promise.all(
      items.map(async (item) => {
        const details = await resoudrePatientDetails(item.patientId);
        return mapperPatientFile(item, details);
      }),
    );
  },

  async obtenirRendezVousDuJour(): Promise<RendezVousDuJourMedecin[]> {
  const raw = await requeteAvecFallback<unknown>(
    "/api/me/rendez_vous_du_jour",
    "/me/rendez_vous_du_jour",
  );
  const items = extraireElementsCollection<RendezVousDuJourApi>(raw);
  return Promise.all(
    items.map(async (item) => {
      const details = await resoudrePatientDetails(item.patientId);
      const nom = details
        ? [details.Prenom || details.prenom, details.Nom || details.nom]
            .filter(Boolean)
            .join(" ")
            .trim()
        : null;
      return mapperRendezVousDuJour(item, nom);
    }),
  );
},

  async obtenirPatientEnCours(): Promise<ConsultationEnCours> {
    const raw = await requeteAvecFallback<PatientEnCoursApi>(
      "/api/me/patient_en_cours",
      "/me/patient_en_cours",
    );
    let nom: string | null = null;
    if (raw.patientId) {
      const details = await resoudrePatientDetails(raw.patientId);
      if (details) {
        nom = [details.Prenom || details.prenom, details.Nom || details.nom]
          .filter(Boolean)
          .join(" ")
          .trim();
      }
    }
    return mapperConsultationEnCours(raw, nom);
  },

  /**
   * Prise en charge d'un patient depuis la file d'attente médecin.
   * Le type de prise en charge est choisi dans la modale avant l'appel.
   */
  async prendreEnCharge(aiguillageId: number, typeEncounterId: number): Promise<PriseEnChargeApi> {
    if (!Number.isInteger(typeEncounterId) || typeEncounterId <= 0) {
      throw new Error(
        "typeEncounterId manquant ou invalide — vérifiez le flux de prise en charge.",
      );
    }
    return requeteAvecFallback<PriseEnChargeApi>(
      `/api/aiguillages/${aiguillageId}/prendre_en_charge`,
      `/aiguillages/${aiguillageId}/prendre_en_charge`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typeEncounterId: Number(typeEncounterId) }),
      },
    );
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      },
    );
  },
};
