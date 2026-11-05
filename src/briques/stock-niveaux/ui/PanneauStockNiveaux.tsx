/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Package,
  PackageX,
  Pill,
  History,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { stockApi } from "@/briques/stock-commun/api";
import { useListe } from "@/briques/stock-commun/useListe";
import { echapper, imprimerDocument } from "@/briques/stock-commun/ui";
import { useStockNiveaux } from "../hooks/useStockNiveaux";
import type { LigneNiveauStock, SiteStock } from "../modele/stock-niveaux.types";

export interface PanneauStockNiveauxProps {
  mode?: ModeAffichage;
  siteIdActif?: number | null;
  siteActifId?: number | null;
}

type Statut = "rupture" | "critique" | string;

/** Nombre de jours avant péremption à partir duquel on alerte (orange). */
const SEUIL_PEREMPTION_JOURS = 90;

/**
 * État de stock à une date PASSÉE : le serveur renvoie l'instantané enregistré
 * en fin de journée (voir useStockNiveaux : second paramètre « date »).
 * Mettre à false pour désactiver la consultation et l'impression des dates passées
 * tant que le backend n'est pas prêt : on n'imprime jamais le stock actuel sous
 * une fausse date.
 */
const HISTORIQUE_DISPONIBLE = true;

/** Délai (en jours) au-delà duquel un nouvel inventaire est demandé. */
const INTERVALLE_INVENTAIRE_JOURS = 30;

/**
 * Champs ajoutés par le backend à la réponse des niveaux de stock.
 * Optionnels : tant qu'ils sont absents, l'affichage retombe sur « n comprimés ».
 */
type StockEnrichi = LigneNiveauStock & {
  formeLibelle?: string | null;
  medicamentLibelle?: string | null;
  unitesParBoite?: number | null;
  comprimesParPlaquette?: number | null;
  plaquettesParBoite?: number | null;
  lotId?: number | null;
  numLot?: string | null;
  datePeremption?: string | null;
};

interface Conditionnement {
  /** Unités de base par boîte (Produit.getUnitesParConditionnement). */
  unitesParBoite?: number | null;
  /** Niveau plaquette, optionnel (si le backend le fournit un jour). */
  comprimesParPlaquette?: number | null;
  plaquettesParBoite?: number | null;
}

interface SiteLigne {
  id: string | number;
  site: string;
  quantite: number;
  statut: Statut;
}

interface LotLigne {
  cle: string;
  numLot: string | null;
  datePeremption: string | null;
  quantite: number;
}

interface LigneProduit {
  produit: string;
  medicament?: string | null;
  forme?: string | null;
  conditionnement: Conditionnement;
  total: number;
  statut: Statut;
  sites: SiteLigne[];
  lots: LotLigne[];
}

const rang = (s: Statut) => (s === "rupture" ? 2 : s === "critique" ? 1 : 0);

/** Médicament à afficher sous le produit : seulement s'il diffère du nom du produit. */
const medicamentAffiche = (l: { produit: string; medicament?: string | null }): string | null => {
  const m = (l.medicament ?? "").trim();
  return m && m.toLowerCase() !== l.produit.trim().toLowerCase() ? m : null;
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Mot décrivant l'unité de base selon la forme. */
const motUnite = (forme?: string | null) => {
  const f = (forme ?? "").toLowerCase();
  return f.includes("gélule") || f.includes("gelule") ? "gélule" : "comprimé";
};

/** Nombre d'unités par boîte : valeur directe, sinon plaquettes × comprimés. */
const unitesParBoite = (c?: Conditionnement | null): number =>
  c?.unitesParBoite || (c?.comprimesParPlaquette ?? 0) * (c?.plaquettesParBoite ?? 0) || 0;

/** Quantité de base (comprimés) → texte lisible selon la forme et le conditionnement. */
const formaterQuantite = (q: number, forme?: string | null, c?: Conditionnement | null): string => {
  const f = (forme ?? "").toLowerCase();
  if (f.includes("sirop")) return pluriel(q, "flacon");
  if (f.includes("inject")) return pluriel(q, "ampoule");

  const mot = motUnite(forme);
  const parPlaquette = c?.comprimesParPlaquette ?? 0;
  const parBoite = unitesParBoite(c);
  if (parBoite <= 1 && !parPlaquette) return pluriel(q, mot);

  let reste = q;
  const parts: string[] = [];

  if (parBoite > 1) {
    const b = Math.floor(reste / parBoite);
    if (b) parts.push(pluriel(b, "boîte"));
    reste -= b * parBoite;
  }
  if (parPlaquette) {
    const p = Math.floor(reste / parPlaquette);
    if (p) parts.push(pluriel(p, "plaquette"));
    reste -= p * parPlaquette;
  }
  if (reste) parts.push(pluriel(reste, mot));

  return parts.length ? parts.join(" + ") : `0 ${mot}`;
};

/** Détail du conditionnement, ex. « 20 comprimés/boîte ». */
const detailConditionnement = (
  forme?: string | null,
  c?: Conditionnement | null,
): string | null => {
  const f = (forme ?? "").toLowerCase();
  if (f.includes("sirop")) return "1 flacon = unité de stock";
  if (f.includes("inject")) return "1 ampoule = unité de stock";

  const mot = motUnite(forme);
  const parPlaquette = c?.comprimesParPlaquette ?? 0;
  const plaquettesParBoite = c?.plaquettesParBoite ?? 0;
  const parBoite = unitesParBoite(c);

  const parts: string[] = [];
  if (parPlaquette) parts.push(`${pluriel(parPlaquette, mot)}/plaquette`);
  if (parPlaquette && plaquettesParBoite) {
    parts.push(`${pluriel(plaquettesParBoite, "plaquette")}/boîte`);
  }
  if (parBoite > 1) parts.push(`${pluriel(parBoite, mot)}/boîte`);

  return parts.length ? parts.join(" · ") : null;
};

/* ------------------------------ Péremption ------------------------------ */

/** « 2026-11-08 » → Date locale (évite le décalage de fuseau horaire). */
const parserDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formaterDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Nombre de jours entre la date de référence et la date (négatif si dépassée).
 * Référence = aujourd'hui, ou la date de l'état consulté pour une situation passée.
 */
const joursAvant = (d: Date, ref?: Date | null) => {
  const r = ref ? new Date(ref) : new Date();
  r.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - r.getTime()) / 86_400_000);
};

