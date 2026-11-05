/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import {
  definirJetonJwt,
  definirJetonRefresh,
  obtenirJetonRefresh,
  effacerSession,
} from "@/noyau/http/session";
import { decoderJetonJwt } from "@/noyau/http/jwt";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { IdentifiantsConnexion, UtilisateurConnecte } from "../modele/authentification.types";
import { LoginReponseApi, MeReponseApi, RefreshReponseApi } from "./authentification.contrats";
import { mapperUtilisateurConnecte } from "./authentification.mapping";

export const authentificationApi = {
  /**
   * Connexion à l'API Symfony :
   * 1. POST /login (envoi de identifier et password)
   * 2. Stockage des jetons reçus
   * 3. GET /me (source de vérité du profil)
   * 4. Conversion vers le modèle UtilisateurConnecte
   */
  connecter: async (identifiants: IdentifiantsConnexion): Promise<UtilisateurConnecte> => {
    const identifiantPropre = identifiants.identifiant.trim();

    let reponseAuth: LoginReponseApi;
    try {
      reponseAuth = await clientHttp<LoginReponseApi>("/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifiantPropre,
          password: identifiants.motDePasse,
        }),
        skipAuth: true,
      });
    } catch (err: unknown) {
      // Compatibilité si l'endpoint attend 'username' au lieu de 'identifier'
      if (err instanceof ErreurApi && err.statut === 400 && /username/i.test(err.message)) {
        reponseAuth = await clientHttp<LoginReponseApi>("/login", {
          method: "POST",
          body: JSON.stringify({
            username: identifiantPropre,
            password: identifiants.motDePasse,
          }),
          skipAuth: true,
        });
      } else {
        throw err;
      }
    }

    const jeton = reponseAuth?.token || reponseAuth?.jwt || reponseAuth?.access_token;

    if (!jeton) {
      throw new ErreurApi(
        500,
        "La réponse de l'API de connexion ne contient aucun jeton d'authentification valide.",
      );
    }

    definirJetonJwt(jeton);

    const jetonRefresh = reponseAuth?.refreshToken || reponseAuth?.refresh_token;
    if (jetonRefresh) {
      definirJetonRefresh(jetonRefresh);
    }

    // Récupération du profil auprès de /me
    let profilMe: MeReponseApi;
    try {
      profilMe = await clientHttp<MeReponseApi>("/me");
    } catch (err) {
      effacerSession();
      throw err;
    }

    // Décodage des rôles du token pour enrichissement
    const chargeJwt = decoderJetonJwt(jeton);
    const rolesJwt = Array.isArray(chargeJwt?.roles) ? chargeJwt.roles : [];
    const rolesReponse = Array.isArray(reponseAuth.roles) ? reponseAuth.roles : [];
    const rolesCombinés = [...rolesJwt, ...rolesReponse];

    const utilisateur = mapperUtilisateurConnecte(profilMe, jeton, jetonRefresh, rolesCombinés);

    if (!utilisateur) {
      effacerSession();
      throw new ErreurApi(
        500,
        "Impossible de lire le profil utilisateur renvoyé par l'API (identifiant numérique manquant).",
      );
    }

    return utilisateur;
  },

  /**
   * Rafraîchissement du jeton d'accès via le refresh token
   */
  rafraichirJeton: async (): Promise<string | null> => {
    const jetonRefresh = obtenirJetonRefresh();
    if (!jetonRefresh) return null;

    try {
      const reponse = await clientHttp<RefreshReponseApi>("/refresh", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ refreshToken: jetonRefresh }),
      });

      const nouveauJeton = reponse?.token || reponse?.jwt || reponse?.access_token;
      if (nouveauJeton) {
        definirJetonJwt(nouveauJeton);
        const nouveauRefresh = reponse?.refreshToken || reponse?.refresh_token;
        if (nouveauRefresh) {
          definirJetonRefresh(nouveauRefresh);
        }
        return nouveauJeton;
      }
    } catch {
      // Échec du rafraîchissement
    }
    return null;
  },

  /**
   * Déconnexion complète
   */
  deconnecter: async (): Promise<void> => {
    const jetonRefresh = obtenirJetonRefresh();
    try {
      if (jetonRefresh) {
        await clientHttp<void>("/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: jetonRefresh }),
        });
      }
    } catch {
      // Ignorer si la session est déjà invalidée
    } finally {
      effacerSession();
    }
  },

  /**
   * Récupère le profil de l'utilisateur courant (GET /api/me)
   */
  obtenirMoi: (): Promise<MeReponseApi> => {
    return clientHttp<MeReponseApi>("/me");
  },
};
