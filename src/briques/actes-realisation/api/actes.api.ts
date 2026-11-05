
// src/briques/actes-realisation/api/actes.api.ts

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import {
  ActeRealisableApi,
  MouleApi,
  ActeRealiseApi,
  LigneDemandeApi,
} from "./actes.contrats";
import {
  ActeRealisable,
  ChampMoule,
  ActeEnregistre,
  StatutActe,
  EnregistrementActeInput,
  ActeDemande,
} from "../modele/acte.types";

const API = "/api";

const mapperActe = (a: ActeRealiseApi): ActeEnregistre => ({
  id: a.id,
  encounterId: a.encounterId,
  acteDefinitionId: a.acteDefinitionId,
  code: a.acteDefinitionCode,
  libelle: a.acteDefinitionLibelle,
  statut: a.statut as StatutActe,
  commentaire: a.commentaire,
  observations: (a.observations ?? []).map((o) => ({
    id: o.id,
    observationDefinitionId: o.observationDefinitionId,
    code: o.code,
    libelle: o.libelle,
    valeur: o.valeur,
    unite: o.uniteCode ?? null,
    interpretation: o.interpretation ?? null,
    statut: o.statut,
  })),
});

export const actesApi = {
  /** Le back filtre déjà par rôle + type de service de l'encounter. */
  async listerRealisables(encounterId: number): Promise<ActeRealisable[]> {
    const raw = await clientHttp<unknown>(`${API}/me/actes_realisables`, {
      params: { encounterId },
    });

    return extraireElementsCollection<ActeRealisableApi>(raw)
      .filter((a) => a.actif !== false)
      .map((a) => ({
        id: a.id,
        code: a.code,
        libelle: a.libelle,
        categorieCode: a.categorie?.code,
      }))
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },

  async obtenirMoule(acteDefinitionId: number): Promise<ChampMoule[]> {
    const raw = await clientHttp<MouleApi>(
      `${API}/acte_definitions/${acteDefinitionId}/observations`,
    );

    return (raw?.observations ?? [])
      .map((i) => ({
        observationId: i.observation.id,
        code: i.observation.code,
        libelle: i.observation.libelle,
        typeValeur:
          i.observation.typeValeur === "texte"
            ? ("texte" as const)
            : ("numerique" as const),
        unite: i.observation.uniteCode || i.observation.uniteLibelle || null,
        obligatoire: Boolean(i.obligatoire),
        ordre: i.ordre ?? 1,
      }))
      .sort((a, b) => a.ordre - b.ordre);
  },

  async listerActesEncounter(encounterId: number): Promise<ActeEnregistre[]> {
    const raw = await clientHttp<unknown>(`${API}/acte_realises`, {
      params: { encounterId },
    });

    return extraireElementsCollection<ActeRealiseApi>(raw).map(mapperActe);
  },

  /**
   * Enregistre un acte et ses observations.
   * Ordre imposé par le back : création SANS statut, observations, puis "realise".
   * Si une obligatoire manque, l'acte reste "en_cours" (on pourra le compléter).
   */
  async enregistrer(input: EnregistrementActeInput): Promise<ActeEnregistre> {
    const { moule, valeurs, interpretations = {} } = input;

    let acte: ActeRealiseApi | null = null;
    let acteId = input.acteExistantId ?? null;

    if (acteId === null) {
      acte = await clientHttp<ActeRealiseApi>(`${API}/acte_realises`, {
        method: "POST",
        body: JSON.stringify({
          encounterId: input.encounterId,
          acteDefinitionId: input.acteDefinitionId,
          commentaire: input.commentaire || null,
          ligneDemandeId: input.ligneDemandeId ?? null,
          // Pas de statut : le back choisit en_cours ou realise selon le moule.
        }),
      });

      acteId = acte.id;
    }

    // Observations renseignées, dans l'ordre du moule (en séquence).
    for (const champ of moule) {
      const valeur = (valeurs[champ.observationId] ?? "").trim();

      if (valeur === "") continue;

      acte = await clientHttp<ActeRealiseApi>(
        `${API}/acte_realises/${acteId}/observations`,
        {
          method: "POST",
          body: JSON.stringify({
            observationDefinitionId: champ.observationId,
            valeur,
            interpretation:
              (interpretations[champ.observationId] ?? "").trim() || null,
          }),
        },
      );
    }

    // Passage à "realise" seulement si l'acte est encore en cours
    // et que toutes les observations obligatoires sont saisies.
    const obligatoiresOk = moule.every(
      (c) =>
        !c.obligatoire ||
        (valeurs[c.observationId] ?? "").trim() !== "",
    );

    if (acte && acte.statut === "en_cours" && obligatoiresOk) {
      acte = await clientHttp<ActeRealiseApi>(
        `${API}/acte_realises/${acteId}/statut`,
        {
          method: "POST",
          body: JSON.stringify({ statut: "realise" }),
        },
      );
    }

    if (!acte) {
      // Complétion sans nouvelle valeur : on relit l'acte brut.
      acte = await clientHttp<ActeRealiseApi>(
        `${API}/acte_realises/${acteId}`,
      );
    }

    return mapperActe(acte);
  },

  /** Prescriptions à faire pour CE patient (le service vient du profil du connecté, côté back). */
  async listerAFaire(patientId: number): Promise<ActeDemande[]> {
    const raw = await clientHttp<unknown>(`${API}/me/actes_a_faire`, {
      params: { patientId },
    });

    return extraireElementsCollection<LigneDemandeApi>(raw).map((l) => ({
      id: l.id,
      demandeId: l.demandeId,
      encounterId: l.encounterId,
      patientId: l.patientId,
      acteDefinitionId: l.acteDefinitionId,
      code: l.acteDefinitionCode,
      libelle: l.acteDefinitionLibelle,
      urgente: Boolean(l.urgente),
      commentaire: l.commentaire,
      dateDemande: l.dateDemande,
    }));
  },

  /** Même ticket, nouvel aiguillage vers un autre service. */
  async orienter(encounterId: number, serviceId: number): Promise<void> {
    await clientHttp<unknown>(`${API}/encounters/${encounterId}/orienter`, {
      method: "POST",
      body: JSON.stringify({ serviceId }),
    });
  },

  async terminer(encounterId: number, forcer = false): Promise<void> {
    await clientHttp<unknown>(`${API}/encounters/${encounterId}/terminer`, {
      method: "POST",
      params: { forcer: forcer ? 1 : undefined },
    });
  },
};
