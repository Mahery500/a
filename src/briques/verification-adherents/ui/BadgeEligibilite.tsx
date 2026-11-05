/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { AdherentEligibilite } from "../modele/verification-adherent.types";

export interface BadgeEligibiliteProps {
  eligibilite: AdherentEligibilite;
  compact?: boolean;
}

export const BadgeEligibilite: React.FC<BadgeEligibiliteProps> = ({
  eligibilite,
  compact = false,
}) => {
  if (eligibilite.statut === "ELIGIBLE") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span>{eligibilite.label}</span>
        {!compact && (
          <span className="text-[10px] font-normal text-emerald-600/80 ml-1">
            (Convention active)
          </span>
        )}
      </div>
    );
  }

  if (eligibilite.statut === "NON_ELIGIBLE") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
        <span>{eligibilite.label}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
      <span>{eligibilite.label}</span>
    </div>
  );
};
