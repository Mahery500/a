// src/briques/diagnostic-definitions/ui/FormulaireDiagnosticDefinitionModale.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Check, Plus, Trash2, AlertTriangle } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import {
  DiagnosticDefinition,
  NouvelleDiagnosticDefinitionInput,
  ModificationDiagnosticDefinitionInput,
  CodeSystemeOption,
  CodificationDiagnostic,
} from "../modele/diagnostic-definition.types";
import { useReferentielsHabilitations } from "@/noyau/referentiels/habilitations";
import type { HabilitationInput } from "@/noyau/referentiels/habilitations";

/* =====================================================================
 *  Tokens du design (maquettes Diag2 / Diag3 / Diag4 / Diag5)
 *  vert #1f9d55 · vert clair #e7f6ed · vert foncé #14703c
 *  bordure #e5e7eb · séparateur #f0f2f1 · texte #1f2937 · muted #5b6472
 *  erreur #b42318 · ambre #fff4e0 / #8a5300
 * ===================================================================== */
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
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const EXT_CHIP =
  "inline-block bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const HABIL_CHIP =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] text-[13px] font-semibold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

/* =====================================================================
 *  Stepper (3 étapes)
 * ===================================================================== */
type Etape = 1 | 2 | 3;
const ETAPES: { numero: Etape; libelle: string }[] = [
  { numero: 1, libelle: "Identité" },
  { numero: 2, libelle: "Habilitations" },
  { numero: 3, libelle: "Codifications" },
];

