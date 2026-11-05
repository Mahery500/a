/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Printer } from "lucide-react";

export interface TicketPrintPreviewProps {
  numero: string;
  patientNom: string;
  matricule?: string;
  serviceNom: string;
  dateEmission?: string;
  heureEmission?: string;
  surImprimer?: () => void;
  className?: string;
}

export const TicketPrintPreview: React.FC<TicketPrintPreviewProps> = ({
  numero,
  patientNom,
  matricule,
  serviceNom,
  dateEmission = new Date().toLocaleDateString("fr-FR"),
  heureEmission = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  surImprimer,
  className = "",
}) => {
  return (
    <div
      className={`p-6 bg-slate-50 border-2 border-dashed border-slate-350 rounded-2xl flex flex-col items-center text-center font-mono ${className}`}
    >
      <div className="w-full max-w-[260px] bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-slate-800 space-y-3">
        <div className="border-b border-dashed border-slate-200 pb-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            ASINA — Santé au Travail
          </span>
          <span className="text-[9px] text-slate-400 block">Antananarivo</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
            Votre Numéro d'Appel
          </span>
          <div className="text-3xl font-black text-slate-900 tracking-wider py-1 font-mono">
            {numero}
          </div>
          <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-150 inline-block mt-0.5">
            {serviceNom}
          </span>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-2 text-[11px] text-slate-600 text-left space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Patient:</span>
            <span className="font-bold truncate max-w-[150px]">{patientNom}</span>
          </div>
          {matricule && (
            <div className="flex justify-between">
              <span className="text-slate-400">Matricule:</span>
              <span>{matricule}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] text-slate-400 pt-1">
            <span>{dateEmission}</span>
            <span>{heureEmission}</span>
          </div>
        </div>

        <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-2">
          Merci de patienter en salle d’attente jusqu’à l’appel sur écran.
        </div>
      </div>

      {surImprimer && (
        <button
          type="button"
          onClick={surImprimer}
          className="mt-4 btn-primary text-xs flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Lancer l'impression</span>
        </button>
      )}
    </div>
  );
};

export default TicketPrintPreview;
