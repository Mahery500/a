/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { rendezVousApi } from '../api/rendezVousApi';
import { invalider, useMutation } from './useRequete';

const apresEcriture = () => invalider('rendez-vous', 'creneaux');

export function useReserverRendezVous() {
  return useMutation(rendezVousApi.reserver, apresEcriture);
}

export function useAnnulerRendezVous() {
  return useMutation(rendezVousApi.annuler, apresEcriture);
}

export function useConfirmerArrivee() {
  return useMutation(
    ({ id, serviceId }: { id: number; serviceId: number }) =>
      rendezVousApi.confirmerArrivee(id, serviceId),
    apresEcriture,
  );
}