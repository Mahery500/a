/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import {
  CategorieActe,
  ActeMedical,
  NouvelleCategorieInput,
} from "../modele/catalogue-actes.types";

export interface FormulaireCategorieModaleProps {
  ouvert: boolean;
  categories: CategorieActe[];
  actes: ActeMedical[];
  onFermer: () => void;
  onCreerCategorie: (saisie: NouvelleCategorieInput) => Promise<boolean>;
}

export const FormulaireCategorieModale: React.FC<FormulaireCategorieModaleProps> = ({
  ouvert,
  categories,
  actes,
  onFermer,
  onCreerCategorie,
}) => {
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const compteursParCode = useMemo(() => {
    const compteurs = new Map<string, number>();
    for (const acte of actes) {
      const c = acte.categorie.code;
      compteurs.set(c, (compteurs.get(c) ?? 0) + 1);
    }
    return compteurs;
  }, [actes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const codeNettoye = code.trim().toUpperCase();
    const libelleNettoye = libelle.trim();

    if (!codeNettoye || !libelleNettoye) {
      setErreur("Le code et le libellé sont requis.");
      return;
    }

    setEnCours(true);
    try {
      const succes = await onCreerCategorie({
        code: codeNettoye,
        libelle: libelleNettoye,
        parentCode: null,
      });
      if (succes) {
        setCode("");
        setLibelle("");
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modale
      ouvert={ouvert}
      onFermer={onFermer}
      titre="Catégories d'Actes Médicaux"
      largeurMax="md"
      enfants={
        <div className="space-y-4 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          {/* Formulaire d'ajout rapide */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
          >
            <div className="font-semibold text-slate-900 text-xs flex items-center justify-between">
              <span>Ajouter une catégorie</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Code permanent (non modifiable)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-700 font-medium mb-1">Code *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="EX: VACCINATION"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono uppercase text-xs focus:outline-hidden focus:border-asina-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 font-medium mb-1">
                  Libellé *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="EX: Vaccinations et rappels"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={enCours || !code.trim() || !libelle.trim()}
                className="btn-primary py-1.5 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{enCours ? "Création..." : "Ajouter la catégorie"}</span>
              </button>
            </div>
          </form>

          {/* Tableau des catégories */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700 text-xs">Catégories existantes</span>
              <span className="font-mono text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-bold">
                {categories.length}
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  Aucune catégorie enregistrée pour le moment.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Libellé</th>
                      <th className="py-2 px-3 text-right">Actes rattachés</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono font-bold text-asina-700 text-[11px]">
                          {cat.code}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{cat.libelle}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-600">
                          {compteursParCode.get(cat.code) ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      }
      pied={
        <button
          type="button"
          onClick={onFermer}
          className="btn-secondary py-1.5 px-4 text-xs font-semibold rounded-lg cursor-pointer"
        >
          Fermer
        </button>
      }
    />
  );
};
