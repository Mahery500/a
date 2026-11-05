/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { CompetenceItem } from "../modele/competence.types";

export interface FormulaireCompetenceModaleProps {
  ouvert: boolean;
  /** null = création. */
  enEdition: CompetenceItem | null;
  /** Ex. « corps médical », « spécialité ». */
  libelleSingulier: string;
  onFermer: () => void;
  onEnregistrer: (
    saisie: { code: string; libelle: string },
    id?: number,
  ) => Promise<boolean>;
}

const CHAMP =
  "w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500 disabled:bg-slate-100 disabled:text-slate-500";

export const FormulaireCompetenceModale: React.FC<FormulaireCompetenceModaleProps> = ({
  ouvert,
  enEdition,
  libelleSingulier,
  onFermer,
  onEnregistrer,
}) => {
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    setErreur(null);
    if (enEdition) {
      setCode(enEdition.code);
      setLibelle(enEdition.libelle);
    } else {
      setCode("");
      setLibelle("");
    }
  }, [enEdition, ouvert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const c = code.trim().toUpperCase();
    const l = libelle.trim();
    if (!c) return setErreur("Le code est obligatoire.");
    if (!l) return setErreur("Le libellé est obligatoire.");

    setEnCours(true);
    try {
      const ok = await onEnregistrer({ code: c, libelle: l }, enEdition?.id);
      if (ok) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre={
        enEdition
          ? `Modifier ${libelleSingulier} : ${enEdition.code}`
          : `Nouveau ${libelleSingulier}`
      }
      largeurMax="md"
      enfants={
        <form id="form-competence" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Code *</label>
            <input
              type="text"
              required
              maxLength={50}
              disabled={Boolean(enEdition) || enCours}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={libelleSingulier === "spécialité" ? "CARDIO" : "MEDECIN"}
              className={`${CHAMP} font-mono uppercase`}
            />
            {enEdition && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Le code est figé après création.
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Libellé *</label>
            <input
              type="text"
              required
              maxLength={100}
              disabled={enCours}
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder={libelleSingulier === "spécialité" ? "Cardiologie" : "Médecin"}
              className={CHAMP}
            />
          </div>
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-competence"
            onAnnuler={onFermer}
            enCours={enCours}
            desactive={enCours}
            labelValider={enEdition ? "Enregistrer" : "Créer"}
          />
        </div>
      }
    />
  );
};

export default FormulaireCompetenceModale;