const Stepper: React.FC<{
  etapeCourante: Etape;
  onNaviguer: (n: Etape) => void;
  desactive?: boolean;
}> = ({ etapeCourante, onNaviguer, desactive }) => (
  <div className="flex items-center px-6 py-4 border-b border-[#e5e7eb] shrink-0">
    {ETAPES.map((e, idx) => {
      const fait = e.numero < etapeCourante;
      const active = e.numero === etapeCourante;
      const vert = fait || active;
      const clickable = !desactive && e.numero !== etapeCourante;
      return (
        <React.Fragment key={e.numero}>
          <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onNaviguer(e.numero)}
            className={`flex items-center gap-2 ${clickable ? "cursor-pointer" : "cursor-default"} ${FOCUS}`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                vert
                  ? "bg-[#1f9d55] text-white"
                  : "border-2 border-[#e5e7eb] bg-white text-[#5b6472]"
              }`}
            >
              {fait ? <Check className="w-4 h-4" strokeWidth={3} /> : e.numero}
            </span>
            <span
              className={`text-[13px] whitespace-nowrap ${
                active ? "font-bold text-[#14703c]" : "font-semibold text-[#5b6472]"
              }`}
            >
              {e.libelle}
            </span>
          </button>
          {idx < ETAPES.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2.5 ${fait ? "bg-[#1f9d55]" : "bg-[#e5e7eb]"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* =====================================================================
 *  Rappel (étapes 2 et 3)
 * ===================================================================== */
const Rappel: React.FC<{
  code: string;
  libelle: string;
  estEdition: boolean;
}> = ({ code, libelle, estEdition }) => (
  <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px]">
    <div className="text-[12px] text-[#5b6472]">
      Rappel · diagnostic en cours de {estEdition ? "modification" : "création"}
    </div>
    <div className="mt-1 flex items-center gap-2 flex-wrap">
      <span className={CODE_CHIP}>{code || "—"}</span>
      <span className="font-bold text-[#1f2937] text-sm truncate">{libelle || "—"}</span>
    </div>
  </div>
);

/* =====================================================================
 *  Bandeau d'erreur (bordé rouge, conforme à Diag3)
 * ===================================================================== */
const ErreurBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    role="alert"
    className="p-3.5 border border-[#b42318] rounded-[10px] text-[#b42318] font-bold text-[12px] flex items-start gap-2"
  >
    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
    <span>{message}</span>
  </div>
);

/* =====================================================================
 *  Props (inchangées — rétro‑compatibles avec le panneau)
 * ===================================================================== */
export interface FormulaireDiagnosticDefinitionModaleProps {
  ouvert: boolean;
  onFermer: () => void;
  definitionExistante?: DiagnosticDefinition | null;
  chapitresConnus?: string[];
  codeSystems?: CodeSystemeOption[];
  onEnregistrer: (
    saisie: NouvelleDiagnosticDefinitionInput | ModificationDiagnosticDefinitionInput,
  ) => Promise<boolean>;
}

/* =====================================================================
 *  Composant principal
 * ===================================================================== */
export const FormulaireDiagnosticDefinitionModale: React.FC<
  FormulaireDiagnosticDefinitionModaleProps
> = ({
  ouvert,
  onFermer,
  definitionExistante = null,
  chapitresConnus = [],
  codeSystems = [],
  onEnregistrer,
}) => {
  const estEdition = definitionExistante !== null;

  const [etape, setEtape] = useState<Etape>(1);

  // Étape 1 — Identité
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [chapitre, setChapitre] = useState("");
  const [description, setDescription] = useState("");

  // Étape 2 — Habilitations
  const [habilitations, setHabilitations] = useState<HabilitationInput[]>([]);
  const [corpsSelectionne, setCorpsSelectionne] = useState("");
  const [specialiteSelectionnee, setSpecialiteSelectionnee] = useState("");

  // Étape 3 — Codifications
  const [codifications, setCodifications] = useState<CodificationDiagnostic[]>([]);
  const [actif, setActif] = useState(true);

  // État
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const {
    corpsMedicaux,
    specialites,
    chargement: chargementRef,
  } = useReferentielsHabilitations();

  const codeSystemsActifs = useMemo(
    () =>
      codeSystems
        .filter((cs) => cs.actif)
        .sort((a, b) => a.code.localeCompare(b.code, "fr")),
    [codeSystems],
  );

  /* -------- Initialisation à chaque ouverture -------- */
  useEffect(() => {
    if (!ouvert) return;
    setEtape(1);
    setErreur(null);
    if (definitionExistante) {
      setCode(definitionExistante.code);
      setLibelle(definitionExistante.libelle);
      setChapitre(definitionExistante.chapitre ?? "");
      setDescription(definitionExistante.description ?? "");
      setActif(definitionExistante.actif);
      setHabilitations(
        definitionExistante.habilitations.map((h) => ({
          corpsMedicalCode: h.corpsMedicalCode,
          specialiteCode: h.specialiteCode ?? null,
        })),
      );
      setCodifications(definitionExistante.codifications ?? []);
    } else {
      setCode("");
      setLibelle("");
      setChapitre("");
      setDescription("");
      setActif(true);
      setHabilitations([]);
      setCodifications([]);
    }
    setCorpsSelectionne("");
    setSpecialiteSelectionnee("");
  }, [ouvert, definitionExistante]);

  /* -------- Validations par étape -------- */
  const validerEtape1 = (): string | null => {
    if (!code.trim()) return "Le code du diagnostic est obligatoire.";
    if (!libelle.trim()) return "Le libellé du diagnostic est obligatoire.";
    return null;
  };

  const validerEtape2 = (): string | null => {
    if (habilitations.length === 0) return "Au moins une habilitation est obligatoire.";
    return null;
  };

  /* -------- Navigation -------- */
  const allerA = (n: Etape) => {
    if (enCours) return;
    if (n === etape) return;
    if (n < etape) {
      setEtape(n);
      setErreur(null);
      return;
    }
    // Forward : valider chaque étape intermédiaire
    if (n >= 2) {
      const m1 = validerEtape1();
      if (m1) {
        setErreur(m1);
        setEtape(1);
        return;
      }
    }
    if (n >= 3) {
      const m2 = validerEtape2();
      if (m2) {
        setErreur(m2);
        setEtape(2);
        return;
      }
    }
    setEtape(n);
    setErreur(null);
  };

  const suivant = () => {
    if (etape === 1) {
      const m = validerEtape1();
      if (m) return setErreur(m);
      setEtape(2);
      setErreur(null);
    } else if (etape === 2) {
      const m = validerEtape2();
      if (m) return setErreur(m);
      setEtape(3);
      setErreur(null);
    } else {
      void enregistrer();
    }
  };

  const precedent = () => {
    if (etape > 1) {
      setEtape((etape - 1) as Etape);
      setErreur(null);
    }
  };

  /* -------- Helpers habilitations -------- */
  const libelleCorps = (codeCorps: string) =>
    corpsMedicaux.find((c) => c.code === codeCorps)?.libelle ?? codeCorps;

  const libelleSpecialite = (codeSpec?: string | null) =>
    codeSpec ? (specialites.find((s) => s.code === codeSpec)?.libelle ?? codeSpec) : null;

  const ajouterHabilitation = () => {
    if (!corpsSelectionne) return;
    const existe = habilitations.some(
      (h) =>
        h.corpsMedicalCode === corpsSelectionne &&
        (h.specialiteCode ?? null) === (specialiteSelectionnee || null),
    );
    if (existe) return;
    setHabilitations((prev) => [
      ...prev,
      {
        corpsMedicalCode: corpsSelectionne,
        specialiteCode: specialiteSelectionnee || null,
      },
    ]);
    setSpecialiteSelectionnee("");
    setErreur(null);
  };

  const retirerHabilitation = (index: number) => {
    setHabilitations((prev) => prev.filter((_, i) => i !== index));
  };

  /* -------- Helpers codifications -------- */
  const ajouterCodification = () => {
    const systemeDefaut = codeSystemsActifs[0]?.code ?? "CIM-10";
    setCodifications((prev) => [...prev, { codeSystem: systemeDefaut, code: "" }]);
  };

  const modifierCodification = (
    idx: number,
    champ: "codeSystem" | "code",
    valeur: string,
  ) => {
    setCodifications((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const maj = { ...c, [champ]: valeur };
        if (champ === "code") maj.libelle = undefined;
        return maj;
      }),
    );
  };

  const retirerCodification = (idx: number) => {
    setCodifications((prev) => prev.filter((_, i) => i !== idx));
  };

  /* -------- Soumission -------- */
  const enregistrer = async () => {
    setErreur(null);
    const m1 = validerEtape1();
    if (m1) {
      setEtape(1);
      return setErreur(m1);
    }
    const m2 = validerEtape2();
    if (m2) {
      setEtape(2);
      return setErreur(m2);
    }

    setEnCours(true);
    try {
      const codifsValides = codifications
        .map((c) => ({
          codeSystem: c.codeSystem.trim().toUpperCase(),
          code: c.code.trim(),
          libelle: c.libelle?.trim() || undefined,
        }))
        .filter((c) => c.code.length > 0 && c.codeSystem.length > 0);

      if (estEdition && definitionExistante) {
        const payload: ModificationDiagnosticDefinitionInput = {
          libelle: libelle.trim(),
          chapitre: chapitre.trim() || null,
          description: description.trim() || null,
          actif,
          codifications: codifsValides,
          habilitations,
        };
        const ok = await onEnregistrer(payload);
        if (ok) onFermer();
        else setErreur("Impossible d'enregistrer les modifications.");
      } else {
        const payload: NouvelleDiagnosticDefinitionInput = {
          code: code.trim().toUpperCase(),
          libelle: libelle.trim(),
          chapitre: chapitre.trim() || null,
          description: description.trim() || null,
          actif,
          codifications: codifsValides,
          habilitations,
        };
        const ok = await onEnregistrer(payload);
        if (ok) onFermer();
        else setErreur("Impossible de créer le diagnostic.");
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setEnCours(false);
    }
  };

  const libelleAction =
    etape === 3
      ? enCours
        ? "Enregistrement…"
        : estEdition
          ? "Enregistrer les modifications"
          : "Créer le diagnostic"
      : "Continuer";

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      fermetureBloquee={enCours}
      libelle={estEdition ? "Modifier le diagnostic" : "Nouveau diagnostic médical"}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* ============ En-tête ============ */}
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2937] leading-tight">
              {estEdition ? "Modifier le diagnostic médical" : "Nouveau diagnostic médical"}
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Étape {etape} sur {ETAPES.length} · champs obligatoires marqués d'une étoile
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? undefined : onFermer}
            disabled={enCours}
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============ Stepper ============ */}
        <Stepper etapeCourante={etape} onNaviguer={allerA} desactive={enCours} />

        {/* ============ Contenu ============ */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* ---------- ÉTAPE 1 — IDENTITÉ ---------- */}
          {etape === 1 && (
            <>
              {erreur && <ErreurBanner message={erreur} />}

              <div>
                <label htmlFor="diag-code" className={LABEL}>
                  Code du diagnostic <span className="text-[#b42318]">*</span>
                </label>
                <input
                  id="diag-code"
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase().replace(/\s/g, "_"))
                  }
                  placeholder="EX : ANGINE"
                  disabled={estEdition || enCours}
                  className={`${CHAMP} font-mono uppercase`}
                />
                <p className={AIDE}>
                  Code interne unique, en majuscules. Les codes CIM-10 se saisissent à
                  l'étape 3.
                </p>
              </div>

              <div>
                <label htmlFor="diag-libelle" className={LABEL}>
                  Libellé complet du diagnostic <span className="text-[#b42318]">*</span>
                </label>
                <input
                  id="diag-libelle"
                  type="text"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="ex : Infection aiguë des voies respiratoires supérieures"
                  disabled={enCours}
                  className={CHAMP}
                />
              </div>

              <div>
                <label htmlFor="diag-chapitre" className={LABEL}>
                  Chapitre / catégorie nosologique{" "}
                  <span className="font-normal">(facultatif)</span>
                </label>
                <input
                  id="diag-chapitre"
                  type="text"
                  list="chapitres-existants"
                  value={chapitre}
                  onChange={(e) => setChapitre(e.target.value)}
                  placeholder="Choisir ou saisir un chapitre…"
                  disabled={enCours}
                  className={CHAMP}
                />
                <datalist id="chapitres-existants">
                  {chapitresConnus.map((ch) => (
                    <option key={ch} value={ch} />
                  ))}
                </datalist>
                <p className={AIDE}>
                  Ex. Maladies de l'appareil respiratoire (chapitre X).
                </p>
              </div>

              <div>
                <label htmlFor="diag-description" className={LABEL}>
                  Description clinique ou critères d'inclusion{" "}
                  <span className="font-normal">(facultatif)</span>
                </label>
                <textarea
                  id="diag-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Précisions diagnostiques, diagnostics différentiels exclus…"
                  disabled={enCours}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa]"
                />
              </div>
            </>
          )}

          {/* ---------- ÉTAPE 2 — HABILITATIONS ---------- */}
          {etape === 2 && (
            <>
              <Rappel code={code} libelle={libelle} estEdition={estEdition} />

              <div className={SECTION}>
                Habilitations requises <span className="text-[#b42318]">*</span>
              </div>

              {/* Bandeau d'erreur placé entre le titre de section et le form (cf. Diag3) */}
              {erreur && <ErreurBanner message={erreur} />}

              {habilitations.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {habilitations.map((h, i) => {
                    const spec = libelleSpecialite(h.specialiteCode);
                    return (
                      <span
                        key={`${h.corpsMedicalCode}-${h.specialiteCode ?? "-"}-${i}`}
                        className={HABIL_CHIP}
                      >
                        {libelleCorps(h.corpsMedicalCode)}
                        {spec ? ` · ${spec}` : ""}
                        <button
                          type="button"
                          onClick={() => retirerHabilitation(i)}
                          disabled={enCours}
                          className="text-[#14703c]/70 hover:text-[#b42318] cursor-pointer disabled:opacity-50"
                          aria-label={`Retirer l'habilitation ${libelleCorps(h.corpsMedicalCode)}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                  <span className="text-[12px] text-[#5b6472] ml-auto">
                    {habilitations.length} habilitation{habilitations.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px] flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="diag-corps" className={LABEL}>
                      Corps médical
                    </label>
                    <select
                      id="diag-corps"
                      value={corpsSelectionne}
                      onChange={(e) => setCorpsSelectionne(e.target.value)}
                      disabled={enCours || chargementRef}
                      className={CHAMP}
                    >
                      <option value="">
                        {chargementRef ? "Chargement…" : "— Sélectionner —"}
                      </option>
                      {corpsMedicaux.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="diag-spec" className={LABEL}>
                      Spécialité <span className="font-normal">(facultatif)</span>
                    </label>
                    <select
                      id="diag-spec"
                      value={specialiteSelectionnee}
                      onChange={(e) => setSpecialiteSelectionnee(e.target.value)}
                      disabled={enCours || chargementRef}
                      className={CHAMP}
                    >
                      <option value="">— Toutes —</option>
                      {specialites.map((s) => (
                        <option key={s.id} value={s.code}>
                          {s.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={ajouterHabilitation}
                  disabled={enCours || !corpsSelectionne}
                  className={`${BTN} justify-center`}
                >
                  <Plus className="w-[18px] h-[18px]" />
                  Ajouter l'habilitation
                </button>
              </div>

              <p className={AIDE}>
                Seuls les professionnels habilités pourront poser ce diagnostic en
                consultation.
              </p>
            </>
          )}

          {/* ---------- ÉTAPE 3 — CODIFICATIONS ---------- */}
          {etape === 3 && (
            <>
              {erreur && <ErreurBanner message={erreur} />}

              <Rappel code={code} libelle={libelle} estEdition={estEdition} />

              <div className="p-3 bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] text-[#8a5300] text-[12px]">
                <b>Codification facultative.</b> Sans codification internationale, le
                diagnostic est signalé « À codifier ».
              </div>

              <div className="flex justify-between items-baseline gap-2">
                <span className="text-sm font-bold text-[#1f2937]">
                  Codifications internationales ({codifications.length})
                </span>
                <span className="text-[12px] text-[#5b6472] text-right">
                  CIM-10, CIM-11, SNOMED CT, CISP-2…
                </span>
              </div>

              {codeSystemsActifs.length === 0 && (
                <p className="text-[12px] text-[#5b6472] italic">
                  Aucune terminologie active. Ajoutez-en dans « Terminologies ».
                </p>
              )}

              {codifications.map((c, idx) => {
                const previewLibelle = c.libelle?.trim() || c.code;
                return (
                  <div
                    key={idx}
                    className="p-3 border border-[#e5e7eb] rounded-[10px] flex flex-col gap-2.5 relative"
                  >
                    <button
                      type="button"
                      onClick={() => retirerCodification(idx)}
                      disabled={enCours}
                      aria-label="Retirer cette codification"
                      className="absolute top-1.5 right-1.5 p-1 text-[#5b6472] hover:text-[#b42318] hover:bg-rose-50 rounded transition cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex gap-2.5 items-start pr-8">
                      <div className="w-[150px] shrink-0">
                        <label className={LABEL}>Système</label>
                        <select
                          value={c.codeSystem}
                          onChange={(e) =>
                            modifierCodification(idx, "codeSystem", e.target.value)
                          }
                          disabled={enCours}
                          className={CHAMP}
                        >
                          {codeSystemsActifs.map((cs) => (
                            <option key={cs.id} value={cs.code}>
                              {cs.code}
                            </option>
                          ))}
                          {c.codeSystem &&
                            !codeSystemsActifs.some((cs) => cs.code === c.codeSystem) && (
                              <option value={c.codeSystem}>
                                {c.codeSystem} (désactivé)
                              </option>
                            )}
                        </select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className={LABEL}>Code</label>
                        <input
                          type="text"
                          value={c.code}
                          onChange={(e) =>
                            modifierCodification(idx, "code", e.target.value)
                          }
                          disabled={enCours}
                          placeholder="ex : J03"
                          className={`${CHAMP} font-mono`}
                        />
                      </div>
                    </div>

                    {previewLibelle && (
                      <div className="text-[12px] text-[#5b6472] flex items-center gap-2 min-w-0">
                        <span className={EXT_CHIP}>{c.codeSystem}</span>
                        <span className="truncate">{previewLibelle}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={ajouterCodification}
                disabled={enCours || codeSystemsActifs.length === 0}
                className={BTN}
              >
                <Plus className="w-[18px] h-[18px]" />
                Ajouter une codification
              </button>

              <div className={SECTION}>Disponibilité</div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={actif}
                  aria-label="Diagnostic actif"
                  disabled={enCours}
                  onClick={() => setActif(!actif)}
                  className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                    actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                  } ${FOCUS}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      actif ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
                <div>
                  <div className="font-bold text-sm text-[#1f2937]">
                    {actif ? "Diagnostic actif" : "Diagnostic inactif"}
                  </div>
                  <p className="text-[12px] text-[#5b6472]">
                    {actif
                      ? "Proposé lors des consultations médicales."
                      : "Masqué des consultations médicales."}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ============ Pied ============ */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={precedent}
            disabled={etape === 1 || enCours}
            className={`${BTN} ${etape === 1 ? "invisible" : ""}`}
            aria-hidden={etape === 1}
          >
            Retour
          </button>

          <button
            type="button"
            onClick={suivant}
            disabled={enCours}
            className={BTN_PRIMAIRE}
          >
            {etape === 3 && !enCours && <Check className="w-[18px] h-[18px]" />}
            {libelleAction}
          </button>
        </div>
      </div>
    </TiroirLateral>
  );
};

export default FormulaireDiagnosticDefinitionModale;