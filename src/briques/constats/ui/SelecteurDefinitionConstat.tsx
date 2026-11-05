/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { PencilLine, Stethoscope } from "lucide-react";
import type { DefinitionConstat } from "../modele/constat.types";

const CODE_CONSTAT_LIBRE = "CONSTAT_LIBRE";

export interface SelecteurDefinitionConstatProps {
  definitions: DefinitionConstat[];
  valeur: number | "";
  onChange: (id: number | "") => void;
  disabled?: boolean;
  chargement?: boolean;
}

export const SelecteurDefinitionConstat: React.FC<
  SelecteurDefinitionConstatProps
> = ({ definitions, valeur, onChange, disabled, chargement }) => {
  // Le constat libre est sorti des groupes pour être épinglé en haut.
  const constatLibre = useMemo(
    () =>
      definitions.find(
        (d) => d.code.toUpperCase() === CODE_CONSTAT_LIBRE,
      ) ?? null,
    [definitions],
  );

  // Les autres constats, groupés par catégorie (ordre alphabétique inchangé).
  const groupes = useMemo(() => {
    const map = new Map<string, DefinitionConstat[]>();
    for (const d of definitions) {
      if (d.code.toUpperCase() === CODE_CONSTAT_LIBRE) continue;
      const cle = d.categorieLibelle || "Autres";
      const arr = map.get(cle) ?? [];
      arr.push(d);
      map.set(cle, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [definitions]);

  const libreSelectionne =
    constatLibre !== null && valeur === constatLibre.id;

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472] flex items-center gap-1.5">
        <Stethoscope className="h-3.5 w-3.5" />
        Constat à enregistrer <span className="text-[#b42318]">*</span>
      </span>

      <select
        value={valeur}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : "")
        }
        disabled={disabled || chargement}
        className={`h-10 px-3 border rounded-[10px] text-sm bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa] disabled:text-[#5b6472]/60 disabled:cursor-not-allowed ${
          libreSelectionne
            ? "border-[#1f9d55] text-[#14703c] font-semibold"
            : "border-[#e5e7eb] text-[#1f2937] focus:border-[#1f9d55]"
        }`}
      >
        <option value="">
          {chargement ? "Chargement…" : "— Sélectionner un constat —"}
        </option>

        {/* ═══ Épinglé : le constat libre en haut, toujours visible ═══ */}
        {constatLibre && (
          <option value={constatLibre.id}>
            ✏️ Constat libre — décrire ce que je vois
          </option>
        )}

        {/* ═══ Les constats habituels, groupés par examen ═══ */}
        {groupes.map(([catLibelle, defs]) => (
          <optgroup key={catLibelle} label={catLibelle}>
            {defs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.libelle} ({d.code})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Aide contextuelle : uniquement si rien n'est encore choisi,
          pour ne pas polluer une saisie en cours. */}
      {!chargement && valeur === "" && constatLibre && (
        <span className="text-[11px] text-[#5b6472] flex items-center gap-1">
          <PencilLine className="h-3 w-3 text-[#1f9d55]" aria-hidden="true" />
          Votre constat n'est pas dans la liste ? Choisissez{" "}
          <b className="font-semibold">« Constat libre »</b> en haut du menu.
        </span>
      )}

      {!chargement && definitions.length === 0 && (
        <span className="text-[12px] text-[#8a5300]">
          Aucun constat n'est configuré dans le catalogue. Ajoutez-en via
          Administration › Observations Cliniques (catégorie racine EXAMEN_CLINIQUE).
        </span>
      )}
    </label>
  );
};