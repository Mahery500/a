/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from "react";
import { ContexteNotifications } from "./ContexteNotifications";
import { ContexteNotificationsValeur } from "./types";

/**
 * Hook permettant à n'importe quelle brique ou composant
 * d'émettre des notifications toast unifiées.
 */
export function useNotifier(): ContexteNotificationsValeur {
  const contexte = useContext(ContexteNotifications);
  if (!contexte) {
    throw new Error("useNotifier doit être utilisé au sein d’un FournisseurNotifications.");
  }
  return contexte;
}

export default useNotifier;
