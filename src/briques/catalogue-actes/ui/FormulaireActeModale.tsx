/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import {
  ActeMedical,
  CategorieActe,
  TypeServiceOption,
  NouvelActeInput,
  ModificationActeInput,
  CodeSystemeOption,
  CodificationActe,
} from "../modele/catalogue-actes.types";
import { useReferentielsHabilitations } from "@/noyau/referentiels/habilitations";
import type { HabilitationInput } from "@/noyau/referentiels/habilitations";
import { LIBELLES_DOMAINE_SERVICE } from "@/briques/services/modele/service.types";

/* =====================================================================
 *  Tokens du design (maquettes Actes1 / Actes2 / Actes3)
 * ===================================================================== */
const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 " +
  "bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 " +
  "border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition-colors disabled:opacity-50";
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const EXT_CHIP =
  "inline-block bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";

type Etape = 1 | 2 | 3;
const ETAPES: { numero: Etape; libelle: string }[] = [
  { numero: 1, libelle: "Identité" },
  { numero: 2, libelle: "Habilitations et services" },
  { numero: 3, libelle: "Codifications" },
];

/* =====================================================================
 *  Stepper
 * ===================================================================== */
const Stepper: React.FC<{ etapeCourante: Etape }> = ({ etapeCourante }) => (
  <div className="flex items-center px-6 py-4 border-b border-[#e5e7eb] shrink-0">
    {ETAPES.map((e, idx) => {
      const fait = e.numero < etapeCourante;
      const active = e.numero === etapeCourante;
      const vert = fait || active;
      return (
        <React.Fragment key={e.numero}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                vert
                  ? "bg-[#1f9d55] text-white"
                  : "border-2 border-[#e5e7eb] bg-white text-[#5b6472]"
              }`}
            >
              {fait ? <Check className="w-4 h-4" strokeWidth={3} /> : e.numero}
            </div>
            <span
              className={`text-[13px] whitespace-nowrap ${
                active ? "font-bold text-[#14703c]" : "font-semibold text-[#5b6472]"
              }`}
            >
              {e.libelle}
            </span>
          </div>
          {idx < ETAPES.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2.5 ${fait ? "bg-[#1f9d55]" : "bg-[#e5e7eb]"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* =====================================================================
 *  Carte « Rappel » (étapes 2 et 3)
 * ===================================================================== */
const Rappel: React.FC<{ code: string; libelle: string; chemin: string }> = ({
  code,
  libelle,
  chemin,
}) => (
  <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px]">
    <div className="text-[12px] text-[#5b6472]">Rappel · acte en cours de création</div>
    <div className="mt-1 flex items-center gap-2">
      <span className={CODE_CHIP}>{code}</span>
      <span className="font-bold text-[#1f2937] text-sm truncate">{libelle}</span>
    </div>
    {chemin && <div className="text-[12px] text-[#5b6472] mt-0.5">{chemin}</div>}
  </div>
);

/* =====================================================================
 *  Props
 * ===================================================================== */
export interface FormulaireActeModaleProps {
  ouvert: boolean;
  acteEnEdition: ActeMedical | null;
  categories: CategorieActe[];
  typesServices: TypeServiceOption[];
  codeSystems: CodeSystemeOption[];
  onFermer: () => void;
  onEnregistrer: (
    saisie: NouvelActeInput | ModificationActeInput,
    id?: number,
  ) => Promise<boolean>;
  /** Optionnel : appelé en mode modification pour sauver les codifications externes. */
  onEnregistrerCodifications?: (
    id: number,
    codifications: CodificationActe[],
  ) => Promise<boolean>;
}

/* =====================================================================
 *  Composant principal
 * ===================================================================== */
export const FormulaireActeModale: React.FC<FormulaireActeModaleProps> = ({
  ouvert,
  acteEnEdition,
  categories,
  typesServices,
  codeSystems,
  onFermer,
  onEnregistrer,
  onEnregistrerCodifications,
}) => {
  const estEdition = acteEnEdition !== null;

  const [etape, setEtape] = useState<Etape>(1);

  // Étape 1
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [categorieCode, setCategorieCode] = useState("");

  // Étape 2
  const [habilitations, setHabilitations] = useState<HabilitationInput[]>([]);
  const [corpsSelectionne, setCorpsSelectionne] = useState("");
  const [specialiteSelectionnee, setSpecialiteSelectionnee] = useState("");
  const [typeServiceIds, setTypeServiceIds] = useState<number[]>([]);

  // Filtre « Services médicaux uniquement » (activé par défaut).
  const [servicesMedicauxSeulement, setServicesMedicauxSeulement] = useState(true);

  // Étape 3
  const [codifications, setCodifications] = useState<CodificationActe[]>([]);

  // État
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const { corpsMedicaux, specialites, chargement: chargementRef } =
    useReferentielsHabilitations();

  /* ---------- Listes dérivées ---------- */
  const categoriesFeuilles = useMemo(
    () =>
      categories
        .filter((c) => c.feuille)
        .sort((a, b) => a.chemin.join("/").localeCompare(b.chemin.join("/"), "fr")),
    [categories],
  );

  const codeSystemsActifs = useMemo(
    () =>
      codeSystems
        .filter((cs) => cs.actif)
        .sort((a, b) => a.code.localeCompare(b.code, "fr")),
    [codeSystems],
  );

  /* ---------- Helpers filtre services ---------- */
  const estNonMedical = (ts: TypeServiceOption): boolean =>
    ts.domaine === "ADMINISTRATIF" || ts.domaine === "LOGISTIQUE";

  const libelleDomaine = (ts: TypeServiceOption): string | null => {
    if (!ts.domaine) return null;
    return LIBELLES_DOMAINE_SERVICE[ts.domaine] ?? ts.domaine;
  };

  /** Services réellement proposés dans la liste. */
  const servicesAffiches = useMemo(() => {
    const filtres = servicesMedicauxSeulement
      ? typesServices.filter(
          // On garde toujours les services déjà cochés, même non médicaux,
          // pour que l'utilisateur puisse les décocher.
          (ts) => !estNonMedical(ts) || typeServiceIds.includes(ts.id),
        )
      : typesServices;
    return [...filtres].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesServices, servicesMedicauxSeulement, typeServiceIds]);

  /** Nombre de services non médicaux encore cochés (à signaler à l'utilisateur). */
  const nbNonMedicauxCoches = useMemo(
    () =>
      typesServices.filter(
        (ts) => typeServiceIds.includes(ts.id) && estNonMedical(ts),
      ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typesServices, typeServiceIds],
  );

  /* ---------- Init à l'ouverture ---------- */
  useEffect(() => {
    if (!ouvert) return;
    setEtape(1);
    setErreur(null);

    if (acteEnEdition) {
      setCode(acteEnEdition.code);
      setLibelle(acteEnEdition.libelle);
      setCategorieCode(acteEnEdition.categorie.code);
      setHabilitations(
        acteEnEdition.habilitations.map((h) => ({
          corpsMedicalCode: h.corpsMedicalCode,
          specialiteCode: h.specialiteCode ?? null,
        })),
      );
      setTypeServiceIds([...acteEnEdition.typeServiceIds]);
      setCodifications(acteEnEdition.codifications ? [...acteEnEdition.codifications] : []);
    } else {
      setCode("");
      setLibelle("");
      setCategorieCode(categoriesFeuilles[0]?.code ?? "");
      setHabilitations([]);
      setTypeServiceIds([]);
      setCodifications([]);
    }
    setCorpsSelectionne("");
    setSpecialiteSelectionnee("");
    // On remet le filtre « Services médicaux uniquement » à ON à chaque ouverture.
    setServicesMedicauxSeulement(true);
  }, [ouvert, acteEnEdition, categoriesFeuilles]);

  /* ---------- Validations ---------- */
  const validerEtape1 = (): string | null => {
    if (!code.trim()) return "Le code technique est obligatoire.";
    if (!libelle.trim()) return "Le libellé descriptif est obligatoire.";
    if (!categorieCode) return "Une catégorie d'acte doit être sélectionnée.";
    return null;
  };

  const validerEtape2 = (): string | null => {
    if (habilitations.length === 0) return "Au moins une habilitation est obligatoire.";
    return null;
  };

  /* ---------- Navigation ---------- */
  const suivant = () => {
    setErreur(null);
    if (etape === 1) {
      const msg = validerEtape1();
      if (msg) return setErreur(msg);
      return setEtape(2);
    }
    if (etape === 2) {
      const msg = validerEtape2();
      if (msg) return setErreur(msg);
      return setEtape(3);
    }
  };

  const precedent = () => {
    setErreur(null);
    if (etape > 1) setEtape((etape - 1) as Etape);
  };

  /* ---------- Habilitations helpers ---------- */
  const libelleCorps = (c: string) =>
    corpsMedicaux.find((x) => x.code === c)?.libelle ?? c;

  const libelleSpecialite = (c?: string | null) =>
    c ? (specialites.find((s) => s.code === c)?.libelle ?? c) : null;

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
  };

  const retirerHabilitation = (index: number) => {
    setHabilitations((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTypeService = (id: number) => {
    setTypeServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  /* ---------- Codifications helpers ---------- */
  const ajouterCodification = () => {
    const systemeDefaut = codeSystemsActifs[0]?.code ?? "CCAM";
    setCodifications((prev) => [...prev, { codeSystem: systemeDefaut, code: "" }]);
  };

  const modifierCodification = (
    idx: number,
    champ: "codeSystem" | "code",
    valeur: string,
  ) => {
    setCodifications((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [champ]: valeur } : c)),
    );
  };

  const supprimerCodification = (idx: number) => {
    setCodifications((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ---------- Enregistrement ---------- */
  const enregistrer = async () => {
    setErreur(null);
    const e1 = validerEtape1();
    if (e1) {
      setEtape(1);
      return setErreur(e1);
    }
    const e2 = validerEtape2();
    if (e2) {
      setEtape(2);
      return setErreur(e2);
    }

    setEnCours(true);
    try {
      const codificationsValides = codifications
        .map((c) => ({
          codeSystem: c.codeSystem.trim().toUpperCase(),
          code: c.code.trim(),
        }))
        .filter((c) => c.code.length > 0 && c.codeSystem.length > 0);

      if (acteEnEdition) {
        const payload: ModificationActeInput = {
          libelle: libelle.trim(),
          categorieCode,
          habilitations,
          typeServiceIds,
          codifications: codificationsValides,
        };
        const ok = await onEnregistrer(payload, acteEnEdition.id);
        if (!ok) {
          setErreur("Impossible d'enregistrer l'acte.");
          return;
        }
        if (onEnregistrerCodifications) {
          await onEnregistrerCodifications(acteEnEdition.id, codificationsValides);
        }
      } else {
        const payload: NouvelActeInput = {
          code: code.trim().toUpperCase(),
          libelle: libelle.trim(),
          categorieCode,
          habilitations,
          typeServiceIds,
          codifications: codificationsValides,
        };
        const ok = await onEnregistrer(payload);
        if (!ok) {
          setErreur("Impossible de créer l'acte.");
          return;
        }
      }
      onFermer();
    } finally {
      setEnCours(false);
    }
  };

  /* ---------- Libellés dynamiques ---------- */
  const estDerniere = etape === 3;
  const libelleAction = estDerniere
    ? enCours
      ? "Enregistrement…"
      : estEdition
        ? "Enregistrer les modifications"
        : "Créer l'acte"
    : "Continuer";

  const categorieSelectionnee = categoriesFeuilles.find((c) => c.code === categorieCode);
  const cheminCategorie = categorieSelectionnee
    ? categorieSelectionnee.chemin.length > 1
      ? categorieSelectionnee.chemin.join(" › ")
      : categorieSelectionnee.libelle
    : "";
  const niveauCategorie = categorieSelectionnee?.niveau ?? 0;

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={enCours}
      libelle={estEdition ? "Modifier l'acte" : "Nouvel acte médical"}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2937] leading-tight">
              {estEdition ? "Modifier l'acte médical" : "Nouvel acte médical"}
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Étape {etape} sur {ETAPES.length}
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

        {/* Stepper */}
        <Stepper etapeCourante={etape} />

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {erreur && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-[#b42318] text-[12px] font-medium"
            >
              {erreur}
            </div>
          )}

          {/* ===================== ÉTAPE 1 — Identité ===================== */}
          {etape === 1 && (
            <>
              <div>
                <label htmlFor="acte-code" className={LABEL}>
                  Code technique <b className="text-[#b42318]">*</b>
                </label>
                <input
                  id="acte-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX : ECG, PANSEMENT"
                  disabled={estEdition || enCours}
                  className={`${CHAMP} font-mono font-bold uppercase`}
                />
                <p className={AIDE}>Unique, en majuscules, non modifiable après création.</p>
              </div>

              <div>
                <label htmlFor="acte-categorie" className={LABEL}>
                  Catégorie d'acte <b className="text-[#b42318]">*</b>
                </label>
                <select
                  id="acte-categorie"
                  value={categorieCode}
                  onChange={(e) => setCategorieCode(e.target.value)}
                  disabled={enCours || categoriesFeuilles.length === 0}
                  className={CHAMP}
                >
                  <option value="" disabled>
                    — Choisir une catégorie —
                  </option>
                  {categoriesFeuilles.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.chemin.length > 1 ? c.chemin.join(" › ") : c.libelle}
                    </option>
                  ))}
                </select>
                <p className={AIDE}>
                  {niveauCategorie > 0
                    ? `Niveau ${niveauCategorie} sur 3 · seules les catégories finales sont proposées.`
                    : categoriesFeuilles.length === 0
                      ? "Aucune catégorie feuille disponible. Créez-en une dans « Catégories »."
                      : "Seules les catégories finales sont proposées (3 niveaux maximum)."}
                </p>
              </div>

              <div>
                <label htmlFor="acte-libelle" className={LABEL}>
                  Libellé descriptif <b className="text-[#b42318]">*</b>
                </label>
                <input
                  id="acte-libelle"
                  type="text"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="EX : Électrocardiogramme de repos 12 dérivations"
                  disabled={enCours}
                  className={CHAMP}
                />
                <p className={AIDE}>Nom affiché dans le catalogue et les prescriptions.</p>
              </div>
            </>
          )}

          {/* ===================== ÉTAPE 2 — Habilitations et services ===================== */}
          {etape === 2 && (
            <>
              <Rappel code={code} libelle={libelle} chemin={cheminCategorie} />

              <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5">
                Habilitations requises <span className="text-[#b42318]">*</span>
              </div>

              {habilitations.length === 0 ? (
                <p className="text-[12px] text-[#5b6472] italic">
                  Aucune habilitation sélectionnée.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {habilitations.map((h, i) => {
                    const spec = libelleSpecialite(h.specialiteCode);
                    return (
                      <span
                        key={`${h.corpsMedicalCode}-${h.specialiteCode ?? "-"}-${i}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] text-[13px] font-semibold whitespace-nowrap"
                      >
                        {libelleCorps(h.corpsMedicalCode)}
                        {spec ? ` · ${spec}` : ""}
                        <button
                          type="button"
                          onClick={() => retirerHabilitation(i)}
                          disabled={enCours}
                          className="text-[#14703c]/70 hover:text-[#b42318] cursor-pointer disabled:opacity-50"
                          aria-label="Retirer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                  <span className="text-[12px] text-[#5b6472] ml-auto">
                    {habilitations.length} habilitation
                    {habilitations.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px] flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={LABEL}>Corps médical</label>
                    <select
                      value={corpsSelectionne}
                      onChange={(e) => setCorpsSelectionne(e.target.value)}
                      disabled={enCours || chargementRef}
                      className={CHAMP}
                    >
                      <option value="">— Sélectionner —</option>
                      {corpsMedicaux.map((c) => (
                        <option key={c.id} value={c.code}>
                          {c.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={LABEL}>
                      Spécialité <span className="font-normal">(facultatif)</span>
                    </label>
                    <select
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
                  className={`${BTN_SECONDAIRE} justify-center`}
                >
                  <Plus className="w-[18px] h-[18px]" />
                  Ajouter l'habilitation
                </button>
              </div>

              {/* ---------- SERVICES APPLICABLES (avec filtre médical) ---------- */}
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 flex-1">
                  Services applicables
                </div>
                <label className="flex items-center gap-2 text-[12px] text-[#5b6472] cursor-pointer select-none pb-1.5">
                  <input
                    type="checkbox"
                    checked={servicesMedicauxSeulement}
                    onChange={(e) => setServicesMedicauxSeulement(e.target.checked)}
                    disabled={enCours}
                    className="rounded border-slate-300 text-[#1f9d55] focus:ring-[#1f9d55]"
                  />
                  Services médicaux uniquement
                </label>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#5b6472] -mt-1">
                <span>
                  {typeServiceIds.length} sélectionné{typeServiceIds.length > 1 ? "s" : ""}
                  {" · "}
                  {servicesAffiches.length} proposé{servicesAffiches.length > 1 ? "s" : ""}
                </span>
                {servicesMedicauxSeulement && nbNonMedicauxCoches > 0 && (
                  <span className="text-[#8a5300] font-semibold">
                    ⚠ {nbNonMedicauxCoches} service
                    {nbNonMedicauxCoches > 1 ? "s" : ""} non médical
                    {nbNonMedicauxCoches > 1 ? "aux" : ""} encore coché
                    {nbNonMedicauxCoches > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {servicesAffiches.map((ts) => {
                  const coche = typeServiceIds.includes(ts.id);
                  const domaineLibelle = libelleDomaine(ts);
                  const nonMedical = estNonMedical(ts);
                  return (
                    <label
                      key={ts.id}
                      className={`flex items-center gap-2.5 h-11 px-3 rounded-[10px] border cursor-pointer transition-colors ${
                        coche
                          ? "border-[#1f9d55] bg-[#e7f6ed]"
                          : "border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                      } ${enCours ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={
                        domaineLibelle ? `Domaine : ${domaineLibelle}` : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={() => toggleTypeService(ts.id)}
                        disabled={enCours}
                        className="rounded border-slate-300 text-[#1f9d55] focus:ring-[#1f9d55]"
                      />
                      <span className="text-[13px] text-[#1f2937] truncate flex-1">
                        {ts.nom}
                      </span>
                      {domaineLibelle && (
                        <span
                          className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            nonMedical
                              ? "bg-[#fff4e0] text-[#8a5300]"
                              : ts.domaine === "MEDICO_TECHNIQUE"
                                ? "bg-[#e0f2fe] text-[#0369a1]"
                                : "bg-[#e7f6ed] text-[#14703c]"
                          }`}
                        >
                          {domaineLibelle}
                        </span>
                      )}
                    </label>
                  );
                })}
                {servicesAffiches.length === 0 && (
                  <p className="col-span-2 text-[12px] text-[#5b6472] italic">
                    {servicesMedicauxSeulement
                      ? "Aucun service médical disponible. Désactivez le filtre pour voir tous les types."
                      : "Aucun type de service configuré."}
                  </p>
                )}
              </div>

              {typeServiceIds.length === 0 && (
                <div className="p-3 rounded-[10px] bg-[#e7f6ed] border border-[#1f9d55] text-[#14703c] text-[12px]">
                  <b>Aucun service coché</b> : l'acte sera disponible dans{" "}
                  <b>tous les services</b>.
                </div>
              )}
            </>
          )}

          {/* ===================== ÉTAPE 3 — Codifications ===================== */}
          {etape === 3 && (
            <>
              <Rappel code={code} libelle={libelle} chemin={cheminCategorie} />

              <div className="p-3 rounded-[10px] bg-[#fff4e0] border border-[#f3d9a8] text-[#8a5300] text-[12px]">
                <b>Codification facultative.</b>
                <div className="mt-0.5">
                  Sans codification externe, l'acte est signalé « À codifier ».
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[#1f2937] text-sm">
                  Codifications externes ({codifications.length})
                </span>
                <span className="text-[12px] text-[#5b6472]">CCAM, NGAP, LOINC…</span>
              </div>

              {codeSystemsActifs.length === 0 && (
                <p className="text-[12px] text-[#5b6472] italic">
                  Aucune terminologie active. Ajoutez-en dans « Terminologies ».
                </p>
              )}

              {codifications.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-[#e5e7eb] rounded-[10px] flex flex-col gap-2.5"
                >
                  <div className="flex gap-2.5 items-start">
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
                        onChange={(e) => modifierCodification(idx, "code", e.target.value)}
                        disabled={enCours}
                        placeholder="ex : DEQP003"
                        className={`${CHAMP} font-mono`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => supprimerCodification(idx)}
                      disabled={enCours}
                      aria-label="Supprimer cette codification"
                      className="mt-6 p-2 text-[#5b6472] hover:text-[#b42318] hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {c.code && (
                    <div className="text-[12px] text-[#5b6472] flex items-center gap-2">
                      <span className={EXT_CHIP}>{c.codeSystem}</span>
                      <span className="font-mono">{c.code}</span>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={ajouterCodification}
                disabled={enCours || codeSystemsActifs.length === 0}
                className={BTN_SECONDAIRE}
              >
                <Plus className="w-[18px] h-[18px]" />
                Ajouter une codification
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={precedent}
            disabled={etape === 1 || enCours}
            className={`${BTN_SECONDAIRE} ${etape === 1 ? "invisible" : ""}`}
            aria-hidden={etape === 1}
          >
            Retour
          </button>

          <button
            type="button"
            onClick={estDerniere ? enregistrer : suivant}
            disabled={enCours}
            className={BTN_PRIMAIRE}
          >
            {estDerniere && !enCours && <Check className="w-[18px] h-[18px]" />}
            {libelleAction}
          </button>
        </div>
      </div>
    </TiroirLateral>
  );
};

export default FormulaireActeModale;