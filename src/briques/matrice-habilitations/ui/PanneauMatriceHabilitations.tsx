/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import type { ModeAffichage } from "@/cerveau/permissions/types";
import { useMatriceHabilitations } from "../hooks/useMatriceHabilitations";
import type { OngletMatrice } from "../modele/matrice-habilitations.types";
import { VueParHabilitation } from "./VueParHabilitation";
import { VueParCible } from "./VueParCible";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

export interface PanneauMatriceHabilitationsProps {
  mode?: ModeAffichage;
}

export const PanneauMatriceHabilitations: React.FC<
  PanneauMatriceHabilitationsProps
> = ({ mode = "edition" }) => {
  const [onglet, setOnglet] = useState<OngletMatrice>("par_habilitation");
  const {
    actes,
    diagnostics,
    chargement,
    erreur,
    recharger,
    definirHabilitations,
  } = useMatriceHabilitations();

  if (mode === "masque") return null;

  const onglets: { id: OngletMatrice; libelle: string }[] = [
    { id: "par_habilitation", libelle: "Par habilitation" },
    { id: "par_cible", libelle: "Par acte ou diagnostic" },
  ];

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* En-tête */}
      <div>
        <h1 className="text-[22px] font-bold leading-tight">
          Matrice des habilitations
        </h1>
        <p className="text-[13px] text-[#5b6472] mt-0.5">
          Vue croisée des droits : actes et diagnostics autorisés par corps médical,
          et habilitations détaillées par acte.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e7eb]" role="tablist">
        {onglets.map((o) => {
          const actif = onglet === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => setOnglet(o.id)}
              className={`h-11 px-5 flex items-center text-sm whitespace-nowrap cursor-pointer transition-colors border-b-2 ${FOCUS} ${
                actif
                  ? "text-[#14703c] font-bold border-[#1f9d55]"
                  : "text-[#5b6472] font-semibold border-transparent hover:text-[#1f2937]"
              }`}
            >
              {o.libelle}
            </button>
          );
        })}
      </div>

      {/* Erreur de chargement */}
      {erreur && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-rose-700 text-xs flex items-center justify-between">
          <span>{erreur}</span>
          <button
            type="button"
            onClick={recharger}
            className="font-bold underline cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Contenu */}
      {chargement ? (
        <div className="p-12 text-center text-[13px] text-[#5b6472]">
          Chargement des habilitations…
        </div>
      ) : onglet === "par_habilitation" ? (
        <VueParHabilitation actes={actes} diagnostics={diagnostics} />
      ) : (
        <VueParCible
          actes={actes}
          diagnostics={diagnostics}
          onDefinirHabilitations={definirHabilitations}
        />
      )}
    </div>
  );
};

export default PanneauMatriceHabilitations;