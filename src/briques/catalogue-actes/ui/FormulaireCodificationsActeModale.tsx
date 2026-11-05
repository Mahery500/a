/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { ActeMedical, CodeSystemeOption, CodificationActe } from "../modele/catalogue-actes.types";
import { Plus, Trash2, Tag } from "lucide-react";

export interface FormulaireCodificationsActeModaleProps {
  ouvert: boolean;
  acte: ActeMedical | null;
  codeSystems: CodeSystemeOption[];
  onFermer: () => void;
  onEnregistrer: (id: number, codifications: CodificationActe[]) => Promise<boolean>;
}

export const FormulaireCodificationsActeModale: React.FC<
  FormulaireCodificationsActeModaleProps
> = ({ ouvert, acte, codeSystems, onFermer, onEnregistrer }) => {
  const [codifications, setCodifications] = useState<CodificationActe[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  const codeSystemsActifs = codeSystems.filter((c) => c.actif);

  useEffect(() => {
    if (acte) {
      setCodifications(acte.codifications || []);
    } else {
      setCodifications([]);
    }
    setErreurValidation(null);
  }, [acte, ouvert]);

  const handleAjouter = () => {
    const systemeParDefaut = codeSystemsActifs.length > 0 ? codeSystemsActifs[0].code : "CCAM";
    setCodifications((prev) => [...prev, { codeSystem: systemeParDefaut, code: "" }]);
  };

  const handleSupprimer = (index: number) => {
    setCodifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChanger = (index: number, champ: keyof CodificationActe, valeur: string) => {
    setCodifications((prev) => prev.map((c, i) => (i === index ? { ...c, [champ]: valeur } : c)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acte) return;
    setErreurValidation(null);

    const lignesValides = codifications
      .map((c) => ({
        codeSystem: c.codeSystem.trim().toUpperCase(),
        code: c.code.trim(),
        libelle: c.libelle?.trim() || undefined,
      }))
      .filter((c) => c.code.length > 0);

    setEnCours(true);
    try {
      const succes = await onEnregistrer(acte.id, lignesValides);
      if (succes) {
        onFermer();
      }
    } finally {
      setEnCours(false);
    }
  };

  if (!acte) return null;

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre={`Codifications externes & Systèmes : ${acte.libelle} (${acte.code})`}
      largeurMax="md"
      enfants={
        <form id="form-codifications-acte" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {erreurValidation && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreurValidation}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 flex items-start gap-2">
            <Tag className="w-4 h-4 text-asina-600 shrink-0 mt-0.5" />
            <div className="text-[11px] space-y-0.5">
              <span className="font-bold text-slate-800 block">
                Nomenclature & Codes Systèmes de l'Acte
              </span>
              <span>
                Associez les référentiels de cotation et d'interopérabilité (ex. CCAM, LOINC,
                CIM-10, NGAP, SNOMED CT) pour cet acte médical.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                Codes associés ({codifications.length})
              </span>
              <button
                type="button"
                onClick={handleAjouter}
                className="btn-secondary py-1 px-2.5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un code</span>
              </button>
            </div>

            {codifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                Aucune codification externe n'est actuellement associée à cet acte médical.
              </div>
            ) : (
              <div className="space-y-2">
                {codifications.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg shadow-2xs"
                  >
                    <div className="w-1/3">
                      <select
                        value={item.codeSystem}
                        onChange={(e) => handleChanger(idx, "codeSystem", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold focus:border-asina-500"
                      >
                        {codeSystemsActifs.map((cs) => (
                          <option key={cs.id} value={cs.code}>
                            {cs.code} — {cs.libelle}
                          </option>
                        ))}
                        {!codeSystemsActifs.some((cs) => cs.code === item.codeSystem) && (
                          <option value={item.codeSystem}>{item.codeSystem}</option>
                        )}
                      </select>
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.code}
                        onChange={(e) => handleChanger(idx, "code", e.target.value)}
                        placeholder="Code officiel (ex. JAQK001)"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono uppercase focus:border-asina-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSupprimer(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer transition rounded"
                      title="Supprimer cette codification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-codifications-acte"
            onAnnuler={onFermer}
            enCours={enCours}
            desactive={enCours}
            labelValider="Enregistrer les codifications"
          />
        </div>
      }
    />
  );
};
