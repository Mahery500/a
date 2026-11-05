/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import {
  DiagnosticDefinition,
  CodificationDiagnostic,
  CodeSystemeOption,
} from "../modele/diagnostic-definition.types";

export interface FormulaireCodificationsDiagnosticModaleProps {
  ouvert: boolean;
  onFermer: () => void;
  definition: DiagnosticDefinition | null;
  codeSystems: CodeSystemeOption[];
  onEnregistrer: (id: number, codifications: CodificationDiagnostic[]) => Promise<boolean>;
}

export const FormulaireCodificationsDiagnosticModale: React.FC<
  FormulaireCodificationsDiagnosticModaleProps
> = ({ ouvert, onFermer, definition, codeSystems, onEnregistrer }) => {
  const [lignes, setLignes] = useState<CodificationDiagnostic[]>([]);
  const [nouveauCodeSystem, setNouveauCodeSystem] = useState<string>("");
  const [nouveauCode, setNouveauCode] = useState<string>("");
  const [nouveauLibelle, setNouveauLibelle] = useState<string>("");
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);

  useEffect(() => {
    if (definition) {
      setLignes(definition.codifications ? [...definition.codifications] : []);
    } else {
      setLignes([]);
    }
    const premierCS = codeSystems.find((c) => c.actif)?.code || (codeSystems[0]?.code ?? "");
    setNouveauCodeSystem(premierCS);
    setNouveauCode("");
    setNouveauLibelle("");
  }, [definition, codeSystems, ouvert]);

  if (!definition) return null;

  const handleAjouterLigne = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouveauCodeSystem.trim() || !nouveauCode.trim()) return;

    setLignes((prec) => [
      ...prec,
      {
        codeSystem: nouveauCodeSystem.trim(),
        code: nouveauCode.trim().toUpperCase(),
        libelle: nouveauLibelle.trim() || undefined,
      },
    ]);

    setNouveauCode("");
    setNouveauLibelle("");
  };

  const handleSupprimerLigne = (index: number) => {
    setLignes((prec) => prec.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSoumissionEnCours(true);
    try {
      const succes = await onEnregistrer(definition.id, lignes);
      if (succes) {
        onFermer();
      }
    } finally {
      setSoumissionEnCours(false);
    }
  };

  return (
    <Modale
      ouvert={ouvert}
      onFermer={onFermer}
      titre={`Codifications internationales : ${definition.code}`}
      largeurMax="lg"
    >
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <p className="font-semibold text-slate-800">{definition.libelle}</p>
          {definition.chapitre && (
            <p className="text-slate-500 text-[11px] mt-0.5">Chapitre : {definition.chapitre}</p>
          )}
        </div>

        {/* Lignes actuelles */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Codes associés ({lignes.length})
          </h4>

          {lignes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Aucune codification externe associée pour ce diagnostic.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {lignes.map((l, index) => (
                <div
                  key={`${l.codeSystem}-${l.code}-${index}`}
                  className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-mono font-bold text-[10px]">
                      {l.codeSystem}
                    </span>
                    <strong className="font-mono text-slate-900">{l.code}</strong>
                    {l.libelle && (
                      <span className="text-slate-500 text-[11px] truncate max-w-xs">
                        — {l.libelle}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSupprimerLigne(index)}
                    className="text-slate-400 hover:text-red-600 transition p-1"
                    title="Supprimer cette codification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulaire ajout ligne */}
        <form
          onSubmit={handleAjouterLigne}
          className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
        >
          <h5 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-rose-600" />
            <span>Associer un code de nomenclature</span>
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Système (Terminology)
              </label>
              <select
                value={nouveauCodeSystem}
                onChange={(e) => setNouveauCodeSystem(e.target.value)}
                disabled={codeSystems.length === 0}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
              >
                {codeSystems.length > 0 ? (
                  codeSystems.map((cs) => (
                    <option key={cs.id} value={cs.code}>
                      {cs.code} ({cs.libelle})
                    </option>
                  ))
                ) : (
                  <option value="">Aucun système de codification configuré</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Code officiel *
              </label>
              <input
                type="text"
                required
                placeholder="ex: J06.9"
                value={nouveauCode}
                onChange={(e) => setNouveauCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono uppercase focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Libellé standard
              </label>
              <input
                type="text"
                placeholder="Optionnel"
                value={nouveauLibelle}
                onChange={(e) => setNouveauLibelle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!nouveauCode.trim()}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter ce code</span>
          </button>
        </form>

        <ActionsFormulaire
          texteValider="Enregistrer les codifications"
          chargement={soumissionEnCours}
          onValider={handleSubmit}
          onAnnuler={onFermer}
        />
      </div>
    </Modale>
  );
};
