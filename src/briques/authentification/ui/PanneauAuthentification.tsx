/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { FormulaireConnexion } from "./FormulaireConnexion";
import { UtilisateurConnecte } from "../modele/authentification.types";

export interface PanneauAuthentificationProps {
  mode?: ModeAffichage;
  onConnexionReussie?: (utilisateur: UtilisateurConnecte) => void;
}

/** Croix médicale utilisée en filigrane (SVG inline, colorée via currentColor). */
const CroixFiligrane: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M38 0h24v38h38v24H62v38H38V62H0V38h38z" />
  </svg>
);

export const PanneauAuthentification: React.FC<PanneauAuthentificationProps> = ({
  mode = "edition",
  onConnexionReussie,
}) => {
  if (mode === "masque") return null;

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          MOBILE  (< md) — maquette mobile, logo réel, anims d'entrée
          ════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden min-h-screen bg-medical-pattern relative flex flex-col justify-center overflow-hidden">
        {/* Décors de fond : croix médicales flottantes */}
        <div
          className="fixed inset-0 overflow-hidden pointer-events-none z-0"
          aria-hidden="true"
        >
          <div className="animate-ambient-float-left">
            <CroixFiligrane className="absolute -left-10 top-12 w-28 h-60 text-white/45" />
            <CroixFiligrane className="absolute -left-24 top-28 w-56 h-28 text-white/45" />
          </div>
          <div className="animate-ambient-float-right">
            <CroixFiligrane className="absolute right-2 top-8 w-20 h-44 text-white/60" />
            <CroixFiligrane className="absolute -right-10 top-20 w-44 h-20 text-white/60" />
          </div>
        </div>

        <main className="relative z-10 w-full max-w-[420px] mx-auto px-4 pt-6 pb-8 flex flex-col items-center">
          {/* En-tête marque + vrai logo */}
          <header className="w-full text-center mb-6 pt-2 animate-entrance-1">
            <img
              src="/images/asina-logo.png"
              alt="ASINA — Association Sanitaire Interentreprises d'Antananarivo"
              className="w-26 h-26 mx-auto mb-2 object-contain transition-transform duration-500 ease-out hover:scale-105"
              draggable={false}
            />

            {/* Barre tricolore signature */}
            <div
              className="w-24 h-1.5 mx-auto mt-2 flex rounded-full overflow-hidden shadow-xs"
              aria-hidden="true"
            >
              <div className="w-1/3 bg-[#1e7e44]" />
              <div className="w-1/3 bg-[#0090d8]" />
              <div className="w-1/3 bg-[#fab028]" />
            </div>
          </header>

          {/* Accroche */}
          <div className="mt-4 px-3 text-center animate-entrance-2">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              Le dossier de santé de vos équipes, réuni au même endroit
            </h2>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              Dossiers patients, rendez-vous et stock : tout se gère depuis votre espace.
            </p>
          </div>

          {/* Carte formulaire */}
          <div className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 p-6 mt-6 animate-entrance-3">
            <FormulaireConnexion onConnexionReussie={onConnexionReussie} />
          </div>
        </main>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP  ( >= md) — décor de croix médicales animées
          ════════════════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════════════════
    DESKTOP  ( >= md) — décor animé + entrée en cascade
    ════════════════════════════════════════════════════════════════ */}
{/* ════════════════════════════════════════════════════════════════
    DESKTOP  ( >= md)
    ════════════════════════════════════════════════════════════════ */}
<div className="hidden md:flex relative min-h-screen overflow-hidden bg-[#F1F8F3] items-center justify-center p-4 sm:p-6 md:p-10 text-[#0E2F44] font-sans">

  {/* Croix médicales décoratives — statiques */}
  <CroixFiligrane className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 text-[#2FA14A]/[0.10]" />
  <CroixFiligrane className="pointer-events-none absolute -right-28 -bottom-28 h-[26rem] w-[26rem] text-[#2FA14A]/[0.12]" />
  <CroixFiligrane className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 text-[#2FA14A]/[0.08]" />

  {/* Carte principale animée */}
  <div className="relative w-full max-w-5xl bg-white rounded-[28px] border border-[#D2E6D6] shadow-[0_30px_70px_-25px_rgba(20,83,45,0.35)] overflow-hidden flex flex-col md:flex-row animate-card-in">

    {/* Colonne identité */}
    <aside className="relative md:w-[46%] bg-[#E4F3E8] px-8 py-12 sm:px-12 flex flex-col items-center justify-center text-center overflow-hidden animate-panel-left">
      <CroixFiligrane className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 text-[#2FA14A]/[0.14]" />
      <CroixFiligrane className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 text-[#2FA14A]/[0.12]" />

      <img
        src="/images/asina-logo.png"
        alt="ASINA – Association Sanitaire Interentreprises d'Antananarivo"
        className="relative w-56 sm:w-64 md:w-72 h-auto select-none"
        draggable={false}
      />

      <div className="relative mt-1 flex h-1.5 w-28 overflow-hidden rounded-full" aria-hidden="true">
        <span className="flex-[3] bg-[#2FA14A]" />
        <span className="flex-1 bg-[#1BB0EC]" />
        <span className="flex-1 bg-[#FBB74A]" />
      </div>

      <h2 className="relative mt-8 max-w-xs text-xl sm:text-2xl font-bold leading-snug tracking-tight text-[#14532D]">
        Le dossier de santé de vos équipes, réuni au même endroit
      </h2>
      <p className="relative mt-3 max-w-xs text-sm leading-relaxed text-[#0E2F44]/70">
        Dossiers patients, rendez-vous et stock : tout se gère depuis votre espace.
      </p>
    </aside>

    {/* Colonne formulaire */}
    <main className="flex-1 flex flex-col justify-center bg-white px-6 py-12 sm:px-12 md:px-16 animate-panel-right">
      <div className="w-full max-w-sm mx-auto">
        <FormulaireConnexion onConnexionReussie={onConnexionReussie} />
      </div>
    </main>
  </div>
</div>
    </>
  );
};

export default PanneauAuthentification;