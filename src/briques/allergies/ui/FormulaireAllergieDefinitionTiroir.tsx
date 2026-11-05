// src/briques/allergies/ui/FormulaireAllergieDefinitionTiroir.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";

import { TiroirLateral } from "@/noyau/ui/TiroirLateral";

import {
  LIBELLES_CATEGORIE,
  type AllergieCategorie,
  type AllergieDefinition,
  type CodificationAllergie,
  type ModificationAllergieDefinitionInput,
  type NouvelleAllergieDefinitionInput,
} from "../modele/allergie.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";

export interface FormulaireAllergieDefinitionTiroirProps {
  ouvert: boolean;
  definitionEnEdition: AllergieDefinition | null;
  enCours: boolean;
  onFermer: () => void;
  onCreer: (input: NouvelleAllergieDefinitionInput) => Promise<boolean>;
  onModifier: (
    id: number,
    input: ModificationAllergieDefinitionInput,
  ) => Promise<boolean>;
  onBasculerActivation?: (def: AllergieDefinition) => Promise<void>;
}

const SYSTEMES_COURANTS = ["SNOMED-CT", "CIM-10", "ATC"];

export const FormulaireAllergieDefinitionTiroir: React.FC<
  FormulaireAllergieDefinitionTiroirProps
> = ({
  ouvert,
  definitionEnEdition,
  enCours,
  onFermer,
  onCreer,
  onModifier,
  onBasculerActivation,
}) => {
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState<AllergieCategorie>("medication");
  const [codifications, setCodifications] = useState<CodificationAllergie[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    if (definitionEnEdition) {
      setCode(definitionEnEdition.code);
      setLibelle(definitionEnEdition.libelle);
      setCategorie(definitionEnEdition.categorie);
      setCodifications(definitionEnEdition.codifications ?? []);
    } else {
      setCode("");
      setLibelle("");
      setCategorie("medication");
      setCodifications([]);
    }
    setErreur(null);
  }, [ouvert, definitionEnEdition]);

  const estEdition = definitionEnEdition !== null;

  const ajouterCodification = () => {
    setCodifications((prev) => [
      ...prev,
      { codeSystem: SYSTEMES_COURANTS[0], code: "" },
    ]);
  };

  const modifierCodification = (
    i: number,
    champ: "codeSystem" | "code",
    valeur: string,
  ) => {
    setCodifications((prev) =>
      prev.map((c, k) => (k === i ? { ...c, [champ]: valeur } : c)),
    );
  };

  const supprimerCodification = (i: number) => {
    setCodifications((prev) => prev.filter((_, k) => k !== i));
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!code.trim()) return setErreur("Le code est obligatoire.");
    if (!libelle.trim()) return setErreur("Le libellé est obligatoire.");

    const codifs = codifications
      .map((c) => ({
        codeSystem: c.codeSystem.trim().toUpperCase(),
        code: c.code.trim(),
      }))
      .filter((c) => c.codeSystem && c.code);

    if (estEdition && definitionEnEdition) {
      await onModifier(definitionEnEdition.id, {
        libelle: libelle.trim(),
        categorie,
        codifications: codifs,
      });
    } else {
      await onCreer({
        code: code.trim().toUpperCase(),
        libelle: libelle.trim(),
        categorie,
        codifications: codifs,
      });
    }
  };

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      fermetureBloquee={enCours}
      libelle={estEdition ? "Modifier la substance" : "Nouvelle substance"}
    >
      <form onSubmit={soumettre} className="flex flex-col h-full min-h-0">
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">
              {estEdition ? `Modifier « ${definitionEnEdition?.libelle} »` : "Nouvelle substance allergène"}
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              {estEdition
                ? "Le code est figé après création."
                : "Elle sera immédiatement utilisable dans les fiches patient."}
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? undefined : onFermer}
            disabled={enCours}
            aria-label="Fermer"
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {erreur && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-[#b42318] text-[12px] font-medium"
            >
              {erreur}
            </div>
          )}

          <div>
            <label htmlFor="def-code" className={LABEL}>
              Code <span className="text-[#b42318]">*</span>
            </label>
            <input
              id="def-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PENICILLINE"
              disabled={estEdition || enCours}
              maxLength={50}
              className={`${CHAMP} font-mono uppercase`}
            />
          </div>

          <div>
            <label htmlFor="def-libelle" className={LABEL}>
              Libellé <span className="text-[#b42318]">*</span>
            </label>
            <input
              id="def-libelle"
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Pénicilline"
              disabled={enCours}
              maxLength={255}
              className={CHAMP}
            />
          </div>

          <div>
            <div className={LABEL}>
              Catégorie <span className="text-[#b42318]">*</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(LIBELLES_CATEGORIE) as AllergieCategorie[]).map((c) => {
                const actif = categorie === c;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => setCategorie(c)}
                    className={`p-2.5 rounded-[10px] border text-center cursor-pointer text-[13px] ${
                      actif
                        ? "border-2 border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                        : "border border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
                    }`}
                  >
                    {LIBELLES_CATEGORIE[c]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={SECTION}>Codifications externes</div>

          {codifications.length === 0 && (
            <p className={AIDE}>
              Sans codification, la substance reste utilisable mais signalée « À codifier ».
            </p>
          )}

          {codifications.map((c, i) => (
            <div
              key={i}
              className="p-3 border border-[#e5e7eb] rounded-[10px] flex gap-2 items-start"
            >
              <div className="w-[150px] shrink-0">
                <select
                  value={c.codeSystem}
                  onChange={(e) =>
                    modifierCodification(i, "codeSystem", e.target.value)
                  }
                  disabled={enCours}
                  aria-label="Système"
                  className={CHAMP}
                >
                  {SYSTEMES_COURANTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {!SYSTEMES_COURANTS.includes(c.codeSystem) && (
                    <option value={c.codeSystem}>{c.codeSystem}</option>
                  )}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={c.code}
                  onChange={(e) => modifierCodification(i, "code", e.target.value)}
                  placeholder="code"
                  disabled={enCours}
                  maxLength={100}
                  className={`${CHAMP} font-mono`}
                />
              </div>
              <button
                type="button"
                onClick={() => supprimerCodification(i)}
                disabled={enCours}
                aria-label="Supprimer"
                className="mt-1 p-2 text-[#5b6472] hover:text-[#b42318] hover:bg-rose-50 rounded transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={ajouterCodification}
            disabled={enCours}
            className={BTN}
          >
            <Plus className="w-[18px] h-[18px]" />
            Ajouter une codification
          </button>

          {estEdition && onBasculerActivation && definitionEnEdition && (
            <button
              type="button"
              onClick={() => onBasculerActivation(definitionEnEdition)}
              disabled={enCours}
              className={`mt-2 self-start px-3 py-1.5 text-[12px] font-semibold rounded-[10px] cursor-pointer ${
                definitionEnEdition.actif
                  ? "text-[#b42318] hover:bg-rose-50"
                  : "text-[#14703c] hover:bg-[#e7f6ed]"
              }`}
            >
              {definitionEnEdition.actif ? "Désactiver" : "Réactiver"} cette substance
            </button>
          )}
        </div>

        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Annuler
          </button>
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            <Check className="w-[18px] h-[18px]" />
            {enCours ? "Enregistrement…" : estEdition ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default FormulaireAllergieDefinitionTiroir;