/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { invaliderCacheHabilitations } from "@/noyau/referentiels/habilitations";
import {
  CompetenceItem,
  NouvelleCompetenceInput,
  ModificationCompetenceInput,
} from "../modele/competence.types";
import type { ApiCompetences } from "../api/competences.api";

export function useCompetences(api: ApiCompetences, libelleSingulier: string) {
  const notif = useNotifier();
  const [items, setItems] = useState<CompetenceItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setItems(await api.lister());
    } catch (err) {
      const msg = messageErreur(err, `Impossible de charger les ${libelleSingulier}s.`);
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [api, libelleSingulier, notif]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const creer = useCallback(
    async (input: NouvelleCompetenceInput): Promise<boolean> => {
      try {
        const cree = await api.creer(input);
        setItems((prev) =>
          [...prev, cree].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        // Le sélecteur d'habilitations (formulaires actes/diagnostics) utilise
        // un cache module-scoped : on l'invalide pour que le nouveau corps /
        // la nouvelle spécialité soit immédiatement proposé.
        invaliderCacheHabilitations();
        notif.succes(`${capitaliser(libelleSingulier)} « ${cree.libelle} » créé(e).`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, `Échec de la création.`));
        return false;
      }
    },
    [api, libelleSingulier, notif],
  );

  const modifier = useCallback(
    async (
      id: number,
      input: ModificationCompetenceInput,
      courante: CompetenceItem,
    ): Promise<boolean> => {
      try {
        const maj = await api.modifier(id, input, courante);
        setItems((prev) =>
          prev
            .map((c) => (c.id === id ? maj : c))
            .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        invaliderCacheHabilitations();
        notif.succes(`${capitaliser(libelleSingulier)} « ${maj.libelle} » mis(e) à jour.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la mise à jour."));
        return false;
      }
    },
    [api, libelleSingulier, notif],
  );

  const basculerActivation = useCallback(
    (item: CompetenceItem) => modifier(item.id, { actif: !item.actif }, item),
    [modifier],
  );

  return { items, chargement, erreur, recharger, creer, modifier, basculerActivation };
}

function capitaliser(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}