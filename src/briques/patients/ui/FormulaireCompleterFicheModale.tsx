/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { PatientFiche, CompleterFicheInput } from "../modele/patient.types";

export interface FormulaireCompleterFicheModaleProps {
  ouvert: boolean;
  patient: PatientFiche | null;
  onFermer: () => void;
  onCompleter: (id: string, saisie: CompleterFicheInput) => Promise<boolean>;
}

export const FormulaireCompleterFicheModale: React.FC<FormulaireCompleterFicheModaleProps> = ({
  ouvert,
  patient,
  onFermer,
  onCompleter,
}) => {
  const [matricule, setMatricule] = useState("");
  const [dateN, setDateN] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [sexe, setSexe] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [groupeSanguin, setGroupeSanguin] = useState("");
  const [nir, setNir] = useState("");

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setMatricule(patient.matricule || "");
      setDateN(patient.dateNaissance || "");
      setLieuNaissance(patient.lieuNaissance || "");
      setSexe(patient.sexe || "");
      setAdresse(patient.adresse || "");
      setTelephone(patient.telephone || "");
      setEmail(patient.email || "");
      setGroupeSanguin(patient.groupeSanguin || "");
      setNir(patient.nir || "");
    }
    setErreur(null);
  }, [patient, ouvert]);

  if (!patient) return null;

  const aDeja = {
    matricule: Boolean(patient.matricule?.trim()),
    dateN: Boolean(patient.dateNaissance?.trim()),
    lieuNaissance: Boolean(patient.lieuNaissance?.trim()),
    sexe: Boolean(patient.sexe?.trim()),
    adresse: Boolean(patient.adresse?.trim()),
    telephone: Boolean(patient.telephone?.trim()),
    email: Boolean(patient.email?.trim()),
    groupeSanguin: Boolean(patient.groupeSanguin?.trim()),
    nir: Boolean(patient.nir?.trim()),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const payload: CompleterFicheInput = {};
    if (!aDeja.matricule && matricule.trim()) payload.matricule = matricule.trim();
    if (!aDeja.dateN && dateN.trim()) payload.dateN = dateN.trim();
    if (!aDeja.lieuNaissance && lieuNaissance.trim()) payload.lieuNaissance = lieuNaissance.trim();
    if (!aDeja.sexe && sexe.trim()) payload.sexe = sexe.trim();
    if (!aDeja.adresse && adresse.trim()) payload.adresse = adresse.trim();
    if (!aDeja.telephone && telephone.trim()) payload.telephone = telephone.trim();
    if (!aDeja.email && email.trim()) payload.email = email.trim();
    if (!aDeja.groupeSanguin && groupeSanguin.trim()) payload.groupeSanguin = groupeSanguin.trim();
    if (!aDeja.nir && nir.trim()) payload.nir = nir.trim();

    if (Object.keys(payload).length === 0) {
      onFermer();
      return;
    }

    setEnCours(true);
    try {
      const succes = await onCompleter(patient.id, payload);
      if (succes) {
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
      titre={`Compléter la fiche : ${patient.nom} ${patient.prenom}`}
      largeurMax="md"
      enfants={
        <form id="form-completer-fiche" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-[11px] leading-relaxed">
            Règle de gestion : Seuls les champs actuellement <strong>vides</strong> peuvent être
            complétés. Les données déjà enregistrées sont verrouillées.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Matricule</label>
              {aDeja.matricule ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono">
                  {patient.matricule}
                </div>
              ) : (
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="EX: MAT-00123"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Date de naissance</label>
              {aDeja.dateN ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium">
                  {patient.dateNaissance}
                </div>
              ) : (
                <input
                  type="date"
                  value={dateN}
                  onChange={(e) => setDateN(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Lieu de naissance</label>
              {aDeja.lieuNaissance ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium">
                  {patient.lieuNaissance}
                </div>
              ) : (
                <input
                  type="text"
                  value={lieuNaissance}
                  onChange={(e) => setLieuNaissance(e.target.value)}
                  placeholder="Ville / Région"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Sexe</label>
              {aDeja.sexe ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium">
                  {patient.sexe}
                </div>
              ) : (
                <select
                  value={sexe}
                  onChange={(e) => setSexe(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                >
                  <option value="">— Non précisé —</option>
                  <option value="M">Masculin (M)</option>
                  <option value="F">Féminin (F)</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Groupe sanguin</label>
              {aDeja.groupeSanguin ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-rose-700 font-bold">
                  {patient.groupeSanguin}
                </div>
              ) : (
                <select
                  value={groupeSanguin}
                  onChange={(e) => setGroupeSanguin(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                >
                  <option value="">— Sélectionner —</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Numéro NIR / Identifiant
              </label>
              {aDeja.nir ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono">
                  {patient.nir}
                </div>
              ) : (
                <input
                  type="text"
                  value={nir}
                  onChange={(e) => setNir(e.target.value)}
                  placeholder="EX: 1 85 02 75 123 456"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono focus:outline-hidden focus:border-asina-500"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
              {aDeja.telephone ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium">
                  {patient.telephone}
                </div>
              ) : (
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+261 34 00 000 00"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email</label>
              {aDeja.email ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium">
                  {patient.email}
                </div>
              ) : (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@domaine.mg"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Adresse de résidence</label>
            {aDeja.adresse ? (
              <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-medium">
                {patient.adresse}
              </div>
            ) : (
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Numéro, rue, quartier, ville"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
              />
            )}
          </div>
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-completer-fiche"
            onAnnuler={onFermer}
            enCours={enCours}
            labelValider="Enregistrer les compléments"
          />
        </div>
      }
    />
  );
};
