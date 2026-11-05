/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { SiteHospitalier, NouveauSiteInput, ModificationSiteInput } from "../modele/site.types";
import { sitesApi } from "../api/sites.api";

export function useSites() {
  const notif = useNotifier();

  // On garde `notif` dans une ref : il ne doit JAMAIS figurer dans les deps
  // de `chargerSites`, sinon une nouvelle notification (re-render du provider)
  // recréerait `chargerSites` → relancerait le fetch → nouvelle notification
  // → boucle infinie.
  const notifRef = useRef(notif);
  notifRef.current = notif;

  const [sites, setSites] = useState<SiteHospitalier[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState<string>("");

  const chargerSites = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const liste = await sitesApi.lister();
      setSites(liste);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger la liste des sites.");
      setErreur(msg);
      notifRef.current.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerSites();
  }, [chargerSites]);

  const creerSite = useCallback(
    async (saisie: NouveauSiteInput): Promise<boolean> => {
      try {
        const nouveau = await sitesApi.creer(saisie);
        setSites((prev) => [...prev, nouveau]);
        notifRef.current.succes(`Site « ${nouveau.nom} » créé avec succès.`);
        return true;
      } catch (err) {
        notifRef.current.erreur(messageErreur(err, "Échec de la création du site."));
        return false;
      }
    },
    [],
  );

  const modifierSite = useCallback(
    async (id: number, saisie: ModificationSiteInput): Promise<boolean> => {
      try {
        const modifie = await sitesApi.modifier(id, saisie);
        setSites((prev) => prev.map((s) => (s.id === id ? modifie : s)));
        notifRef.current.succes(`Site « ${modifie.nom} » mis à jour.`);
        return true;
      } catch (err) {
        notifRef.current.erreur(messageErreur(err, "Échec de la modification du site."));
        return false;
      }
    },
    [],
  );

  const supprimerSite = useCallback(
    async (id: number, nom: string): Promise<boolean> => {
      try {
        await sitesApi.supprimer(id);
        setSites((prev) => prev.filter((s) => s.id !== id));
        notifRef.current.succes(`Site « ${nom} » supprimé.`);
        return true;
      } catch (err) {
        notifRef.current.erreur(messageErreur(err, "Échec de la suppression du site."));
        return false;
      }
    },
    [],
  );

  const sitesFiltres = useMemo(() => {
    if (!recherche.trim()) return sites;
    const q = recherche.toLowerCase().trim();
    return sites.filter(
      (s) =>
        s.nom.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.ville.toLowerCase().includes(q),
    );
  }, [sites, recherche]);

  return {
    sites: sitesFiltres,
    totalSites: sites.length,
    chargement,
    erreur,
    recherche,
    setRecherche,
    recharger: chargerSites,
    creerSite,
    modifierSite,
    supprimerSite,
  };
}

export default useSites;