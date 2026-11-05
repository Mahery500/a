
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import {
  EntreprisePartenaire,
  NouvelleEntrepriseInput,
  ModificationEntrepriseInput,
  Smie,
} from "../modele/entreprise.types";
import { entreprisesApi } from "../api/entreprises.api";

export type FiltreSmie = "toutes" | Smie;

export function useEntreprises() {
  const notif = useNotifier();

  const [entreprises, setEntreprises] = useState<EntreprisePartenaire[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [recherche, setRecherche] = useState<string>("");
  const [filtreSmie, setFiltreSmie] = useState<FiltreSmie>("toutes");

  const chargerEntreprises = useCallback(async () => {
    setChargement(true);
    setErreur(null);

    try {
      const liste = await entreprisesApi.lister();
      setEntreprises(liste);
    } catch (err) {
      const msg = messageErreur(
        err,
        "Impossible de charger la liste des entreprises partenaires.",
      );

      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => {
    chargerEntreprises();
  }, [chargerEntreprises]);

  const creerEntreprise = useCallback(
    async (
      saisie: NouvelleEntrepriseInput,
    ): Promise<EntreprisePartenaire | null> => {
      try {
        const nouvelle = await entreprisesApi.creer(saisie);

        setEntreprises((prev) => [...prev, nouvelle]);

        notif.succes(
          `Entreprise « ${nouvelle.nom} » enregistrée avec succès.`,
        );

        return nouvelle;
      } catch (err) {
        notif.erreur(
          messageErreur(err, "Échec de l'enregistrement de l'entreprise."),
        );

        return null;
      }
    },
    [notif],
  );

  const modifierEntreprise = useCallback(
    async (
      id: number,
      saisie: ModificationEntrepriseInput,
    ): Promise<EntreprisePartenaire | null> => {
      try {
        const modifiee = await entreprisesApi.modifier(id, saisie);

        setEntreprises((prev) =>
          prev.map((entreprise) =>
            entreprise.id === id ? modifiee : entreprise,
          ),
        );

        notif.succes(
          `Entreprise « ${modifiee.nom} » mise à jour.`,
        );

        return modifiee;
      } catch (err) {
        notif.erreur(
          messageErreur(err, "Échec de la modification de l'entreprise."),
        );

        return null;
      }
    },
    [notif],
  );

  const supprimerEntreprise = useCallback(
    async (id: number, nom: string): Promise<boolean> => {
      try {
        await entreprisesApi.supprimer(id);

        setEntreprises((prev) =>
          prev.filter((entreprise) => entreprise.id !== id),
        );

        notif.succes(`Entreprise « ${nom} » supprimée.`);

        return true;
      } catch (err) {
        notif.erreur(
          messageErreur(err, "Échec de la suppression de l'entreprise."),
        );

        return false;
      }
    },
    [notif],
  );

  /* ----- Statistiques calculées sur la liste brute ----- */

  const stats = useMemo(() => {
    const total = entreprises.length;

    const salaries = entreprises.reduce(
      (somme, entreprise) => somme + (entreprise.nombreAgents ?? 0),
      0,
    );

    const asina = entreprises.filter(
      (entreprise) => entreprise.smie === "asina",
    ).length;

    const serenite = entreprises.filter(
      (entreprise) => entreprise.smie === "serenite",
    ).length;

    return {
      total,
      salaries,
      asina,
      serenite,
    };
  }, [entreprises]);

  /* ----- Liste filtrée : recherche + SMIE ----- */

  const entreprisesFiltrees = useMemo(() => {
    let resultat = entreprises;

    if (filtreSmie !== "toutes") {
      resultat = resultat.filter(
        (entreprise) => entreprise.smie === filtreSmie,
      );
    }

    const q = recherche.trim().toLowerCase();

    if (q) {
      resultat = resultat.filter(
        (entreprise) =>
          entreprise.nom.toLowerCase().includes(q) ||
          (entreprise.raisonSociale &&
            entreprise.raisonSociale.toLowerCase().includes(q)) ||
          entreprise.adresse.toLowerCase().includes(q) ||
          entreprise.contact.toLowerCase().includes(q) ||
          (entreprise.numeroCnaps &&
            entreprise.numeroCnaps.toLowerCase().includes(q)) ||
          (entreprise.matriculeAsina &&
            entreprise.matriculeAsina.toLowerCase().includes(q)),
      );
    }

    return resultat;
  }, [entreprises, filtreSmie, recherche]);

  return {
    entreprises: entreprisesFiltrees,
    entreprisesToutes: entreprises,
    totalEntreprises: entreprises.length,
    stats,
    chargement,
    erreur,
    recherche,
    setRecherche,
    filtreSmie,
    setFiltreSmie,
    recharger: chargerEntreprises,
    creerEntreprise,
    modifierEntreprise,
    supprimerEntreprise,
  };
}

export default useEntreprises;
