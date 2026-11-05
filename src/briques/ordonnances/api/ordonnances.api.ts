import { clientHttp } from "@/noyau/http/clientHttp"; // ⚠️ adapter si le fichier porte un autre nom

export interface MedicamentCatalogue {
  id: number;
  libelle: string;
  code?: string | null;
  formeId?: number | null;
  /** Libellé de la forme (comprimé, sirop, injectable…), résolu côté hook si disponible. */
  forme?: string | null;
  statut?: string | null;
}

export interface LigneOrdonnanceSaisie {
  medicamentId: number;
  quantite: number;
  posologie: string;
  dureeJours?: number | null;
}

export interface CreerOrdonnancePayload {
  encounterId: number;
  lignes: LigneOrdonnanceSaisie[];
}

/** Forme tolérante : OrdonnanceOutput n'étant pas connu côté front. */
export interface OrdonnanceItem {
  id: number;
  encounterId?: number | null;
  statut?: string | null;
  createdAt?: string | null;
  dateCreation?: string | null;
  lignes?: Array<{
    id?: number;
    medicamentId?: number;
    medicamentLibelle?: string | null;
    medicamentNom?: string | null;
    quantite: number;
    posologie: string;
    dureeJours?: number | null;
  }>;
}

interface MedicamentBrut {
  id: number;
  nomNormalise: string;
  formeId?: number | null;
  statutValidation?: string | null;
}

// API Platform peut répondre en JSON simple ou en JSON-LD (Hydra).
const extraireListe = (d: any): any[] => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.["hydra:member"])) return d["hydra:member"];
  if (Array.isArray(d?.member)) return d.member;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

const mapperMedicament = (m: MedicamentBrut): MedicamentCatalogue => ({
  id: m.id,
  libelle: m.nomNormalise,
  code: null,
  formeId: m.formeId ?? null,
  forme: null,
  statut: m.statutValidation ?? null,
});

// ⚠️ Chemins possibles de la ressource FormePharmaceutique : ajoute le tien s'il est différent.
// Si aucun ne répond, le panneau fonctionne quand même, sans afficher la forme.
const ENDPOINTS_FORMES = ["/formes-pharmaceutiques", "/forme-pharmaceutiques", "/formes"];

export const ordonnancesApi = {
  async listerMedicaments(): Promise<MedicamentCatalogue[]> {
    const res = await clientHttp<unknown>("/medicaments", { method: "GET" });
    console.debug("[ordonnances] réponse /medicaments :", res); // à retirer une fois réglé
    return (extraireListe(res) as MedicamentBrut[])
      .filter((m) => m.statutValidation !== "obsolete")
      .map(mapperMedicament);
  },

  /** Map formeId → libellé. Ne lève jamais d'erreur : une map vide est un résultat valide. */
  async listerFormes(): Promise<Map<number, string>> {
    for (const endpoint of ENDPOINTS_FORMES) {
      try {
        const res = await clientHttp<unknown>(endpoint, { method: "GET" });
        const map = new Map<number, string>();
        for (const f of extraireListe(res)) {
          const id = Number(f?.id);
          const libelle = f?.libelle ?? f?.nom ?? f?.code;
          if (id && libelle) map.set(id, String(libelle));
        }
        if (map.size > 0) return map;
      } catch {
        // endpoint suivant
      }
    }
    return new Map();
  },

  async listerParEncounter(encounterId: number): Promise<OrdonnanceItem[]> {
    const res = await clientHttp<unknown>("/ordonnances", {
      method: "GET",
      params: { encounterId },
    });
    // Filtre strict : sans encounterId, une ordonnance n'appartient à aucun patient affiché
    return (extraireListe(res) as OrdonnanceItem[]).filter(
      (o) => Number(o.encounterId) === encounterId,
    );
  },

  async creer(payload: CreerOrdonnancePayload): Promise<OrdonnanceItem> {
    const body = {
      encounterId: payload.encounterId,
      lignes: payload.lignes.map((l) => ({
        medicamentId: l.medicamentId,
        quantite: l.quantite,
        posologie: l.posologie.trim(),
        ...(l.dureeJours ? { dureeJours: l.dureeJours } : {}),
      })),
    };
    return clientHttp<OrdonnanceItem>("/ordonnances", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async annuler(id: number): Promise<void> {
    await clientHttp<unknown>(`/ordonnances/${id}/annuler`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
