/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Info } from "lucide-react";
import type { NiveauAlerte, PointNomValeur } from "../modele/dashboard.types";

/* ------------------------------------------------------------------ *
 *  Tokens : vert #1f9d55 · vert clair #e7f6ed · ink #1f2937 · muted #5b6472
 * ------------------------------------------------------------------ */

export const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";

/* ---------------- Carte KPI (avec comparaison) ------------------- */
export interface CarteKpiProps {
  libelle: string;
  valeur: number | string;
  suffixe?: string;
  comparaison?: number | null;
  detail?: string;
}

export const CarteKpi: React.FC<CarteKpiProps> = ({
  libelle,
  valeur,
  suffixe,
  comparaison,
  detail,
}) => {
  const { tendance, couleur, Icone } = analyserComparaison(valeur, comparaison);
  return (
    <div className={`${CARTE} p-4 flex flex-col gap-1`}>
      <span className="text-[12px] font-bold text-[#5b6472]">{libelle}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[24px] font-bold leading-none tabular-nums text-[#1f2937]">
          {typeof valeur === "number" ? valeur.toLocaleString("fr-FR") : valeur}
        </span>
        {suffixe && <span className="text-sm text-[#5b6472]">{suffixe}</span>}
        {comparaison !== null && comparaison !== undefined && (
          <span
            className={`ml-auto inline-flex items-center gap-0.5 text-[12px] font-bold ${couleur}`}
            title={`vs période précédente : ${comparaison > 0 ? "+" : ""}${comparaison}`}
          >
            <Icone className="h-3 w-3" />
            {Math.abs(tendance)}%
          </span>
        )}
      </div>
      {detail && <span className="text-[11px] text-[#5b6472]">{detail}</span>}
    </div>
  );
};

function analyserComparaison(
  courant: number | string,
  precedent: number | null | undefined,
): { tendance: number; couleur: string; Icone: React.ComponentType<{ className?: string }> } {
  if (typeof courant !== "number" || !precedent || precedent <= 0) {
    return { tendance: 0, couleur: "text-[#5b6472]", Icone: ArrowRight };
  }
  const delta = ((courant - precedent) / precedent) * 100;
  if (delta > 0) return { tendance: Math.round(delta * 10) / 10, couleur: "text-[#14703c]", Icone: ArrowUp };
  if (delta < 0) return { tendance: Math.round(delta * 10) / 10, couleur: "text-[#b42318]", Icone: ArrowDown };
  return { tendance: 0, couleur: "text-[#5b6472]", Icone: ArrowRight };
}

/* ---------------- Grille de KPIs -------------------------------- */
export const GrilleKpis: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{children}</div>
);

/* ---------------- Section ------------------------------------------------- */
export const Section: React.FC<{
  titre: string;
  aide?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ titre, aide, children, className = "" }) => (
  <section className={`${CARTE} ${className}`}>
    <header className="px-4 pt-4 pb-2">
      <h3 className="text-[16px] font-bold text-[#1f2937]">{titre}</h3>
      {aide && <p className="text-[12px] text-[#5b6472] mt-0.5">{aide}</p>}
    </header>
    <div className="px-4 pb-4">{children}</div>
  </section>
);

/* ---------------- Liste de barres horizontales ------------------ */
export const GraphBarres: React.FC<{
  items: PointNomValeur[];
  max?: number;
  ton?: "vert" | "rouge" | "neutre";
  vide?: string;
}> = ({ items, max, ton = "vert", vide = "Aucune donnée." }) => {
  if (items.length === 0) {
    return <p className="text-sm text-[#5b6472] py-4 text-center italic">{vide}</p>;
  }
  const maximum = max ?? Math.max(1, ...items.map((i) => i.valeur));
  const couleurBarre =
    ton === "rouge" ? "bg-[#b42318]" : ton === "neutre" ? "bg-[#cbd5e1]" : "bg-[#1f9d55]";
  return (
    <ul className="space-y-2 pt-1">
      {items.map((i) => (
        <li key={i.nom} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-[#5b6472]" title={i.nom}>
            {i.nom}
          </span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f0f2f1]">
            <span
              className={`block h-full rounded-full ${couleurBarre}`}
              style={{
                width: `${maximum > 0 ? Math.max((i.valeur / maximum) * 100, i.valeur > 0 ? 3 : 0) : 0}%`,
              }}
            />
          </span>
          <span className="w-14 text-right font-bold tabular-nums text-[#1f2937]">
            {i.valeur.toLocaleString("fr-FR")}
          </span>
        </li>
      ))}
    </ul>
  );
};

/* ---------------- Colonnes (évolution multi-séries) -------------- */
export interface SerieColonne {
  cle: string;
  libelle: string;
  couleur: string;
}

