/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { CompetenceItem } from "../modele/competence.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP_BASE =
  "w-full h-10 px-3 rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const CHAMP = `${CHAMP_BASE} border border-[#e5e7eb] focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20`;
const CHAMP_ERREUR = `${CHAMP_BASE} border border-[#b42318]`;
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const AIDE_ERREUR = "text-[12px] text-[#b42318] font-bold mt-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";

export interface FormulaireCompetenceInlineProps {
  enEdition: CompetenceItem | null;
  /** « corps médical » ou « spécialité ». */
  libelleSingulier: string;
  onFermer: () => void;
  onEnregistrer: (
    saisie: { code: string; libelle: string },
    id?: number,
  ) => Promise<boolean>;
}

export const FormulaireCompetenceInline: React.FC<FormulaireCompetenceInlineProps> = ({
  enEdition,
  libelleSingulier,
  onFermer,
  onEnregistrer,
}) => {
  const estSpecialite = libelleSingulier === "spécialité";

  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [erreurCode, setErreurCode] = useState<string | null>(null);
  const [erreurLibelle, setErreurLibelle] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (enEdition) {
      setCode(enEdition.code);
      setLibelle(enEdition.libelle);
    } else {
      setCode("");
      setLibelle("");
    }
    setErreurCode(null);
    setErreurLibelle(null);
  }, [enEdition]);

  const valider = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErreurCode(null);
    setErreurLibelle(null);

    const c = code.trim().toUpperCase();
    const l = libelle.trim();
    let aErreur = false;
    if (!c) {
      setErreurCode("Le code est obligatoire.");
      aErreur = true;
    }
    if (!l) {
      setErreurLibelle("Le libellé est obligatoire.");
      aErreur = true;
    }
    if (aErreur) return;

    setEnCours(true);
    try {
      const ok = await onEnregistrer({ code: c, libelle: l }, enEdition?.id);
      if (ok) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  const placeholderCode = estSpecialite ? "EX : CARDIO" : "EX : MEDECIN";
  const placeholderLibelle = estSpecialite ? "ex : Cardiologie" : "ex : Médecin";
  const titre = enEdition
    ? `Modifier ${estSpecialite ? "la spécialité" : "le corps médical"}`
    : estSpecialite
      ? "Nouvelle spécialité"
      : "Nouveau corps médical";

  return (
    <form
      onSubmit={valider}
      className="bg-white border border-[#1f9d55] rounded-[14px] p-4 flex flex-col gap-3"
    >
      <b className="text-[13px] text-[#1f2937]">{titre}</b>

      <div className="flex flex-col md:flex-row gap-3.5 items-start">
        <div className="w-full md:w-[260px]">
          <label htmlFor="fc-code" className={LABEL}>
            Code <span className="text-[#b42318]">*</span>
          </label>
          <input
            id="fc-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (erreurCode) setErreurCode(null);
            }}
            disabled={Boolean(enEdition) || enCours}
            placeholder={placeholderCode}
            autoFocus={!enEdition}
            className={`${erreurCode ? CHAMP_ERREUR : CHAMP} font-mono uppercase`}
          />
          <p className={erreurCode ? AIDE_ERREUR : AIDE}>
            {erreurCode ||
              (enEdition
                ? "Le code est figé après création."
                : "Unique, en majuscules.")}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <label htmlFor="fc-libelle" className={LABEL}>
            Libellé <span className="text-[#b42318]">*</span>
          </label>
          <input
            id="fc-libelle"
            type="text"
            value={libelle}
            onChange={(e) => {
              setLibelle(e.target.value);
              if (erreurLibelle) setErreurLibelle(null);
            }}
            disabled={enCours}
            placeholder={placeholderLibelle}
            autoFocus={Boolean(enEdition)}
            className={erreurLibelle ? CHAMP_ERREUR : CHAMP}
          />
          <p className={erreurLibelle ? AIDE_ERREUR : AIDE}>
            {erreurLibelle || "Nom affiché dans les habilitations."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 mt-0 md:mt-[22px] shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Annuler
          </button>
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            <Check className="w-[18px] h-[18px]" />
            {enCours ? "Enregistrement…" : enEdition ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default FormulaireCompetenceInline;