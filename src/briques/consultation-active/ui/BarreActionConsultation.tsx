/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { OngletConsultation } from "./TabsConsultation";

export interface BarreActionConsultationProps {
  diagnostics: number;
  actes: number;
  demandes: number;
  ordonnances: number;
  estModifiable: boolean;
  enCours: boolean;
  onCloturer: () => void;

  actesEnSuspens?: number;
  aDiagnosticPrincipal?: boolean;
  onOuvrirOnglet?: (onglet: OngletConsultation) => void;
  onSuiviOrientation?: () => void;
  libelleCloture?: string;
  /**
   * false (défaut) : la barre défile avec la page — le choix le plus confortable
   *                   visuellement, rien ne reste « collé » à l'œil.
   * true  : la barre reste collée en bas avec une ombre portée discrète en haut.
   */
  collant?: boolean;
}

/* ------------------------------------------------------------------ *
 *  Tokens — sobres, pas de fond saturé, rien qui « clignote »
 * ------------------------------------------------------------------ */
type Ton = "warn" | "ok" | "neutre";

/* ------------------------------------------------------------------ *
 *  Chip sobre : icône ronde (✓ / ! / ○) + « N libellés »
 *  Pas de pastille colorée, pas de fond — juste un repère visuel.
 * ------------------------------------------------------------------ */
const ChipStatut: React.FC<{
  ton: Ton;
  valeur: number;
  libelle: string;
  alerte?: boolean;
  onClick?: () => void;
}> = ({ ton, valeur, libelle, alerte, onClick }) => {
  const icone =
    ton === "warn" ? (
      <span className="w-5 h-5 rounded-full bg-[#fff4e0] text-[#8a5300] text-[12px] font-bold grid place-items-center shrink-0">
        !
      </span>
    ) : ton === "ok" ? (
      <span className="w-5 h-5 rounded-full bg-[#e7f6ed] text-[#14703c] text-[12px] font-bold grid place-items-center shrink-0">
        ✓
      </span>
    ) : (
      <span className="w-5 h-5 rounded-full bg-[#f0f2f1] text-[#5b6472] text-[12px] font-bold grid place-items-center shrink-0">
        ○
      </span>
    );

  const contenu = (
    <>
      {icone}
      <span
        className={`whitespace-nowrap ${
          alerte ? "text-[#8a5300] font-semibold" : "text-[#1f2937]"
        }`}
      >
        <b className="tabular-nums">{valeur}</b> {libelle}
        {valeur > 1 ? "s" : ""}
      </span>
    </>
  );

  const base =
    "inline-flex items-center gap-2 h-10 px-3 rounded-[10px] text-[13px] transition-colors";

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${base} cursor-pointer hover:bg-[#f5f7f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]`}
    >
      {contenu}
    </button>
  ) : (
    <span className={base}>{contenu}</span>
  );
};

/* ------------------------------------------------------------------ *
 *  Modale de confirmation (inchangée sur le fond, mais plus sobre)
 * ------------------------------------------------------------------ */
const StatutItem: React.FC<{ ok: boolean; libelle: string; neutre?: boolean }> = ({
  ok,
  libelle,
  neutre,
}) => (
  <div className="flex items-center gap-1.5 text-xs">
    {neutre ? (
      <span className="h-2 w-2 rounded-full bg-slate-300" />
    ) : ok ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
    ) : (
      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
    )}
    <span
      className={
        neutre ? "text-slate-500" : ok ? "text-slate-700" : "text-amber-800 font-semibold"
      }
    >
      {libelle}
    </span>
  </div>
);

