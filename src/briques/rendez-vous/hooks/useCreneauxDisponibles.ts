/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { agendaApi } from '../api/Agendaapi';
import { useRequete } from './useRequete';

export function useCreneauxDisponibles(agendaId?: number, date?: string) {
  return useRequete(
    () => agendaApi.creneauxDisponibles(agendaId!, date!),
    [agendaId, date],
    { enabled: !!agendaId && !!date, tag: 'creneaux' },
  );
}