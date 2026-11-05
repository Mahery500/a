/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tableau de bord de l'espace Pharmacie.
 * Composant d'affichage pur : les données viennent des hooks existants
 * de la brique stock-dispensation (voir construireStatsPharmacie).
 */

import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  PackageX,
  Timer,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  Types
 * ------------------------------------------------------------------ */
export interface OrdonnanceResume {
  id: number;
  patientNom: string;
  medecinNom?: string;
  /** Date ISO de création / d'émission de l'ordonnance. */
  creeLe?: string | null;
  nbLignes?: number;
}

export interface StatsPharmacie {
  aDispenser: number;
  dispenseesAujourdhui: number;
  /** Attente moyenne des ordonnances encore en file, en minutes. */
  attenteMoyenneMinutes: number | null;
  /** Lots périmés ou proches de la péremption (fourni par le stock). */
  lotsPerimesProches: number;
  /** Produits sous le seuil d'alerte (fourni par le stock). */
  produitsSousSeuil: number;
}

export interface TableauBordPharmacieProps {
  stats: StatsPharmacie;
  /** Ordonnances en attente, de la plus ancienne à la plus récente. */
  prochaines: OrdonnanceResume[];
  chargement?: boolean;
  onOuvrirFile: () => void;
  onOuvrirDispensees: () => void;
  onOuvrirStock?: () => void;
}

/* ------------------------------------------------------------------ *
 *  Calcul des stats à partir des listes déjà chargées
 * ------------------------------------------------------------------ */
export function construireStatsPharmacie(params: {
  aDispenser: OrdonnanceResume[];
  dispenseesAujourdhui: number;
  lotsPerimesProches?: number;
  produitsSousSeuil?: number;
  maintenant?: Date;
}): StatsPharmacie {
  const now = (params.maintenant ?? new Date()).getTime();
  const attentes = params.aDispenser
    .map((o) => (o.creeLe ? (now - new Date(o.creeLe).getTime()) / 60000 : NaN))
    .filter((m) => Number.isFinite(m) && m >= 0);

  return {
    aDispenser: params.aDispenser.length,
    dispenseesAujourdhui: params.dispenseesAujourdhui,
    attenteMoyenneMinutes:
      attentes.length > 0
        ? Math.round(attentes.reduce((s, m) => s + m, 0) / attentes.length)
        : null,
    lotsPerimesProches: params.lotsPerimesProches ?? 0,
    produitsSousSeuil: params.produitsSousSeuil ?? 0,
  };
}

/** Tri FEFO côté file : la plus ancienne d'abord. */
export function trierParAnciennete(
  ordonnances: OrdonnanceResume[],
): OrdonnanceResume[] {
  return [...ordonnances].sort((a, b) => {
    const ta = a.creeLe ? new Date(a.creeLe).getTime() : Infinity;
    const tb = b.creeLe ? new Date(b.creeLe).getTime() : Infinity;
    return ta - tb;
  });
}

/* ------------------------------------------------------------------ *
 *  Utilitaires d'affichage
 * ------------------------------------------------------------------ */
const formaterAttente = (iso?: string | null): string => {
  if (!iso) return "—";
  const min = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${String(min % 60).padStart(2, "0")}`;
};

type Ton = "orange" | "vert" | "rouge" | "ambre" | "gris";

const TONS: Record<Ton, { fond: string; texte: string }> = {
  orange: { fond: "bg-orange-50", texte: "text-orange-600" },
  vert: { fond: "bg-emerald-50", texte: "text-emerald-600" },
  rouge: { fond: "bg-rose-50", texte: "text-rose-600" },
  ambre: { fond: "bg-amber-50", texte: "text-amber-600" },
  gris: { fond: "bg-slate-100", texte: "text-slate-500" },
};

interface CarteStatProps {
  icone: React.ComponentType<{ className?: string }>;
  libelle: string;
  valeur: string;
  detail?: string;
  ton: Ton;
  chargement?: boolean;
  onClick?: () => void;
}

const CarteStat: React.FC<CarteStatProps> = ({
  icone: Icone,
  libelle,
  valeur,
  detail,
  ton,
  chargement,
  onClick,
}) => {
  const t = TONS[ton];
  const contenu = (
    <>
      <div
        className={`h-10 w-10 rounded-[10px] grid place-items-center shrink-0 ${t.fond}`}
      >
        <Icone className={`h-5 w-5 ${t.texte}`} />
      </div>
      <div className="min-w-0 text-left">
        <div className="text-[12px] text-[#5b6472] truncate">{libelle}</div>
        {chargement ? (
          <div className="h-7 w-14 mt-1 rounded bg-slate-100 animate-pulse" />
        ) : (
          <div className="text-[24px] font-bold text-[#1f2937] leading-tight">
            {valeur}
          </div>
        )}
        {detail && !chargement && (
          <div className="text-[11px] text-[#5b6472] truncate">{detail}</div>
        )}
      </div>
    </>
  );

  const classes =
    "bg-white border border-[#e5e7eb] rounded-[14px] p-4 flex items-center gap-3";

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${classes} w-full cursor-pointer hover:bg-[#fafbfa] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f97316]`}
    >
      {contenu}
    </button>
  ) : (
    <div className={classes}>{contenu}</div>
  );
};

