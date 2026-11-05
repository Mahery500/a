/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Petit mécanisme d'invalidation : après une écriture, on recharge toutes les
// requêtes qui portent le même tag.
const abonnes = new Map<string, Set<() => void>>();

export function invalider(...tags: string[]) {
  tags.forEach((tag) => abonnes.get(tag)?.forEach((rappel) => rappel()));
}

interface OptionsRequete {
  enabled?: boolean;
  tag?: string;
}

export function useRequete<T>(
  chargeur: () => Promise<T>,
  deps: unknown[],
  { enabled = true, tag }: OptionsRequete = {},
) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(enabled);
  const [version, setVersion] = useState(0);
  const chargeurRef = useRef(chargeur);
  chargeurRef.current = chargeur;

  useEffect(() => {
    if (!tag) return;
    const rappel = () => setVersion((v) => v + 1);
    let ensemble = abonnes.get(tag);
    if (!ensemble) {
      ensemble = new Set();
      abonnes.set(tag, ensemble);
    }
    ensemble.add(rappel);
    return () => {
      ensemble!.delete(rappel);
    };
  }, [tag]);

  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      setIsLoading(false);
      return;
    }
    let annule = false;
    setIsLoading(true);
    setError(undefined);
    setData(undefined);
    chargeurRef
      .current()
      .then((resultat) => {
        if (!annule) setData(resultat);
      })
      .catch((e) => {
        if (!annule) setError(e);
      })
      .finally(() => {
        if (!annule) setIsLoading(false);
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, version, ...deps]);

  return {
    data,
    error,
    isLoading,
    isError: error !== undefined,
    refetch: () => setVersion((v) => v + 1),
  };
}

interface Rappels<R> {
  onSuccess?: (resultat: R) => void;
  onError?: (erreur: unknown) => void;
}

export function useMutation<V, R>(action: (variables: V) => Promise<R>, apresSucces?: () => void) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<unknown>();

  const mutate = useCallback(
    (variables: V, rappels?: Rappels<R>) => {
      setIsPending(true);
      setError(undefined);
      action(variables)
        .then((resultat) => {
          apresSucces?.();
          rappels?.onSuccess?.(resultat);
        })
        .catch((e) => {
          setError(e);
          rappels?.onError?.(e);
        })
        .finally(() => setIsPending(false));
    },
    [action, apresSucces],
  );

  return { mutate, isPending, error, isError: error !== undefined };
}