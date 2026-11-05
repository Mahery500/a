/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import {
  CategorieHierarchique,
  NouvelleCategorieInput,
  construireArbre,
  ArbreCategorie,
} from "./hierarchie.types";
import type { ApiCategories } from "./apiCategories.factory";

export function useCategories(api: ApiCategories, libelleSingulier: string) {
  const notif = useNotifier();
  const [categories, setCategories] = useState<CategorieHierarchique[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setCategories(await api.lister());
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger les catégories.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [api, notif]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const creer = useCallback(
    async (input: NouvelleCategorieInput): Promise<boolean> => {
      try {
        const creee = await api.creer(input);
        setCategories((prev) =>
          [...prev, creee].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr")),
        );
        notif.succes(`${libelleSingulier} « ${creee.libelle} » créée.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la création."));
        return false;
      }
    },
    [api, libelleSingulier, notif],
  );

  const changerParent = useCallback(
    async (id: number, parentCode: string | null): Promise<boolean> => {
      try {
        const maj = await api.changerParent(id, parentCode);
        // Recharger l'arbre entier : un déplacement peut changer
        // le niveau et le chemin de tous les descendants.
        await recharger();
        notif.succes(`${libelleSingulier} « ${maj.libelle} » déplacée.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec du déplacement."));
        return false;
      }
    },
    [api, libelleSingulier, notif, recharger],
  );

  const arbre: ArbreCategorie<CategorieHierarchique>[] = useMemo(
    () => construireArbre(categories),
    [categories],
  );

  const feuilles = useMemo(() => categories.filter((c) => c.feuille), [categories]);

  return { categories, arbre, feuilles, chargement, erreur, recharger, creer, changerParent };
}