/* ------------------------------------------------------------------ *
 *  Composant principal
 * ------------------------------------------------------------------ */
export const TableauBordPharmacie: React.FC<TableauBordPharmacieProps> = ({
  stats,
  prochaines,
  chargement = false,
  onOuvrirFile,
  onOuvrirDispensees,
  onOuvrirStock,
}) => {
  const attente = stats.attenteMoyenneMinutes;
  const tonAttente: Ton =
    attente === null ? "gris" : attente >= 30 ? "rouge" : attente >= 15 ? "ambre" : "vert";

  const alertes: { id: string; texte: string; ton: Ton }[] = [];
  if (stats.lotsPerimesProches > 0) {
    alertes.push({
      id: "peremption",
      texte: `${stats.lotsPerimesProches} lot(s) périmé(s) ou proche(s) de la péremption`,
      ton: "rouge",
    });
  }
  if (stats.produitsSousSeuil > 0) {
    alertes.push({
      id: "seuil",
      texte: `${stats.produitsSousSeuil} produit(s) sous le seuil d'alerte`,
      ton: "ambre",
    });
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* ----- Indicateurs ----- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <CarteStat
          icone={Clock}
          libelle="À dispenser"
          valeur={String(stats.aDispenser)}
          detail="Ordonnances en attente"
          ton="orange"
          chargement={chargement}
          onClick={onOuvrirFile}
        />
        <CarteStat
          icone={CheckCircle2}
          libelle="Dispensées aujourd'hui"
          valeur={String(stats.dispenseesAujourdhui)}
          detail="Délivrances comptoir"
          ton="vert"
          chargement={chargement}
          onClick={onOuvrirDispensees}
        />
        <CarteStat
          icone={Timer}
          libelle="Attente moyenne"
          valeur={attente === null ? "—" : `${attente} min`}
          detail="Ordonnances encore en file"
          ton={tonAttente}
          chargement={chargement}
        />
        <CarteStat
          icone={PackageX}
          libelle="Alertes stock"
          valeur={String(stats.lotsPerimesProches + stats.produitsSousSeuil)}
          detail="Péremptions & seuils"
          ton={alertes.length > 0 ? "rouge" : "gris"}
          chargement={chargement}
          onClick={onOuvrirStock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* ----- Prochaines ordonnances ----- */}
        <section className="lg:col-span-2 bg-white border border-[#e5e7eb] rounded-[14px] overflow-hidden">
          <header className="h-14 px-5 flex items-center justify-between border-b border-[#f0f2f1]">
            <h3 className="font-bold text-[15px] text-[#1f2937]">
              Prochaines ordonnances à dispenser
            </h3>
            <button
              type="button"
              onClick={onOuvrirFile}
              className="text-[13px] font-semibold text-[#f97316] inline-flex items-center gap-1 cursor-pointer hover:underline"
            >
              Ouvrir la file
              <ArrowRight className="h-4 w-4" />
            </button>
          </header>

          {chargement ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : prochaines.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-[#5b6472]">
              Aucune ordonnance en attente.
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f2f1]">
              {prochaines.slice(0, 6).map((o) => (
                <li
                  key={o.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#1f2937] truncate">
                      {o.patientNom}
                    </div>
                    <div className="text-[12px] text-[#5b6472] truncate">
                      {o.medecinNom ? `Dr ${o.medecinNom}` : "Médecin non renseigné"}
                      {o.nbLignes !== undefined && ` · ${o.nbLignes} médicament(s)`}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] font-bold text-orange-600 bg-orange-50 rounded-full px-2.5 py-1">
                    {formaterAttente(o.creeLe)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ----- Alertes ----- */}
        <section className="bg-white border border-[#e5e7eb] rounded-[14px] overflow-hidden">
          <header className="h-14 px-5 flex items-center border-b border-[#f0f2f1]">
            <h3 className="font-bold text-[15px] text-[#1f2937]">
              Alertes pharmacie
            </h3>
          </header>
          <div className="p-4 space-y-2.5">
            {alertes.length === 0 ? (
              <div className="text-[13px] text-[#5b6472] text-center py-6">
                Aucune alerte : stock conforme.
              </div>
            ) : (
              alertes.map((a) => (
                <div
                  key={a.id}
                  role="alert"
                  className={`rounded-[10px] px-3 py-2.5 flex items-start gap-2 text-[13px] ${TONS[a.ton].fond} ${TONS[a.ton].texte}`}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{a.texte}</span>
                </div>
              ))
            )}
            {onOuvrirStock && alertes.length > 0 && (
              <button
                type="button"
                onClick={onOuvrirStock}
                className="w-full h-9 rounded-[10px] border border-[#e5e7eb] text-[13px] font-semibold text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition-colors"
              >
                Voir le détail du stock
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TableauBordPharmacie;