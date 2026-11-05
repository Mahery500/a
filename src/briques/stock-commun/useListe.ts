// stock-commun/useListe.ts
import { useCallback, useEffect, useState } from "react";
import { messageErreur } from "./api";

export function useListe<R>(chargeur: () => Promise<R[]>, deps: unknown[] = []) {
  const [items, setItems] = useState<R[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      setItems(await chargeur());
    } catch (e) {
      setErreur(messageErreur(e, "Chargement impossible."));
    } finally {
      setChargement(false);
    }
  }, deps);

  useEffect(() => {
    charger();
  }, [charger]);
  return { items, chargement, erreur, recharger: charger };
}