const ModaleConfirmationCloture: React.FC<{
  diagnostics: number;
  actes: number;
  demandes: number;
  ordonnances: number;
  actesEnSuspens: number;
  libelleCloture: string;
  enCours: boolean;
  onAnnuler: () => void;
  onConfirmer: () => void;
}> = ({
  diagnostics,
  actes,
  demandes,
  ordonnances,
  actesEnSuspens,
  libelleCloture,
  enCours,
  onAnnuler,
  onConfirmer,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enCours) onAnnuler();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enCours, onAnnuler]);

  const avertissements: string[] = [];
  if (diagnostics === 0) avertissements.push("Aucun diagnostic posé");
  if (actesEnSuspens > 0)
    avertissements.push(
      `${actesEnSuspens} acte${actesEnSuspens > 1 ? "s" : ""} non terminé${actesEnSuspens > 1 ? "s" : ""}`,
    );
  if (demandes > 0)
    avertissements.push(`${demandes} demande${demandes > 1 ? "s" : ""} en attente`);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !enCours && onAnnuler()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-cloture"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-start gap-3 p-5 border-b border-[#f0f2f1]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#1f9d55]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 id="titre-cloture" className="text-base font-bold text-[#1f2937]">
              {libelleCloture} ?
            </h3>
            <p className="text-sm text-[#5b6472] mt-0.5">
              Cette action est définitive. Vérifiez le résumé avant de confirmer.
            </p>
          </div>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <StatutItem ok={diagnostics > 0} libelle="Diagnostic posé" />
            <StatutItem ok={actesEnSuspens === 0} libelle="Actes terminés" />
            <StatutItem
              ok
              neutre
              libelle={`${actes} acte${actes > 1 ? "s" : ""} réalisé${actes > 1 ? "s" : ""}`}
            />
            <StatutItem
              ok
              neutre
              libelle={`${ordonnances} ordonnance${ordonnances > 1 ? "s" : ""}`}
            />
          </div>

          {avertissements.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                Points d'attention
              </div>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                {avertissements.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#f0f2f1] bg-[#fafbfa]">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={enCours}
            className="h-10 px-4 rounded-[10px] text-sm font-semibold border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-white cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={enCours}
            className="h-10 px-4 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {enCours ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================================================================== *
 *  Barre principale
 * ================================================================== */
export const BarreActionConsultation: React.FC<BarreActionConsultationProps> = ({
  diagnostics,
  actes,
  demandes,
  ordonnances,
  estModifiable,
  enCours,
  onCloturer,
  actesEnSuspens = 0,
  aDiagnosticPrincipal = diagnostics > 0,
  onOuvrirOnglet,
  onSuiviOrientation,
  libelleCloture = "Clôturer la consultation",
  collant = false,
}) => {
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const bloque = actesEnSuspens > 0;

  useEffect(() => {
    if (!estModifiable || enCours) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (bloque) return;
        setConfirmationOuverte(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [estModifiable, enCours, bloque]);

  // Sticky discret avec ombre portée en haut, ou pied de page classique
  const classesFooter = collant
    ? "sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-[#e5e7eb] shadow-[0_-4px_16px_rgba(15,27,61,0.08)]"
    : "bg-white border-t border-[#e5e7eb] shadow-[0_-4px_16px_rgba(15,27,61,0.08)]";

  return (
    <>
      <footer role="contentinfo" className={classesFooter}>
        <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex flex-wrap items-center gap-3 justify-between">
          {/* ---------- Compteurs sobres ---------- */}
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            <ChipStatut
              ton={diagnostics === 0 ? "warn" : "ok"}
              valeur={diagnostics}
              libelle="diagnostic"
              alerte={diagnostics === 0}
              onClick={onOuvrirOnglet ? () => onOuvrirOnglet("diag") : undefined}
            />
            <ChipStatut
              ton={bloque ? "warn" : "ok"}
              valeur={actes}
              libelle="acte"
              onClick={onOuvrirOnglet ? () => onOuvrirOnglet("actes") : undefined}
            />
            <ChipStatut
              ton="neutre"
              valeur={demandes}
              libelle="demande"
              onClick={onOuvrirOnglet ? () => onOuvrirOnglet("dem") : undefined}
            />
            <ChipStatut
              ton="neutre"
              valeur={ordonnances}
              libelle="ordonnance"
              onClick={onOuvrirOnglet ? () => onOuvrirOnglet("ord") : undefined}
            />
          </div>

          {/* ---------- Actions ---------- */}
          {estModifiable && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Avertissements : simple texte, sans pastille de fond */}
              {bloque && (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8a5300]">
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {actesEnSuspens} acte{actesEnSuspens > 1 ? "s" : ""} en suspens
                </span>
              )}
              {!bloque && !aDiagnosticPrincipal && (
                <button
                  type="button"
                  onClick={() => onOuvrirOnglet?.("diag")}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8a5300] cursor-pointer hover:text-[#6d4100] transition-colors"
                  title="Poser un diagnostic"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Aucun diagnostic posé</span>
                  {onOuvrirOnglet && <span className="underline">· Ajouter</span>}
                </button>
              )}

              {onSuiviOrientation && (
                <button
                  type="button"
                  onClick={onSuiviOrientation}
                  className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#fafbfa] cursor-pointer transition-colors"
                >
                  Suivi et orientation
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setConfirmationOuverte(true)}
                disabled={enCours || bloque}
                title={
                  bloque
                    ? `Clôture impossible : ${actesEnSuspens} acte${actesEnSuspens > 1 ? "s" : ""} en suspens`
                    : "Raccourci : Ctrl+Entrée"
                }
                className="h-11 px-5 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enCours ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{enCours ? "Clôture en cours…" : libelleCloture}</span>
              </button>
            </div>
          )}
        </div>
      </footer>

      {confirmationOuverte && (
        <ModaleConfirmationCloture
          diagnostics={diagnostics}
          actes={actes}
          demandes={demandes}
          ordonnances={ordonnances}
          actesEnSuspens={actesEnSuspens}
          libelleCloture={libelleCloture}
          enCours={enCours}
          onAnnuler={() => setConfirmationOuverte(false)}
          onConfirmer={() => {
            setConfirmationOuverte(false);
            onCloturer();
          }}
        />
      )}
    </>
  );
};

export default BarreActionConsultation;