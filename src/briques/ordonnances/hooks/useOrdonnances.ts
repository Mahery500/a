import { useCallback, useEffect, useRef, useState } from "react";
import {
  ordonnancesApi,
  type CreerOrdonnancePayload,
  type MedicamentCatalogue,
  type OrdonnanceItem,
} from "../api/ordonnances.api";

export function useOrdonnances(encounterId?: number | null) {
  const [medicaments, setMedicaments] = useState<MedicamentCatalogue[]>([]);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceItem[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreurMedicaments, setErreurMedicaments] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Identifie la consultation courante pour ignorer les réponses périmées
  const encounterCourant = useRef<number | null | undefined>(encounterId);
  encounterCourant.current = encounterId;

  const recharger = useCallback(async () => {
    if (!encounterId) {
      setOrdonnances([]);
      return;
    }
    try {
      const liste = await ordonnancesApi.listerParEncounter(encounterId);
      if (encounterCourant.current === encounterId) setOrdonnances(liste);
    } catch {
      // Lecture non bloquante
    }
  }, [encounterId]);

  // Catalogue médicaments (une seule fois)
  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreurMedicaments(null);

    (async () => {
      try {
        const [liste, formes] = await Promise.all([
          ordonnancesApi.listerMedicaments(),
          ordonnancesApi.listerFormes(),
        ]);
        if (!actif) return;
        setMedicaments(
          liste.map((m) => ({ ...m, forme: m.formeId ? (formes.get(m.formeId) ?? null) : null })),
        );
        if (liste.length === 0) setErreurMedicaments("Le catalogue des médicaments est vide.");
      } catch (err) {
        if (!actif) return;
        setMedicaments([]);
        setErreurMedicaments(
          err instanceof Error ? err.message : "Impossible de charger les médicaments.",
        );
      } finally {
        if (actif) setChargement(false);
      }
    })();

    return () => {
      actif = false;
    };
  }, []);

  // Changement de patient : on vide tout de suite, puis on charge
  useEffect(() => {
    setOrdonnances([]);
    void recharger();
  }, [recharger]);

  // Rafraîchit au retour sur l'onglet et toutes les 30 s (statut modifié par la pharmacie)
  useEffect(() => {
    if (!encounterId) return;
    const surFocus = () => void recharger();
    const surVisibilite = () => {
      if (document.visibilityState === "visible") void recharger();
    };
    window.addEventListener("focus", surFocus);
    document.addEventListener("visibilitychange", surVisibilite);
    const minuteur = window.setInterval(() => void recharger(), 30_000);
    return () => {
      window.removeEventListener("focus", surFocus);
      document.removeEventListener("visibilitychange", surVisibilite);
      window.clearInterval(minuteur);
    };
  }, [encounterId, recharger]);

  const creer = useCallback(
    async (payload: CreerOrdonnancePayload) => {
      setEnCours(true);
      try {
        const cree = await ordonnancesApi.creer(payload);
        await recharger(); // la liste serveur fait foi
        return cree;
      } finally {
        setEnCours(false);
      }
    },
    [recharger],
  );

  const annuler = useCallback(
    async (id: number) => {
      setEnCours(true);
      try {
        await ordonnancesApi.annuler(id);
        await recharger();
      } finally {
        setEnCours(false);
      }
    },
    [recharger],
  );

  return {
    medicaments,
    ordonnances,
    chargement,
    erreurMedicaments,
    enCours,
    creer,
    annuler,
    recharger,
  };
}
