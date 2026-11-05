import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";

export type StatutDemande = "EN_ATTENTE" | "PLANIFIEE" | "REFUSEE";
export type TypeDemande = "SUIVI" | "SPECIALISTE";

export interface DemandeRendezVous {
  id: number;
  type: TypeDemande;
  patientId: number;
  patientNom: string | null;
  encounterId: number | null;
  demandeur: string;
  specialiteId: number | null;
  specialiteLibelle: string | null;
  dateSouhaitee: string | null;
  urgent: boolean;
  motif: string;
  resumeClinique: string | null;
  statut: StatutDemande;
  createdAt: string;
}

export interface CreerDemandePayload {
  type: TypeDemande;
  patientId: number;
  patientNom?: string;
  encounterId?: number;
  demandeurLibelle?: string;
  specialiteId?: number;
  dateSouhaitee?: string;
  urgent: boolean;
  motif: string;
  resumeClinique?: string;
}

export interface SpecialiteOption {
  id: number;
  code: string;
  libelle: string;
  actif: boolean;
}

export const demandesRendezVousApi = {
  async lister(filtres: { statut?: StatutDemande; encounterId?: number } = {}) {
    const params: Record<string, string | number> = {};
    if (filtres.statut) params.statut = filtres.statut;
    if (filtres.encounterId) params.encounterId = filtres.encounterId;
    const reponse = await clientHttp<unknown>("/api/demandes-rendez-vous", { params });
    return extraireElementsCollection<DemandeRendezVous>(reponse);
  },

  creer(payload: CreerDemandePayload) {
    return clientHttp<DemandeRendezVous>("/api/demandes-rendez-vous", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  marquerPlanifiee(id: number) {
    return clientHttp<void>(`/api/demandes-rendez-vous/${id}/planifier`, { method: "POST" });
  },

  refuser(id: number) {
    return clientHttp<void>(`/api/demandes-rendez-vous/${id}/refuser`, { method: "POST" });
  },

  async listerSpecialites() {
    const reponse = await clientHttp<unknown>("/api/specialites");
    return extraireElementsCollection<SpecialiteOption>(reponse).filter((s) => s.actif);
  },
};