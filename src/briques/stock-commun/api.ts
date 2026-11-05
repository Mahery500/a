// stock-commun/api.ts
import { clientHttp, extraireElementsCollection, ErreurApi } from "@/noyau/http";
import type { OptionsRequete } from "@/noyau/http";
import type * as T from "./types";

type Params = NonNullable<OptionsRequete["params"]>;

// Adaptateur : même interface que l'ancien client axios, basé sur clientHttp
const api = {
  get: <R = unknown>(url: string, opts?: { params?: Params }) =>
    clientHttp<R>(url, { params: opts?.params }),
  post: <R = unknown>(url: string, body?: unknown) =>
    clientHttp<R>(url, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <R = unknown>(url: string, body?: unknown) =>
    clientHttp<R>(url, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <R = unknown>(url: string) => clientHttp<R>(url, { method: "DELETE" }),
};

async function liste<R>(url: string, params?: Params): Promise<R[]> {
  const data = await api.get(url, { params });
  return extraireElementsCollection<R>(data);
}

// Fabrique les 4 opérations standard d'une ressource API Platform
const crud = <R = any, P = any>(url: string) => ({
  liste: () => liste<R>(url),
  creer: (p: P) => api.post<R>(url, p),
  modifier: (id: number, p: P) => api.put<R>(`${url}/${id}`, p),
  supprimer: (id: number) => api.delete(`${url}/${id}`),
});

// Lit le détail renvoyé par Symfony / API Platform (conservé dans ErreurApi.donnees)
export const messageErreur = (e: unknown, defaut = "L'opération a échoué.") => {
  if (e instanceof ErreurApi) {
    const d = e.donnees as Record<string, unknown> | null;
    const brut = d?.detail ?? d?.["hydra:description"] ?? d?.message;
    if (typeof brut === "string" && brut.trim()) return brut.trim();
    return e.message || defaut;
  }
  return e instanceof Error && e.message ? e.message : defaut;
};

// Référentiels du catalogue (un onglet chacun)
export const refApi = {
  familles: crud("/familles"),
  formes: crud("/formes-pharmaceutiques"),
  voies: crud("/voies-administration"),
  unitesMesure: crud("/unites-mesure"),
  principesActifs: crud("/principe_actifs"), // chemin auto-généré depuis shortName 'PrincipeActif'
  medicaments: crud("/medicaments"),
  presentations: crud("/presentations"),
  conditionnements: crud("/conditionnements"),
};

export const stockApi = {
  sites: async () => (await liste<T.Site>("/sites")).filter((s) => s.isActive),
  niveaux: (siteId?: number) => liste<T.StockLigne>("/stocks", siteId ? { siteId } : {}),
  lots: () =>
    liste<{
      id: number;
      numLot?: string;
      datePeremption?: string;
      quantite?: number;
      fournisseurNom?: string | null;
    }>("/lots"),

  // Ordonnances (prescriptions) et dispensation
  prescriptions: () => liste<T.Prescription>("/ordonnances"),
  dispenser: (id: number, siteId: number) => api.post(`/ordonnances/${id}/dispenser`, { siteId }),
  annulerPrescription: (id: number) => api.post(`/ordonnances/${id}/annuler`, {}),
  dispensations: (params?: Params) => liste<T.Dispensation>("/dispensations", params),
  dispensationsDe: (ordonnanceId: number) =>
    liste<T.Dispensation>("/dispensations", { ordonnanceId }),

  commandes: () => liste<T.Commande>("/commandes"),
  fournisseurs: () => liste<T.Fournisseur>("/fournisseurs"),
  creerFournisseur: (p: T.FournisseurPayload) => api.post<T.Fournisseur>("/fournisseurs", p),
  modifierFournisseur: (id: number, p: T.FournisseurPayload) =>
    api.put<T.Fournisseur>(`/fournisseurs/${id}`, p),
  supprimerFournisseur: (id: number) => api.delete(`/fournisseurs/${id}`),
  creerCommande: (p: T.CommandePayload) => api.post<T.Commande>("/commandes", p),
  envoyerCommande: (id: number) => api.post(`/commandes/${id}/envoyer`, {}),
  annulerCommande: (id: number) => api.post(`/commandes/${id}/annuler`, {}),
  // numLot facultatif : le serveur génère le numéro de lot automatiquement
  recevoirCommande: (
    id: number,
    lignes: {
      detailId: number;
      qte: number;
      unite: T.UniteStock;
      numLot?: string | null;
      datePeremption: string | null;
    }[],
  ) => api.post(`/commandes/${id}/recevoir`, { lignes }),

  mouvements: (params?: Params) => liste<T.Mouvement>("/mouvements", params),

  // Le transfert est créé directement « valide » ; l'annulation passe par DELETE
  transferts: () => liste<T.Transfert>('/transferts'),
creerTransfert: (p: T.TransfertPayload) =>
  api.post('/transferts', {
    siteOrigineId: p.siteOrigineId,
    siteDestinationId: p.siteDestinationId,
    lotId: p.lotId,
    qte: p.quantite,   // nombre de BOÎTES
    unite: 'boite',
  }),
  annulerTransfert: (id: number) => api.delete(`/transferts/${id}`),

   ajustementTypes: () => liste<T.AjustementType>('/ajustement_types'),
  ajustements: (siteId?: number) => liste<T.Ajustement>('/stock_ajustements', siteId ? { siteId } : {}),
creerAjustement: (p: T.AjustementPayload) =>
  api.post('/stock_ajustements', {
    siteId: p.siteId,
    ajustementTypeId: p.typeId,
    raison: p.motif?.trim() || null,
    details: [{ lotId: p.lotId, actuallyQuantity: p.quantiteComptee }],
  }),
  produits: () => liste<T.Produit>('/produits'),
  creerProduit: (p: T.ProduitPayload) => api.post('/produits', p),
  modifierProduit: (id: number, p: T.ProduitPayload) => api.put(`/produits/${id}`, p),
  supprimerProduit: (id: number) => api.delete(`/produits/${id}`),

  // Route réelle : /appro_resources (ou ajoutez shortName: 'Appro' en PHP pour obtenir /appros)
  appros: () => liste<Appro>("/appro_resources"),
  creerAppro: (p: ApproPayload) => api.post<Appro>("/appro_resources", p),
  supprimerAppro: (id: number) => api.delete(`/appro_resources/${id}`),
};

/* ---- Approvisionnements ---- */
export interface ApproDetailPayload {
  produitId: number;
  /** Ignoré par le serveur : le numéro de lot est généré automatiquement. */
  numLot?: string | null;
  datePeremption: string | null;
  qte: number;
  unite: T.UniteStock;
  prix: number | null;
}

export interface ApproPayload {
  numFac: string | null;
  commandeId: number | null;
  fournisseurId: number;
  siteId: number;
  details: ApproDetailPayload[];
}

export interface ApproDetail {
  id: number;
  lotId: number;
  numLot?: string | null;
  datePeremption?: string | null;
  produitNom?: string | null;
  qte: number;
  prix: number | null;
}

export interface Appro {
  id: number;
  numFac: string | null;
  dateAppro: string | null;
  commandeId: number | null;
  commandeNum: string | null;
  fournisseurId: number | null;
  fournisseurNom: string | null;
  details: ApproDetail[];
}
