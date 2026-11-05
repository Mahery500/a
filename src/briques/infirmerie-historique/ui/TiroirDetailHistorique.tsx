/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, CheckCircle2, FileDown, X } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import {
  ActeHistorique,
  ObservationHistorique,
} from "../modele/infirmerie-historique.types";

export interface TiroirDetailHistoriqueProps {
  ouvert: boolean;
  acte: ActeHistorique | null;
  onFermer: () => void;
  /** Optionnel : callback pour l'export PDF. Si absent, on fait window.print(). */
  onExporter?: (acte: ActeHistorique) => void;
}

const formatDateHeure = (iso: string): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const datePart = d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const heurePart = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `${datePart} · ${heurePart}`;
  } catch {
    return iso;
  }
};

function estValeurAberrante(o: ObservationHistorique): boolean {
  const texte = `${o.code} ${(o as { libelle?: string }).libelle ?? ""}`.toUpperCase();
  const v = parseFloat(o.valeur.replace(",", "."));
  if (!Number.isFinite(v)) return false;
  if (/SYSTOL|\bPAS\b/.test(texte) && (v < 60 || v > 250)) return true;
  if (/DIASTOL|\bPAD\b/.test(texte) && (v < 30 || v > 150)) return true;
  if (/POULS|\bFC\b/.test(texte) && (v < 30 || v > 220)) return true;
  if (/TEMP/.test(texte) && (v < 34 || v > 43)) return true;
  if (/SPO2|SAT/.test(texte) && (v < 50 || v > 100)) return true;
  return false;
}

const libelleObservation = (o: ObservationHistorique): string =>
  (o as { libelle?: string }).libelle?.trim() || o.code;

/* ---------- Ligne d'identification (label + valeur) ---------- */
const Ligne: React.FC<{ libelle: string; children: React.ReactNode }> = ({
  libelle,
  children,
}) => (
  <div className="flex gap-3 py-2 border-b border-[#f0f2f1] last:border-b-0">
    <span className="w-[150px] shrink-0 text-[13px] font-bold text-[#5b6472]">
      {libelle}
    </span>
    <span className="flex-1 text-[13px] text-[#1f2937] min-w-0 break-words">
      {children}
    </span>
  </div>
);

/* ---------- Composant ---------- */
export const TiroirDetailHistorique: React.FC<TiroirDetailHistoriqueProps> = ({
  ouvert,
  acte,
  onFermer,
  onExporter,
}) => {
  if (!acte) return null;

  const observationsAberrantes = acte.observations.filter(estValeurAberrante);
  const aUneAlerte = observationsAberrantes.length > 0;

  const statutLabel = acte.saisiParErreur
    ? "Saisi par erreur"
    : acte.statut === "realise"
      ? "Réalisé"
      : acte.statut === "annule"
        ? "Annulé"
        : acte.statut;

  const handleExporter = () => {
    if (onExporter) {
      onExporter(acte);
    } else {
      window.print();
    }
  };

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={onFermer}
      libelle={`Fiche de l'acte ${acte.acteDefinitionLibelle}`}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold leading-tight text-[#1f2937] truncate">
              {acte.acteDefinitionLibelle}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px]">
                {acte.acteDefinitionCode}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  acte.saisiParErreur
                    ? "bg-rose-50 text-rose-700"
                    : acte.statut === "realise"
                      ? "bg-[#e7f6ed] text-[#14703c]"
                      : "bg-[#f0f2f1] text-[#5b6472]"
                }`}
              >
                {!acte.saisiParErreur && acte.statut === "realise" && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {statutLabel}
              </span>
              {aUneAlerte && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff4e0] text-[#8a5300]">
                  <AlertTriangle className="h-3 w-3" />À vérifier
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Identification */}
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mb-2">
              Identification
            </div>
            <Ligne libelle="Date et heure">
              {formatDateHeure(acte.dateRealisation)}
            </Ligne>
            <Ligne libelle="Patient">
              {acte.patientNom || `Patient #${acte.patientId}`}
            </Ligne>
            <Ligne libelle="Dossier">#{acte.encounterId}</Ligne>
            <Ligne libelle="Réalisé par">
              Votre compte{acte.staffId ? ` (staff #${acte.staffId})` : " (exemple)"}
            </Ligne>
          </div>

          {/* Résultats */}
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mb-2 mt-2">
              Résultats
            </div>
            {acte.observations.length === 0 ? (
              <p className="text-[13px] italic text-[#5b6472]">
                Aucune observation enregistrée pour cet acte.
              </p>
            ) : (
              acte.observations.map((o) => {
                const alerte = estValeurAberrante(o);
                return (
                  <div
                    key={o.id}
                    className="flex gap-3 py-2 border-b border-[#f0f2f1] last:border-b-0"
                  >
                    <span className="w-[150px] shrink-0 text-[13px] font-bold text-[#5b6472]">
                      {libelleObservation(o)}
                    </span>
                    <span
                      className={`flex-1 text-[13px] min-w-0 ${
                        alerte ? "text-[#b42318] font-bold" : "text-[#1f2937]"
                      }`}
                    >
                      <span className="font-mono">{o.valeur}</span>
                      {o.unite && <span className="ml-1">{o.unite}</span>}
                      {o.interpretation && (
                        <span className="italic text-[#5b6472]"> ({o.interpretation})</span>
                      )}
                    </span>
                  </div>
                );
              })
            )}

            {aUneAlerte && (
              <div className="mt-4 bg-[#fff4e0] rounded-[10px] px-3.5 py-3 text-[13px] text-[#8a5300] leading-relaxed">
                <b>⚠ Valeurs à vérifier.</b>{" "}
                {observationsAberrantes
                  .map(
                    (o) =>
                      `${o.valeur}${o.unite ? ` ${o.unite}` : ""} (${libelleObservation(
                        o,
                      )})`,
                  )
                  .join(", ")}{" "}
                est très en dehors des valeurs usuelles. Un acte enregistré n'est pas modifiable :
                signalez l'erreur au référent du service.
              </div>
            )}
          </div>
        </div>

        {/* Pied */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onFermer}
            className="h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleExporter}
            className="h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition"
          >
            <FileDown className="h-4 w-4" />
            Exporter la fiche en PDF
          </button>
        </div>
      </div>
    </TiroirLateral>
  );
};

export default TiroirDetailHistorique;