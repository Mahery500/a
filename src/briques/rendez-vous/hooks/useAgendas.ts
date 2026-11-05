/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { agendaApi } from '../api/Agendaapi';
import type { AgendaInput } from '../modele/types';
import { invalider, useMutation, useRequete } from './useRequete';

export function useAgendas() {
  return useRequete(() => agendaApi.lister(), [], { tag: 'agendas' });
}

/**
 * Création ET modification passent par POST /api/agendas : le backend garde un agenda par staff
 * et remplace les horaires de l'agenda existant (il n'y a pas de PUT /api/agendas/{id}).
 * `id` reste accepté par la signature pour ne pas changer les appelants.
 */
export function useEnregistrerAgenda() {
  return useMutation(
    ({ input }: { id?: number; input: AgendaInput }) => agendaApi.creer(input),
    () => invalider('agendas', 'creneaux'),
  );
}