type NiveauPeremption = "expire" | "bientot" | "ok";

/* Charte : erreur #b42318 ; alerte ambre #fff4e0 / #8a5300 ; neutre = bordures / texte secondaire. */
const STYLE_PEREMPTION: Record<NiveauPeremption, { badge: string; texte: string }> = {
  expire: {
    badge: "border-[#b42318]/30 bg-[#b42318]/10 text-[#b42318]",
    texte: "text-[#b42318]",
  },
  bientot: {
    badge: "border-[#8a5300]/25 bg-[#fff4e0] text-[#8a5300]",
    texte: "text-[#8a5300]",
  },
  ok: {
    badge: "border-[#e5e7eb] bg-[#f6f8f7] text-[#5b6472]",
    texte: "text-[#5b6472]",
  },
};

const libelleRelatif = (jours: number): string => {
  if (jours < 0) return `Périmé depuis ${-jours} j`;
  if (jours === 0) return "Expire aujourd'hui";
  if (jours <= SEUIL_PEREMPTION_JOURS) return `Dans ${jours} j`;
  return `Dans ${Math.round(jours / 30)} mois`;
};

const niveauDe = (jours: number): NiveauPeremption =>
  jours < 0 ? "expire" : jours <= SEUIL_PEREMPTION_JOURS ? "bientot" : "ok";

const LIBELLE_NIVEAU: Record<NiveauPeremption, string> = {
  expire: "Périmé",
  bientot: "À surveiller",
  ok: "Valide",
};

