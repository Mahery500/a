/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { PatientFiche, EntrepriseOption, RattacherAgentInput } from "../modele/patient.types";

export interface FormulairePromotionAgentModaleProps {
  ouvert: boolean;
  patients: PatientFiche[];
  entreprises: EntrepriseOption[];
  onFermer: () => void;
  onRattacher: (saisie: RattacherAgentInput) => Promise<boolean>;
}

export const FormulairePromotionAgentModale: React.FC<FormulairePromotionAgentModaleProps> = ({
  ouvert,
  patients,
  entreprises,
  onFermer,
  onRattacher,
}) => {
  const [patientId, setPatientId] = useState<string>("");
  const [entrepriseId, setEntrepriseId] = useState<string>(
    entreprises.length > 0 ? String(entreprises[0].id) : "",
  );
  const [cnaps, setCnaps] = useState("");
  const [fonction, setFonction] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Patients éligibles (qui ne sont pas déjà déclarés comme Agent)
  const patientsEligibles = patients.filter((p) => !p.idAgent && p.statut !== "Agent");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const idPatNum = Number(patientId);
    const idEntNum = Number(entrepriseId);

    if (!idPatNum || idPatNum <= 0) {
      setErreur("Veuillez sélectionner un patient valide.");
      return;
    }
    if (!idEntNum || idEntNum <= 0) {
      setErreur("Veuillez sélectionner une entreprise.");
      return;
    }

    setEnCours(true);
    try {
      const succes = await onRattacher({
        idPatient: idPatNum,
        idEntreprise: idEntNum,
        cnaps: cnaps.trim() || undefined,
        fonction: fonction.trim() || undefined,
      });
      if (succes) {
        setPatientId("");
        setCnaps("");
        setFonction("");
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
      titre="Rattachement Salarié d'un Patient (Agent)"
      largeurMax="md"
      enfants={
        <form id="form-rattacher-agent" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px] leading-relaxed">
            Permet d'attribuer le statut de salarié affilié (Agent) d'une entreprise partenaire à un
            patient déjà enregistré.
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Patient à affilier *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              disabled={enCours}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
            >
              <option value="" disabled>
                — Sélectionner un patient ({patientsEligibles.length} éligibles) —
              </option>
              {patientsEligibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.prenom} {p.matricule ? `(${p.matricule})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Entreprise employeur *
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Numéro CNAPS</label>
              <input
                type="text"
                value={cnaps}
                onChange={(e) => setCnaps(e.target.value)}
                placeholder="EX: 123456789"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Poste / Fonction</label>
              <input
                type="text"
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                placeholder="EX: Comptable, Chauffeur"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
              />
            </div>
          </div>
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-rattacher-agent"
            onAnnuler={onFermer}
            enCours={enCours}
            desactive={enCours}
            labelValider="Valider l'affiliation salariée"
          />
        </div>
      }
    />
  );
};
