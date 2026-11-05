// src/briques/allergies/ui/FormulaireReactionTiroir.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import { TiroirLateral } from "@/noyau/ui/TiroirLateral";

import type {
  AllergieDefinitionSummary,
  NouvelleReactionInput,
  ReferentielsAllergie,
  SeveriteReaction,
} from "../modele/allergie.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";

export interface FormulaireReactionTiroirProps {
  ouvert: boolean;
  allergieId: number;
  definitionsActives: AllergieDefinitionSummary[];
  referentiels: ReferentielsAllergie | null;
  enCours: boolean;
  onFermer: () => void;
  onValider: (input: NouvelleReactionInput) => Promise<boolean>;
}

const EXEMPLES_MANIFESTATION = [
  "Urticaire",
  "Œdème de Quincke",
  "Dyspnée",
  "Prurit",
  "Rhinorrhée",
  "Nausées",
];

export const FormulaireReactionTiroir: React.FC<FormulaireReactionTiroirProps> = ({
  ouvert,
  definitionsActives,
  referentiels,
  enCours,
  onFermer,
  onValider,
}) => {
  const [manifestation, setManifestation] = useState("");
  const [severite, setSeverite] = useState<SeveriteReaction>("mild");
  const [allergieDefinitionCode, setAllergieDefinitionCode] = useState("");
  const [description, setDescription] = useState("");
  const [dateReaction, setDateReaction] = useState("");
  const [exposition, setExposition] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    setManifestation("");
    setSeverite("mild");
    setAllergieDefinitionCode("");
    setDescription("");
    setDateReaction("");
    setExposition("");
    setErreur(null);
  }, [ouvert]);

  const aujourdhui = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const j = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${j}`;
  }, []);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!manifestation.trim()) {
      return setErreur("Renseignez la manifestation clinique.");
    }
    if (dateReaction && dateReaction > aujourdhui) {
      return setErreur("La date de réaction ne peut pas être dans le futur.");
    }

    await onValider({
      manifestation: manifestation.trim(),
      severite,
      allergieDefinitionCode: allergieDefinitionCode || null,
      description: description.trim() || null,
      dateReaction: dateReaction ? `${dateReaction}T00:00:00` : null,
      exposition: exposition.trim() || null,
    });
  };

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      fermetureBloquee={enCours}
      libelle="Nouvelle réaction allergique"
    >
      <form onSubmit={soumettre} className="flex flex-col h-full min-h-0">
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">
              Ajouter une réaction
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Manifestation, sévérité et circonstances.
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

          <div className={SECTION}>Manifestation</div>
          <div>
            <label htmlFor="react-manif" className={LABEL}>
              Manifestation clinique <span className="text-[#b42318]">*</span>
            </label>
            <input
              id="react-manif"
              type="text"
              value={manifestation}
              onChange={(e) => setManifestation(e.target.value)}
              maxLength={255}
              disabled={enCours}
              placeholder="Urticaire, dyspnée, œdème…"
              className={CHAMP}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXEMPLES_MANIFESTATION.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setManifestation(m)}
                  className="px-2.5 py-0.5 rounded-full border border-[#e5e7eb] bg-white text-[10.5px] text-[#5b6472] hover:border-[#1f9d55] hover:text-[#14703c] transition cursor-pointer"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={LABEL}>
              Sévérité <span className="text-[#b42318]">*</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(referentiels?.severites ?? []).map((s) => {
                const actif = severite === s.valeur;
                return (
                  <button
                    key={s.valeur}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => setSeverite(s.valeur as SeveriteReaction)}
                    className={`p-2.5 rounded-[10px] border text-center cursor-pointer text-[13px] ${
                      actif
                        ? "border-2 border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                        : "border border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
                    }`}
                  >
                    {s.libelle}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={SECTION}>Circonstances</div>

          <div>
            <label htmlFor="react-sub" className={LABEL}>
              Substance spécifique (facultatif)
            </label>
            <select
              id="react-sub"
              value={allergieDefinitionCode}
              onChange={(e) => setAllergieDefinitionCode(e.target.value)}
              disabled={enCours}
              className={CHAMP}
            >
              <option value="">— La substance de l'allergie —</option>
              {definitionsActives.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.libelle} ({d.code})
                </option>
              ))}
            </select>
            <p className={AIDE}>
              Utile si la réaction provient d'une substance plus précise que
              l'allergie parente.
            </p>
          </div>

          <div>
            <label htmlFor="react-expo" className={LABEL}>
              Exposition
            </label>
            <input
              id="react-expo"
              type="text"
              value={exposition}
              onChange={(e) => setExposition(e.target.value)}
              maxLength={50}
              disabled={enCours}
              placeholder="ingestion, contact, injection…"
              className={CHAMP}
            />
          </div>

          <div>
            <label htmlFor="react-date" className={LABEL}>
              Date de la réaction
            </label>
            <input
              id="react-date"
              type="date"
              value={dateReaction}
              max={aujourdhui}
              onChange={(e) => setDateReaction(e.target.value)}
              disabled={enCours}
              className={CHAMP}
            />
            <p className={AIDE}>Par défaut : l'instant courant.</p>
          </div>

          <div>
            <label htmlFor="react-desc" className={LABEL}>
              Description <span className="font-normal">(facultatif)</span>
            </label>
            <textarea
              id="react-desc"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={enCours}
              placeholder="Détails cliniques, traitement reçu, évolution…"
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-[10px] text-sm bg-white resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20"
            />
          </div>
        </div>

        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Annuler
          </button>
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            <Check className="w-[18px] h-[18px]" />
            {enCours ? "Enregistrement…" : "Enregistrer la réaction"}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default FormulaireReactionTiroir;