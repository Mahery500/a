import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface BottomSheetProps {
  ouvert: boolean;
  onFermer: () => void;
  titre?: React.ReactNode;
  sousTitre?: React.ReactNode;
  fermetureBloquee?: boolean;
  hauteurMax?: string;
  /** Contenu — alias de `children`. */
  enfants?: React.ReactNode;
  /** Contenu — syntaxe JSX classique. */
  children?: React.ReactNode;
  pied?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  ouvert,
  onFermer,
  titre,
  sousTitre,
  fermetureBloquee = false,
  hauteurMax = "90vh",
  enfants,
  children,
  pied,
}) => {
  const contenu = enfants ?? children;

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !fermetureBloquee) onFermer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert, fermetureBloquee, onFermer]);

  if (!ouvert) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-[rgba(15,27,61,.45)]"
        onClick={() => !fermetureBloquee && onFermer()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof titre === "string" ? titre : undefined}
        className="fixed left-0 right-0 bottom-0 z-[71] bg-white rounded-t-[20px] shadow-[0_-6px_24px_rgba(15,27,61,.2)] flex flex-col animate-slide-in"
        style={{ maxHeight: hauteurMax }}
      >
        <div
          className="w-10 h-1 rounded bg-[#cbd5e1] mx-auto mt-2 shrink-0"
          aria-hidden="true"
        />

        {(titre || sousTitre) && (
          <div className="px-4 pt-2.5 pb-3 shrink-0 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {titre && (
                <div className="text-[18px] font-extrabold leading-tight text-[#1f2937]">
                  {titre}
                </div>
              )}
              {sousTitre && (
                <div className="text-[12px] text-[#5b6472] mt-0.5">{sousTitre}</div>
              )}
            </div>
            <button
              type="button"
              onClick={onFermer}
              disabled={fermetureBloquee}
              aria-label="Fermer"
              className="w-11 h-11 -mr-2 grid place-items-center rounded-[10px] text-[#1f2937] hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              <X className="w-[22px] h-[22px]" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0">{contenu}</div>

        {pied && (
          <div className="border-t border-[#f0f2f1] px-4 py-3 pb-5 shrink-0">
            {pied}
          </div>
        )}
      </div>
    </>
  );
};

export default BottomSheet;