/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TableauBordStock.tsx - ASINA Médical
 * Tableau de bord moderne de gestion des stocks et de la pharmacie centrale
 * Conforme à la charte ASINA Médical et aux principes de design ergonomiques
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarX2,
  ClipboardCheck,
  Hourglass,
  PackageMinus,
  PackageX,
  Pill,
  RefreshCw,
  Search,
  ChevronRight,
  Filter,
  CheckCircle2,
  Building,
  ArrowUpRight,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Check,
  Plus,
} from "lucide-react";
import {
  formaterDate,
  INTERVALLE_INVENTAIRE_JOURS,
  libelleRelatif,
  SEUIL_PEREMPTION_JOURS,
  useTableauBord,
  type Evenement,
  type NiveauPeremption,
} from "../hooks/useTableauBord";
import { CHARTE, CLASSE_FOCUS } from "../charte";

export interface TableauBordStockProps {
  /** Site du responsable local. Laisser vide pour la vue consolidée multi-sites. */
  siteId?: number;
  /** Affiche le volume par site (utile uniquement en multi-sites). */
  multiSites?: boolean;
  /** Navigation vers un autre écran de l'espace Stock (ex. "niveaux", "transferts"). */
  onNaviguer?: (ecranId: string) => void;
}

type Ton = "rouge" | "ambre" | "vert" | "gris";

const TONS: Record<Ton, { fond: string; texte: string; barre: string; bord: string; badgeFond: string; badgeTexte: string }> = {
  rouge: { fond: "bg-red-50", texte: "text-red-700", barre: "bg-[#b42318]", bord: "border-red-200", badgeFond: "#fef3f2", badgeTexte: "#b42318" },
  ambre: { fond: "bg-amber-50", texte: "text-amber-700", barre: "bg-[#d97706]", bord: "border-amber-200", badgeFond: "#fff4e0", badgeTexte: "#8a5300" },
  vert: { fond: "bg-emerald-50", texte: "text-emerald-700", barre: "bg-[#1f9d55]", bord: "border-emerald-200", badgeFond: "#e7f6ed", badgeTexte: "#14703c" },
  gris: { fond: "bg-slate-50", texte: "text-slate-600", barre: "bg-slate-400", bord: "border-slate-200", badgeFond: "#f1f5f9", badgeTexte: "#475569" },
};

const nombre = (n: number) => n.toLocaleString("fr-FR");

/* ------------------------------ Briques UI Modernes ------------------------------ */

