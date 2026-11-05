/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User, Building2, Calendar, Phone, Printer } from "lucide-react";

export interface PatientInfoProps {
  id: number;
  nom: string;
  prenom?: string;
  matricule?: string;
  dateNaissance?: string;
  genre?: string;
  telephone?: string;
  entrepriseNom?: string;
  statutAdherent?: "AGENT" | "CONJOINT" | "ENFANT" | string;
}

export interface PatientCardProps {
  patient: PatientInfoProps;
  variant?: "compact" | "full";
  surImprimerCarte?: () => void;
  className?: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  variant = "compact",
  surImprimerCarte,
  className = "",
}) => {
  const nomComplet = `${patient.prenom || ""} ${patient.nom}`.trim() || `Patient #${patient.id}`;

  const calculerAge = (dateIso?: string): string | null => {
    if (!dateIso) return null;

    const birth = new Date(dateIso);

    if (Number.isNaN(birth.getTime())) return null;

    // Date de référence déterminée une seule fois pour ce rendu.
    const aujourdHui = new Date();

    let age = aujourdHui.getFullYear() - birth.getFullYear();

    const mois = aujourdHui.getMonth() - birth.getMonth();

    if (
      mois < 0 ||
      (mois === 0 && aujourdHui.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 0 ? `${age} ans` : null;
};

  const age = calculerAge(patient.dateNaissance);

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs ${className}`}
      >
        <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-700 border border-sky-150 flex items-center justify-center font-bold text-sm shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">{nomComplet}</h4>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
            {patient.matricule && <span>Mat. {patient.matricule}</span>}
            {age && (
              <>
                <span>·</span>
                <span>{age}</span>
              </>
            )}
            {patient.statutAdherent && (
              <>
                <span>·</span>
                <span className="text-sky-700 font-semibold">{patient.statutAdherent}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-700 border border-sky-150 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">{nomComplet}</h3>
              {patient.statutAdherent && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-sky-50 text-sky-800 rounded border border-sky-200">
                  {patient.statutAdherent}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Matricule : <strong className="text-slate-800">{patient.matricule || "Non renseigné"}</strong>
            </p>
          </div>
        </div>

        {surImprimerCarte && (
          <button
            type="button"
            onClick={surImprimerCarte}
            className="btn-secondary text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimer la carte</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Entreprise</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{patient.entrepriseNom || "Particulier / Non affilié"}</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Âge / Naissance</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{age ? `${age} (${patient.dateNaissance || ""})` : patient.dateNaissance || "Non renseignée"}</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5 truncate">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{patient.telephone || "Aucun numéro"}</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Genre</span>
          <span className="font-semibold text-slate-800 block mt-0.5">
            {patient.genre === "M" ? "Masculin" : patient.genre === "F" ? "Féminin" : patient.genre || "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;