export const GraphColonnes: React.FC<{
  donnees: Record<string, string | number>[];
  cleLibelle: string;
  series: SerieColonne[];
  resume: string;
}> = ({ donnees, cleLibelle, series, resume }) => {
  if (donnees.length === 0) {
    return <p className="text-sm text-[#5b6472] py-4 text-center italic">Aucune donnée.</p>;
  }
  const max = Math.max(1, ...donnees.flatMap((d) => series.map((s) => Number(d[s.cle]) || 0)));
  const pas = donnees.length > 24 ? 3 : donnees.length > 12 ? 2 : 1;
  return (
    <div>
      <div className="overflow-x-auto">
        <div
          className="flex h-32 items-end gap-1.5 pt-2"
          role="img"
          aria-label={resume}
          style={{ minWidth: donnees.length > 12 ? donnees.length * 32 : undefined }}
        >
          {donnees.map((d, i) => (
            <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                {series.map((s) => {
                  const n = Number(d[s.cle]) || 0;
                  return (
                    <span
                      key={s.cle}
                      title={`${d[cleLibelle]} · ${s.libelle} : ${n}`}
                      className="w-2.5 rounded-t"
                      style={{
                        background: s.couleur,
                        height: `${n > 0 ? Math.max((n / max) * 100, 6) : 0}%`,
                      }}
                    />
                  );
                })}
              </div>
              <span className="h-4 whitespace-nowrap text-[11px] text-[#5b6472]">
                {i % pas === 0 ? d[cleLibelle] : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[#5b6472]">
        {series.map((s) => (
          <li key={s.cle} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.couleur }} />
            {s.libelle}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------- Donut ------------------------------------------ */
export const GraphDonut: React.FC<{
  items: PointNomValeur[];
  resume: string;
  palette?: string[];
}> = ({ items, resume, palette = ["#1f9d55", "#3730a3", "#e8a317", "#b42318", "#5b6472"] }) => {
  const total = items.reduce((s, i) => s + i.valeur, 0);
  if (total === 0) {
    return <p className="text-sm text-[#5b6472] py-4 text-center italic">Aucune donnée.</p>;
  }
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 42 42" className="h-28 w-28" role="img" aria-label={resume}>
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f0f2f1" strokeWidth="6" />
        {items.map((it, idx) => {
          const pct = (it.valeur / total) * 100;
          const dash = `${pct} ${100 - pct}`;
          const dashArray = `${pct} ${100 - pct}`;
          const rotation = (offset / 100) * 360;
          offset += pct;
          return (
            <circle
              key={it.nom}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={palette[idx % palette.length]}
              strokeWidth="6"
              strokeDasharray={dashArray}
              strokeDashoffset={25}
              transform={`rotate(${rotation} 21 21)`}
            />
          );
        })}
        <circle cx="21" cy="21" r="10" fill="white" />
        <text x="21" y="21" textAnchor="middle" dominantBaseline="central"
              className="fill-[#1f2937] font-bold" style={{ fontSize: 3.8 }}>
          {total.toLocaleString("fr-FR")}
        </text>
      </svg>
      <ul className="flex-1 min-w-0 space-y-1.5">
        {items.map((it, idx) => (
          <li key={it.nom} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: palette[idx % palette.length] }} />
            <span className="flex-1 truncate text-[#5b6472]" title={it.nom}>{it.nom}</span>
            <span className="font-bold tabular-nums text-[#1f2937]">
              {it.valeur.toLocaleString("fr-FR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------- Heatmap simple -------------------------------- */
export const Heatmap: React.FC<{
  points: Array<{ jour: string; heure: string; tickets: number }>;
}> = ({ points }) => {
  if (points.length === 0) {
    return <p className="text-sm text-[#5b6472] py-4 text-center italic">Aucune donnée.</p>;
  }
  const jours = Array.from(new Set(points.map((p) => p.jour)));
  const heures = Array.from(new Set(points.map((p) => p.heure))).sort();
  const index = new Map(points.map((p) => [`${p.jour}|${p.heure}`, p.tickets]));
  const max = Math.max(1, ...points.map((p) => p.tickets));

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="p-1" />
            {heures.map((h) => (
              <th key={h} className="p-1 font-normal text-[#5b6472]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jours.map((j) => (
            <tr key={j}>
              <th className="p-1 text-right font-bold text-[#5b6472]">{j}</th>
              {heures.map((h) => {
                const n = index.get(`${j}|${h}`) ?? 0;
                const intensite = n / max;
                return (
                  <td key={h} className="p-0.5">
                    <span
                      title={`${j} ${h} : ${n} tickets`}
                      className="block h-5 w-6 rounded-sm"
                      style={{
                        background: `rgba(31, 157, 85, ${0.08 + intensite * 0.85})`,
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------------- Bandeau d'alertes ----------------------------- */
export const BandeauAlertes: React.FC<{ alertes: Array<{ nom: string; valeur: number; niveau: NiveauAlerte }> }> = ({ alertes }) => {
  const actives = alertes.filter((a) => a.valeur > 0);
  if (actives.length === 0) return null;
  const danger = actives.some((a) => a.niveau === "danger");
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] px-4 py-3 text-sm font-bold ${
        danger ? "bg-[#b42318]/10 text-[#b42318]" : "bg-[#fff4e0] text-[#8a5300]"
      }`}
    >
      <AlertTriangle className="h-5 w-5 shrink-0" />
      {actives.map((a) => (
        <span key={a.nom} className="inline-flex items-center gap-1.5">
          <b className="tabular-nums">{a.valeur}</b>
          <span className="font-normal">{a.nom}</span>
        </span>
      ))}
    </div>
  );
};

/* ---------------- Encart "vide" ou erreur ----------------------- */
export const EtatBloc: React.FC<{
  chargement: boolean;
  erreur: string | null;
  messageVide: string;
}> = ({ chargement, erreur, messageVide }) => {
  if (chargement) {
    return (
      <div className="p-6 text-center text-sm text-[#5b6472]">Chargement…</div>
    );
  }
  if (erreur) {
    return (
      <div className="p-4 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>{erreur}</span>
      </div>
    );
  }
  return (
    <p className="text-sm text-[#5b6472] py-6 text-center italic">{messageVide}</p>
  );
};