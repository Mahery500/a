/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import type {
  DefinitionConstat,
  NouveauConstatInput,
} from "../modele/constat.types";
import { SelecteurDefinitionConstat } from "./SelecteurDefinitionConstat";
import { ChampValeurConstat } from "./ChampValeurConstat";

export interface FormulaireConstatProps {
  definitions: DefinitionConstat[];
  chargementDefs: boolean;
  enregistrement: boolean;
  onSubmit: (input: NouveauConstatInput) => Promise<unknown>;
  disabled?: boolean;
}

const isoLocal = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

export const FormulaireConstat: React.FC<FormulaireConstatProps> = ({
  definitions,
  chargementDefs,
  enregistrement,
  onSubmit,
  disabled = false,
}) => {
  const [definitionId, setDefinitionId] = useState<number | "">("");
  const [valeur, setValeur] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [dateObservation, setDateObservation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const definition = definitions.find((d) => d.id === definitionId) ?? null;

  // Réinitialisation de la valeur quand la définition change
  useEffect(() => {
    if (!definition) {
      setValeur("");
      return;
    }
    setValeur(definition.typeValeur === "booleen" ? "" : "");
    setErreur(null);
  }, [definition?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!definition) return setErreur("Veuillez choisir un constat.");
    const v = valeur.trim();
    if (!v) return setErreur("La valeur est obligatoire.");

    // Validations client par type (le backend reste garant du résultat final)
    if (definition.typeValeur === "numerique") {
      const vNum = v.replace(",", ".");
      if (!/^-?\d+(\.\d+)?$/.test(vNum)) {
        return setErreur(
          "La valeur doit être un nombre valide (ex. 37.5, 120/80 non supporté).",
        );
      }
    }
    if (definition.typeValeur === "booleen") {
      if (!["true", "false"].includes(v.toLowerCase())) {
        return setErreur("La valeur doit être true ou false.");
      }
    }
    if (dateObservation && new Date(dateObservation) > new Date()) {
      return setErreur("La date d'observation ne peut pas être dans le futur.");
    }

    try {
      await onSubmit({
        observationDefinitionId: definition.id,
        valeur: v,
        commentaire: commentaire.trim() || null,
        dateObservation: dateObservation || null,
      });
      // Succès : on vide le formulaire
      setDefinitionId("");
      setValeur("");
      setCommentaire("");
      setDateObservation("");
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    }
  };

  const bloque = disabled || enregistrement;

  return (
    <form onSubmit={soumettre} className="space-y-3.5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-[#1f2937]">Nouveau constat clinique</h3>
        <span className="text-[11px] text-[#5b6472]">
          Observation faite pendant la prise en charge, sans acte
        </span>
      </div>

      {erreur && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs">
          {erreur}
        </div>
      )}

      <SelecteurDefinitionConstat
        definitions={definitions}
        valeur={definitionId}
        onChange={(v) => setDefinitionId(v)}
        disabled={bloque}
        chargement={chargementDefs}
      />

      {definition && (
        <ChampValeurConstat
          definition={definition}
          valeur={valeur}
          onChange={setValeur}
          disabled={bloque}
        />
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
          Commentaire / nuance{" "}
          <span className="font-normal normal-case tracking-normal">
            (facultatif, 2000 caractères max)
          </span>
        </span>
        <textarea
          rows={2}
          maxLength={2000}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          disabled={bloque}
          placeholder="Ex. bilatéral, depuis 3 jours, sur peau pâle…"
          className="w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa] disabled:text-[#5b6472]/60"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
          Date d'observation{" "}
          <span className="font-normal normal-case tracking-normal">
            (par défaut : maintenant)
          </span>
        </span>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={dateObservation}
            max={isoLocal(new Date())}
            onChange={(e) => setDateObservation(e.target.value)}
            disabled={bloque}
            className="flex-1 h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa]"
          />
          {dateObservation && (
            <button
              type="button"
              onClick={() => setDateObservation("")}
              disabled={bloque}
              className="px-3 rounded-[10px] border border-[#e5e7eb] bg-white text-xs font-semibold text-[#5b6472] hover:bg-[#fafbfa] cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={bloque || !definition || !valeur.trim()}
          className="h-10 px-4 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
        >
          {enregistrement ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Enregistrer le constat
            </>
          )}
        </button>
      </div>
    </form>
  );
};