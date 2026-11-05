/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from "react";
import { ContexteSession } from "./ContexteSession";
import { ContexteSessionValeur } from "./types";

/**
 * Hook permettant d'accéder au contexte de session globale
 * (utilisateur connecté, statut de connexion, site et service actifs).
 */
export function useSession(): ContexteSessionValeur {
  const contexte = useContext(ContexteSession);
  if (!contexte) {
    throw new Error("useSession doit être utilisé à l’intérieur d’un FournisseurSession.");
  }
  return contexte;
}

export default useSession;
