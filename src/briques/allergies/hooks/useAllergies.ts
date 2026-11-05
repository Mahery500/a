// src/briques/allergies/hooks/useAllergies.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";

import type {
  Allergie,
  AllergieDefinitionSummary,
  ChangerStatutInput,
  ModificationAllergieInput,
  NouvelleAllergieInput,
  NouvelleReactionInput,
  PrincipeActifOption,
  ReactionAllergie,
  ReferentielsAllergie,
} from "../modele/allergie.types";

import { allergiesApi } from "../api/allergies.api";

export function useAllergies(patientId: number | null | undefined) {
  const notif = useNotifier();

  const [allergies, setAllergies] = useState<Allergie[]>([]);
  const [referentiels, setReferentiels] = useState<ReferentielsAllergie | null>(
    null,
  );
  const [definitionsActives, setDefinitionsActives] = useState<
    AllergieDefinitionSummary[]
  >([]);
  const [principesActifs, setPrincipesActifs] = useState<PrincipeActifOption[]>(
    [],
  );

  const [chargement, setChargement] = useState(true);
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Filtre "afficher les inactives / résolues"
  const [inclureInactives, setInclureInactives] = useState(false);
  const [filtreCategorie, setFiltreCategorie] = useState<string>("toutes");
  const [recherche, setRecherche] = useState("");

  const chargerTout = useCallback(async () => {
  if (!patientId) {
    setAllergies([]);
    setChargement(false);
    return;
  }
  setChargement(true);
  setErreur(null);

  const [listeR, refsR, defsR, pasR] = await Promise.allSettled([
    allergiesApi.lister(patientId),
    referentiels ? Promise.resolve(referentiels) : allergiesApi.referentiels(),
    definitionsActives.length > 0
      ? Promise.resolve(definitionsActives)
      : allergiesApi.definitionsActives(),
    principesActifs.length > 0
      ? Promise.resolve(principesActifs)
      : allergiesApi.listerPrincipesActifs(),
  ]);

  if (listeR.status === "fulfilled") {
    setAllergies(listeR.value);
  } else {
    const msg = messageErreur(
      listeR.reason,
      "Impossible de charger les allergies du patient.",
    );
    setErreur(msg);
    notif.erreur(msg);
  }

  if (refsR.status === "fulfilled") setReferentiels(refsR.value);
  else notif.erreur(messageErreur(refsR.reason, "Référentiels indisponibles."));

  if (defsR.status === "fulfilled") setDefinitionsActives(defsR.value);
  else notif.erreur(messageErreur(defsR.reason, "Substances indisponibles."));

  if (pasR.status === "fulfilled") setPrincipesActifs(pasR.value);
  else
    notif.erreur(
      messageErreur(pasR.reason, "Principes actifs indisponibles."),
    );

  setChargement(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [patientId]);

  useEffect(() => {
    void chargerTout();
  }, [chargerTout]);

  const creer = useCallback(
    async (input: NouvelleAllergieInput): Promise<Allergie | null> => {
      setActionEnCours(true);
      try {
        const creee = await allergiesApi.creer(input);
        setAllergies((prev) => [...prev, creee]);
        notif.succes("Allergie enregistrée.");
        return creee;
      } catch (err) {
        notif.erreur(
          messageErreur(err, "Échec de l'enregistrement de l'allergie."),
        );
        return null;
      } finally {
        setActionEnCours(false);
      }
    },
    [notif],
  );

  const modifier = useCallback(
    async (id: number, input: ModificationAllergieInput): Promise<boolean> => {
      setActionEnCours(true);
      try {
        const miseAJour = await allergiesApi.modifier(id, input);
        setAllergies((prev) => prev.map((a) => (a.id === id ? miseAJour : a)));
        notif.succes("Allergie mise à jour.");
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la modification."));
        return false;
      } finally {
        setActionEnCours(false);
      }
    },
    [notif],
  );

  const changerStatut = useCallback(
    async (id: number, input: ChangerStatutInput): Promise<boolean> => {
      setActionEnCours(true);
      try {
        const miseAJour = await allergiesApi.changerStatut(id, input);
        setAllergies((prev) => prev.map((a) => (a.id === id ? miseAJour : a)));
        notif.succes("Statut de l'allergie mis à jour.");
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec du changement de statut."));
        return false;
      } finally {
        setActionEnCours(false);
      }
    },
    [notif],
  );

  const ajouterReaction = useCallback(
    async (
      allergieId: number,
      input: NouvelleReactionInput,
    ): Promise<ReactionAllergie | null> => {
      setActionEnCours(true);
      try {
        const creee = await allergiesApi.ajouterReaction(allergieId, input);
        setAllergies((prev) =>
          prev.map((a) =>
            a.id === allergieId
              ? { ...a, reactions: [...a.reactions, creee] }
              : a,
          ),
        );
        notif.succes("Réaction enregistrée.");
        return creee;
      } catch (err) {
        notif.erreur(
          messageErreur(err, "Échec de l'enregistrement de la réaction."),
        );
        return null;
      } finally {
        setActionEnCours(false);
      }
    },
    [notif],
  );

  /* Filtres + compteurs */
  const allergiesAffichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return allergies.filter((a) => {
      if (!inclureInactives && a.statut !== "active") return false;
      if (filtreCategorie !== "toutes" && a.categorie !== filtreCategorie)
        return false;
      if (!q) return true;
      const haystack = [
        a.allergieDefinitionLibelle,
        a.allergieDefinitionCode,
        a.principeActifLibelle,
        a.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allergies, inclureInactives, filtreCategorie, recherche]);

  const stats = useMemo(() => {
    const total = allergies.length;
    const actives = allergies.filter((a) => a.statut === "active").length;
    const critiques = allergies.filter(
      (a) => a.statut === "active" && a.criticalite === "high",
    ).length;
    const reactionnes = allergies.filter((a) => a.reactions.length > 0).length;
    return { total, actives, critiques, reactionnes };
  }, [allergies]);

  return {
    allergies,
    allergiesAffichees,
    referentiels,
    definitionsActives,
    principesActifs,
    chargement,
    actionEnCours,
    erreur,
    stats,
    inclureInactives,
    setInclureInactives,
    filtreCategorie,
    setFiltreCategorie,
    recherche,
    setRecherche,
    recharger: chargerTout,
    creer,
    modifier,
    changerStatut,
    ajouterReaction,
  };
}

