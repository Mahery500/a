/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useReferentielsHabilitations } from "@/noyau/referentiels/habilitations";
import type { Habilitation, HabilitationInput } from "@/noyau/referentiels/habilitations";
import type { CibleAvecHabilitations } from "../modele/matrice-habilitations.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472]";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";

export interface TiroirAjoutHabilitationProps {
  ouvert: boolean;
  cible: CibleAvecHabilitations | null;
  onFermer: () => void;
  onValider: (habilitations: HabilitationInput[]) => Promise<boolean>;
}

const dejaPresent = (
  existantes: Habilitation[],
  corpsCode: string,
  specCode: string | null,
): boolean =>
  existantes.some(
    (h) =>
      h.corpsMedicalCode === corpsCode &&
      (h.specialiteCode ?? null) === (specCode ?? null),
  );

export const TiroirAjoutHabilitation: React.FC<TiroirAjoutHabilitationProps> = ({
  ouvert,
  cible,
  onFermer,
  onValider,
}) => {
  const { corpsMedicaux, specialites, chargement } = useReferentielsHabilitations();

  const [corpsCode, setCorpsCode] = useState("");
  const [specCode, setSpecCode] = useState("");
  const [actif, setActif] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    setCorpsCode("");
    setSpecCode("");
    setActif(true);
    setErreur(null);
  }, [ouvert]);

  const corpsDisponibles = useMemo(() => {
    if (!cible) return corpsMedicaux;
    // On n'exclut pas les corps déjà présents : l'utilisateur peut ajouter
    // une nouvelle spécialité au même corps. La prévention de doublon exact
    // se fait à la soumission.
    return corpsMedicaux;
  }, [corpsMedicaux, cible]);

  const corpsSelectionne = corpsMedicaux.find((c) => c.code === corpsCode) ?? null;

  const dejaExistant =
    cible && corpsCode
      ? dejaPresent(
          cible.habilitations.map((h) => ({
            corpsMedicalCode: h.corpsMedicalCode,
            specialiteCode: h.specialiteCode,
          })) as Habilitation[],
          corpsCode,
          specCode || null,
        )
      : false;

  const apercuFinal = useMemo(() => {
    if (!cible || !corpsCode) return cible?.habilitations ?? [];
    const nouvelles = [...cible.habilitations];
    if (!dejaExistant) {
      nouvelles.push({
        corpsMedicalCode: corpsCode,
        corpsMedicalLibelle: corpsSelectionne?.libelle ?? corpsCode,
        specialiteCode: specCode || null,
        specialiteLibelle:
          specialites.find((s) => s.code === specCode)?.libelle ?? null,
        actif,
      });
    }
    return nouvelles;
  }, [cible, corpsCode, specCode, actif, dejaExistant, corpsSelectionne, specialites]);

  const apercuLibelleCorps = apercuFinal
    .map((h) => h.corpsMedicalLibelle ?? h.corpsMedicalCode)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(", ");

  const valider = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!cible) return;

    if (!corpsCode) {
      setErreur("Sélectionnez un corps médical.");
      return;
    }
    if (dejaExistant) {
      setErreur("Cette habilitation (corps + spécialité) existe déjà pour cette cible.");
      return;
    }

    setEnCours(true);
    setErreur(null);
    try {
      const nouvelles: HabilitationInput[] = [
        ...cible.habilitations.map((h) => ({
          corpsMedicalCode: h.corpsMedicalCode,
          specialiteCode: h.specialiteCode,
        })),
        { corpsMedicalCode: corpsCode, specialiteCode: specCode || null },
      ];
      const ok = await onValider(nouvelles);
      if (ok) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  if (!ouvert || !cible) return null;

  const nbApres = apercuFinal.length;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
        onClick={enCours ? undefined : onFermer}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Ajouter une habilitation"
        className="absolute top-0 right-0 bottom-0 w-[560px] max-w-full bg-white flex flex-col"
        style={{ boxShadow: "-12px 0 40px rgba(15,27,61,.25)" }}
      >
        {/* Header */}
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
          <div>
            <h2 className="text-[17px] font-bold">Ajouter une habilitation</h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Les champs marqués d'une étoile sont obligatoires.
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

        {/* Corps */}
        <form
          id="form-habilitation"
          onSubmit={valider}
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3.5"
        >
          {erreur && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-[#b42318] rounded-[10px] text-[12px] font-medium"
            >
              {erreur}
            </div>
          )}

          {/* Contexte de la cible */}
          <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px]">
            <div className="text-[12px] text-[#5b6472]">
              {cible.type === "acte" ? "Pour l'acte" : "Pour le diagnostic"}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold">
                {cible.code}
              </span>
              <b className="text-[13px] text-[#1f2937]">{cible.libelle}</b>
            </div>
            {cible.categorieLibelle && (
              <div className="text-[12px] text-[#5b6472] mt-0.5">
                {cible.categorieLibelle}
              </div>
            )}
          </div>

          {/* Corps médical */}
          <div>
            <label htmlFor="hab-corps" className={LABEL}>
              Corps médical <span className="text-[#b42318]">*</span>
            </label>
            <select
              id="hab-corps"
              value={corpsCode}
              onChange={(e) => {
                setCorpsCode(e.target.value);
                setErreur(null);
              }}
              disabled={enCours || chargement}
              className={CHAMP}
            >
              <option value="">
                {chargement ? "Chargement…" : "— Sélectionner —"}
              </option>
              {corpsDisponibles.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.libelle} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Spécialité */}
          <div>
            <label htmlFor="hab-spec" className={LABEL}>
              Spécialité <span className="font-normal">(facultatif)</span>
            </label>
            <select
              id="hab-spec"
              value={specCode}
              onChange={(e) => {
                setSpecCode(e.target.value);
                setErreur(null);
              }}
              disabled={enCours || !corpsCode}
              className={CHAMP}
            >
              <option value="">Toutes les spécialités</option>
              {specialites.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.libelle} ({s.code})
                </option>
              ))}
            </select>
            <p className={AIDE}>
              Laissez vide pour toutes les spécialités du corps médical.
            </p>
          </div>

          {/* Toggle actif */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={actif}
              onClick={() => setActif(!actif)}
              disabled={enCours}
              className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  actif ? "left-4" : "left-0.5"
                }`}
              />
            </button>
            <div>
              <div className="font-bold text-[13px] text-[#1f2937]">
                Habilitation active dès l'ajout
              </div>
              <p className="text-[12px] text-[#5b6472]">
                Une habilitation inactive n'autorise plus l'acte.
              </p>
            </div>
          </div>

          {/* Aperçu après ajout */}
          {corpsCode && !dejaExistant && (
            <div className="p-3 rounded-[10px] bg-[#e7f6ed] border border-[#1f9d55] text-[#14703c] text-[12px]">
              <b>
                Après l'ajout : {nbApres} habilitation{nbApres > 1 ? "s" : ""}
              </b>{" "}
              pour cet {cible.type === "acte" ? "acte" : "diagnostic"} ({apercuLibelleCorps}).
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onFermer}
            disabled={enCours}
            className={BTN}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="form-habilitation"
            disabled={enCours || !corpsCode || dejaExistant}
            className={BTN_PRIMAIRE}
          >
            <Check className="w-[18px] h-[18px]" />
            {enCours ? "Enregistrement…" : "Ajouter l'habilitation"}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default TiroirAjoutHabilitation;