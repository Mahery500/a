/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User, Building2, Phone, Mail, MapPin, HeartPulse, ShieldAlert } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { PatientFiche, libelleAffiliationPatient } from "../modele/patient.types";

export interface DetailPatientModaleProps {
  ouvert: boolean;
  patient: PatientFiche | null;
  onFermer: () => void;
  onOuvrirCompleter?: () => void;
}

export const DetailPatientModale: React.FC<DetailPatientModaleProps> = ({
  ouvert,
  patient,
  onFermer,
  onOuvrirCompleter,
}) => {
  if (!patient) return null;

  const affiliation = libelleAffiliationPatient(patient);

  return (
    <Modale
      ouvert={ouvert}
      onFermer={onFermer}
      titre={`Dossier Patient : ${patient.nom} ${patient.prenom}`}
      largeurMax="lg"
      enfants={
        <div className="space-y-4 text-xs">
          {/* En-tête du patient */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-asina-100 text-asina-700 font-extrabold text-sm flex items-center justify-center shrink-0 border border-asina-200">
                {patient.nom.charAt(0)}
                {patient.prenom.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {patient.nom} {patient.prenom}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                    {patient.matricule || `ID: ${patient.id}`}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${affiliation.classeCouleur}`}
                  >
                    {affiliation.libelle}
                  </span>
                </div>
              </div>
            </div>

            {onOuvrirCompleter && (
              <button
                type="button"
                onClick={() => {
                  onFermer();
                  onOuvrirCompleter();
                }}
                className="btn-primary py-1.5 px-3 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
              >
                Compléter la fiche
              </button>
            )}
          </div>

          {/* Grille d'informations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* État civil & Identification */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>État Civil & Données Médicales</span>
              </span>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date de naissance :</span>
                  <span className="font-medium">{patient.dateNaissance || "Non renseignée"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lieu de naissance :</span>
                  <span className="font-medium">{patient.lieuNaissance || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sexe :</span>
                  <span className="font-medium">{patient.sexe || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Groupe sanguin :</span>
                  <span className="font-bold text-rose-600">
                    {patient.groupeSanguin || "Inconnu"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Numéro NIR :</span>
                  <span className="font-mono">{patient.nir || "Non renseigné"}</span>
                </div>
              </div>
            </div>

            {/* Employeur & Affiliation */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Entreprise & Rattachement</span>
              </span>

              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employeur conventionné :</span>
                  <span className="font-semibold text-slate-900">
                    {patient.nomEntreprise || "Aucun employeur rattaché"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statut affiliation :</span>
                  <span className="font-medium">{patient.statut || "Patient individuel"}</span>
                </div>
                {patient.matriculeAgent && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Matricule agent ouvrant droit :</span>
                    <span className="font-mono font-bold text-asina-700">
                      {patient.matriculeAgent}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>Coordonnées & Contact</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Téléphone</span>
                <span className="font-semibold">{patient.telephone || "Non renseigné"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Email</span>
                <span className="font-medium text-slate-800">
                  {patient.email || "Non renseigné"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Adresse de résidence</span>
                <span className="font-medium text-slate-800">
                  {patient.adresse || "Non renseignée"}
                </span>
              </div>
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
