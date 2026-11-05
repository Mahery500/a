/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { Modale } from "./Modale";

export interface ModaleConfirmationSuppressionProps {
  ouvert: boolean;
  onFermer: () => void;
  onConfirmer: () => void | Promise<void>;
  titre?: string;
  message?: string;
  nomElement?: string;
  enCours?: boolean;
}

export const ModaleConfirmationSuppression: React.FC<ModaleConfirmationSuppressionProps> = ({
  ouvert,
  onFermer,
  onConfirmer,
  titre = "Confirmer la suppression",
  message = "Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?",
  nomElement,
  enCours = false,
}) => {
  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre={titre}
      largeurMax="sm"
      icone={<AlertTriangle className="h-4 w-4 text-rose-600" />}
      enfants={
        <div className="space-y-3">
          <p className="text-slate-600 leading-relaxed">{message}</p>
          {nomElement && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-semibold font-mono text-[11px]">
              {nomElement}
            </div>
          )}
        </div>
      }
      pied={
        <>
          <button
            type="button"
            disabled={enCours}
            onClick={onFermer}
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium text-xs disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={enCours}
            onClick={onConfirmer}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {enCours ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Supprimer</span>
              </>
            )}
          </button>
        </>
      }
    />
  );
};

export default ModaleConfirmationSuppression;