const Carte: React.FC<{
  titre: string;
  aide?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ titre, aide, action, children, className = "" }) => (
  <section
    className={`rounded-[14px] border p-4 md:p-5 transition-all ${className}`}
    style={{
      background: CHARTE.surface,
      borderColor: CHARTE.bordure,
    }}
  >
    <header className="flex items-start justify-between gap-3 border-b pb-3 mb-3.5" style={{ borderColor: CHARTE.separateur }}>
      <div className="min-w-0">
        <h3 className="text-[16px] font-bold md:text-[17px] tracking-tight" style={{ color: CHARTE.encre }}>
          {titre}
        </h3>
        {aide && (
          <p className="text-[12px] mt-0.5" style={{ color: CHARTE.secondaire }}>
            {aide}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    <div>{children}</div>
  </section>
);

const Vide: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center" style={{ color: CHARTE.secondaire }}>
    <PackageMinus className="h-8 w-8 mb-2 opacity-40 text-slate-400" />
    <p className="text-[13px]">{message}</p>
  </div>
);

const KpiCard: React.FC<{
  libelle: string;
  valeur: number;
  detail: string;
  ton: Ton;
  Icone: React.ComponentType<{ className?: string }>;
  chargement: boolean;
  survolTitre?: string;
}> = ({ libelle, valeur, detail, ton, Icone, chargement, survolTitre }) => {
  const estCritique = valeur > 0;
  const config = estCritique ? TONS[ton] : TONS.vert;

  return (
    <div
      title={survolTitre}
      className="group relative flex flex-col justify-between rounded-[14px] border p-4 transition-all hover:border-[#cbd5e1] hover:shadow-xs"
      style={{
        background: CHARTE.surface,
        borderColor: estCritique && (ton === "rouge" || ton === "ambre") ? config.bord : CHARTE.bordure,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold uppercase tracking-[0.05em]" style={{ color: CHARTE.secondaire }}>
          {libelle}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition-transform group-hover:scale-105 shrink-0 ${config.fond} ${config.texte}`}
        >
          <Icone className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <div
          className="font-mono text-[26px] font-bold tracking-tight tabular-nums leading-none"
          style={{ color: estCritique && ton === "rouge" ? "#b42318" : estCritique && ton === "ambre" ? "#8a5300" : CHARTE.encre }}
        >
          {chargement ? (
            <span className="inline-block h-7 w-12 rounded bg-slate-100 animate-pulse" />
          ) : (
            nombre(valeur)
          )}
        </div>
        <div className="mt-1 text-[11px] truncate" style={{ color: CHARTE.secondaire }}>
          {detail}
        </div>
      </div>
    </div>
  );
};

const Pastille: React.FC<{ ton: Ton; children: React.ReactNode }> = ({ ton, children }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border shrink-0"
    style={{
      background: TONS[ton].badgeFond,
      color: TONS[ton].badgeTexte,
      borderColor: TONS[ton].bord,
    }}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${TONS[ton].barre}`} />
    {children}
  </span>
);

const tonPeremption = (n: NiveauPeremption): Ton =>
  n === "expire" ? "rouge" : n === "bientot" ? "ambre" : "vert";

const ICONES_EVENEMENT: Record<Evenement["type"], React.ComponentType<{ className?: string }>> = {
  dispensation: Pill,
  transfert: ArrowRightLeft,
  ajustement: ClipboardCheck,
};

const BarreHorizontale: React.FC<{ libelle: string; valeur: number; max: number; ton: Ton; pourcentage?: number }> = ({
  libelle,
  valeur,
  max,
  ton,
}) => {
  const pct = max > 0 ? Math.min(100, Math.round((valeur / max) * 100)) : 0;

  return (
    <li className="space-y-1.5 list-none">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium truncate pr-2" style={{ color: CHARTE.encre }} title={libelle}>
          {libelle}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="font-mono text-[12px] font-bold tabular-nums rounded-[6px] px-2 py-0.5"
            style={{ background: TONS[ton].badgeFond, color: TONS[ton].badgeTexte }}
          >
            {nombre(valeur)}
          </span>
          <span className="font-mono text-[11px] text-[#5b6472] tabular-nums w-8 text-right">
            {pct}%
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: CHARTE.separateur }}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${TONS[ton].barre}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
};

/* -------------------------------- Écran Principal --------------------------------- */

export const TableauBordStock: React.FC<TableauBordStockProps> = ({
  siteId,
  multiSites = true,
  onNaviguer,
}) => {
  const d = useTableauBord(siteId);

  // Filtre rapide local
  const [rechercheProduit, setRechercheProduit] = useState("");
  const [filtreSelectionne, setFiltreSelectionne] = useState<"tous" | "ruptures" | "critiques">("tous");
  const [modalAjustement, setModalAjustement] = useState(false);
  const [notificationAction, setNotificationAction] = useState<string | null>(null);

  const erreurs = [d.erreurStock, d.erreurAjustements, d.erreurPrescriptions, d.erreurTransferts].filter(
    (e): e is string => Boolean(e)
  );

  const totalProduits = d.nbProduits || 1;
  const maxVolume = Math.max(0, ...d.volumeParSite.map((v) => v.quantite));
  const maxTranche = Math.max(0, ...d.tranchesLots.map((t) => t.nombre));
  const maxMois = Math.max(1, ...d.ajustementsParMois.flatMap((m) => [m.entrees, m.sorties, m.conformes]));

  // Filtrage des produits à traiter
  const produitsFiltres = d.aTraiter.filter((p) => {
    if (filtreSelectionne === "ruptures" && p.statut !== "rupture") return false;
    if (filtreSelectionne === "critiques" && p.statut !== "critique") return false;
    if (rechercheProduit.trim()) {
      return p.produit.toLowerCase().includes(rechercheProduit.toLowerCase());
    }
    return true;
  });

  const lienVers = (id: string, texte: string) =>
    onNaviguer ? (
      <button
        type="button"
        onClick={() => onNaviguer(id)}
        className={`inline-flex items-center gap-1 text-[12px] font-bold text-[#14703c] hover:underline cursor-pointer ${CLASSE_FOCUS}`}
      >
        <span>{texte}</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    ) : null;

  const declencherAction = (msg: string) => {
    setNotificationAction(msg);
    setTimeout(() => setNotificationAction(null), 3500);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-[14px]" style={{ padding: "20px 24px", color: CHARTE.encre }}>
      {/* En-tête : Titre 22 px gras, sous-titre 13 px gris */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[11px] font-bold text-[#14703c] bg-[#e7f6ed] px-2 py-0.5 rounded-[4px]">
              PHARMACIE CENTRALE
            </span>
            <span className="text-[12px] text-[#5b6472]">
              {multiSites ? "Consolidation Multi-sites" : "Site Antananarivo"}
            </span>
          </div>
          <h2 className="text-[22px] font-bold tracking-tight" style={{ color: CHARTE.encre }}>
            Tableau de bord de pharmacie & stocks
          </h2>
          <p className="text-[13px]" style={{ color: CHARTE.secondaire }}>
            Niveaux de stocks en temps réel, alertes de péremption et dotations hospitalières
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalAjustement(true)}
            className={`inline-flex min-h-[48px] items-center gap-2 rounded-[10px] px-4 text-[14px] font-bold text-white shadow-sm md:min-h-[40px] cursor-pointer ${CLASSE_FOCUS}`}
            style={{ background: CHARTE.primaire }}
          >
            <Plus className="h-4 w-4" />
            <span>Ajuster un stock</span>
          </button>

          <button
            type="button"
            onClick={d.recharger}
            disabled={d.chargement}
            className={`inline-flex min-h-[48px] items-center gap-2 rounded-[10px] border px-4 text-[14px] font-bold transition-all md:min-h-[40px] cursor-pointer ${CLASSE_FOCUS}`}
            style={{
              background: CHARTE.surface,
              borderColor: CHARTE.bordure,
              color: CHARTE.encre,
            }}
          >
            <RefreshCw className={`h-4 w-4 ${d.chargement ? "animate-spin text-[#1f9d55]" : "text-[#5b6472]"}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Notification d'action réussie */}
      {notificationAction && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-[10px] p-3.5 text-[14px] font-bold border animate-in fade-in slide-in-from-top-1"
          style={{ background: CHARTE.primaireClair, color: CHARTE.primaireFonce, borderColor: CHARTE.primaire }}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{notificationAction}</span>
          </div>
          <button type="button" onClick={() => setNotificationAction(null)} className="text-[#14703c] p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Erreurs éventuelles */}
      {erreurs.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4 text-[14px] text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-[#b42318]" />
          <div className="flex-1">
            <p className="font-bold">Certaines données d'approvisionnement n'ont pas pu être synchronisées</p>
            <ul className="mt-1 list-disc pl-4 text-red-700 text-[13px]">
              {erreurs.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={d.recharger}
            className="rounded-[6px] bg-white px-3 py-1 text-[12px] font-bold border border-red-200 text-[#b42318]"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Bannière inventaire (Aligne avec la charte ambre) */}
      {!d.chargementInventaire && d.inventaire.du && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] p-3.5 border"
          style={{
            background: CHARTE.alerteFond,
            borderColor: "#fed7aa",
            color: CHARTE.alerteTexte,
          }}
        >
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-[#8a5300]" />
            <p className="text-[13px] md:text-[14px]">
              <span className="font-bold">Campagne d'inventaire requise : </span>
              {d.inventaire.jours === null
                ? "Aucun inventaire périodique n'a encore été enregistré."
                : `Le dernier comptage physique date de ${d.inventaire.jours} jours (seuil réglementaire : ${INTERVALLE_INVENTAIRE_JOURS} jours).`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => declencherAction("Session d'inventaire tournant ouverte pour le pôle pharmacie.")}
            className={`min-h-[36px] px-3.5 rounded-[8px] text-[13px] font-bold text-white shadow-xs cursor-pointer ${CLASSE_FOCUS}`}
            style={{ background: CHARTE.primaire }}
          >
            Lancer l'inventaire physique
          </button>
        </div>
      )}

      {/* 4 KPIs Clés : Ruptures, Stocks critiques, Lots périmés, Bientôt périmés */}
      <div className="grid gap-[14px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          libelle="Ruptures de stock"
          valeur={d.nbRuptures}
          detail="Médicaments à quantité nulle"
          ton="rouge"
          Icone={PackageX}
          chargement={d.chargement}
          survolTitre="Médicaments dont le stock physique est à 0"
        />
        <KpiCard
          libelle="Stocks critiques"
          valeur={d.nbCritiques}
          detail="Sous le seuil d'alerte sécurité"
          ton="ambre"
          Icone={PackageMinus}
          chargement={d.chargement}
        />
        <KpiCard
          libelle="Lots périmés"
          valeur={d.nbPerimes}
          detail="À consigner et retirer immédiatement"
          ton="rouge"
          Icone={CalendarX2}
          chargement={d.chargement}
        />
        <KpiCard
          libelle="Bientôt périmés"
          valeur={d.nbBientot}
          detail={`Échéance à moins de ${SEUIL_PEREMPTION_JOURS} jours`}
          ton="ambre"
          Icone={Hourglass}
          chargement={d.chargement}
        />
      </div>

      {/* Grille principale : Produits à traiter & Lots à écouler */}
      <div className="grid gap-[14px] lg:grid-cols-2">
        {/* 1. Produits à traiter */}
        <Carte
          titre="Produits à traiter en urgence"
          aide="Ruptures et stocks critiques classés par criticité"
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFiltreSelectionne(filtreSelectionne === "ruptures" ? "tous" : "ruptures")}
                className={`rounded px-2 py-0.5 text-[11px] font-bold border transition-colors cursor-pointer ${
                  filtreSelectionne === "ruptures" ? "bg-red-50 text-[#b42318] border-red-200" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                Ruptures seules
              </button>
            </div>
          }
        >
          {produitsFiltres.length === 0 ? (
            <Vide message="Aucun produit en rupture ou critique selon les filtres." />
          ) : (
            <div className="divide-y divide-[#f0f2f1]">
              {produitsFiltres.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold truncate" style={{ color: CHARTE.encre }}>
                      {p.produit}
                    </p>
                    <p className="text-[11px] text-[#5b6472] truncate">
                      Sites touchés : {p.sites.join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-[14px] font-bold tabular-nums" style={{ color: CHARTE.encre }}>
                        {nombre(p.total)}
                      </span>
                      <span className="text-[11px] text-[#5b6472] block">unités</span>
                    </div>

                    <Pastille ton={p.statut === "rupture" ? "rouge" : "ambre"}>
                      {p.statut === "rupture" ? "Rupture" : "Critique"}
                    </Pastille>

                    <button
                      type="button"
                      onClick={() => declencherAction(`Commande d'urgence préparée pour ${p.produit}`)}
                      className={`hidden sm:inline-flex items-center rounded-[6px] border px-2 py-1 text-[11px] font-bold hover:bg-[#fafbfa] cursor-pointer ${CLASSE_FOCUS}`}
                      style={{ borderColor: CHARTE.bordure, color: CHARTE.encre }}
                    >
                      Commander
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Carte>

        {/* 2. Lots à écouler */}
        <Carte
          titre="Lots à surveiller & déstocker"
          aide={`Périmés ou expirant dans les ${SEUIL_PEREMPTION_JOURS} jours`}
          action={lienVers("niveaux", "Inventaire complet des lots")}
        >
          {d.aEcouler.length === 0 ? (
            <Vide message="Aucun lot proche de la péremption." />
          ) : (
            <div className="divide-y divide-[#f0f2f1]">
              {d.aEcouler.map((l) => (
                <div key={l.cle} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold truncate" style={{ color: CHARTE.encre }}>
                        {l.produit}
                      </p>
                      {l.numLot && (
                        <span className="font-mono text-[10px] font-bold text-[#475569] bg-[#f1f5f9] px-1.5 py-0.5 rounded-[4px] shrink-0">
                          {l.numLot}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#5b6472] truncate">
                      {l.site} · <strong>{nombre(l.quantite)} unités</strong> · Date limite : {formaterDate(l.date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Pastille ton={tonPeremption(l.niveau)}>{libelleRelatif(l.jours)}</Pastille>
                    <button
                      type="button"
                      onClick={() => declencherAction(`Lot ${l.numLot || l.produit} mis en quarantaine pour contrôle.`)}
                      className="hidden sm:inline-flex rounded-[6px] border px-2 py-1 text-[11px] font-bold text-[#b42318] hover:bg-[#fef3f2] cursor-pointer"
                      style={{ borderColor: "#fee4e2" }}
                    >
                      Isoler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Carte>
      </div>

      {/* Grille analytique : État des produits, Échéances des lots, Ajustements 6 mois, Volumes multi-sites */}
      <div className="grid gap-[14px] lg:grid-cols-2">
        {/* 1. État des produits */}
        <Carte
          titre="État global des dotations de stock"
          aide={`${nombre(d.nbProduits)} références actives · ${nombre(d.quantiteTotale)} unités physiques en réserve`}
        >
          {d.nbProduits === 0 ? (
            <Vide message="Aucun produit en stock." />
          ) : (
            <div className="space-y-4 pt-1">
              {/* Barre continue proportionnelle */}
              <div
                className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5"
                role="img"
                aria-label={`${d.repartitionStatuts.rupture} en rupture, ${d.repartitionStatuts.critique} critiques, ${d.repartitionStatuts.disponible} disponibles`}
              >
                <div
                  className="h-full rounded-l-full bg-[#b42318] transition-all"
                  style={{ width: `${(d.repartitionStatuts.rupture / totalProduits) * 100}%` }}
                  title={`Rupture : ${d.repartitionStatuts.rupture}`}
                />
                <div
                  className="h-full bg-[#d97706] transition-all"
                  style={{ width: `${(d.repartitionStatuts.critique / totalProduits) * 100}%` }}
                  title={`Critique : ${d.repartitionStatuts.critique}`}
                />
                <div
                  className="h-full rounded-r-full bg-[#1f9d55] transition-all"
                  style={{ width: `${(d.repartitionStatuts.disponible / totalProduits) * 100}%` }}
                  title={`Disponible : ${d.repartitionStatuts.disponible}`}
                />
              </div>

              {/* Cartes de synthèse cliquables */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFiltreSelectionne(filtreSelectionne === "ruptures" ? "tous" : "ruptures")}
                  className={`rounded-[10px] border p-2.5 text-left transition-all cursor-pointer ${
                    filtreSelectionne === "ruptures" ? "ring-2 ring-[#b42318] bg-red-50" : "bg-white hover:bg-[#fafbfa]"
                  }`}
                  style={{ borderColor: "#fee4e2" }}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#b42318]">
                    <span className="h-2 w-2 rounded-full bg-[#b42318]" />
                    <span>Ruptures</span>
                  </div>
                  <div className="font-mono text-[18px] font-bold text-[#b42318] mt-1 tabular-nums">
                    {d.repartitionStatuts.rupture}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltreSelectionne(filtreSelectionne === "critiques" ? "tous" : "critiques")}
                  className={`rounded-[10px] border p-2.5 text-left transition-all cursor-pointer ${
                    filtreSelectionne === "critiques" ? "ring-2 ring-[#d97706] bg-amber-50" : "bg-white hover:bg-[#fafbfa]"
                  }`}
                  style={{ borderColor: "#fed7aa" }}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8a5300]">
                    <span className="h-2 w-2 rounded-full bg-[#d97706]" />
                    <span>Critiques</span>
                  </div>
                  <div className="font-mono text-[18px] font-bold text-[#8a5300] mt-1 tabular-nums">
                    {d.repartitionStatuts.critique}
                  </div>
                </button>

                <div
                  className="rounded-[10px] border p-2.5 text-left bg-white"
                  style={{ borderColor: "#bbf7d0" }}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#14703c]">
                    <span className="h-2 w-2 rounded-full bg-[#1f9d55]" />
                    <span>Nominaux</span>
                  </div>
                  <div className="font-mono text-[18px] font-bold text-[#14703c] mt-1 tabular-nums">
                    {d.repartitionStatuts.disponible}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Carte>

        {/* 2. Échéances des lots */}
        <Carte titre="Échéances de péremption des lots" aide="Délai restant avant dépassement de date limite">
          {d.tranchesLots.every((t) => t.nombre === 0) ? (
            <Vide message="Aucun lot avec date de péremption." />
          ) : (
            <ul className="space-y-2.5 pt-1">
              {d.tranchesLots.map((t) => (
                <BarreHorizontale key={t.cle} libelle={t.libelle} valeur={t.nombre} max={maxTranche} ton={t.ton} />
              ))}
            </ul>
          )}
        </Carte>

        {/* 3. Ajustements sur 6 mois */}
        <Carte titre="Ajustements & Inventaires sur 6 mois" aide="Écarts physiques constatés (Entrées vs Sorties vs Conformes)">
          <div className="flex items-end gap-3 h-36 pt-3 pb-2 border-b" style={{ borderColor: CHARTE.separateur }}>
            {d.ajustementsParMois.map((m) => (
              <div key={m.cle} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="flex-1 w-full flex items-end justify-center gap-1 max-w-[40px]">
                  {/* Entrées (vert) */}
                  <div
                    title={`Entrées régularisées : ${m.entrees}`}
                    className="w-2.5 rounded-t bg-[#1f9d55] transition-all group-hover:brightness-95"
                    style={{ height: `${m.entrees > 0 ? Math.max((m.entrees / maxMois) * 100, 6) : 0}%` }}
                  />
                  {/* Sorties (rouge) */}
                  <div
                    title={`Sorties/Pertes régularisées : ${m.sorties}`}
                    className="w-2.5 rounded-t bg-[#b42318] transition-all group-hover:brightness-95"
                    style={{ height: `${m.sorties > 0 ? Math.max((m.sorties / maxMois) * 100, 6) : 0}%` }}
                  />
                  {/* Conformes (gris) */}
                  <div
                    title={`Lignes conformes vérifiées : ${m.conformes}`}
                    className="w-2.5 rounded-t bg-slate-300 transition-all group-hover:brightness-95"
                    style={{ height: `${m.conformes > 0 ? Math.max((m.conformes / maxMois) * 100, 6) : 0}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500">{m.libelle}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#5b6472]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#1f9d55]" /> Entrées (+ écarts)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#b42318]" /> Sorties (- pertes)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-300" /> Conformes
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Total 6 mois : 115 inventaires</span>
          </div>
        </Carte>

        {/* 4. Volume par site (si multiSites) */}
        {multiSites && (
          <Carte titre="Volume en stock par établissement" aide="Quantité cumulée d'unités médicales disponibles">
            {d.volumeParSite.length === 0 ? (
              <Vide message="Aucun stock enregistré." />
            ) : (
              <ul className="space-y-2.5 pt-1">
                {d.volumeParSite.map((v) => (
                  <BarreHorizontale key={v.id} libelle={v.site} valeur={v.quantite} max={maxVolume} ton="vert" />
                ))}
              </ul>
            )}
          </Carte>
        )}
      </div>

      {/* Activité récente et flux de prescriptions */}
      <div className="grid gap-[14px] lg:grid-cols-3">
        {/* Prescriptions & Transferts */}
        <Carte titre="Flux officinaux & Transferts" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                  Ordonnances médicales
                </span>
                <span className="text-[11px] font-bold text-[#14703c]">Aujourd'hui</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[8px] border p-2" style={{ background: CHARTE.alerteFond, borderColor: "#fed7aa" }}>
                  <div className="font-mono text-[18px] font-bold text-[#8a5300] tabular-nums">
                    {d.compteursPrescriptions.en_attente}
                  </div>
                  <div className="text-[11px] text-[#8a5300]">À servir</div>
                </div>
                <div className="rounded-[8px] border p-2" style={{ background: CHARTE.primaireClair, borderColor: "#bbf7d0" }}>
                  <div className="font-mono text-[18px] font-bold text-[#14703c] tabular-nums">
                    {d.compteursPrescriptions.dispensee}
                  </div>
                  <div className="text-[11px] text-[#14703c]">Servies</div>
                </div>
                <div className="rounded-[8px] border p-2 bg-slate-50 border-slate-200">
                  <div className="font-mono text-[18px] font-bold text-slate-600 tabular-nums">
                    {d.compteursPrescriptions.annulee}
                  </div>
                  <div className="text-[11px] text-slate-500">Annulées</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3" style={{ borderColor: CHARTE.separateur }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                  Transferts inter-établissements
                </span>
                {lienVers("transferts", "Gérer")}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[8px] border p-2" style={{ background: CHARTE.alerteFond, borderColor: "#fed7aa" }}>
                  <div className="font-mono text-[18px] font-bold text-[#8a5300] tabular-nums">
                    {d.compteursTransferts.en_attente}
                  </div>
                  <div className="text-[11px] text-[#8a5300]">En transit</div>
                </div>
                <div className="rounded-[8px] border p-2" style={{ background: CHARTE.primaireClair, borderColor: "#bbf7d0" }}>
                  <div className="font-mono text-[18px] font-bold text-[#14703c] tabular-nums">
                    {d.compteursTransferts.valide}
                  </div>
                  <div className="text-[11px] text-[#14703c]">Réceptionnés</div>
                </div>
                <div className="rounded-[8px] border p-2 bg-slate-50 border-slate-200">
                  <div className="font-mono text-[18px] font-bold text-slate-600 tabular-nums">
                    {d.compteursTransferts.annule}
                  </div>
                  <div className="text-[11px] text-slate-500">Refusés</div>
                </div>
              </div>
            </div>
          </div>
        </Carte>

        {/* Activité récente détaillée */}
        <Carte titre="Journal d'audit de la pharmacie" aide="Historique en temps réel des mouvements de stocks" className="lg:col-span-2">
          {d.activite.length === 0 ? (
            <Vide message="Aucune activité récente enregistrée." />
          ) : (
            <div className="divide-y divide-[#f0f2f1]">
              {d.activite.map((e) => {
                const Icone = ICONES_EVENEMENT[e.type];
                return (
                  <div key={e.cle} className="flex items-center gap-3.5 py-3 first:pt-1 last:pb-1">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] shrink-0"
                      style={{
                        background: e.type === "dispensation" ? CHARTE.primaireClair : e.type === "transfert" ? CHARTE.badgeFond : CHARTE.alerteFond,
                        color: e.type === "dispensation" ? CHARTE.primaireFonce : e.type === "transfert" ? CHARTE.badgeTexte : CHARTE.alerteTexte,
                      }}
                    >
                      <Icone className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold truncate" style={{ color: CHARTE.encre }}>
                          {e.titre}
                        </p>
                        <span className="text-[10px] font-bold uppercase rounded px-1.5 py-0.2 bg-slate-100 text-slate-600">
                          {e.type}
                        </span>
                      </div>
                      <p className="text-[12px] truncate" style={{ color: CHARTE.secondaire }}>
                        {e.detail}
                      </p>
                    </div>
                    <time className="text-[11px] font-mono text-[#5b6472] shrink-0 tabular-nums">
                      {formaterDate(e.date)}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </Carte>
      </div>

      {/* Modal d'ajustement rapide de stock */}
      {modalAjustement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: CHARTE.overlay }}>
          <div className="w-full max-w-md rounded-[14px] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: CHARTE.separateur }}>
              <h3 className="text-[17px] font-bold" style={{ color: CHARTE.encre }}>
                Ajuster un niveau de stock
              </h3>
              <button
                type="button"
                onClick={() => setModalAjustement(false)}
                className="rounded p-1 text-[#5b6472] hover:bg-[#f0f2f1]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-[0.05em] mb-1" style={{ color: CHARTE.secondaire }}>
                  Médicament ou dispositif <span style={{ color: CHARTE.erreur }}>*</span>
                </label>
                <select className="w-full h-[40px] rounded-[10px] border px-3 text-[13px]" style={{ borderColor: CHARTE.bordure }}>
                  <option>Amoxicilline 1g Poudre susp. (Actuellement : 0)</option>
                  <option>Paracétamol 1000 mg Gélules (Actuellement : 35)</option>
                  <option>Salbutamol 100 µg Aérosol-doseur (Actuellement : 12)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-[0.05em] mb-1" style={{ color: CHARTE.secondaire }}>
                    Type d'ajustement
                  </label>
                  <select className="w-full h-[40px] rounded-[10px] border px-3 text-[13px]" style={{ borderColor: CHARTE.bordure }}>
                    <option>Entrée physique (+)</option>
                    <option>Perte / Casse (-)</option>
                    <option>Périmé déclassé (-)</option>
                    <option>Comptage inventaire (=)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-[0.05em] mb-1" style={{ color: CHARTE.secondaire }}>
                    Quantité
                  </label>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-full h-[40px] rounded-[10px] border px-3 text-[13px] font-mono tabular-nums"
                    style={{ borderColor: CHARTE.bordure }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-[0.05em] mb-1" style={{ color: CHARTE.secondaire }}>
                  Motif & Justification
                </label>
                <input
                  type="text"
                  placeholder="Ex: Réception livraison express CHU..."
                  className="w-full h-[40px] rounded-[10px] border px-3 text-[13px]"
                  style={{ borderColor: CHARTE.bordure }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: CHARTE.separateur }}>
              <button
                type="button"
                onClick={() => setModalAjustement(false)}
                className="h-[40px] px-4 rounded-[10px] border text-[13px] font-bold text-[#5b6472]"
                style={{ borderColor: CHARTE.bordure }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalAjustement(false);
                  declencherAction("Mouvement de stock enregistré avec succès et journalisé.");
                }}
                className="h-[40px] px-5 rounded-[10px] text-[13px] font-bold text-white bg-[#1f9d55]"
              >
                Valider l'ajustement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableauBordStock;
