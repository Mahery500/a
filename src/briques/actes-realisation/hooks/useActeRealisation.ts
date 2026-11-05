import { useState, useEffect, useCallback, useMemo } from "react";
import { actesApi } from "../api/actes.api";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import {
  ActeRealisable,
  ChampMoule,
  ActeEnregistre,
  ActeDemande,
  OBSERVATIONS_ACTIVES,
} from "../modele/acte.types";

const STATUTS_LIBERES = ["annule", "saisi_par_erreur"];

export function useActeRealisation(
  encounterId?: number | null,
  patientId?: number | null,
  filtreCategorieCodes?: string[],
) {
  const cleFiltre = filtreCategorieCodes?.join(",") ?? "";

  const [realisables, setRealisables] = useState<ActeRealisable[]>([]);
  const [actes, setActes] = useState<ActeEnregistre[]>([]);
  const [demandes, setDemandes] = useState<ActeDemande[]>([]);
  const [selectionId, setSelectionId] = useState<number | null>(null);
  const [ligneDemandeId, setLigneDemandeId] = useState<number | null>(null);

  const [moule, setMoule] = useState<ChampMoule[]>([]);
  const [valeurs, setValeurs] = useState<Record<number, string>>({});
  const [interpretations, setInterpretations] = useState<Record<number, string>>({});
  const [commentaire, setCommentaire] = useState("");

  const [chargement, setChargement] = useState(false);
  const [chargementMoule, setChargementMoule] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const reinitialiserSaisie = useCallback(() => {
    setValeurs({});
    setInterpretations({});
    setCommentaire("");
  }, []);

  // 1. Actes réalisables + actes saisis + prescriptions du patient
  const charger = useCallback(async () => {
    if (!encounterId) {
      setRealisables([]);
      setActes([]);
      setDemandes([]);
      setSelectionId(null);
      setLigneDemandeId(null);
      return;
    }
    setChargement(true);
    setErreur(null);
    try {
      const [liste, saisis] = await Promise.all([
        actesApi.listerRealisables(encounterId),
        actesApi.listerActesEncounter(encounterId),
      ]);
      const filtre = cleFiltre ? cleFiltre.split(",").map((c) => c.toUpperCase()) : [];
      setRealisables(
        filtre.length
          ? liste.filter((a) => a.categorieCode && filtre.includes(a.categorieCode.toUpperCase()))
          : liste,
      );
      setActes(saisis);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }

    // Prescriptions : seulement si on connaît le patient (sinon le back renverrait
    // toutes les demandes du service). Un échec (ex. 403 "aucune affectation")
    // ne doit pas bloquer le reste.
    try {
      setDemandes(patientId ? await actesApi.listerAFaire(patientId) : []);
    } catch {
      setDemandes([]);
    }
  }, [encounterId, patientId, cleFiltre]);

  useEffect(() => {
    void charger();
  }, [charger]);

  // 2. Moule de l'acte sélectionné
  useEffect(() => {
    if (!selectionId) {
      setMoule([]);
      return;
    }
    let actif = true;
    setChargementMoule(true);
    actesApi
      .obtenirMoule(selectionId)
      .then((champs) => actif && setMoule(champs))
      .catch((err) => actif && setErreur(extraireMessageErreur(err)))
      .finally(() => actif && setChargementMoule(false));
    return () => {
      actif = false;
    };
  }, [selectionId]);

  const choisirActe = useCallback(
    (id: number | null) => {
      setSelectionId(id);
      setLigneDemandeId(null);
      reinitialiserSaisie();
      setErreur(null);
    },
    [reinitialiserSaisie],
  );

  /** Clic sur "Réaliser" d'une prescription : présélectionne l'acte ET garde le lien. */
  const choisirDemande = useCallback(
    (d: ActeDemande) => {
      setSelectionId(d.acteDefinitionId);
      setLigneDemandeId(d.id);
      reinitialiserSaisie();
      setErreur(null);
    },
    [reinitialiserSaisie],
  );

  const demandeActive = useMemo(
    () => demandes.find((d) => d.id === ligneDemandeId) ?? null,
    [demandes, ligneDemandeId],
  );

  // 3. Acte déjà présent (actif) pour cette définition → mode "compléter"
  const acteExistant = useMemo(
    () =>
      actes.find(
        (a) => a.acteDefinitionId === selectionId && !STATUTS_LIBERES.includes(a.statut),
      ) ?? null,
    [actes, selectionId],
  );

  // Observations déjà saisies (actives) : on ne les renvoie pas (le back répondrait 422)
  const dejaSaisies = useMemo(() => {
    const map = new Map<number, string>();
    acteExistant?.observations
      .filter((o) => OBSERVATIONS_ACTIVES.includes(o.statut))
      .forEach((o) => map.set(o.observationDefinitionId, o.valeur));
    return map;
  }, [acteExistant]);

  const champsAEnvoyer = useMemo(
    () => moule.filter((c) => !dejaSaisies.has(c.observationId)),
    [moule, dejaSaisies],
  );

  const aUneValeur = (id: number) => (valeurs[id] ?? "").trim() !== "";
  const nombreSaisis = champsAEnvoyer.filter((c) => aUneValeur(c.observationId)).length;
  const obligatoiresManquantes = champsAEnvoyer.filter(
    (c) => c.obligatoire && !aUneValeur(c.observationId),
  );

  // 4. Enregistrer
  const enregistrer = async () => {
    if (!encounterId || !selectionId) throw new Error("Choisissez un acte.");
    if (champsAEnvoyer.length > 0 && nombreSaisis === 0 && !acteExistant) {
      throw new Error("Renseignez au moins une valeur.");
    }

    setEnCours(true);
    setErreur(null);
    try {
      const acte = await actesApi.enregistrer({
        encounterId,
        acteDefinitionId: selectionId,
        moule: champsAEnvoyer,
        valeurs,
        interpretations,
        commentaire,
        ligneDemandeId: acteExistant ? null : ligneDemandeId,
        acteExistantId: acteExistant?.id ?? null,
      });
      reinitialiserSaisie();
      setLigneDemandeId(null);
      await charger(); // la prescription disparaît de la liste "à faire"
      return acte;
    } catch (err) {
      if (err instanceof ErreurApi && err.statut === 409) {
        await charger(); // la liste était périmée
        const msg = "Cet acte existe déjà pour ce patient. La liste a été actualisée.";
        setErreur(msg);
        throw new Error(msg);
      }
      setErreur(extraireMessageErreur(err));
      throw err;
    } finally {
      setEnCours(false);
    }
  };

  return {
    realisables,
    actes,
    demandes,
    demandeActive,
    ligneDemandeId,
    selectionId,
    choisirActe,
    choisirDemande,
    moule,
    dejaSaisies,
    champsAEnvoyer,
    acteExistant,
    valeurs,
    setValeur: (id: number, v: string) => setValeurs((p) => ({ ...p, [id]: v })),
    interpretations,
    setInterpretation: (id: number, v: string) => setInterpretations((p) => ({ ...p, [id]: v })),
    commentaire,
    setCommentaire,
    nombreSaisis,
    obligatoiresManquantes,
    chargement,
    chargementMoule,
    enCours,
    erreur,
    enregistrer,
    rafraichir: charger,
  };
}