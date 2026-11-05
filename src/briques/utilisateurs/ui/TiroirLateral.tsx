/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";

export interface TiroirLateralProps {
  ouvert: boolean;
  onFermer: () => void;
  /** Empêche la fermeture (Échap / clic sur le voile) pendant un envoi. */
  fermetureBloquee?: boolean;
  libelle: string;
  children: React.ReactNode;
}

export const TiroirLateral: React.FC<TiroirLateralProps> = ({
  ouvert,
  onFermer,
  fermetureBloquee = false,
  libelle,
  children,
}) => {
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !fermetureBloquee) onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert, fermetureBloquee, onFermer]);

  if (!ouvert) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[#0f1b3d]/45"
        onClick={() => {
          if (!fermetureBloquee) onFermer();
        }}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={libelle}
        className="fixed top-0 right-0 bottom-0 z-[61] w-[560px] max-w-full bg-white flex flex-col shadow-[-8px_0_32px_rgba(15,27,61,0.18)] text-[#1f2937]"
      >
        {children}
      </aside>
    </>
  );
};

export default TiroirLateral;