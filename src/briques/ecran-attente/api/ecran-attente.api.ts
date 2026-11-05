/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import { TicketAppele } from "../modele/ecran-attente.types";

async function requeteAvecFallback<T>(
  cheminPrincipal: string,
  cheminRepli: string,
  options?: Parameters<typeof clientHttp>[1],
): Promise<T> {
  try {
    return await clientHttp<T>(cheminPrincipal, options);
  } catch (err) {
    if (err instanceof ErreurApi && err.statut === 404) {
      return await clientHttp<T>(cheminRepli, options);
    }
    throw err;
  }
}

function formaterHeure(dateIso?: string): string {
  if (!dateIso) return "--:--";
  try {
    const d = new Date(dateIso);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    // fallback
  }
  return "--:--";
}

function extraireId(valeur: unknown): number | null {
  if (typeof valeur === "number" && Number.isFinite(valeur) && valeur > 0) return valeur;
  if (typeof valeur === "string") {
    const s = valeur.trim();
    if (/^\d+$/.test(s)) return Number(s);
    const m = s.match(/\/(\d+)$/);
    if (m) return Number(m[1]);
  }
  if (valeur && typeof valeur === "object") {
    const o = valeur as Record<string, unknown>;
    return extraireId(o.id ?? o["@id"]);
  }
  return null;
}

export const ecranAttenteApi = {
  /**
   * Récupère les deux flux nécessaires à l'écran public :
   *   - APPELÉ : patients actuellement appelés au guichet (affichés en très gros)
   *   - EN_ATTENTE : prochains passages (affichés en petit dans la liste du bas)
   *
   * On n'expose PAS "EN_COURS" (patient déjà en consultation) : cette information
   * n'a pas d'utilité pour les personnes présentes en salle d'attente.
   */
  async chargerDonneesFile(siteId: number): Promise<{
    appeles: TicketAppele[];
    enAttente: TicketAppele[];
  }> {
    const [waitingRaw, appelesRaw, servicesRaw, patientsRaw] = await Promise.all([
      requeteAvecFallback<unknown>("/api/aiguillages", "/aiguillages", {
        params: { siteId, site: siteId, statut: "EN_ATTENTE" },
      }).then((r) => extraireElementsCollection<Record<string, unknown>>(r)),

      requeteAvecFallback<unknown>("/api/aiguillages", "/aiguillages", {
        params: { siteId, site: siteId, statut: "APPELE" },
      }).then((r) => extraireElementsCollection<Record<string, unknown>>(r)),

      requeteAvecFallback<unknown>("/api/services", "/services").then((r) =>
        extraireElementsCollection<Record<string, unknown>>(r),
      ),

      requeteAvecFallback<unknown>("/api/patients", "/patients").then((r) =>
        extraireElementsCollection<Record<string, unknown>>(r),
      ),
    ]);

    const servicesMap = new Map<number, string>();
    servicesRaw.forEach((s) => {
      const id = extraireId(s.id ?? s["@id"]);
      if (id) {
        const libelle = s.typeServiceName ?? s.nom ?? s.libelle ?? s.name ?? s.title;
        servicesMap.set(id, String(libelle ?? `Service #${id}`));
      }
    });

    const patientsMap = new Map<number, string>();
    patientsRaw.forEach((p) => {
      const id = extraireId(p.id ?? p["@id"]);
      if (id) {
        const nom = String(p.nom ?? p.lastName ?? "").trim();
        const prenom = String(p.prenom ?? p.firstName ?? "").trim();
        patientsMap.set(id, `${nom} ${prenom}`.trim());
      }
    });

    const mapper = (a: Record<string, unknown>): TicketAppele => {
      const id = extraireId(a.id ?? a["@id"]) ?? 0;
      const ticketObj = (a.ticket && typeof a.ticket === "object" ? a.ticket : null) as Record<
        string,
        unknown
      > | null;
      const ticketId =
        extraireId(a.ticketId) ?? extraireId(ticketObj?.id) ?? extraireId(a.ticket) ?? 0;
      const numTicket = String(
        a.numTicket ??
          ticketObj?.numTicket ??
          ticketObj?.numero ??
          (ticketId ? `T-${ticketId}` : `T-${id}`),
      );

      const patientObj = (ticketObj?.patient ?? a.patient) as Record<string, unknown> | null;
      const patientId =
        extraireId(a.patientId) ?? extraireId(patientObj?.id) ?? extraireId(ticketObj?.patientId);
      let patientNom: string | undefined;
      if (patientObj && typeof patientObj === "object") {
        const n = String(patientObj.nom ?? patientObj.lastName ?? "").trim();
        const p = String(patientObj.prenom ?? patientObj.firstName ?? "").trim();
        if (n || p) patientNom = `${n} ${p}`.trim();
      }
      if (!patientNom && patientId) {
        patientNom = patientsMap.get(patientId);
      }

      const serviceObj = (a.service && typeof a.service === "object" ? a.service : null) as Record<
        string,
        unknown
      > | null;
      const serviceId =
        extraireId(a.serviceId) ?? extraireId(serviceObj?.id) ?? extraireId(a.service) ?? 0;
      const serviceNom = String(
        a.serviceNom ??
          serviceObj?.typeServiceName ??
          serviceObj?.nom ??
          serviceObj?.libelle ??
          (serviceId ? servicesMap.get(serviceId) : null) ??
          (serviceId ? `Service #${serviceId}` : "Accueil"),
      );

      // Pour un ticket APPELÉ, c'est l'heure d'appel qui compte (dateAppel).
      // Pour un ticket EN ATTENTE, on retombe sur l'heure d'aiguillage.
      const dateAffichee = String(a.dateAppel ?? a.dateAiguillage ?? a.date ?? a.createdAt ?? "");

      return {
        id,
        ticketId,
        numTicket,
        patientNom,
        serviceNom,
        serviceId,
        heureAffichee: formaterHeure(dateAffichee),
      };
    };

    return {
      appeles: appelesRaw.map(mapper),
      enAttente: waitingRaw.map(mapper),
    };
  },
};
