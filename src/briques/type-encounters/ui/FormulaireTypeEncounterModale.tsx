/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import {
  TypeEncounter,
  NouveauTypeEncounterInput,
  ModificationTypeEncounterInput,
} from "../modele/type-encounter.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

export interface FormulaireTypeEncounterModaleProps {
  ouvert: boolean;
  typeEnEdition: TypeEncounter | null;
  /** Types de service disponibles (services catalogués). */
  typesServicesDisponibles: { id: number; nom: string; code?: string }[];
  onFermer: () => void;
  /**
   * Enregistre la saisie. En création, si `typeServiceIds` est fourni, la
   * sauvegarde des services est déclenchée juste après la création côté parent.
   */
  onEnregistrer: (
    saisie: NouveauTypeEncounterInput | ModificationTypeEncounterInput,
    id?: number,
    typeServiceIds?: number[],
  ) => Promise<boolean>;
}

export const FormulaireTypeEncounterModale: React.FC<FormulaireTypeEncounterModaleProps> = ({
  ouvert,
  typeEnEdition,
  typesServicesDisponibles,
  onFermer,
  onEnregistrer,
}) => {
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [description, setDescription] = useState("");
  const [typeServiceIds, setTypeServiceIds] = useState<number[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  useEffect(() => {
    if (typeEnEdition) {
      setCode(typeEnEdition.code);
      setLibelle(typeEnEdition.libelle);
      setDescription(typeEnEdition.description ?? "");
      setTypeServiceIds([...typeEnEdition.typeServiceIds]);
    } else {
      setCode("");
      setLibelle("");
      setDescription("");
      setTypeServiceIds([]);
    }
    setErreurValidation(null);
  }, [typeEnEdition, ouvert]);

  const basculerTypeService = (id: number) => {
    setTypeServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurValidation(null);

    const codeNettoye = code.trim().toUpperCase();
    const libelleNettoye = libelle.trim();

    if (!typeEnEdition && !codeNettoye) {
      setErreurValidation("Le code technique est obligatoire.");
      return;
    }
    if (!libelleNettoye) {
      setErreurValidation("Le libellé est obligatoire.");
      return;
    }

    setEnCours(true);
    try {
      const payload = typeEnEdition
        ? ({
            libelle: libelleNettoye,
            description: description.trim() || null,
          } satisfies ModificationTypeEncounterInput)
        : ({
            code: codeNettoye,
            libelle: libelleNettoye,
            description: description.trim() || null,
          } satisfies NouveauTypeEncounterInput);

      const ok = await onEnregistrer(payload, typeEnEdition?.id, typeServiceIds);
      if (ok) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  const typesTries = useMemo(
    () => [...typesServicesDisponibles].sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    [typesServicesDisponibles],
  );

  const nbSelectionnes = typeServiceIds.length;
  const nbTotal = typesTries.length;
  const libelleTitre = typeEnEdition
    ? `Modifier le type « ${typeEnEdition.libelle} »`
    : "Nouveau type de prise en charge";
  const libelleAction = typeEnEdition ? "Enregistrer" : "Créer le type";

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      fermetureBloquee={enCours}
      libelle={libelleTitre}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        {/* En-tête */}
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">{libelleTitre}</h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Les champs marqués d'une étoile sont obligatoires.
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? undefined : onFermer}
            disabled={enCours}
            className={`p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50 ${FOCUS}`}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {erreurValidation && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs"
            >
              {erreurValidation}
            </div>
          )}

          <div className={SECTION}>Identité</div>

          <div>
            <label htmlFor="te-code" className={LABEL}>
              Code technique <span className="text-[#b42318]">*</span>
            </label>
            <input
              id="te-code"
              type="text"
              required
              disabled={Boolean(typeEnEdition) || enCours}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX : CONS_GEN, URGENCE, VACCINATION"
              className={`${CHAMP} font-mono uppercase`}
            />
            <p className={AIDE}>
              {typeEnEdition
                ? "Immuable après création."
                : "Unique, en majuscules, non modifiable après création."}
            </p>
          </div>

          <div>
            <label htmlFor="te-libelle" className={LABEL}>
              Libellé <span className="text-[#b42318]">*</span>
            </label>
            <input
              id="te-libelle"
              type="text"
              required
              disabled={enCours}
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="ex : Consultation générale"
              className={CHAMP}
            />
          </div>

          <div>
            <label htmlFor="te-description" className={LABEL}>
              Description <span className="font-normal">(facultatif)</span>
            </label>
            <textarea
              id="te-description"
              rows={3}
              disabled={enCours}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex : Consultation médicale générale réalisée par un médecin généraliste"
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa]"
            />
          </div>

          {/* Services autorisés */}
          <div className={SECTION}>Services autorisés</div>

          <div className="flex items-baseline justify-between">
            <span className={AIDE}>
              Services où ce type peut être choisi à la prise en charge.
            </span>
            <span className="text-[13px] font-bold text-[#1f2937] tabular-nums">
              {nbSelectionnes} / {nbTotal}
            </span>
          </div>

          {typesTries.length === 0 ? (
            <p className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] text-[12px] text-amber-800">
              Aucun type de service n'est configuré. Créez-en un dans « Services Médicaux ».
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {typesTries.map((ts) => {
                const coche = typeServiceIds.includes(ts.id);
                return (
                  <label
                    key={ts.id}
                    className={`flex items-center gap-2.5 h-[52px] px-3 rounded-[10px] border cursor-pointer transition-colors ${FOCUS} ${
                      coche
                        ? "border-[#1f9d55] bg-[#e7f6ed]"
                        : "border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                    } ${enCours ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={coche}
                      onChange={() => basculerTypeService(ts.id)}
                      disabled={enCours}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`w-5 h-5 shrink-0 rounded-[5px] grid place-items-center ${
                        coche
                          ? "bg-[#1f9d55] text-white"
                          : "border-2 border-[#cbd5e1] bg-white"
                      }`}
                    >
                      {coche && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#1f2937] truncate">
                        {ts.nom}
                      </span>
                      {ts.code && (
                        <span className="block font-mono text-[11px] font-bold text-[#5b6472]">
                          {ts.code}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {nbTotal > 0 && nbSelectionnes === 0 && (
            <div className="p-3 rounded-[10px] bg-[#fff4e0] border border-[#f3d9a8] text-[#8a5300] text-[12px]">
              <b>Aucun service coché</b> : ce type ne sera disponible dans aucun service pour
              l'instant.
            </div>
          )}
          {nbSelectionnes > 0 && (
            <div className="p-3 rounded-[10px] bg-[#e7f6ed] border border-[#1f9d55] text-[#14703c] text-[12px]">
              <b>
                Ce type sera disponible dans {nbSelectionnes} service
                {nbSelectionnes > 1 ? "s" : ""}
              </b>{" "}
              :{" "}
              {typesTries
                .filter((t) => typeServiceIds.includes(t.id))
                .map((t) => t.nom)
                .join(", ")}
              .
            </div>
          )}

          {!typeEnEdition && (
            <p className={AIDE}>
              La sélection est enregistrée automatiquement juste après la création du type.
            </p>
          )}
        </div>

        {/* Pied */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Annuler
          </button>
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            <Check className="w-[18px] h-[18px]" />
            {enCours ? "Enregistrement…" : libelleAction}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default FormulaireTypeEncounterModale;