/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RefreshCw, Check } from "lucide-react";

export interface ActionsFormulaireProps {
  onAnnuler?: () => void;
  surAnnuler?: () => void;
  onValider?: () => void;
  idFormulaire?: string;
  labelValider?: string;
  texteValider?: string;
  texteValidation?: string;
  labelAnnuler?: string;
  enCours?: boolean;
  chargement?: boolean;
  desactive?: boolean;
  variante?: "primaire" | "danger";
  iconeValider?: React.ReactNode;
}

export const ActionsFormulaire: React.FC<ActionsFormulaireProps> = ({
  onAnnuler,
  surAnnuler,
  onValider,
  idFormulaire,
  labelValider,
  texteValider,
  texteValidation,
  labelAnnuler = "Annuler",
  enCours = false,
  chargement = false,
  desactive = false,
  variante = "primaire",
  iconeValider,
}) => {
  const annuler = onAnnuler ?? surAnnuler;
  const libelleValider = labelValider ?? texteValider ?? texteValidation ?? "Enregistrer";
  const estEnCours = enCours || chargement;

  const classesBoutonValider =
    variante === "danger" ? "bg-rose-600 hover:bg-rose-700 text-white" : "btn-primary";

  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
      {annuler && (
        <button
          type="button"
          disabled={estEnCours}
          onClick={annuler}
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium text-xs transition disabled:opacity-50"
        >
          {labelAnnuler}
        </button>
      )}

      <button
        type={idFormulaire || !onValider ? "submit" : "button"}
        form={idFormulaire}
        onClick={onValider}
        disabled={estEnCours || desactive}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs ${classesBoutonValider}`}
      >
        {estEnCours ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Enregistrement...</span>
          </>
        ) : (
          <>
            {iconeValider || <Check className="h-3.5 w-3.5" />}
            <span>{libelleValider}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ActionsFormulaire;
