/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UtilisateurConnecte } from "@/briques/authentification";

export interface EtatSession {
  utilisateur: UtilisateurConnecte | null;
  siteActifId: number | null;
  serviceActifId: number | null;
  estConnecte: boolean;
}

export interface ContexteSessionValeur {
  utilisateur: UtilisateurConnecte | null;
  siteActifId: number | null;
  serviceActifId: number | null;
  estConnecte: boolean;
  definirUtilisateur: (utilisateur: UtilisateurConnecte | null) => void;
  choisirSite: (siteId: number | null) => void;
  choisirService: (serviceId: number | null) => void;
  deconnecter: () => Promise<void>;
  rafraichirProfil: () => Promise<void>;
}
