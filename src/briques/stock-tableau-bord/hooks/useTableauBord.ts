// briques/stock-tableau-bord/hooks/useTableauBord.ts
import { useMemo } from "react";
import { stockApi } from "@/briques/stock-commun/api";
import { useListe } from "@/briques/stock-commun/useListe";
import type { Prescription } from "@/briques/stock-commun/types";
import { useStockNiveaux } from "@/briques/stock-niveaux/hooks/useStockNiveaux";
import type { LigneNiveauStock } from "@/briques/stock-niveaux/modele/stock-niveaux.types";

/* -------------------------------------------------------------------------- */
/*  Constantes                                                                 */
/* -------------------------------------------------------------------------- */

/** Nombre de jours avant péremption à partir duquel on alerte. */
export const SEUIL_PEREMPTION_JOURS = 90;
/** Délai (en jours) au-delà duquel un nouvel inventaire est demandé. */
export const INTERVALLE_INVENTAIRE_JOURS = 30;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type StockEnrichi = LigneNiveauStock & {
  formeLibelle?: string | null;
  numLot?: string | null;
  datePeremption?: string | null;
};

export type NiveauPeremption = "expire" | "bientot" | "ok";

export interface ProduitATraiter {
  produit: string;
  total: number;
  statut: "rupture" | "critique";
  sites: string[];
}

export interface LotAEcouler {
  cle: string;
  produit: string;
  numLot: string | null;
  site: string;
  quantite: number;
  date: Date;
  jours: number;
  niveau: NiveauPeremption;
}

export interface VolumeSite {
  id: string | number;
  site: string;
  quantite: number;
}

export interface TrancheLots {
  cle: string;
  libelle: string;
  nombre: number;
  ton: "rouge" | "ambre" | "vert" | "gris";
}

export interface MoisAjustements {
  cle: string;
  libelle: string;
  entrees: number;
  sorties: number;
  conformes: number;
}

export interface Evenement {
  cle: string;
  type: "dispensation" | "transfert" | "ajustement";
  titre: string;
  detail: string;
  date: Date;
}

/* -------------------------------------------------------------------------- */
/*  Utilitaires de date                                                        */
/* -------------------------------------------------------------------------- */

/** « 2026-11-08 » → Date locale (évite le décalage de fuseau horaire). */
export const parserDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

export const formaterDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Nombre de jours entre aujourd'hui et la date (négatif si dépassée). */
export const joursAvant = (d: Date) => {
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - auj.getTime()) / 86_400_000);
};

export const niveauDe = (jours: number): NiveauPeremption =>
  jours < 0 ? "expire" : jours <= SEUIL_PEREMPTION_JOURS ? "bientot" : "ok";

export const libelleRelatif = (jours: number): string => {
  if (jours < 0) return `Périmé depuis ${-jours} j`;
  if (jours === 0) return "Expire aujourd'hui";
  if (jours <= SEUIL_PEREMPTION_JOURS) return `Dans ${jours} j`;
  return `Dans ${Math.round(jours / 30)} mois`;
};

const rang = (s: string) => (s === "rupture" ? 2 : s === "critique" ? 1 : 0);

