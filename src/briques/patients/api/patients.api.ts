/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { obtenirUrlBaseApi, obtenirJetonJwt } from "@/noyau/http/session";
import {
  PatientFiche,
  CompleterFicheInput,
  RattacherAgentInput,
  EntrepriseOption,
} from "../modele/patient.types";
import { PatientOutputApi } from "./patients.contrats";
import {
  mapperPatientDepuisApi,
  mapperCompleterFicheVersApi,
  mapperRattacherAgentVersApi,
  mapperEntrepriseOption,
} from "./patients.mapping";

export const patientsApi = {
  /**
   * Recherche de patients (par recherche intelligente ou par entreprise).
   */
  lister: async (recherche?: string, idEntreprise?: number): Promise<PatientFiche[]> => {
    const params: Record<string, string | number> = {};
    if (recherche?.trim()) params.recherche = recherche.trim();
    if (idEntreprise && idEntreprise > 0) {
      params.idEntreprise = idEntreprise;
      params.entreprise = idEntreprise;
      params.company = idEntreprise;
      params["entreprise.id"] = idEntreprise;
    }

    const reponse = await clientHttp<unknown>("/patients", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    const elements = extraireElementsCollection<unknown>(reponse);
    return elements
      .map(mapperPatientDepuisApi)
      .filter((p): p is PatientFiche => p !== null)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  },

  /**
   * Consultation de la fiche détaillée d'un patient par son identifiant.
   */
  obtenirParId: async (id: string): Promise<PatientFiche> => {
    const reponse = await clientHttp<PatientOutputApi>(`/patients/${id}`);
    const patient = mapperPatientDepuisApi(reponse);
    if (!patient) {
      throw new ErreurApi(404, `Patient introuvable (ID: ${id})`);
    }
    return patient;
  },

  /**
   * Complète les informations manquantes d'une fiche patient via PATCH /api/patients/{id}/completer.
   */
  completerFiche: async (id: string, saisie: CompleterFicheInput): Promise<PatientFiche> => {
    const payload = mapperCompleterFicheVersApi(saisie);
    const reponse = await clientHttp<PatientOutputApi>(`/patients/${id}/completer`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/merge-patch+json",
      },
      body: JSON.stringify(payload),
    });
    const patient = mapperPatientDepuisApi(reponse);
    if (!patient) {
      throw new ErreurApi(
        500,
        "L'API a répondu sans données valides après la complétion de la fiche.",
      );
    }
    return patient;
  },

  /**
   * Importation de salariés et ayants droit par fichier Excel (.xlsx) via POST /api/import-patients.
   */
  importerExcel: async (
    fichier: File,
    idEntreprise: number,
  ): Promise<{ reussite: boolean; message: string }> => {
    const formData = new FormData();
    formData.append("file", fichier);
    formData.append("idEntreprise", String(idEntreprise));
    formData.append("entrepriseId", String(idEntreprise));
    formData.append("entreprise", String(idEntreprise));
    formData.append("entrepriseId", String(idEntreprise));
    formData.append("entreprise", String(idEntreprise));

    const jeton = obtenirJetonJwt();
    const entetes: HeadersInit = {};
    if (jeton) entetes.Authorization = `Bearer ${jeton}`;

    const url = `${obtenirUrlBaseApi()}/import-patients`;
    const reponse = await fetch(url, {
      method: "POST",
      headers: entetes,
      body: formData,
    });

    if (!reponse.ok) {
      let detailErreur = `Erreur HTTP ${reponse.status} lors de l'import.`;
      try {
        const corps = await reponse.json();
        if (Array.isArray(corps?.erreurs) && corps.erreurs.length > 0) {
          // Le backend renvoie 422 avec toutes les erreurs du fichier (rien n'est enregistré).
          const lignes = corps.erreurs.map((e: unknown) =>
            typeof e === "string" ? e : ((e as { message?: string })?.message ?? JSON.stringify(e)),
          );
          const apercu = lignes.slice(0, 10).join("\n");
          const reste =
            lignes.length > 10 ? `\n… et ${lignes.length - 10} autre(s) erreur(s).` : "";
          detailErreur = `Import annulé, ${lignes.length} erreur(s) dans le fichier :\n${apercu}${reste}`;
        } else if (typeof corps?.detail === "string") {
          detailErreur = corps.detail;
        } else if (typeof corps?.message === "string") {
          detailErreur = corps.message;
        }
      } catch {
        /* Ignoré */
      }
      throw new ErreurApi(reponse.status, detailErreur, null, "/import-patients");
    }

    let message = "Fichier Excel traité avec succès par le serveur.";
    try {
      const corps = await reponse.json();
      if (typeof corps?.agents === "number") {
        message = `Import terminé : ${corps.agents} agent(s), ${corps.conjoints ?? 0} conjoint(s), ${corps.enfants ?? 0} enfant(s).`;
      }
    } catch {
      /* Ignoré */
    }

    return { reussite: true, message };
  },

  /**
   * Attribue un statut d'agent salarié à un patient existant via POST /api/agents.
   */
  rattacherAgent: async (saisie: RattacherAgentInput): Promise<void> => {
    const payload = mapperRattacherAgentVersApi(saisie);
    await clientHttp<unknown>("/agents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Récupère la liste des entreprises pour les filtres et les rattachements sans dépendance externe.
   * Utilise /entreprises avec fallback vers /companies.
   * Route réelle du backend : /entreprises (repli sur /companies en cas de 404).
   * Les erreurs ne sont plus avalées : elles remontent à usePatients, qui les notifie.
   */
  listerEntreprises: async (): Promise<EntrepriseOption[]> => {
    let reponse: unknown;
    try {
      reponse = await clientHttp<unknown>("/entreprises");
    } catch (err) {
      if (err instanceof ErreurApi && err.statut === 404) {
        reponse = await clientHttp<unknown>("/companies");
      } else {
        throw err;
      }
    }

    const elements = extraireElementsCollection<unknown>(reponse);
    return elements
      .map(mapperEntrepriseOption)
      .filter((e): e is EntrepriseOption => e !== null)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  },
};
