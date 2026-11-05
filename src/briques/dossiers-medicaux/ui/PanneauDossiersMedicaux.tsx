/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FileText,
  Search,
  User,
  Calendar,
  Building2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Activity,
  ClipboardList,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useDossiersMedicaux } from "../hooks/useDossiersMedicaux";
import { formaterDateHeure } from "@/noyau/utils/dates";

export interface PanneauDossiersMedicauxProps {
  mode?: ModeAffichage;
  patientIdInitial?: number | null;
  patientIdFiltre?: number | null;
  onSelectionnerPatient?: (patientId: number) => void;
}

export const PanneauDossiersMedicaux: React.FC<PanneauDossiersMedicauxProps> = ({
  mode = "lecture",
  patientIdInitial,
  patientIdFiltre,
  onSelectionnerPatient,
}) => {
  const patientCible = patientIdInitial ?? patientIdFiltre;
  const [recherche, setRecherche] = useState("");

  const {
    patients,
    patientSelectionne,
    encounters,
    chargementPatients,
    chargementDossier,
    erreur,
    rechercher,
    selectionnerPatient,
  } = useDossiersMedicaux(patientCible);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRecherche(val);
    rechercher(val);
  };

  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous ne disposez pas des autorisations nécessaires pour consulter les dossiers médicaux.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {erreur && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{erreur}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Recherche & Sélection patient */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-700" />
              <span>Répertoire des Dossiers Patients</span>
            </h3>
            <p className="text-[11px] text-slate-500">Recherche par nom, prénom ou matricule</p>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Filtrer un dossier..."
              value={recherche}
              onChange={handleSearchChange}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden pl-8"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {chargementPatients && patients.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chargement des dossiers…</p>
          ) : patients.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucun dossier trouvé.</p>
          ) : (
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {patients.map((p) => {
                const estActif = patientSelectionne?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      selectionnerPatient(p);
                      if (onSelectionnerPatient) onSelectionnerPatient(p.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg text-xs transition border flex justify-between items-center cursor-pointer ${
                      estActif
                        ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200 text-rose-950 font-bold"
                        : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="block truncate">
                        {p.nom} {p.prenom}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {p.matricule}
                      </span>
                    </div>

                    {p.groupeSanguin && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-rose-100 text-rose-800 rounded font-bold">
                        {p.groupeSanguin}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite : Historique clinique complet */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          {patientSelectionne ? (
            <div className="space-y-6">
              {/* En-tête dossier patient */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dossier Médical Individuel
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {patientSelectionne.nom} {patientSelectionne.prenom}
                  </h3>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-600 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Matricule : <strong>{patientSelectionne.matricule}</strong>
                      </span>
                    </span>

                    {patientSelectionne.entrepriseNom && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Entreprise : <strong>{patientSelectionne.entrepriseNom}</strong>
                        </span>
                      </span>
                    )}

                    {patientSelectionne.groupeSanguin && (
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                        Groupe : {patientSelectionne.groupeSanguin}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Historique des encounters / consultations */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-cyan-700" />
                    <span>Chronologie des Consultations & Actes ({encounters.length})</span>
                  </h4>
                </div>

                {chargementDossier ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Chargement de l'historique clinique…
                  </p>
                ) : encounters.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-400">
                    Aucune consultation passée enregistrée pour ce patient.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                    {encounters.map((enc) => (
                      <div
                        key={enc.id}
                        className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 text-xs shadow-2xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-slate-500 font-bold flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formaterDateHeure(enc.dateDebut)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              enc.statut === "termine" || enc.statut === "Terminé"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            Dossier #{enc.id} · {enc.statut}
                          </span>
                        </div>

                        {/* Diagnostics de l'encounter */}
                        {enc.diagnostics.length > 0 && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                              <ClipboardList className="h-3 w-3 text-cyan-600" />
                              Diagnostics posés :
                            </span>
                            <ul className="space-y-1">
                              {enc.diagnostics.map((d) => (
                                <li key={d.id} className="text-slate-900">
                                  {d.code && (
                                    <span className="font-mono font-bold text-rose-700 mr-1">
                                      [{d.code}]
                                    </span>
                                  )}
                                  <strong>{d.libelle}</strong>
                                  <span className="text-slate-400 text-[10px] ml-2">
                                    ({d.statut})
                                  </span>
                                  {d.commentaire && (
                                    <span className="text-slate-500 italic block text-[11px]">
                                      {d.commentaire}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actes et observations de l'encounter */}
                        {enc.actes.length > 0 && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                              <Activity className="h-3 w-3 text-emerald-600" />
                              Actes & Constantes :
                            </span>
                            <ul className="space-y-2">
                              {enc.actes.map((a) => (
                                <li key={a.id} className="text-slate-800">
                                  <div className="flex justify-between items-center">
                                    <strong>{a.libelle}</strong>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {a.statut}
                                    </span>
                                  </div>
                                  {a.observations.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {a.observations.map((o) => (
                                        <span
                                          key={o.id}
                                          className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                                        >
                                          <strong>{o.code}:</strong> {o.valeur} {o.unite ?? ""}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-slate-400 text-xs space-y-2">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">Aucun patient sélectionné</p>
              <p>
                Choisissez un dossier patient dans la liste de gauche pour consulter son historique.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
