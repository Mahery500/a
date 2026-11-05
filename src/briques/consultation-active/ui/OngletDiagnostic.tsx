/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import type {
  DiagnosticDefinitionItem,
  TypeDiagnostic,
  StatutDiagnostic,
} from "@/briques/consultation-active";
import { ComboboxCim10 } from "./ComboboxCim10";

export interface OngletDiagnosticProps {
  catalogue: DiagnosticDefinitionItem[];
  onPoser: (input: {
    diagnosticDefinitionId: number;
    type: TypeDiagnostic;
    statut: StatutDiagnostic;
    commentaire: string | null;
  }) => Promise<unknown>;
  estModifiable: boolean;
}

const CHAMP =
  "w-full h-10 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] " +
  "focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";

const LABEL = "block text-xs font-bold text-[#5b6472] mb-1.5";

export const OngletDiagnostic: React.FC<OngletDiagnosticProps> = ({
  catalogue,
  onPoser,
  estModifiable,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();
  const [selection, setSelection] = useState<DiagnosticDefinitionItem | null>(null);
  const [categorie, setCategorie] = useState<TypeDiagnostic>("principal");
  const [statut, setStatut] = useState<StatutDiagnostic>("provisoire");
  const [note, setNote] = useState("");
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection) return;
    setEnCours(true);
    try {
      await onPoser({
        diagnosticDefinitionId: selection.id,
        type: categorie,
        statut,
        commentaire: note.trim() || null,
      });
      notifierSucces("Diagnostic posé.");
      setSelection(null);
      setNote("");
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="p-5 space-y-3.5">
      <div>
        <label className={LABEL}>
          Diagnostic (CIM-10) <b className="text-[#b42318]">*</b>
        </label>
        <ComboboxCim10
          options={catalogue}
          valeurSelectionnee={selection}
          onChange={setSelection}
          disabled={!estModifiable || enCours}
        />
        <p className="mt-1.5 text-xs text-[#5b6472]">
          Un seul champ : la liste se filtre pendant la saisie.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={LABEL}>
            Catégorie <b className="text-[#b42318]">*</b>
          </label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value as TypeDiagnostic)}
            disabled={!estModifiable || enCours}
            className={CHAMP}
          >
            <option value="principal">Diagnostic principal</option>
            <option value="secondaire">Diagnostic secondaire</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>
            Statut <b className="text-[#b42318]">*</b>
          </label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as StatutDiagnostic)}
            disabled={!estModifiable || enCours}
            className={CHAMP}
          >
            <option value="provisoire">Provisoire</option>
            <option value="confirme">Confirmé</option>
            <option value="infirme">Infirmé</option>
          </select>
        </div>
      </div>

      <div>
        <label className={LABEL}>
          Commentaire <span className="font-normal">(facultatif)</span>
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!estModifiable || enCours}
          placeholder="Précisions cliniques…"
          className="w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#1f2937] resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa]"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm text-[#5b6472]">
          {selection ? "Prêt à enregistrer." : "Aucun diagnostic sélectionné pour l’instant."}
        </span>
        {estModifiable && (
          <button
            type="submit"
            disabled={!selection || enCours}
            className="h-10 px-4 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{enCours ? "Enregistrement…" : "Ajouter le diagnostic"}</span>
          </button>
        )}
      </div>
    </form>
  );
};

export default OngletDiagnostic;