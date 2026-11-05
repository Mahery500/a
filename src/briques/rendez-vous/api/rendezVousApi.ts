/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { http } from './http';
import type { NouveauRendezVousInput } from '../modele/types';

export const rendezVousApi = {
  reserver: (input: NouveauRendezVousInput) => http.post('/api/rendez-vous', input),
  annuler: (id: number) => http.delete(`/api/rendez-vous/${id}`),
  confirmerArrivee: (id: number, serviceId: number) =>
    http.post(`/api/rendez-vous/${id}/confirmer-arrivee`, { serviceId }),
};