/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Trash2, Stethoscope } from "lucide-react";
import type { HabilitationInput } from "./habilitations.types";
import { useReferentielsHabilitations } from "./useReferentielsHabilitations";

export interface SelecteurHabilitationsProps {
  value: HabilitationInput[];
  onChange: (next: HabilitationInput[]) => void;
  disabled?: boolean;
  /** Affiche un message rouge si vide (défaut: true). */
  required?: boolean;
}

const CHAMP =
  "w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500";

export const SelecteurHabilitations: React.FC<SelecteurHabilitationsProps> = ({
  value,
  onChange,
  disabled = false,
  required = true,
}) => {
  const { corpsMedicaux, specialites, chargement, erreur } = useReferentielsHabilitations();

  const [corpsSelectionne, setCorpsSelectionne] = useState<string>("");
  const [specialiteSelectionnee, setSpecialiteSelectionnee] = useState<string>("");

  const libelleCorps = (code: string): string =>
    corpsMedicaux.find((c) => c.code === code)?.libelle ?? code;
  const libelleSpecialite = (code?: string | null): string | null =>
    code ? (specialites.find((s) => s.code === code)?.libelle ?? code) : null;

  const ajouter = () => {
    if (!corpsSelectionne) return;
    const existe = value.some(
      (h) =>
        h.corpsMedicalCode === corpsSelectionne &&
        (h.specialiteCode ?? null) === (specialiteSelectionnee || null),
    );
    if (existe) return; // doublon silencieux
    onChange([
      ...value,
      {
        corpsMedicalCode: corpsSelectionne,
        specialiteCode: specialiteSelectionnee || null,
      },
    ]);
    setSpecialiteSelectionnee("");
  };

  const supprimer = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const corpsTries = [...corpsMedicaux].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  const specialitesTriees = [...specialites].sort((a, b) =>
    a.libelle.localeCompare(b.libelle, "fr"),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-slate-700 font-semibold text-xs flex items-center gap-1.5">
          <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
          <span>Habilitations requises</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        <span className="text-[10px] text-slate-400">
          {value.length} habilitation{value.length > 1 ? "s" : ""}
        </span>
      </div>

      {erreur && (
        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px]">
          {erreur}
        </div>
      )}

      {/* Liste des habilitations déjà ajoutées */}
      {value.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic px-2 py-1">
          Aucune habilitation sélectionnée.
        </p>
      ) : (
        <ul className="space-y-1">
          {value.map((h, i) => {
            const specLib = libelleSpecialite(h.specialiteCode);
            return (
              <li
                key={`${h.corpsMedicalCode}-${h.specialiteCode ?? "-"}-${i}`}
                className="flex items-center justify-between gap-2 p-2 bg-asina-50/60 border border-asina-200 rounded-lg text-xs"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-asina-900 truncate">
                    {libelleCorps(h.corpsMedicalCode)}
                  </span>
                  {specLib && (
                    <span className="text-[10px] bg-white text-asina-700 border border-asina-200 px-1.5 py-0.5 rounded">
                      {specLib}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => supprimer(i)}
                  disabled={disabled}
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer disabled:opacity-40"
                  aria-label="Retirer cette habilitation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Formulaire d'ajout */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
              Corps médical
            </label>
            <select
              value={corpsSelectionne}
              onChange={(e) => setCorpsSelectionne(e.target.value)}
              disabled={disabled || chargement}
              className={CHAMP}
            >
              <option value="">{chargement ? "Chargement…" : "— Sélectionner —"}</option>
              {corpsTries.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.libelle} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
              Spécialité <span className="text-slate-400">(facultatif)</span>
            </label>
            <select
              value={specialiteSelectionnee}
              onChange={(e) => setSpecialiteSelectionnee(e.target.value)}
              disabled={disabled || chargement}
              className={CHAMP}
            >
              <option value="">— Toutes les spécialités —</option>
              {specialitesTriees.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.libelle} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={ajouter}
          disabled={disabled || !corpsSelectionne || chargement}
          className="w-full py-1.5 bg-asina-600 hover:bg-asina-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter l'habilitation</span>
        </button>
      </div>

      {required && value.length === 0 && (
        <p className="text-[11px] text-rose-600 font-medium">
          Au moins une habilitation est obligatoire.
        </p>
      )}
    </div>
  );
};

export default SelecteurHabilitations;