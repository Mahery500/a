/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  CompetenceItem,
  NouvelleCompetenceInput,
  ModificationCompetenceInput,
} from "../modele/competence.types";
import { CompetenceApiOutput, UpdateCompetenceApiInput } from "./competences.contrats";
import { mapperCompetence, mapperCreation, mapperModification } from "./competences.mapping";

export interface ApiCompetences {
  lister(): Promise<CompetenceItem[]>;
  creer(input: NouvelleCompetenceInput): Promise<CompetenceItem>;
  modifier(id: number, input: ModificationCompetenceInput, courante: CompetenceItem): Promise<CompetenceItem>;
}

function creerApi(chemin: "/corps_medicaux" | "/specialites"): ApiCompetences {
  return {
    async lister(): Promise<CompetenceItem[]> {
      const rep = await clientHttp<unknown>(chemin);
      return extraireElementsCollection<unknown>(rep)
        .map(mapperCompetence)
        .filter((c): c is CompetenceItem => c !== null)
        .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
    },

    async creer(input: NouvelleCompetenceInput): Promise<CompetenceItem> {
      const rep = await clientHttp<CompetenceApiOutput>(chemin, {
        method: "POST",
        body: JSON.stringify(mapperCreation(input)),
      });
      const c = mapperCompetence(rep);
      if (!c) throw new ErreurApi(500, `Réponse invalide à la création sur ${chemin}.`);
      return c;
    },

    async modifier(
      id: number,
      input: ModificationCompetenceInput,
      courante: CompetenceItem,
    ): Promise<CompetenceItem> {
      const payload: UpdateCompetenceApiInput = mapperModification(input, courante);
      const rep = await clientHttp<CompetenceApiOutput>(`${chemin}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(payload),
      });
      const c = mapperCompetence(rep);
      if (!c) throw new ErreurApi(500, `Réponse invalide après modification sur ${chemin}.`);
      return c;
    },
  };
}

export const competencesApi = {
  corpsMedicaux: creerApi("/corps_medicaux"),
  specialites: creerApi("/specialites"),
};