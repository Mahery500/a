import React from "react";
import { Edit2, CheckCircle2, Trash2 } from "lucide-react";
import { BottomSheet } from "@/noyau/ui/mobile/BottomSheet";
import type { AffectationPersonnel } from "../../modele/affectation.types";

export interface MenuActionsAffectationSheetProps {
  ouvert: boolean;
  affectation: AffectationPersonnel | null;
  onFermer: () => void;
  onModifier: () => void;
  onCloturer: () => void;
  onSupprimer: () => void;
}

const LIGNE =
  "w-full min-h-[52px] flex items-center gap-3 px-1 text-left text-[15px] font-semibold text-[#1f2937] hover:bg-slate-50 rounded-[10px]";

export const MenuActionsAffectationSheet: React.FC<MenuActionsAffectationSheetProps> = ({
  ouvert, affectation, onFermer, onModifier, onCloturer, onSupprimer,
}) => {
  if (!affectation) return null;

  const nom = `${affectation.nomPersonnel ?? ""} ${affectation.prenomPersonnel ?? ""}`.trim();

  return (
    <BottomSheet
      ouvert={ouvert}
      onFermer={onFermer}
      titre={nom || `Personnel #${affectation.staffId}`}
      sousTitre={`${affectation.nomService} · ${affectation.nomSite}`}
      hauteurMax="70vh"
    >
      <div className="py-1">
        <button type="button" className={LIGNE} onClick={onModifier}>
          <Edit2 className="w-5 h-5 text-[#5b6472] shrink-0" />
          Modifier l'affectation
        </button>

        {affectation.actif && (
          <button type="button" className={LIGNE} onClick={onCloturer}>
            <CheckCircle2 className="w-5 h-5 text-[#5b6472] shrink-0" />
            Clôturer l'affectation
          </button>
        )}

        <div className="border-t border-[#f0f2f1] mt-1.5 pt-1.5">
          <button
            type="button"
            className={`${LIGNE} !text-[#b42318]`}
            onClick={onSupprimer}
          >
            <Trash2 className="w-5 h-5 shrink-0" />
            Supprimer
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default MenuActionsAffectationSheet;