/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions/types";
import {
  useConstats,
  FormulaireConstat,
  ListeConstats,
} from "@/briques/constats";

export interface OngletConstatsProps {
  mode: ModeAffichage;
  encounterId: number;
}

export const OngletConstats: React.FC<OngletConstatsProps> = ({
  mode,
  encounterId,
}) => {
  const {
    constats,
    definitions,
    chargement,
    chargementDefs,
    enregistrement,
    erreur,
    inclureInactifs,
    setInclureInactifs,
    ajouter,
    rafraichir,
  } = useConstats(encounterId);

  if (mode === "masque") {
    return (
      <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous n'avez pas les droits pour consulter ou saisir des constats.
      </div>
    );
  }

  if (!encounterId) {
    return (
      <div className="p-8 text-center text-[#5b6472] text-xs">
        Aucune prise en charge active.
      </div>
    );
  }

  const estModifiable = mode === "edition";

  return (
    <div className="p-5 flex flex-col lg:flex-row gap-5">
      {/* ================================================================ */}
      {/*  Colonne gauche : formulaire de saisie                           */}
      {/* ================================================================ */}
      <div className="flex-1 min-w-0">
        {estModifiable ? (
          <FormulaireConstat
            definitions={definitions}
            chargementDefs={chargementDefs}
            enregistrement={enregistrement}
            onSubmit={ajouter}
          />
        ) : (
          <div className="p-4 rounded-[10px] bg-[#fff4e0] border border-[#f3d9a8] text-[#8a5300] text-xs">
            Mode lecture seule : la saisie de constats est désactivée.
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  Colonne droite : constats enregistrés                           */}
      {/* ================================================================ */}
      <aside
        className="lg:w-[340px] lg:shrink-0 lg:border-l lg:border-[#f0f2f1] lg:pl-5"
        aria-label="Constats enregistrés"
      >
        {erreur && (
          <div
            role="alert"
            className="mb-2 p-2 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs"
          >
            {erreur}
          </div>
        )}

        <ListeConstats
          constats={constats}
          chargement={chargement}
          inclureInactifs={inclureInactifs}
          onToggleInactifs={setInclureInactifs}
          onRafraichir={rafraichir}
        />
      </aside>
    </div>
  );
};

export default OngletConstats;