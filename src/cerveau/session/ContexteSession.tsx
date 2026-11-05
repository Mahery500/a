
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useEffect, useState } from "react";
import {
  CLE_STOCKAGE_UTILISATEUR,
  CLE_STOCKAGE_SITE_ACTIF,
  CLE_STOCKAGE_SERVICE_ACTIF,
  obtenirJetonJwt,
  effacerSession,
  surSessionExpiree,
} from "@/noyau/http/session";
import { useNotifier } from "@/noyau/notifications";
import { authentificationApi, UtilisateurConnecte } from "@/briques/authentification";
import { ContexteSessionValeur } from "./types";

export const ContexteSession = createContext<ContexteSessionValeur | null>(null);

function chargerUtilisateurInitial(): UtilisateurConnecte | null {
  if (typeof window === "undefined") return null;

  const jeton = obtenirJetonJwt();
  if (!jeton) return null;

  const brut = localStorage.getItem(CLE_STOCKAGE_UTILISATEUR);
  if (!brut) return null;

  try {
    const parse = JSON.parse(brut) as UtilisateurConnecte;
    if (parse && typeof parse.id === "number" && parse.id > 0) {
      return parse;
    }
  } catch {
    // Session invalide
  }

  return null;
}

function chargerIdStocke(cle: string): number | null {
  if (typeof window === "undefined") return null;

  const valeur = localStorage.getItem(cle);
  if (!valeur) return null;

  const num = Number(valeur);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export interface FournisseurSessionProps {
  children: React.ReactNode;
}

export const FournisseurSession: React.FC<FournisseurSessionProps> = ({ children }) => {
  const notif = useNotifier();

  const [utilisateur, setUtilisateurState] = useState<UtilisateurConnecte | null>(
    chargerUtilisateurInitial,
  );

  const [siteActifId, setSiteActifIdState] = useState<number | null>(() => {
    return chargerIdStocke(CLE_STOCKAGE_SITE_ACTIF) ?? utilisateur?.siteId ?? null;
  });

  const [serviceActifId, setServiceActifIdState] = useState<number | null>(() => {
    return chargerIdStocke(CLE_STOCKAGE_SERVICE_ACTIF) ?? utilisateur?.serviceId ?? null;
  });

  const definirUtilisateur = useCallback((u: UtilisateurConnecte | null) => {
    setUtilisateurState(u);

    if (typeof window === "undefined") return;

    if (u) {
      localStorage.setItem(CLE_STOCKAGE_UTILISATEUR, JSON.stringify(u));

      if (u.siteId && !localStorage.getItem(CLE_STOCKAGE_SITE_ACTIF)) {
        localStorage.setItem(CLE_STOCKAGE_SITE_ACTIF, String(u.siteId));
        setSiteActifIdState(u.siteId);
      }

      if (u.serviceId && !localStorage.getItem(CLE_STOCKAGE_SERVICE_ACTIF)) {
        localStorage.setItem(CLE_STOCKAGE_SERVICE_ACTIF, String(u.serviceId));
        setServiceActifIdState(u.serviceId);
      }
    } else {
      localStorage.removeItem(CLE_STOCKAGE_UTILISATEUR);
      localStorage.removeItem(CLE_STOCKAGE_SITE_ACTIF);
      localStorage.removeItem(CLE_STOCKAGE_SERVICE_ACTIF);

      setSiteActifIdState(null);
      setServiceActifIdState(null);
    }
  }, []);

  const rafraichirProfil = useCallback(async () => {
    if (!utilisateur) return;

    const me = await authentificationApi.obtenirMoi();

    definirUtilisateur({
      ...utilisateur,
      siteId: me.siteId ?? null,
      serviceId: me.serviceId ?? null,
      sansAffectation: me.sansAffectation === true,
    });
  }, [utilisateur, definirUtilisateur]);

  // Au chargement : revalider le profil mis en cache dans le localStorage.
  useEffect(() => {
    rafraichirProfil().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choisirSite = useCallback((id: number | null) => {
    setSiteActifIdState(id);

    if (typeof window === "undefined") return;

    if (id !== null) {
      localStorage.setItem(CLE_STOCKAGE_SITE_ACTIF, String(id));
    } else {
      localStorage.removeItem(CLE_STOCKAGE_SITE_ACTIF);
    }
  }, []);

  const choisirService = useCallback((id: number | null) => {
    setServiceActifIdState(id);

    if (typeof window === "undefined") return;

    if (id !== null) {
      localStorage.setItem(CLE_STOCKAGE_SERVICE_ACTIF, String(id));
    } else {
      localStorage.removeItem(CLE_STOCKAGE_SERVICE_ACTIF);
    }
  }, []);

  const deconnecter = useCallback(async () => {
    try {
      await authentificationApi.deconnecter();
    } catch {
      effacerSession();
    } finally {
      definirUtilisateur(null);
      notif.info("Vous êtes déconnecté.");
    }
  }, [definirUtilisateur, notif]);

  // Écoute de l'invalidation automatique 401
  useEffect(() => {
    const desabonner = surSessionExpiree(() => {
      definirUtilisateur(null);
      notif.avertissement("Votre session a expiré. Veuillez vous reconnecter.");
    });

    return desabonner;
  }, [definirUtilisateur, notif]);

  const valeur: ContexteSessionValeur = {
    utilisateur,
    siteActifId,
    serviceActifId,
    estConnecte: utilisateur !== null,
    definirUtilisateur,
    rafraichirProfil,
    choisirSite,
    choisirService,
    deconnecter,
  };

  return <ContexteSession.Provider value={valeur}>{children}</ContexteSession.Provider>;
};
