/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ChampTexte } from "@/noyau/ui/ChampTexte";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import {
  EntreprisePartenaire,
  NouvelleEntrepriseInput,
  ModificationEntrepriseInput,
  Smie,
} from "../modele/entreprise.types";

// Valeurs identiques à l'enum PHP CardBrand.
export const OPTIONS_SMIE: { valeur: Smie; label: string }[] = [
  { valeur: "serenite", label: "La Sérénité" },
  { valeur: "asina", label: "ASINA" },
];
export const libelleSmie = (s?: Smie | null) =>
  OPTIONS_SMIE.find((o) => o.valeur === s)?.label ?? "—";

export interface FormulaireEntrepriseModaleProps {
  ouvert: boolean;
  entrepriseEnEdition: EntreprisePartenaire | null;
  onFermer: () => void;
  onEnregistrer: (
    saisie: NouvelleEntrepriseInput | ModificationEntrepriseInput,
    id?: number,
  ) => Promise<boolean>;
}

export const FormulaireEntrepriseModale: React.FC<FormulaireEntrepriseModaleProps> = ({
  ouvert,
  entrepriseEnEdition,
  onFermer,
  onEnregistrer,
}) => {
  const [nom, setNom] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [adresse, setAdresse] = useState("");
  const [contact, setContact] = useState("");
  const [numeroCnaps, setNumeroCnaps] = useState("");
  const [matriculeAsina, setMatriculeAsina] = useState("");
  const [smie, setSmie] = useState<Smie | "">("");
  const [erreurSmie, setErreurSmie] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    setErreurSmie(null);
    if (entrepriseEnEdition) {
      setNom(entrepriseEnEdition.nom);
      setRaisonSociale(entrepriseEnEdition.raisonSociale || "");
      setAdresse(entrepriseEnEdition.adresse || "");
      setContact(entrepriseEnEdition.contact || "");
      setNumeroCnaps(entrepriseEnEdition.numeroCnaps || "");
      setMatriculeAsina(entrepriseEnEdition.matriculeAsina || "");
      setSmie(entrepriseEnEdition.smie ?? "");
    } else {
      setNom("");
      setRaisonSociale("");
      setAdresse("");
      setContact("");
      setNumeroCnaps("");
      setMatriculeAsina("");
      setSmie(""); // aucune présélection
    }
  }, [entrepriseEnEdition, ouvert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    const base = {
      nom: nom.trim(),
      raisonSociale: raisonSociale.trim() || undefined,
      adresse: adresse.trim() || undefined,
      contact: contact.trim() || undefined,
      numeroCnaps: numeroCnaps.trim() || undefined,
      matriculeAsina: matriculeAsina.trim().toUpperCase() || undefined,
    };

    // Création : la SMIE est obligatoire.
    if (!entrepriseEnEdition && !smie) {
      setErreurSmie("Choisissez une SMIE (La Sérénité ou ASINA).");
      return;
    }

    // Création → payload avec smie. Modification → payload SANS smie (figée backend).
    // `satisfies` garantit qu'on ne peut pas glisser un mauvais champ.
    const saisie = entrepriseEnEdition
      ? (base satisfies ModificationEntrepriseInput)
      : ({ ...base, smie: smie as Smie } satisfies NouvelleEntrepriseInput);

    setEnCours(true);
    try {
      const succes = await onEnregistrer(saisie, entrepriseEnEdition?.id);
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
      titre={
        entrepriseEnEdition
          ? `Modifier l'entreprise : ${entrepriseEnEdition.nom}`
          : "Enregistrer une Entreprise Partenaire"
      }
      enfants={
        <form id="form-entreprise" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChampTexte
              label="Nom commercial / Nom d'usage *"
              valeur={nom}
              onChange={setNom}
              placeholder="ex: TOTAL MADAGASCAR"
              obligatoire
              desactive={enCours}
            />

            <ChampTexte
              label="Raison Sociale officielle"
              valeur={raisonSociale}
              onChange={setRaisonSociale}
              placeholder="ex: TotalEnergies Marketing Madagascar S.A."
              desactive={enCours}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <ChampTexte
                label="Sigle / Préfixe Matricule ASINA *"
                valeur={matriculeAsina}
                onChange={(val) => setMatriculeAsina(val.toUpperCase())}
                placeholder="ex: TOTAL, SMIE, AXIAN"
                obligatoire
                desactive={enCours}
              />
              <span className="text-[10px] text-slate-500 block mt-1 leading-snug">
                Racine obligatoire pour la génération des matricules des salariés et ayants droit
                (ex: TOTAL-0001, TOTAL-0001-CJ, TOTAL-0001-E1).
              </span>
            </div>

            <div>
              <ChampTexte
                label="N° Affiliation CNAPS Employeur"
                valeur={numeroCnaps}
                onChange={setNumeroCnaps}
                placeholder="ex: 12345678"
                desactive={enCours}
              />
              <span className="text-[10px] text-slate-500 block mt-1 leading-snug">
                Numéro CNAPS de l'employeur imprimé sur les cartes d'adhérents de santé au travail.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              SMIE {!entrepriseEnEdition && "*"}
            </label>
            <select
              value={smie}
              onChange={(e) => {
                setSmie(e.target.value as Smie | "");
                setErreurSmie(null);
              }}
              disabled={enCours || !!entrepriseEnEdition}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white disabled:bg-slate-50"
            >
              <option value="">Choisir une SMIE…</option>
              {OPTIONS_SMIE.map((o) => (
                <option key={o.valeur} value={o.valeur}>
                  {o.label}
                </option>
              ))}
            </select>
            {erreurSmie && (
              <span className="text-[10px] text-rose-600 block mt-1">{erreurSmie}</span>
            )}
            {entrepriseEnEdition && (
              <span className="text-[10px] text-slate-500 block mt-1">
                La SMIE ne peut plus être modifiée.
              </span>
            )}
          </div>

          <ChampTexte
            label="Adresse Géographique (Siège / Antenne)"
            valeur={adresse}
            onChange={setAdresse}
            placeholder="ex: Immeuble Aro, Ampefiloha, Antananarivo"
            desactive={enCours}
          />

          <ChampTexte
            label="Contact RH / Téléphone / Email"
            valeur={contact}
            onChange={setContact}
            placeholder="ex: rh@entreprise.mg ou +261 20 22 123 45"
            desactive={enCours}
          />

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              SMIE {!entrepriseEnEdition && <span className="text-rose-600">*</span>}
            </span>
            {entrepriseEnEdition ? (
              <div className="text-xs">
                <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">
                  {libelleSmie(entrepriseEnEdition.smie)}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  La SMIE ne peut plus être modifiée.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-4 text-xs" role="radiogroup" aria-label="SMIE">
                  {OPTIONS_SMIE.map((o) => (
                    <label key={o.valeur} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="smie"
                        value={o.valeur}
                        checked={smie === o.valeur}
                        disabled={enCours}
                        onChange={() => {
                          setSmie(o.valeur);
                          setErreurSmie(null);
                        }}
                      />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
                {erreurSmie && <p className="text-[11px] text-rose-600 mt-1">{erreurSmie}</p>}
                <p className="text-[10px] text-slate-500 mt-1">
                  Choix définitif : il détermine le modèle des cartes d'adhérent.
                </p>
              </>
            )}
          </div>
        </form>
      }
      pied={
        <ActionsFormulaire
          idFormulaire="form-entreprise"
          onAnnuler={onFermer}
          enCours={enCours}
          labelValider={entrepriseEnEdition ? "Sauvegarder" : "Créer l’entreprise"}
        />
      }
    />
  );
};

export default FormulaireEntrepriseModale;