/** Lot en stock dont la péremption est la plus proche. */
const prochainePeremption = (lots: LotLigne[], ref?: Date | null) => {
  const candidats = lots
    .filter((l) => l.quantite > 0)
    .map((l) => ({ lot: l, date: parserDate(l.datePeremption) }))
    .filter((x): x is { lot: LotLigne; date: Date } => x.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (candidats.length === 0) return null;

  const { lot, date } = candidats[0];
  const jours = joursAvant(date, ref);
  const niveau = niveauDe(jours);

  return {
    lot,
    date,
    jours,
    niveau,
    nbLots: lots.filter((l) => l.quantite > 0).length,
  };
};

/* ------------------------------ État à une date ------------------------------ */

/** Date du jour au format AAAA-MM-JJ (heure locale). */
const aujourdhuiISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** « actuel » = stock du jour ; « passe » = état enregistré à une date antérieure. */
type ModeEtat = "actuel" | "passe";

/* ------------------------- Filtre par date de péremption ------------------------- */

type PeriodePeremption = "tout" | "expire" | "30" | "90";

const COULEUR_PERIME = "#b42318";
const COULEUR_A_SURVEILLER = "#e8a317";

const PERIODES_PEREMPTION: { valeur: PeriodePeremption; libelle: string; couleur?: string }[] = [
  { valeur: "tout", libelle: "Toutes" },
  { valeur: "expire", libelle: "Périmés", couleur: COULEUR_PERIME },
  { valeur: "30", libelle: "Sous 30 jours", couleur: COULEUR_A_SURVEILLER },
  { valeur: "90", libelle: "Sous 90 jours", couleur: COULEUR_A_SURVEILLER },
];

/**
 * Un lot en stock correspond-il au filtre ?
 * Les dates personnalisées (Du / Au) et la période rapide se cumulent.
 * `ref` = date de référence (état passé) ; absente = aujourd'hui.
 */
const lotDansPlage = (
  lot: LotLigne,
  periode: PeriodePeremption,
  debut: string,
  fin: string,
  ref?: Date | null,
): boolean => {
  if (lot.quantite <= 0) return false;
  const d = parserDate(lot.datePeremption);
  if (!d) return false;

  const jours = joursAvant(d, ref);
  if (periode === "expire" && jours >= 0) return false;
  if (periode === "30" && (jours < 0 || jours > 30)) return false;
  if (periode === "90" && (jours < 0 || jours > 90)) return false;

  const dDebut = parserDate(debut);
  const dFin = parserDate(fin);
  if (dDebut && d.getTime() < dDebut.getTime()) return false;
  if (dFin && d.getTime() > dFin.getTime()) return false;
  return true;
};

/** Texte décrivant le filtre actif (impression). */
const decrireFiltrePeremption = (periode: PeriodePeremption, debut: string, fin: string): string => {
  const parts: string[] = [];
  if (periode === "expire") parts.push("Périmés");
  if (periode === "30") parts.push("Péremption sous 30 jours");
  if (periode === "90") parts.push("Péremption sous 90 jours");
  const dDebut = parserDate(debut);
  const dFin = parserDate(fin);
  if (dDebut && dFin) parts.push(`du ${formaterDate(dDebut)} au ${formaterDate(dFin)}`);
  else if (dDebut) parts.push(`à partir du ${formaterDate(dDebut)}`);
  else if (dFin) parts.push(`jusqu'au ${formaterDate(dFin)}`);
  return parts.join(", ");
};

/** Pastilles de filtre à choix unique (charte). */
function Pastilles<T extends string>({
  label,
  options,
  valeur,
  onChange,
}: {
  label: string;
  options: { valeur: T; libelle: string; couleur?: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-[#5b6472]">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-2">
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={o.valeur}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => onChange(o.valeur)}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border px-[14px] py-1.5 text-[13px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] md:min-h-[32px] ${
                actif
                  ? "border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]"
                  : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
              }`}
            >
              {o.couleur && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: o.couleur }}
                  aria-hidden="true"
                />
              )}
              {o.libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CHAMP_DATE =
  "h-12 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] transition focus:border-[#1f9d55] focus:outline-hidden focus:ring-3 focus:ring-[#1f9d55]/25 md:h-10";

/* ------------------------------------------------------------------------ */

/** Nom d'un site, avec repli si le champ libelle est absent ou vide. */
const nomSite = (s: SiteStock & { nom?: string }) => s.libelle || s.nom || `Site #${s.id}`;

/* Le sens est toujours porté par un texte (libellé) en plus de la couleur. */
const STYLE_STATUT = {
  rupture: {
    badge: "border-[#b42318]/30 bg-[#b42318]/10 text-[#b42318]",
    point: "bg-[#b42318]",
    chiffre: "text-[#b42318]",
    pastille: "border-[#b42318]/30 bg-[#b42318]/10 text-[#b42318]",
    libelle: "Rupture",
  },
  critique: {
    badge: "border-[#8a5300]/25 bg-[#fff4e0] text-[#8a5300]",
    point: "bg-[#8a5300]",
    chiffre: "text-[#8a5300]",
    pastille: "border-[#8a5300]/25 bg-[#fff4e0] text-[#8a5300]",
    libelle: "Critique",
  },
  ok: {
    badge: "border-[#1f9d55]/30 bg-[#e7f6ed] text-[#14703c]",
    point: "bg-[#1f9d55]",
    chiffre: "text-[#1f2937]",
    pastille: "border-[#e5e7eb] bg-[#f6f8f7] text-[#5b6472]",
    libelle: "Disponible",
  },
} as const;

const styleDe = (s: Statut) =>
  s === "rupture" ? STYLE_STATUT.rupture : s === "critique" ? STYLE_STATUT.critique : STYLE_STATUT.ok;

/* ------------------------------ Fiche détail ------------------------------ */

const uniteStock = (forme?: string | null) => {
  const f = (forme ?? "").toLowerCase();
  if (f.includes("sirop")) return "flacon";
  if (f.includes("inject")) return "ampoule";
  return motUnite(forme);
};

const Rubrique: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <section className="space-y-2">
    <h3 className="text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">{titre}</h3>
    {children}
  </section>
);

const Info: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-xs font-bold text-[#5b6472]">{label}</dt>
    <dd className="mt-0.5 text-sm text-[#1f2937]">{children}</dd>
  </div>
);

const DetailProduit: React.FC<{
  ligne: LigneProduit;
  dateRef?: Date | null;
  onFermer: () => void;
}> = ({ ligne, dateRef, onFermer }) => {
  const boutonFermer = useRef<HTMLButtonElement>(null);
  const st = styleDe(ligne.statut);

  useEffect(() => {
    boutonFermer.current?.focus();
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFermer]);

  const conditionnement = detailConditionnement(ligne.forme, ligne.conditionnement);

  // Lots en stock, du plus proche de la péremption au plus lointain
  const lots = ligne.lots
    .filter((l) => l.quantite > 0)
    .map((l) => ({ ...l, date: parserDate(l.datePeremption) }))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f1b3d]/45 md:items-stretch md:justify-end"
      onClick={onFermer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-produit-titre"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-white shadow-xl md:h-full md:max-h-none md:w-[560px] md:rounded-none"
      >
        {/* Poignée (mobile) */}
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#e5e7eb] md:hidden"
          aria-hidden="true"
        />

        {/* En-tête */}
        <div className="flex items-start gap-3 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e7f6ed] text-[#14703c]">
            <Pill className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="detail-produit-titre"
              className="text-[19px] font-bold leading-tight text-[#1f2937]"
            >
              {ligne.produit}
            </h2>
            <p className="mt-0.5 text-[13px] text-[#5b6472]">
              {[medicamentAffiche(ligne), ligne.forme || "Forme non renseignée"]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            ref={boutonFermer}
            type="button"
            onClick={onFermer}
            aria-label="Fermer la fiche"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-[#5b6472] transition hover:bg-[#f0f2f1] hover:text-[#1f2937] focus-visible:outline-2 focus-visible:outline-[#1f9d55] md:h-10 md:w-10"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Contenu */}
        <div className="min-h-0 flex-1 space-y-6 overflow-auto px-5 py-5">
          {/* Résumé du stock */}
          <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#e5e7eb] p-4">
            <div>
              <span className="block text-xs font-bold text-[#5b6472]">Stock total</span>
              <span
                className={`block text-[22px] font-bold leading-tight tabular-nums ${st.chiffre}`}
              >
                {ligne.total.toLocaleString("fr-FR")}
              </span>
              <span className="block text-xs text-[#5b6472]">
                {formaterQuantite(ligne.total, ligne.forme, ligne.conditionnement)}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${st.point}`} aria-hidden="true" />
              {st.libelle}
            </span>
          </div>

          {/* Fiche médicament */}
          <Rubrique titre="Médicament">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[14px] border border-[#e5e7eb] p-4">
              <Info label="Produit">{ligne.produit}</Info>
              <Info label="Médicament">
                {ligne.medicament || <span className="italic text-[#5b6472]">Non renseigné</span>}
              </Info>
              <Info label="Forme">{ligne.forme || "—"}</Info>
              <Info label="Unité de stock">{uniteStock(ligne.forme)}</Info>
              <Info label="Conditionnement">
                {conditionnement ?? <span className="italic text-[#5b6472]">Non renseigné</span>}
              </Info>
            </dl>
          </Rubrique>

          {/* Répartition par dépôt */}
          <Rubrique titre={`Répartition par dépôt (${ligne.sites.length})`}>
            <ul className="divide-y divide-[#f0f2f1] overflow-hidden rounded-[14px] border border-[#e5e7eb]">
              {ligne.sites.map((s) => {
                const ss = styleDe(s.statut);
                return (
                  <li key={s.id} className="flex min-h-[44px] items-center gap-3 px-4 py-2.5">
                    <Building2 className="h-4 w-4 shrink-0 text-[#5b6472]" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-medium text-[#1f2937]">
                      {s.site}
                    </span>
                    <span className="text-right">
                      <span className="block font-bold tabular-nums text-[#1f2937]">
                        {s.quantite.toLocaleString("fr-FR")}
                      </span>
                      <span className="block text-xs text-[#5b6472]">
                        {formaterQuantite(s.quantite, ligne.forme, ligne.conditionnement)}
                      </span>
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${ss.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${ss.point}`} aria-hidden="true" />
                      {ss.libelle}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Rubrique>

          {/* Lots et péremption */}
          <Rubrique titre={`Lots en stock (${lots.length})`}>
            {lots.length === 0 ? (
              <p className="rounded-[14px] border border-[#e5e7eb] bg-[#fafbfa] p-4 text-xs text-[#5b6472]">
                Aucun lot renseigné pour ce produit.
              </p>
            ) : (
              <ul className="divide-y divide-[#f0f2f1] overflow-hidden rounded-[14px] border border-[#e5e7eb]">
                {lots.map((lot) => {
                  const jours = lot.date ? joursAvant(lot.date, dateRef) : null;
                  const niveau = jours === null ? null : niveauDe(jours);
                  const sp = niveau ? STYLE_PEREMPTION[niveau] : null;
                  return (
                    <li
                      key={lot.cle}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3"
                    >
                      <span className="rounded-md bg-[#e7f6ed] px-[7px] py-[3px] font-mono text-xs font-bold text-[#14703c]">
                        {lot.numLot ?? "Sans n° de lot"}
                      </span>
                      <span className="flex-1 text-xs text-[#5b6472]">
                        {formaterQuantite(lot.quantite, ligne.forme, ligne.conditionnement)}
                      </span>
                      {lot.date && jours !== null && niveau && sp ? (
                        <span className="text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${sp.badge}`}
                          >
                            <CalendarClock className="h-3 w-3" aria-hidden="true" />
                            {formaterDate(lot.date)} · {LIBELLE_NIVEAU[niveau]}
                          </span>
                          <span className={`mt-0.5 block text-xs font-medium ${sp.texte}`}>
                            {libelleRelatif(jours)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#5b6472]">Péremption non renseignée</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Rubrique>
        </div>

        {/* Pied fixe */}
        <div className="flex justify-end border-t border-[#e5e7eb] px-5 py-3">
          <button
            type="button"
            onClick={onFermer}
            className="inline-flex h-12 cursor-pointer items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] md:h-10"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------ Panneau ------------------------------ */

export const PanneauStockNiveaux: React.FC<PanneauStockNiveauxProps> = ({
  mode = "lecture",
  siteIdActif,
  siteActifId,
}) => {
  const siteInitial = siteIdActif ?? siteActifId;
  const [siteSelectionne, setSiteSelectionne] = useState<string>(
    siteInitial ? String(siteInitial) : "",
  );
  const [recherche, setRecherche] = useState("");
  const [produitDetail, setProduitDetail] = useState<string | null>(null);
  const fermerDetail = useCallback(() => setProduitDetail(null), []);

  // Filtre par date de péremption
  const [periode, setPeriode] = useState<PeriodePeremption>("tout");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const filtreDateActif = periode !== "tout" || dateDebut !== "" || dateFin !== "";

  const reinitialiserDates = () => {
    setPeriode("tout");
    setDateDebut("");
    setDateFin("");
  };

  // État du stock à une date passée (vide = aujourd'hui)
  const [dateEtat, setDateEtat] = useState("");
  const aujourdhui = aujourdhuiISO();
  const modeEtat: ModeEtat = !dateEtat || dateEtat >= aujourdhui ? "actuel" : "passe";
  const etatPasseIndisponible = modeEtat === "passe" && !HISTORIQUE_DISPONIBLE;
  const dateHistorique = HISTORIQUE_DISPONIBLE && modeEtat === "passe" ? dateEtat : undefined;

  // Date de référence pour la péremption relative (null = aujourd'hui)
  const dateRef = useMemo(
    () => (modeEtat === "passe" ? parserDate(dateEtat) : null),
    [modeEtat, dateEtat],
  );

  const { stocks, sites, nbRuptures, nbCritiques, quantiteTotale, chargement, erreur, rafraichir } =
    useStockNiveaux(siteSelectionne ? Number(siteSelectionne) : undefined, dateHistorique);

  // Historique des ajustements : sert à savoir quand le dernier inventaire a eu lieu
  const ajustements = useListe(
    () => stockApi.ajustements(siteSelectionne ? Number(siteSelectionne) : undefined),
    [siteSelectionne],
  );

  const inventaire = useMemo(() => {
    const dates = ajustements.items
      .map((a) => parserDate(a.date))
      .filter((d): d is Date => d !== null);
    if (dates.length === 0) return { du: true, jours: null as number | null };
    const derniere = new Date(Math.max(...dates.map((d) => d.getTime())));
    const jours = -joursAvant(derniere);
    return { du: jours >= INTERVALLE_INVENTAIRE_JOURS, jours };
  }, [ajustements.items]);

  // Une ligne par produit ; les dépôts et les lots sont regroupés dans la ligne
  const lignes = useMemo<LigneProduit[]>(() => {
    const term = recherche.toLowerCase().trim();
    const map = new Map<string, LigneProduit>();

    (stocks as StockEnrichi[]).forEach((s) => {
      if (
        term &&
        !s.produitLibelle.toLowerCase().includes(term) &&
        !(s.medicamentLibelle ?? "").toLowerCase().includes(term) &&
        !s.siteLibelle.toLowerCase().includes(term) &&
        !(s.numLot ?? "").toLowerCase().includes(term)
      ) {
        return;
      }

      const ligne = map.get(s.produitLibelle) ?? {
        produit: s.produitLibelle,
        medicament: s.medicamentLibelle,
        forme: s.formeLibelle,
        conditionnement: {
          unitesParBoite: s.unitesParBoite,
          comprimesParPlaquette: s.comprimesParPlaquette,
          plaquettesParBoite: s.plaquettesParBoite,
        },
        total: 0,
        statut: s.statut,
        sites: [],
        lots: [],
      };

      const quantite = Number(s.quantite) || 0;
      ligne.total += quantite;
      if (rang(s.statut) > rang(ligne.statut)) ligne.statut = s.statut;

      // Fusion des lots d'un même site
      const existant = ligne.sites.find((x) => x.id === s.siteId);
      if (existant) {
        existant.quantite += quantite;
        if (rang(s.statut) > rang(existant.statut)) existant.statut = s.statut;
      } else {
        ligne.sites.push({
          id: s.siteId,
          site: s.siteLibelle,
          quantite,
          statut: s.statut,
        });
      }

      // Fusion des lots identiques (même numéro et même date) entre les sites
      if (s.numLot || s.datePeremption) {
        const cle = `${s.numLot ?? ""}|${s.datePeremption ?? ""}`;
        const lot = ligne.lots.find((x) => x.cle === cle);
        if (lot) {
          lot.quantite += quantite;
        } else {
          ligne.lots.push({
            cle,
            numLot: s.numLot ?? null,
            datePeremption: s.datePeremption ?? null,
            quantite,
          });
        }
      }

      map.set(s.produitLibelle, ligne);
    });

    return (
      Array.from(map.values())
        // Filtre par date : on garde les produits ayant au moins un lot en stock dans la plage
        .filter(
          (l) =>
            !filtreDateActif ||
            l.lots.some((lot) => lotDansPlage(lot, periode, dateDebut, dateFin, dateRef)),
        )
        .sort((a, b) => rang(b.statut) - rang(a.statut) || a.produit.localeCompare(b.produit))
    );
  }, [stocks, recherche, filtreDateActif, periode, dateDebut, dateFin, dateRef]);

  const ligneDetail = produitDetail
    ? (lignes.find((l) => l.produit === produitDetail) ?? null)
    : null;

  if (mode === "masque") {
    return (
      <div className="flex items-center gap-2 rounded-[14px] border border-[#8a5300]/25 bg-[#fff4e0] p-6 text-sm text-[#8a5300]">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous ne disposez pas des autorisations nécessaires pour consulter les niveaux de stocks.
      </div>
    );
  }

  const dEtat = parserDate(dateEtat);
  const libelleEtat = modeEtat === "passe" && dEtat ? `Situation au ${formaterDate(dEtat)}` : "";

  /** Avec un filtre de date actif, la colonne Péremption ne montre que les lots concernés. */
  const lotsPourAffichage = (l: LigneProduit): LotLigne[] =>
    filtreDateActif
      ? l.lots.filter((lot) => lotDansPlage(lot, periode, dateDebut, dateFin, dateRef))
      : l.lots;

  const metriques = [
    {
      label: "Produits",
      valeur: new Set(stocks.map((s) => s.produitLibelle)).size,
      sous: "Références catalogue",
      icone: Boxes,
      chiffre: "text-[#1f2937]",
    },
    {
      label: "Volume",
      valeur: quantiteTotale,
      sous: "Unités en stock",
      icone: Package,
      chiffre: "text-[#1f2937]",
    },
    {
      label: "Critiques",
      valeur: nbCritiques,
      sous: "Sous le seuil d'alerte",
      icone: AlertTriangle,
      chiffre: "text-[#8a5300]",
    },
    {
      label: "Ruptures",
      valeur: nbRuptures,
      sous: "Produits épuisés",
      icone: PackageX,
      chiffre: "text-[#b42318]",
    },
  ];

  /* ---------- Impression de l'état de stock (respecte la recherche, le site et les dates) ---------- */
  const imprimerEtat = () => {
    const siteChoisi = sites.find((s) => String(s.id) === siteSelectionne);
    const nomSiteTitre = siteChoisi ? nomSite(siteChoisi) : "Tous les sites";
    const descriptionFiltre = filtreDateActif
      ? decrireFiltrePeremption(periode, dateDebut, dateFin)
      : "";

    const rows = lignes
      .map((l) => {
        const p = prochainePeremption(lotsPourAffichage(l), dateRef);
        const med = medicamentAffiche(l);
        const libelle =
          l.statut === "rupture" ? "Rupture" : l.statut === "critique" ? "Critique" : "Disponible";
        return `<tr>
  <td><b>${echapper(l.produit)}</b>${med ? `<br>${echapper(med)}` : ""}${l.forme ? `<br>${echapper(l.forme)}` : ""}</td>
  <td>${l.sites.map((s) => `${echapper(s.site)} : ${s.quantite}`).join("<br>")}</td>
  <td>${
    p
      ? `${formaterDate(p.date)}<br>${libelleRelatif(p.jours)}${
          p.lot.numLot ? `<br>${echapper(p.lot.numLot)}` : ""
        }`
      : "—"
  }</td>
  <td class="r"><b>${l.total.toLocaleString("fr-FR")}</b></td>
  <td><b>${libelle}</b></td>
</tr>`;
      })
      .join("");

    const corps = `
<div class="meta">
  <span><b>Site :</b> ${echapper(nomSiteTitre)}</span>
  ${libelleEtat ? `<span><b>État :</b> ${echapper(libelleEtat)}</span>` : ""}
  <span><b>Produits :</b> ${lignes.length}</span>
  <span><b>Ruptures :</b> ${nbRuptures}</span>
  <span><b>Critiques :</b> ${nbCritiques}</span>
  ${descriptionFiltre ? `<span><b>Péremption :</b> ${echapper(descriptionFiltre)}</span>` : ""}
</div>
<table>
  <thead><tr>
    <th>Produit</th><th>Répartition par dépôt</th><th>Prochaine péremption</th>
    <th class="r">Total (unités)</th><th>Statut</th>
  </tr></thead>
  <tbody>${rows || `<tr><td colspan="5">Aucun stock.</td></tr>`}</tbody>
</table>
<p class="note">Quantités en unités de base (comprimés, gélules, flacons, ampoules).</p>
${
  modeEtat === "passe" && dEtat
    ? `<p class="note">Situation reconstituée à partir de l'instantané enregistré en fin de journée du ${echapper(formaterDate(dEtat))}. Les péremptions sont évaluées à cette date.</p>`
    : ""
}
<div class="signatures"><div>Établi par</div><div>Pharmacien responsable</div></div>`;

    imprimerDocument(
      "État de stock",
      libelleEtat ? `${nomSiteTitre} · ${libelleEtat}` : nomSiteTitre,
      corps,
    );
  };

  return (
    <div className="space-y-[14px] text-sm text-[#1f2937]">
      {/* Alerte inventaire mensuel */}
      {!ajustements.chargement && inventaire.du && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-[14px] border border-[#8a5300]/25 bg-[#fff4e0] p-3.5 text-sm font-semibold text-[#8a5300]"
        >
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          <p>
            {inventaire.jours === null
              ? "Aucun inventaire enregistré."
              : `Dernier inventaire il y a ${inventaire.jours} jours.`}{" "}
            Un inventaire mensuel est recommandé : saisissez-le dans l'onglet Ajustements.
          </p>
        </div>
      )}

      {/* Bandeau de stats : une seule ligne blanche */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white lg:grid-cols-4">
        {metriques.map(({ label, valeur, sous, icone: Icone, chiffre }) => (
          <div
            key={label}
            className="flex items-center gap-3 border-[#f0f2f1] p-4 [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+2)]:border-l lg:[&:nth-child(n+3)]:border-t-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f6f8f7] text-[#5b6472]">
              <Icone className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#5b6472]">{label}</span>
              <div className={`text-[22px] font-bold leading-tight tabular-nums ${chiffre}`}>
                {valeur}
              </div>
              <span className="block text-xs text-[#5b6472]">{sous}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]" />
            <input
              type="text"
              aria-label="Rechercher un produit, un médicament, un dépôt ou un lot"
              placeholder="Rechercher un produit, un médicament, un dépôt ou un lot…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="h-12 w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-9 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:border-[#1f9d55] focus:outline-hidden focus:ring-3 focus:ring-[#1f9d55]/25 md:h-10"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] focus-visible:outline-2 focus-visible:outline-[#1f9d55]"
                title="Effacer"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]" />
              <select
                aria-label="Site"
                value={siteSelectionne}
                onChange={(e) => setSiteSelectionne(e.target.value)}
                className="h-12 cursor-pointer rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-3 text-sm font-semibold text-[#1f2937] transition focus:border-[#1f9d55] focus:outline-hidden focus:ring-3 focus:ring-[#1f9d55]/25 md:h-10"
              >
                <option value="">Tous les sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {nomSite(s)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={rafraichir}
              disabled={chargement}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] transition hover:bg-[#fafbfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] disabled:opacity-50 md:h-10 md:w-10"
              title="Rafraîchir"
              aria-label="Rafraîchir"
            >
              <RefreshCw className={`h-4 w-4 ${chargement ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={imprimerEtat}
              disabled={chargement || lignes.length === 0 || etatPasseIndisponible}
              className="flex h-12 cursor-pointer items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] disabled:opacity-50 md:h-10"
              title="Imprimer l'état de stock"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimer l'état
            </button>
          </div>
        </div>

        {/* État du stock à une date passée */}
        <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3 border-t border-[#f0f2f1] pt-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="stock-date-etat" className="text-xs font-bold text-[#5b6472]">
              État du stock au
            </label>
            <input
              id="stock-date-etat"
              type="date"
              value={dateEtat}
              max={aujourdhui}
              onChange={(e) => {
                const v = e.target.value;
                // Une date future (saisie au clavier) est rejetée : pas de prévision.
                setDateEtat(v > aujourdhui ? "" : v);
              }}
              className={CHAMP_DATE}
            />
          </div>

          {dateEtat && (
            <button
              type="button"
              onClick={() => setDateEtat("")}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] md:h-10"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Revenir à aujourd'hui
            </button>
          )}

          <span
            className={`inline-flex items-center gap-1.5 self-end rounded-full border px-2.5 py-0.5 text-xs font-bold ${
              modeEtat === "passe"
                ? "border-[#8a5300]/25 bg-[#fff4e0] text-[#8a5300]"
                : "border-[#1f9d55]/30 bg-[#e7f6ed] text-[#14703c]"
            }`}
          >
            {modeEtat === "passe" ? (
              <History className="h-3 w-3" aria-hidden="true" />
            ) : (
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
            )}
            {modeEtat === "passe" ? "Historique" : "Stock actuel"}
          </span>
        </div>

        {/* Filtre par date de péremption */}
        <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3 border-t border-[#f0f2f1] pt-3">
          <Pastilles
            label="Péremption"
            valeur={periode}
            onChange={(v) => {
              setPeriode(v);
              setDateDebut("");
              setDateFin("");
            }}
            options={PERIODES_PEREMPTION}
          />

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="stock-du" className="text-xs font-bold text-[#5b6472]">
                Péremption du
              </label>
              <input
                id="stock-du"
                type="date"
                value={dateDebut}
                max={dateFin || undefined}
                onChange={(e) => {
                  setDateDebut(e.target.value);
                  setPeriode("tout");
                }}
                className={CHAMP_DATE}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="stock-au" className="text-xs font-bold text-[#5b6472]">
                Au
              </label>
              <input
                id="stock-au"
                type="date"
                value={dateFin}
                min={dateDebut || undefined}
                onChange={(e) => {
                  setDateFin(e.target.value);
                  setPeriode("tout");
                }}
                className={CHAMP_DATE}
              />
            </div>
          </div>

          {filtreDateActif && (
            <button
              type="button"
              onClick={reinitialiserDates}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] md:h-10"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Réinitialiser les dates
            </button>
          )}
        </div>
      </div>

      {erreur && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] border border-[#b42318]/30 bg-[#b42318]/10 p-3.5 text-sm font-semibold text-[#b42318]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      {etatPasseIndisponible && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[14px] border border-[#8a5300]/25 bg-[#fff4e0] p-3.5 text-sm font-semibold text-[#8a5300]"
        >
          <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            L'état du stock à une date passée n'est pas encore disponible : il demande
            l'historique des mouvements côté serveur. Le tableau ci-dessous montre le stock actuel
            et l'impression est désactivée.
          </p>
        </div>
      )}

      {/* Tableau : une ligne par produit (clic = fiche détail) */}
      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">
                {["Produit", "Répartition par dépôt", "Péremption"].map((t) => (
                  <th
                    key={t}
                    scope="col"
                    className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] px-4 py-3"
                  >
                    {t}
                  </th>
                ))}
                {["Total", "Statut"].map((t) => (
                  <th
                    key={t}
                    scope="col"
                    className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] px-4 py-3 text-right"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f1]">
              {chargement && stocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#5b6472]">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#5b6472]" />
                    Chargement des stocks…
                  </td>
                </tr>
              ) : lignes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6f8f7]">
                      <Package className="h-6 w-6 text-[#5b6472]" />
                    </div>
                    <p className="text-sm font-bold text-[#1f2937]">Aucun stock trouvé</p>
                    <p className="text-xs text-[#5b6472]">
                      Modifiez la recherche, le site sélectionné ou la période de péremption.
                    </p>
                    {filtreDateActif && (
                      <button
                        type="button"
                        onClick={reinitialiserDates}
                        className="mt-3 inline-flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55] md:h-10"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Réinitialiser les dates
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                lignes.map((l) => {
                  const st = styleDe(l.statut);
                  const texteTotal = formaterQuantite(l.total, l.forme, l.conditionnement);
                  const detailTexte = detailConditionnement(l.forme, l.conditionnement);
                  const medicament = medicamentAffiche(l);
                  const lotsAffiches = lotsPourAffichage(l);
                  const peremption = prochainePeremption(lotsAffiches, dateRef);
                  const sp = peremption ? STYLE_PEREMPTION[peremption.niveau] : null;
                  const infobulleLots = lotsAffiches
                    .map((lot) => {
                      const d = parserDate(lot.datePeremption);
                      return `${lot.numLot ?? "Sans n° de lot"} : ${formaterQuantite(
                        lot.quantite,
                        l.forme,
                        l.conditionnement,
                      )}${d ? ` (péremption ${formaterDate(d)})` : ""}`;
                    })
                    .join("\n");

                  return (
                    <tr
                      key={l.produit}
                      tabIndex={0}
                      aria-label={`Voir le détail de ${l.produit}`}
                      onClick={() => setProduitDetail(l.produit)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setProduitDetail(l.produit);
                        }
                      }}
                      className="h-[54px] cursor-pointer transition hover:bg-[#fafbfa] focus-visible:bg-[#e7f6ed] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1f9d55]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f6f8f7] text-[#5b6472]">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-[#1f2937]">{l.produit}</span>
                            {medicament && (
                              <span className="flex items-center gap-1 text-xs font-medium text-[#14703c]">
                                <Pill className="h-3 w-3 shrink-0" aria-hidden="true" />
                                {medicament}
                              </span>
                            )}
                            {l.forme && (
                              <span className="block text-xs text-[#5b6472]">{l.forme}</span>
                            )}
                            {detailTexte ? (
                              <span className="mt-0.5 block text-xs text-[#5b6472]">
                                {detailTexte}
                              </span>
                            ) : (
                              <span className="mt-0.5 block text-xs italic text-[#5b6472]">
                                Conditionnement non renseigné
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {l.sites.map((s) => {
                            const texte = formaterQuantite(s.quantite, l.forme, l.conditionnement);
                            return (
                              <span
                                key={s.id}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${styleDe(s.statut).pastille}`}
                                title={`${s.site} : ${texte}`}
                              >
                                <span className="max-w-32 truncate font-medium">{s.site}</span>
                                <span className="font-bold">{texte}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {peremption && sp ? (
                          <div title={infobulleLots}>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${sp.badge}`}
                            >
                              <CalendarClock className="h-3 w-3" />
                              {formaterDate(peremption.date)}
                            </span>
                            <span className={`mt-0.5 block text-xs font-medium ${sp.texte}`}>
                              {libelleRelatif(peremption.jours)}
                            </span>
                            {peremption.lot.numLot && (
                              <span className="block font-mono text-xs font-bold text-[#5b6472]">
                                {peremption.lot.numLot}
                              </span>
                            )}
                            {peremption.nbLots > 1 && (
                              <span className="block text-xs text-[#5b6472]">
                                + {peremption.nbLots - 1} autre{peremption.nbLots > 2 ? "s" : ""}{" "}
                                lot{peremption.nbLots > 2 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#5b6472]">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className={`block text-base font-bold tabular-nums ${st.chiffre}`}>
                          {l.total}
                        </span>
                        <span className="block text-xs text-[#5b6472]">{texteTotal}</span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${st.point}`} />
                          {st.libelle}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {lignes.length > 0 && (
          <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-xs text-[#5b6472]">
            <strong className="font-bold text-[#1f2937]">{lignes.length}</strong> produit
            {lignes.length > 1 ? "s" : ""} affiché{lignes.length > 1 ? "s" : ""}
            {filtreDateActif && " · filtrés par date de péremption"} · cliquez sur une ligne pour
            ouvrir la fiche détail
          </div>
        )}
      </div>

      {/* Fiche détail du produit */}
      {ligneDetail && (
        <DetailProduit ligne={ligneDetail} dateRef={dateRef} onFermer={fermerDetail} />
      )}
    </div>
  );
};