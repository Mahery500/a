/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import { messageErreur } from "@/noyau/utils/erreur";
import { authentificationApi } from "../api/authentification.api";
import { UtilisateurConnecte } from "../modele/authentification.types";

export function useConnexion(onConnexionReussie?: (utilisateur: UtilisateurConnecte) => void) {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const seConnecter = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setErreur(null);

      const idNettoye = identifiant.trim();
      if (!idNettoye) {
        setErreur("Veuillez saisir votre identifiant de connexion.");
        return;
      }
      if (!motDePasse) {
        setErreur("Veuillez saisir votre mot de passe.");
        return;
      }

      setEnCours(true);
      try {
        const utilisateur = await authentificationApi.connecter({
          identifiant: idNettoye,
          motDePasse,
        });

        setMotDePasse("");
        if (onConnexionReussie) {
          onConnexionReussie(utilisateur);
        }
      } catch (err: unknown) {
        setErreur(
          messageErreur(
            err,
            "Identifiants invalides ou impossible de joindre le serveur d’authentification.",
          ),
        );
      } finally {
        setEnCours(false);
      }
    },
    [identifiant, motDePasse, onConnexionReussie],
  );

  return {
    identifiant,
    setIdentifiant,
    motDePasse,
    setMotDePasse,
    erreur,
    enCours,
    seConnecter,
  };
}

export default useConnexion;