const LIMITE_LISTES = 8;

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useTableauBord(siteId?: number) {
  const niveaux = useStockNiveaux(siteId);
  const ajustements = useListe(() => stockApi.ajustements(siteId), [siteId]);
  const prescriptions = useListe<Prescription>(stockApi.prescriptions);
  const transferts = useListe(stockApi.transferts);

  const stocks = niveaux.stocks as StockEnrichi[];

  /* ---------- Produits : statut consolidé, à traiter, répartition ---------- */
  const produits = useMemo(() => {
    const map = new Map<
      string,
      { produit: string; total: number; statut: string; sites: Set<string> }
    >();
    stocks.forEach((s) => {
      const ligne = map.get(s.produitLibelle) ?? {
        produit: s.produitLibelle,
        total: 0,
        statut: s.statut,
        sites: new Set<string>(),
      };
      ligne.total += Number(s.quantite) || 0;
      if (rang(s.statut) > rang(ligne.statut)) ligne.statut = s.statut;
      if (s.statut === "rupture" || s.statut === "critique") ligne.sites.add(s.siteLibelle);
      map.set(s.produitLibelle, ligne);
    });
    return Array.from(map.values());
  }, [stocks]);

  const repartitionStatuts = useMemo(() => {
    const r = { rupture: 0, critique: 0, disponible: 0 };
    produits.forEach((p) => {
      if (p.statut === "rupture") r.rupture += 1;
      else if (p.statut === "critique") r.critique += 1;
      else r.disponible += 1;
    });
    return r;
  }, [produits]);

  const aTraiter = useMemo<ProduitATraiter[]>(
    () =>
      produits
        .filter((p) => p.statut === "rupture" || p.statut === "critique")
        .sort((a, b) => rang(b.statut) - rang(a.statut) || a.total - b.total)
        .slice(0, LIMITE_LISTES)
        .map((p) => ({
          produit: p.produit,
          total: p.total,
          statut: p.statut as "rupture" | "critique",
          sites: Array.from(p.sites),
        })),
    [produits],
  );

  /* ---------- Volume par site ---------- */
  const volumeParSite = useMemo<VolumeSite[]>(() => {
    const map = new Map<string | number, VolumeSite>();
    stocks.forEach((s) => {
      const existant = map.get(s.siteId) ?? { id: s.siteId, site: s.siteLibelle, quantite: 0 };
      existant.quantite += Number(s.quantite) || 0;
      map.set(s.siteId, existant);
    });
    return Array.from(map.values()).sort((a, b) => b.quantite - a.quantite);
  }, [stocks]);

  /* ---------- Lots et péremption ---------- */
  const lots = useMemo<LotAEcouler[]>(() => {
    const res: LotAEcouler[] = [];
    stocks.forEach((s) => {
      const quantite = Number(s.quantite) || 0;
      const date = parserDate(s.datePeremption);
      if (quantite <= 0 || !date) return;
      const jours = joursAvant(date);
      res.push({
        cle: `${s.produitLibelle}|${s.siteId}|${s.numLot ?? ""}|${s.datePeremption}`,
        produit: s.produitLibelle,
        numLot: s.numLot ?? null,
        site: s.siteLibelle,
        quantite,
        date,
        jours,
        niveau: niveauDe(jours),
      });
    });
    return res.sort((a, b) => a.jours - b.jours);
  }, [stocks]);

  const nbPerimes = useMemo(() => lots.filter((l) => l.jours < 0).length, [lots]);
  const nbBientot = useMemo(
    () => lots.filter((l) => l.jours >= 0 && l.jours <= SEUIL_PEREMPTION_JOURS).length,
    [lots],
  );

  const aEcouler = useMemo(
    () => lots.filter((l) => l.jours <= SEUIL_PEREMPTION_JOURS).slice(0, LIMITE_LISTES),
    [lots],
  );

  const tranchesLots = useMemo<TrancheLots[]>(() => {
    const t = { perimes: 0, j30: 0, j90: 0, j180: 0, plus: 0 };
    lots.forEach((l) => {
      if (l.jours < 0) t.perimes += 1;
      else if (l.jours <= 30) t.j30 += 1;
      else if (l.jours <= 90) t.j90 += 1;
      else if (l.jours <= 180) t.j180 += 1;
      else t.plus += 1;
    });
    return [
      { cle: "perimes", libelle: "Périmés", nombre: t.perimes, ton: "rouge" },
      { cle: "j30", libelle: "0 à 30 j", nombre: t.j30, ton: "rouge" },
      { cle: "j90", libelle: "31 à 90 j", nombre: t.j90, ton: "ambre" },
      { cle: "j180", libelle: "91 à 180 j", nombre: t.j180, ton: "vert" },
      { cle: "plus", libelle: "Plus de 180 j", nombre: t.plus, ton: "vert" },
    ];
  }, [lots]);

  /* ---------- Inventaire ---------- */
  const inventaire = useMemo(() => {
    const dates = ajustements.items
      .map((a) => parserDate(a.date))
      .filter((d): d is Date => d !== null);
    if (dates.length === 0) return { du: true, jours: null as number | null };
    const derniere = new Date(Math.max(...dates.map((d) => d.getTime())));
    const jours = -joursAvant(derniere);
    return { du: jours >= INTERVALLE_INVENTAIRE_JOURS, jours };
  }, [ajustements.items]);

  /* ---------- Ajustements par mois (6 derniers mois) ---------- */
  const ajustementsParMois = useMemo<MoisAjustements[]>(() => {
    const maintenant = new Date();
    const mois: MoisAjustements[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      mois.push({
        cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        libelle: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
        entrees: 0,
        sorties: 0,
        conformes: 0,
      });
    }
    ajustements.items.forEach((a) => {
      const d = parserDate(a.date);
      if (!d) return;
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = mois.find((x) => x.cle === cle);
      if (!m) return;
      if (a.ecart > 0) m.entrees += 1;
      else if (a.ecart < 0) m.sorties += 1;
      else m.conformes += 1;
    });
    return mois;
  }, [ajustements.items]);

  /* ---------- Prescriptions et transferts ---------- */
  const compteursPrescriptions = useMemo(() => {
    const c = { en_attente: 0, dispensee: 0, annulee: 0 };
    prescriptions.items.forEach((p) => {
      if (p.statut === "en_attente") c.en_attente += 1;
      else if (p.statut === "dispensee") c.dispensee += 1;
      else if (p.statut === "annulee") c.annulee += 1;
    });
    return c;
  }, [prescriptions.items]);

  const compteursTransferts = useMemo(() => {
    const c = { en_attente: 0, valide: 0, annule: 0 };
    transferts.items.forEach((t) => {
      if (t.statut === "en_attente") c.en_attente += 1;
      else if (t.statut === "valide") c.valide += 1;
      else if (t.statut === "annule") c.annule += 1;
    });
    return c;
  }, [transferts.items]);

  /* ---------- Activité récente (dispensations + transferts + ajustements) ---------- */
  const activite = useMemo<Evenement[]>(() => {
    const evenements: Evenement[] = [];

    prescriptions.items.forEach((p) => {
      const d = parserDate(p.datePrescription);
      if (!d) return;
      const statut =
        p.statut === "dispensee" ? "dispensée" : p.statut === "annulee" ? "annulée" : "en attente";
      evenements.push({
        cle: `p-${p.id}`,
        type: "dispensation",
        titre: `${p.patientNom ?? ""} ${p.patientPrenom ?? ""}`.trim() || "Prescription",
        detail: `Prescription ${statut} · ${p.details?.length ?? 0} ligne(s)`,
        date: d,
      });
    });

    transferts.items.forEach((t) => {
      const d = parserDate(t.dateTransfert);
      if (!d) return;
      evenements.push({
        cle: `t-${t.id}`,
        type: "transfert",
        titre: t.produitNom ?? "Transfert",
        detail: `${t.siteOrigineNom} → ${t.siteDestinationNom} · ${t.quantite} boîte(s)`,
        date: d,
      });
    });

    ajustements.items.forEach((a) => {
      const d = parserDate(a.date);
      if (!d) return;
      const signe = a.ecart > 0 ? "+" : "";
      evenements.push({
        cle: `a-${a.id}`,
        type: "ajustement",
        titre: a.produitNom ?? "Ajustement",
        detail: `${a.typeLibelle ?? "Ajustement"} · écart ${signe}${a.ecart}`,
        date: d,
      });
    });

    return evenements.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, LIMITE_LISTES);
  }, [prescriptions.items, transferts.items, ajustements.items]);

  const recharger = () => {
    niveaux.rafraichir();
    ajustements.recharger();
    prescriptions.recharger();
    transferts.recharger();
  };

  return {
    // site
    sites: niveaux.sites,
    // stock
    nbRuptures: niveaux.nbRuptures,
    nbCritiques: niveaux.nbCritiques,
    quantiteTotale: niveaux.quantiteTotale,
    nbProduits: produits.length,
    repartitionStatuts,
    aTraiter,
    volumeParSite,
    // péremption
    nbPerimes,
    nbBientot,
    aEcouler,
    tranchesLots,
    // inventaire
    inventaire,
    ajustementsParMois,
    // flux
    compteursPrescriptions,
    compteursTransferts,
    activite,
    // état
    chargement: niveaux.chargement,
    chargementInventaire: ajustements.chargement,
    erreurStock: niveaux.erreur as string | null,
    erreurAjustements: ajustements.erreur as string | null,
    erreurPrescriptions: prescriptions.erreur as string | null,
    erreurTransferts: transferts.erreur as string | null,
    recharger,
  };
}