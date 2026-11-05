/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert } from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions/types";
import { useConstats } from "../hooks/useConstats";
import { FormulaireConstat } from "./FormulaireConstat";
import { ListeConstats } from "./ListeConstats";

export interface PanneauConstatsProps {
  mode?: ModeAffichage;
  encounterId?: number | null;
}

/**
 * Panneau réutilisable de gestion des constats cliniques :
 *   - liste chronologique (avec filtre « afficher les corrigés / erreurs »)
 *   - formulaire d'ajout (adapté au type de valeur du constat)
 *
 * Le backend autorise uniquement GET + POST pour l'instant : la correction
 * d'un constat se fait par création d'une nouvelle observation (le statut
 * `corrige` / `saisi_par_erreur` devra être exposé par un futur endpoint).
 */
export const PanneauConstats: React.FC<PanneauConstatsProps> = ({
  mode = "edition",
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
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
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
    <div className="space-y-4">
      {erreur && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs">
          {erreur}
        </div>
      )}

      {estModifiable && (
        <section className="p-5 bg-white rounded-[14px] border border-[#e5e7eb]">
          <FormulaireConstat
            definitions={definitions}
            chargementDefs={chargementDefs}
            enregistrement={enregistrement}
            onSubmit={ajouter}
          />
        </section>
      )}

      <section className="p-5 bg-white rounded-[14px] border border-[#e5e7eb]">
        <ListeConstats
          constats={constats}
          chargement={chargement}
          inclureInactifs={inclureInactifs}
          onToggleInactifs={setInclureInactifs}
          onRafraichir={rafraichir}
        />
      </section>
    </div>
  );
};

export default PanneauConstats;