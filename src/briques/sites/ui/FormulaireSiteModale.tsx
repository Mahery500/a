/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ChampTexte } from "@/noyau/ui/ChampTexte";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { SiteHospitalier, NouveauSiteInput, ModificationSiteInput } from "../modele/site.types";

export interface FormulaireSiteModaleProps {
  ouvert: boolean;
  siteEnEdition: SiteHospitalier | null;
  onFermer: () => void;
  onEnregistrer: (
    saisie: NouveauSiteInput | ModificationSiteInput,
    id?: number,
  ) => Promise<boolean>;
}

export const FormulaireSiteModale: React.FC<FormulaireSiteModaleProps> = ({
  ouvert,
  siteEnEdition,
  onFermer,
  onEnregistrer,
}) => {
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [actif, setActif] = useState(true);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (siteEnEdition) {
      setCode(siteEnEdition.code);
      setNom(siteEnEdition.nom);
      setVille(siteEnEdition.ville);
      setAdresse(siteEnEdition.adresse || "");
      setTelephone(siteEnEdition.telephone || "");
      setActif(siteEnEdition.actif);
    } else {
      setCode("");
      setNom("");
      setVille("");
      setAdresse("");
      setTelephone("");
      setActif(true);
    }
  }, [siteEnEdition, ouvert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    try {
      const succes = await onEnregistrer(
        {
          code: code.trim(),
          nom: nom.trim(),
          ville: ville.trim(),
          adresse: adresse.trim() || undefined,
          telephone: telephone.trim() || undefined,
          actif,
        },
        siteEnEdition?.id,
      );
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
      titre={siteEnEdition ? `Modifier le site : ${siteEnEdition.nom}` : "Nouveau Site Médical"}
      enfants={
        <form id="form-site" onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <ChampTexte
              label="Code du site"
              valeur={code}
              onChange={setCode}
              placeholder="ex: TANA-01"
              obligatoire
              desactive={enCours}
            />
            <ChampTexte
              label="Ville d’implantation"
              valeur={ville}
              onChange={setVille}
              placeholder="ex: Antananarivo"
              obligatoire
              desactive={enCours}
            />
          </div>

          <ChampTexte
            label="Nom officiel du site"
            valeur={nom}
            onChange={setNom}
            placeholder="ex: Centre Médical Principal"
            obligatoire
            desactive={enCours}
          />

          <ChampTexte
            label="Adresse postale / géographique"
            valeur={adresse}
            onChange={setAdresse}
            placeholder="ex: Rue Rainitovo, Antsahavola"
            desactive={enCours}
          />

          <ChampTexte
            label="Téléphone de contact"
            valeur={telephone}
            onChange={setTelephone}
            placeholder="ex: +261 20 22 000 00"
            desactive={enCours}
          />

          {siteEnEdition && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="site-actif-checkbox"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                disabled={enCours}
                className="rounded border-slate-300 text-asina-600 focus:ring-asina-500 cursor-pointer"
              />
              <label
                htmlFor="site-actif-checkbox"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Site opérationnel et actif
              </label>
            </div>
          )}
        </form>
      }
      pied={
        <ActionsFormulaire
          idFormulaire="form-site"
          onAnnuler={onFermer}
          enCours={enCours}
          labelValider={siteEnEdition ? "Sauvegarder" : "Créer le site"}
        />
      }
    />
  );
};

export default FormulaireSiteModale;
