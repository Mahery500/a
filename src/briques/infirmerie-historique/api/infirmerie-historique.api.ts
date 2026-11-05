/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { HistoriqueActeApiOutput, PatientApiSummary } from "./infirmerie-historique.contrats";
import { mapperActeHistorique } from "./infirmerie-historique.mapping";
import { ActeHistorique, FiltresHistorique } from "../modele/infirmerie-historique.types";

const cacheNoms = new Map<number, string>();
const requetesNoms = new Map<number, Promise<string>>();

export async function resoudreNomPatient(id: number): Promise<string> {
  if (cacheNoms.has(id)) return cacheNoms.get(id)!;
  let p = requetesNoms.get(id);
  if (!p) {
    p = clientHttp<PatientApiSummary>(`/patients/${id}`)
      .then((pat) => {
        const nom = [pat.Prenom || pat.prenom, pat.Nom || pat.nom].filter(Boolean).join(" ").trim();
        const final = nom || `Patient #${id}`;
        cacheNoms.set(id, final);
        return final;
      })
      .catch(() => `Patient #${id}`)
      .finally(() => requetesNoms.delete(id));
    requetesNoms.set(id, p);
  }
  return p;
}

export const infirmerieHistoriqueApi = {
  async listerHistorique(
    filtres: FiltresHistorique,
    page = 1,
    limit = 20,
  ): Promise<ActeHistorique[]> {
    const params: Record<string, string | number | undefined> = {
      patientId: filtres.patientId,
      du: filtres.du,
      au: filtres.au,
      page,
      limit,
    };

    const raw = await clientHttp<unknown>("/me/historique_actes", { params });
    const items = extraireElementsCollection<HistoriqueActeApiOutput>(raw);

    return Promise.all(
      items.map(async (item) => {
        const nom = await resoudreNomPatient(item.patientId);
        return mapperActeHistorique(item, nom);
      }),
    );
  },
};
