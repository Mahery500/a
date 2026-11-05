/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CalendarRange, Download, Filter, Loader2, RefreshCw } from "lucide-react";
import { useSession } from "@/cerveau/session";
import { useListe } from "@/briques/stock-commun/useListe";
import { sitesApi } from "@/briques/sites";
import { entreprisesApi } from "@/briques/entreprises";
import type { DashboardFiltres, PeriodeDashboard } from "../modele/dashboard.types";
import { urlExportCsv } from "../api/dashboard.api";

const PERIODES: { valeur: PeriodeDashboard; libelle: string }[] = [
  { valeur: "jour", libelle: "Aujourd'hui" },
  { valeur: "7j", libelle: "7 jours" },
  { valeur: "30j", libelle: "30 jours" },
  { valeur: "90j", libelle: "90 jours" },
  { valeur: "annee", libelle: "Année" },
  { valeur: "custom", libelle: "Personnalisée" },
];

const CHAMP =
  "h-12 md:h-10 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] " +
  "placeholder:text-[#5b6472] transition focus:border-[#1f9d55] focus:outline-hidden focus:ring-2 focus:ring-[#1f9d55]/25";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

export interface FiltresDashboardProps {
  filtres: DashboardFiltres;
  onChange: (f: DashboardFiltres) => void;
  onRafraichir: () => void;
  chargement: boolean;
  exportPath: string;
}

export const FiltresDashboard: React.FC<FiltresDashboardProps> = ({
  filtres,
  onChange,
  onRafraichir,
  chargement,
  exportPath,
}) => {
  const { utilisateur } = useSession();
  const estAdmin =
    utilisateur?.roles?.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN") ?? false;

  // Sites + entreprises accessibles (admin uniquement)
  const sites = useListe(() => (estAdmin ? sitesApi.lister() : Promise.resolve([])), [estAdmin]);
  const entreprises = useListe(
    () => (estAdmin ? entreprisesApi.lister() : Promise.resolve([])),
    [estAdmin],
  );

  const [entrepriseSelection, setEntrepriseSelection] = React.useState<string>("");

  const changer = (maj: Partial<DashboardFiltres>) => {
    onChange({ ...filtres, ...maj });
  };

  const selectionnerEntreprise = (idStr: string) => {
    setEntrepriseSelection(idStr);
    if (!idStr) {
      changer({ entrepriseIds: [] });
      return;
    }
    const id = Number(idStr);
    if (Number.isFinite(id) && id > 0) {
      changer({ entrepriseIds: [id] });
    }
  };

  const exporter = () => {
    window.open(urlExportCsv(exportPath, filtres), "_blank", "noopener,noreferrer");
  };

  const estCustom = filtres.periode === "custom";
  const peutExporter = exportPath.length > 0;

  return (
    <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-4 space-y-3">
      {/* Ligne 1 : périodes */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5b6472]">
          <CalendarRange className="h-3.5 w-3.5" />
          Période
        </span>
        <div role="radiogroup" aria-label="Période" className="inline-flex flex-wrap gap-2">
          {PERIODES.map((p) => {
            const actif = filtres.periode === p.valeur;
            return (
              <button
                key={p.valeur}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => changer({ periode: p.valeur })}
                className={`min-h-[44px] md:min-h-[32px] rounded-full border px-[14px] py-1.5 text-[13px] transition ${FOCUS} ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
                }`}
              >
                {p.libelle}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ligne 2 : dates custom + filtres avancés + actions */}
      <div className="flex flex-wrap items-end gap-3">
        {estCustom && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#5b6472]">Du</label>
              <input
                type="date"
                value={filtres.du ?? ""}
                max={filtres.au || undefined}
                onChange={(e) => changer({ du: e.target.value })}
                className={CHAMP}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#5b6472]">Au</label>
              <input
                type="date"
                value={filtres.au ?? ""}
                min={filtres.du || undefined}
                onChange={(e) => changer({ au: e.target.value })}
                className={CHAMP}
              />
            </div>
          </>
        )}

        {estAdmin && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#5b6472]">Site</label>
              <select
                value={filtres.siteId ?? ""}
                onChange={(e) =>
                  changer({ siteId: e.target.value ? Number(e.target.value) : null })
                }
                className={CHAMP}
              >
                <option value="">Tous les sites</option>
                {sites.items.map((s) => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#5b6472]">Entreprise</label>
              <select
                value={entrepriseSelection}
                onChange={(e) => selectionnerEntreprise(e.target.value)}
                className={CHAMP}
              >
                <option value="">Toutes les entreprises</option>
                {entreprises.items.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <label className="inline-flex h-12 md:h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm font-semibold text-[#1f2937]">
          <input
            type="checkbox"
            checked={filtres.compare === true}
            onChange={(e) => changer({ compare: e.target.checked })}
            className="h-4 w-4 accent-[#1f9d55]"
          />
          Comparer avec la période précédente
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRafraichir}
            disabled={chargement}
            className={`inline-flex h-12 md:h-10 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:opacity-50 ${FOCUS}`}
          >
            {chargement ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </button>

          {peutExporter && (
            <button
              type="button"
              onClick={exporter}
              className={`inline-flex h-12 md:h-10 items-center gap-2 rounded-[10px] border border-[#1f9d55] bg-[#1f9d55] px-3.5 text-sm font-bold text-white transition hover:bg-[#14703c] ${FOCUS}`}
            >
              <Download className="h-4 w-4" />
              Exporter CSV
            </button>
          )}
        </div>
      </div>
    </div>
  );
};