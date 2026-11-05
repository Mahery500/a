/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modale } from "./Modale";

export interface ConfirmDialogProps {
  ouvert: boolean;
  titre: string;
  message: string;
  labelConfirmer?: string;
  labelAnnuler?: string;
  danger?: boolean;
  enCours?: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  ouvert,
  titre,
  message,
  labelConfirmer = "Confirmer",
  labelAnnuler = "Annuler",
  danger = false,
  enCours = false,
  onConfirmer,
  onAnnuler,
}) => {
  return (
    <Modale
      ouvert={ouvert}
      onFermer={onAnnuler}
      titre={titre}
      largeurMax="sm"
      icone={<AlertTriangle className={`w-5 h-5 ${danger ? "text-rose-600" : "text-amber-600"}`} />}
      enfants={<p className="text-xs text-slate-600 leading-relaxed">{message}</p>}
      pied={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={enCours}
            className="btn-secondary text-xs cursor-pointer"
          >
            {labelAnnuler}
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={enCours}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer ${
              danger
                ? "bg-rose-600 hover:bg-rose-700 shadow-xs"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-xs"
            }`}
          >
            {enCours ? "Traitement..." : labelConfirmer}
          </button>
        </div>
      }
    />
  );
};

export default ConfirmDialog;
