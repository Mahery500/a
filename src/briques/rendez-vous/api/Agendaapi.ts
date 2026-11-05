/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { extraireElementsCollection } from '@/noyau/http';
import { http } from './http';
import type { Agenda, AgendaInput, CreneauDisponible } from '../modele/types';

export const agendaApi = {
  async lister(): Promise<Agenda[]> {
    return extraireElementsCollection<Agenda>(await http.get('/api/agendas'));
  },

  async creneauxDisponibles(agendaId: number, date: string): Promise<CreneauDisponible[]> {
    return extraireElementsCollection<CreneauDisponible>(
      await http.get(`/api/agendas/${agendaId}/creneaux-disponibles`, { params: { date } }),
    );
  },

  // À activer quand le backend exposera ces opérations.
  creer: (input: AgendaInput) => http.post<Agenda>('/api/agendas', input),
  modifier: (id: number, input: AgendaInput) => http.put<Agenda>(`/api/agendas/${id}`, input),
};