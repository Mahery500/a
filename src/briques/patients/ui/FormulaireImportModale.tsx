/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { EntrepriseOption } from "../modele/patient.types";

export interface FormulaireImportModaleProps {
  ouvert: boolean;
  entreprises: EntrepriseOption[];
  onFermer: () => void;
  onImporter: (fichier: File, idEntreprise: number) => Promise<boolean>;
}

export const FormulaireImportModale: React.FC<FormulaireImportModaleProps> = ({
  ouvert,
  entreprises,
  onFermer,
  onImporter,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [entrepriseId, setEntrepriseId] = useState<string>(
    entreprises.length > 0 ? String(entreprises[0].id) : "",
  );
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFichier(f);
    setErreur(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!fichier) {
      setErreur("Veuillez sélectionner un fichier Excel (.xlsx).");
      return;
    }
    const idEnt = Number(entrepriseId);
    if (!idEnt || idEnt <= 0) {
      setErreur("Veuillez sélectionner une entreprise de rattachement.");
      return;
    }

    setEnCours(true);
    try {
      const succes = await onImporter(fichier, idEnt);
      if (succes) {
        setFichier(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onFermer();
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre="Importation Excel des Salariés & Ayants Droit"
      largeurMax="md"
      enfants={
        <form id="form-import-patients" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-bold">Règles imposées par le backend :</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  Chaque salarié (Agent) doit figurer <strong>avant</strong> ses ayants droit.
                </li>
                <li>Colonne "Agent/Conjoint/Enfant" obligatoire pour déterminer le rôle.</li>
                <li>
                  Importation stricte en bloc : la moindre erreur annule l'intégralité du fichier.
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Entreprise employeur conventionnée *
            </label>
            <select
              value={entrepriseId}
              onChange={(e) => setEntrepriseId(e.target.value)}
              required
              disabled={enCours}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
            >
              <option value="" disabled>
                — Sélectionner l'entreprise —
              </option>
              {entreprises.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Fichier classeur Excel (.xlsx) *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-asina-500 transition cursor-pointer bg-slate-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                required
                onChange={handleFileChange}
                disabled={enCours}
                className="hidden"
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input" className="cursor-pointer block space-y-2">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600 mx-auto" />
                <div className="text-slate-800 font-semibold text-xs">
                  {fichier ? fichier.name : "Cliquez pour sélectionner un fichier .xlsx"}
                </div>
                {fichier ? (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(fichier.size / 1024).toFixed(1)} Ko
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Format Excel standard avec feuilles de salariés
                  </span>
                )}
              </label>
            </div>
          </div>
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-import-patients"
            onAnnuler={onFermer}
            enCours={enCours}
            desactive={enCours || !fichier || !entrepriseId}
            labelValider="Envoyer et traiter l'import"
          />
        </div>
      }
    />
  );
};
