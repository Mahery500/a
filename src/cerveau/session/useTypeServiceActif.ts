/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { servicesApi, ServiceMedical } from "@/briques/services";
import { useSession } from "./useSession";

/**
 * Cache module-scoped : la liste des services change très rarement,
 * on la partage entre tous les appels du hook (et on évite ainsi un
 * GET /services à chaque ouverture du modal de prise en charge).
 *
 * ⚠️ À invalider explicitement depuis le module Services après un
 * create/update/delete si vous voulez un cache "temps réel".
 */
let cacheServices: Promise<ServiceMedical[]> | null = null;

function chargerServices(): Promise<ServiceMedical[]> {
  if (!cacheServices) {
    cacheServices = servicesApi.listerServices().catch(() => []);
  }
  return cacheServices;
}

export function invaliderCacheServices(): void {
  cacheServices = null;
}

/**
 * Renvoie le `typeServiceId` du service actif de la session.
 * - `null` si aucun service actif n'est défini
 * - `null` si le service n'existe plus / est inconnu
 *
 * Utilisation typique : filtrer les types de prise en charge autorisés
 * pour ce service dans le modal de prise en charge.
 */
export function useTypeServiceActif(): number | null {
  const { serviceActifId } = useSession();
  const [typeServiceId, setTypeServiceId] = useState<number | null>(null);

  useEffect(() => {
    if (!serviceActifId) {
      setTypeServiceId(null);
      return;
    }

    let actif = true;
    chargerServices().then((liste) => {
      if (!actif) return;
      const service = liste.find((s) => s.id === serviceActifId);
      setTypeServiceId(service?.typeServiceId ?? null);
    });

    return () => {
      actif = false;
    };
  }, [serviceActifId]);

  return typeServiceId;
}
