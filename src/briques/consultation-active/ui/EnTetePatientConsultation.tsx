/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, FolderHeart, ShieldAlert } from "lucide-react";

export interface VitalsConsultation {
  poids?: string;
  tension?: string;
  temperature?: string;
  pouls?: string;
}

export interface EnTetePatientConsultationProps {
  patientNom?: string;
  ticketNumero?: string;
  encounterId: number;
  /** Libellés des allergies actives (pas les critiques — voir `allergiesCritiques`). */
  allergies?: string[];
  /** Libellés des allergies actives à criticité élevée. */
  allergiesCritiques?: string[];
  dureeMinutes?: number;
  onVoirDossiers?: () => void;
  /** Ouvre l'onglet Allergies de la consultation. */
  onVoirAllergies?: () => void;
}

export const EnTetePatientConsultation: React.FC<EnTetePatientConsultationProps> = ({
  patientNom,
  ticketNumero,
  encounterId,
  allergies = [],
  allergiesCritiques = [],
  dureeMinutes = 0,
  onVoirDossiers,
  onVoirAllergies,
}) => {
  const aAllergies = allergies.length > 0;
  const aCritiques = allergiesCritiques.length > 0;

  const badgeClasses = aCritiques
    ? "bg-rose-100 text-rose-800 border border-rose-300 ring-2 ring-rose-200"
    : aAllergies
      ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
      : "bg-[#fff4e0] text-[#8a5300] hover:bg-[#ffe9c7]";

  return (
    <div className="bg-[#e7f6ed] border border-[#1f9d55] rounded-[14px] px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-bold text-[#14703c] leading-tight truncate">
          {patientNom || "Patient"}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-[3px] rounded-full bg-[#1f9d55] text-white">
            Consultation en cours
          </span>
          {ticketNumero && (
            <span className="font-mono text-xs font-bold px-2 py-[3px] rounded bg-white text-[#14703c] border border-[#1f9d55]/30">
              Ticket {ticketNumero}
            </span>
          )}
          <span className="text-xs text-[#14703c]/90">
            Dossier #{encounterId} · démarrée il y a {dureeMinutes} min
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          type="button"
          onClick={onVoirAllergies}
          disabled={!onVoirAllergies}
          title={
            onVoirAllergies
              ? "Ouvrir l'onglet Allergies de la consultation"
              : undefined
          }
          className={`text-xs font-semibold px-3 py-2 rounded-[10px] inline-flex items-center gap-1.5 transition ${badgeClasses} ${
            onVoirAllergies ? "cursor-pointer" : "cursor-default"
          }`}
        >
          {aCritiques ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                ⚠ Allergies critiques : {allergiesCritiques.join(", ")}
              </span>
            </>
          ) : aAllergies ? (
            <>
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Allergies : {allergies.join(", ")}</span>
            </>
          ) : (
            <span>Allergies non renseignées · cliquez pour ajouter</span>
          )}
        </button>

        {onVoirDossiers && (
          <button
            type="button"
            onClick={onVoirDossiers}
            className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#fafbfa] cursor-pointer transition-colors"
          >
            <FolderHeart className="w-4 h-4 text-[#14703c]" />
            Dossier patient
          </button>
        )}
      </div>
    </div>
  );
};

export default EnTetePatientConsultation;