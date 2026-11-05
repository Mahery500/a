// src/briques/allergies/ui/FormulaireAllergieTiroir.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import { TiroirLateral } from "@/noyau/ui/TiroirLateral";

import type {
  AllergieCriticalite,
  AllergieDefinitionSummary,
  AllergieStatut,
  AllergieType,
  AllergieVerificationStatut,
  NouvelleAllergieInput,
  PrincipeActifOption,
  ReferentielsAllergie,
} from "../modele/allergie.types";
import { LIBELLES_CATEGORIE } from "../modele/allergie.types";

/* ── tokens (repris du reste de l'app) ─────────────────────────────── */
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

export interface FormulaireAllergieTiroirProps {
  ouvert: boolean;
  patientId: number;
  definitionsActives: AllergieDefinitionSummary[];
  /** Catalogue des principes actifs (référentiel Stock). */
  principesActifs: PrincipeActifOption[];
  referentiels: ReferentielsAllergie | null;
  enCours: boolean;
  onFermer: () => void;
  onCreer: (input: NouvelleAllergieInput) => Promise<boolean>;
}

type ModeSource = "substance" | "principeActif";

export const FormulaireAllergieTiroir: React.FC<FormulaireAllergieTiroirProps> = ({
  ouvert,
  patientId,
  definitionsActives,
  principesActifs,
  referentiels,
  enCours,
  onFermer,
  onCreer,
}) => {
  const [modeSource, setModeSource] = useState<ModeSource>("substance");
  const [allergieDefinitionCode, setAllergieDefinitionCode] = useState("");
  const [principeActifId, setPrincipeActifId] = useState<number | "">("");
  const [type, setType] = useState<AllergieType>("allergy");
  const [criticalite, setCriticalite] =
    useState<AllergieCriticalite>("unable-to-assess");
  const [verificationStatut, setVerificationStatut] =
    useState<AllergieVerificationStatut>("unconfirmed");
  const [statut, setStatut] = useState<AllergieStatut>("active");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    // Si le référentiel de substances est vide mais que des principes actifs
    // existent, on démarre directement sur le principe actif.
    setModeSource(
      definitionsActives.length === 0 && principesActifs.length > 0
        ? "principeActif"
        : "substance",
    );
    setAllergieDefinitionCode(definitionsActives[0]?.code ?? "");
    setPrincipeActifId("");
    setType("allergy");
    setCriticalite("unable-to-assess");
    setVerificationStatut("unconfirmed");
    setStatut("active");
    setDateDebut("");
    setDateFin("");
    setNote("");
    setErreur(null);
  }, [ouvert, definitionsActives, principesActifs]);

  const dateAujourdhui = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const j = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${j}`;
  }, []);

  const definitionSelectionnee = definitionsActives.find(
    (d) => d.code === allergieDefinitionCode,
  );

  const principeActifSelectionne = principesActifs.find(
    (p) => p.id === principeActifId,
  );

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (modeSource === "substance" && !allergieDefinitionCode) {
      return setErreur("Sélectionnez une substance allergène.");
    }
    if (modeSource === "principeActif" && !principeActifId) {
      return setErreur("Sélectionnez un principe actif.");
    }
    if (dateDebut && dateDebut > dateAujourdhui) {
      return setErreur("La date de début ne peut pas être dans le futur.");
    }
    if (dateFin && dateFin > dateAujourdhui) {
      return setErreur("La date de fin ne peut pas être dans le futur.");
    }
    if (dateFin && dateDebut && dateFin < dateDebut) {
      return setErreur("La date de fin ne peut pas précéder la date de début.");
    }
    if (dateFin && statut !== "resolved") {
      return setErreur(
        "Une date de fin n'est valide qu'avec le statut « résolue ».",
      );
    }

    const input: NouvelleAllergieInput = {
      patientId,
      allergieDefinitionCode:
        modeSource === "substance" ? allergieDefinitionCode : null,
      principeActifId:
        modeSource === "principeActif" ? Number(principeActifId) : null,
      type,
      criticalite,
      verificationStatut,
      statut,
      dateDebut: dateDebut || null,
      dateFin: dateFin || null,
      note: note.trim() || null,
    };

    await onCreer(input);
  };

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      fermetureBloquee={enCours}
      libelle="Nouvelle allergie"
    >
      <form onSubmit={soumettre} className="flex flex-col h-full min-h-0">
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">
              Nouvelle allergie
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Substance, criticité et vérification.
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

          {/* ── Type d'allergie ── */}
          <div className={SECTION}>Type</div>
          <div className="grid grid-cols-2 gap-3">
            {(["allergy", "intolerance"] as const).map((t) => {
              const actif = type === t;
              const libelle = t === "allergy" ? "Allergie" : "Intolérance";
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setType(t)}
                  className={`text-left p-3 rounded-[10px] border cursor-pointer transition-colors ${
                    actif
                      ? "border-2 border-[#1f9d55] bg-[#e7f6ed] px-[11px] py-[11px]"
                      : "border border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                  }`}
                >
                  <div className="font-bold text-sm text-[#1f2937]">
                    {libelle}
                  </div>
                  <div className="text-[12px] text-[#5b6472]">
                    {t === "allergy"
                      ? "Réaction immunologique"
                      : "Réaction non immunologique"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Source : substance ou principe actif ── */}
          <div className={SECTION}>Substance allergène</div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setModeSource("substance");
                setErreur(null);
              }}
              aria-pressed={modeSource === "substance"}
              className={`flex-1 h-9 rounded-[8px] text-[13px] border cursor-pointer transition ${
                modeSource === "substance"
                  ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                  : "border-[#e5e7eb] bg-white text-[#5b6472]"
              }`}
            >
              Référentiel substances
            </button>
            <button
              type="button"
              onClick={() => {
                setModeSource("principeActif");
                setErreur(null);
              }}
              aria-pressed={modeSource === "principeActif"}
              className={`flex-1 h-9 rounded-[8px] text-[13px] border cursor-pointer transition ${
                modeSource === "principeActif"
                  ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                  : "border-[#e5e7eb] bg-white text-[#5b6472]"
              }`}
            >
              Principe actif (Stock)
            </button>
          </div>

          {modeSource === "substance" && (
            <div>
              <label htmlFor="aller-sub" className={LABEL}>
                Substance <span className="text-[#b42318]">*</span>
              </label>
              <select
                id="aller-sub"
                value={allergieDefinitionCode}
                onChange={(e) => setAllergieDefinitionCode(e.target.value)}
                disabled={enCours}
                className={CHAMP}
              >
                <option value="">— Sélectionner une substance —</option>
                {definitionsActives.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.libelle} ({d.code})
                  </option>
                ))}
              </select>
              {definitionSelectionnee && (
                <p className={AIDE}>
                  Catégorie :{" "}
                  {LIBELLES_CATEGORIE[definitionSelectionnee.categorie]}
                </p>
              )}
              {definitionsActives.length === 0 && (
                <p className="text-[12px] text-[#8a5300] mt-1.5">
                  Aucune substance active dans le référentiel. Contactez un
                  administrateur.
                </p>
              )}
            </div>
          )}

          {modeSource === "principeActif" && (
            <div>
              <label htmlFor="aller-pa" className={LABEL}>
                Principe actif <span className="text-[#b42318]">*</span>
              </label>
              <select
                id="aller-pa"
                value={principeActifId}
                onChange={(e) =>
                  setPrincipeActifId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                disabled={enCours}
                className={CHAMP}
              >
                <option value="">— Sélectionner un principe actif —</option>
                {principesActifs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.libelle}
                  </option>
                ))}
              </select>
              {principeActifSelectionne && (
                <p className={AIDE}>
                  Principe actif #{principeActifSelectionne.id} — issu du
                  catalogue Stock (catégorie : Médicament).
                </p>
              )}
              {principesActifs.length === 0 && (
                <p className="text-[12px] text-[#8a5300] mt-1.5">
                  Aucun principe actif dans le catalogue Stock.
                </p>
              )}
            </div>
          )}

          {/* ── Criticité ── */}
          <div className={SECTION}>Criticité</div>
          <div className="grid grid-cols-3 gap-2">
            {(referentiels?.criticalites ?? []).map((c) => {
              const actif = criticalite === c.valeur;
              return (
                <button
                  key={c.valeur}
                  type="button"
                  aria-pressed={actif}
                  onClick={() =>
                    setCriticalite(c.valeur as AllergieCriticalite)
                  }
                  className={`p-2.5 rounded-[10px] border text-center cursor-pointer text-[13px] ${
                    actif
                      ? "border-2 border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                      : "border border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
                  }`}
                >
                  {c.libelle}
                </button>
              );
            })}
          </div>

          {/* ── Vérification ── */}
          <div className={SECTION}>Vérification</div>
          <select
            value={verificationStatut}
            onChange={(e) =>
              setVerificationStatut(
                e.target.value as AllergieVerificationStatut,
              )
            }
            disabled={enCours}
            aria-label="Statut de vérification"
            className={CHAMP}
          >
            {(referentiels?.verificationStatuts ?? []).map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>

          {/* ── Statut ── */}
          <div className={SECTION}>Statut</div>
          <select
            value={statut}
            onChange={(e) => {
              const v = e.target.value as AllergieStatut;
              setStatut(v);
              if (v !== "resolved") setDateFin("");
            }}
            disabled={enCours}
            aria-label="Statut initial"
            className={CHAMP}
          >
            {(referentiels?.statuts ?? []).map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.libelle}
              </option>
            ))}
          </select>
          <p className={AIDE}>
            Utilisez « résolue » uniquement pour saisir un antécédent déjà guéri
            (une date de fin y est recommandée).
          </p>

          {/* ── Dates ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="aller-debut" className={LABEL}>
                Date de début
              </label>
              <input
                id="aller-debut"
                type="date"
                value={dateDebut}
                max={dateAujourdhui}
                onChange={(e) => setDateDebut(e.target.value)}
                disabled={enCours}
                className={CHAMP}
              />
            </div>
            {statut === "resolved" && (
              <div>
                <label htmlFor="aller-fin" className={LABEL}>
                  Date de fin
                </label>
                <input
                  id="aller-fin"
                  type="date"
                  value={dateFin}
                  max={dateAujourdhui}
                  onChange={(e) => setDateFin(e.target.value)}
                  disabled={enCours}
                  className={CHAMP}
                />
              </div>
            )}
          </div>

          {/* ── Note ── */}
          <div>
            <label htmlFor="aller-note" className={LABEL}>
              Note clinique <span className="font-normal">(facultatif)</span>
            </label>
            <textarea
              id="aller-note"
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={enCours}
              placeholder="Circonstances, contexte, précisions…"
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-[10px] text-sm bg-white resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20"
            />
          </div>
        </div>

        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onFermer}
            disabled={enCours}
            className={BTN}
          >
            Annuler
          </button>
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            <Check className="w-[18px] h-[18px]" />
            {enCours ? "Enregistrement…" : "Enregistrer l'allergie"}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default FormulaireAllergieTiroir;