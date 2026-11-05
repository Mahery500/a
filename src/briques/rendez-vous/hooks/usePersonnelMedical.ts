import { extraireElementsCollection } from '@/noyau/http';
import { http } from '../api/http';
import { useRequete } from './useRequete';

export interface PersonnelMedical {
  id: number;
  nom: string;
  prenom: string;
  corps: string;
  specialite: string | null;
}

export function usePersonnelMedical(siteId: number, sansAgenda: boolean) {
  return useRequete(
    async () => {
      const params = new URLSearchParams({ siteId: String(siteId) });
      if (sansAgenda) params.set('sansAgenda', '1');
      return extraireElementsCollection<PersonnelMedical>(
        await http.get(`/api/agendas/personnel-medical?${params.toString()}`),
      );
    },
    [siteId, sansAgenda],
  );
}