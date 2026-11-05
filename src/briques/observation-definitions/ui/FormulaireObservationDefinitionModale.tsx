/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { X, Check, Plus, Trash2, ExternalLink } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import type { CategorieHierarchique } from "@/noyau/referentiels/categories";
import {
  ObservationDefinition,
  UniteMesure,
  CodeSysteme,
  NouvelleObservationDefinitionInput,
  ModificationObservationDefinitionInput,
  TypeValeurObservation,
  CodificationItem,
} from "../modele/observation-definition.types";

/* =====================================================================
 *  Tokens du design (maquettes « Tiroir 1/2/3 »)
 *  vert #1f9d55 · vert clair #e7f6ed · vert foncé #14703c
 *  bordure #e5e7eb · séparateur #f0f2f1 · texte #1f2937 · muted #5b6472
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

/* --------------------------------------------------------------------- */

type Etape = 1 | 2 | 3;
const ETAPES: { numero: Etape; libelle: string }[] = [
  { numero: 1, libelle: "Identité" },
  { numero: 2, libelle: "Valeur et unité" },
  { numero: 3, libelle: "Codifications" },
];

/* --------------------------------------------------------------------- */

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
              className={`text-[13px] ${
                active
                  ? "font-bold text-[#14703c]"
                  : fait
                    ? "font-semibold text-[#5b6472]"
                    : "font-semibold text-[#5b6472]"
              }`}
            >
              {e.libelle}
            </span>
          </div>
          {idx < ETAPES.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2.5 ${fait ? "bg-[#1f9d55]" : "bg-[#e5e7eb]"}`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* --------------------------------------------------------------------- */

const Rappel: React.FC<{ code: string; libelle: string; chemin: string }> = ({
  code,
  libelle,
  chemin,
}) => (
  <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px]">
    <div className="text-[12px] text-[#5b6472]">Rappel · Étape précédente validée</div>
    <div className="mt-1 flex items-center gap-2">
      <span className={CODE_CHIP}>{code}</span>
      <span className="font-bold text-[#1f2937] text-sm truncate">{libelle}</span>
    </div>
    {chemin && <div className="text-[12px] text-[#5b6472] mt-0.5">{chemin}</div>}
  </div>
);

/* --------------------------------------------------------------------- */

export interface FormulaireObservationDefinitionModaleProps {
  ouvert: boolean;
  definitionEnEdition: ObservationDefinition | null;
  unites: UniteMesure[];
  codeSystems: CodeSysteme[];
  categories: CategorieHierarchique[];
  onFermer: () => void;
  onEnregistrer: (
    saisie: NouvelleObservationDefinitionInput | ModificationObservationDefinitionInput,
    id?: number,
  ) => Promise<boolean>;
  /** Optionnel : appelé en mode modification pour sauver les codifications externes. */
  onEnregistrerCodifications?: (
    id: number,
    codifications: CodificationItem[],
  ) => Promise<boolean>;
  onOuvrirGestionUnites?: () => void;
}

export const FormulaireObservationDefinitionModale: React.FC<
  FormulaireObservationDefinitionModaleProps
> = ({
  ouvert,
  definitionEnEdition,
  unites,
  codeSystems,
  categories,
  onFermer,
  onEnregistrer,
  onEnregistrerCodifications,
  onOuvrirGestionUnites,
}) => {
  const estEdition = definitionEnEdition !== null;

  /* ---------- Étape courante ---------- */
  const [etape, setEtape] = useState<Etape>(1);

  /* ---------- Champs ---------- */
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [categorieCode, setCategorieCode] = useState("");
  const [typeValeur, setTypeValeur] = useState<TypeValeurObservation>("numerique");
  const [uniteId, setUniteId] = useState<string>("");
  const [codifications, setCodifications] = useState<CodificationItem[]>([]);

  /* ---------- État ---------- */
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /* ---------- Listes dérivées ---------- */
  const unitesActives = useMemo(() => unites.filter((u) => u.actif), [unites]);
  const codeSystemsActifs = useMemo(
    () =>
      codeSystems
        .filter((c) => c.actif)
        .sort((a, b) => a.code.localeCompare(b.code, "fr")),
    [codeSystems],
  );

  const categoriesFeuilles = useMemo(
    () =>
      categories
        .filter((c) => c.feuille)
        .sort((a, b) => a.chemin.join("/").localeCompare(b.chemin.join("/"), "fr")),
    [categories],
  );

  /* ---------- Initialisation à l'ouverture ---------- */
  useEffect(() => {
    if (!ouvert) return;
    setEtape(1);
    setErreur(null);

    if (definitionEnEdition) {
      setCode(definitionEnEdition.code);
      setLibelle(definitionEnEdition.libelle);
      setCategorieCode(definitionEnEdition.categorie.code);
      setTypeValeur(definitionEnEdition.typeValeur);
      setUniteId(
        definitionEnEdition.uniteId ? String(definitionEnEdition.uniteId) : "",
      );
      setCodifications(definitionEnEdition.codifications ?? []);
    } else {
      setCode("");
      setLibelle("");
      setCategorieCode(categoriesFeuilles[0]?.code ?? "");
      setTypeValeur("numerique");
      setUniteId(unitesActives[0] ? String(unitesActives[0].id) : "");
      setCodifications([]);
    }
  }, [ouvert, definitionEnEdition, categoriesFeuilles, unitesActives]);

  /* ---------- Validations par étape ---------- */
  const validerEtape1 = (): string | null => {
    if (!code.trim()) return "Le code mnémonique est obligatoire.";
    if (!libelle.trim()) return "Le libellé est obligatoire.";
    if (!categorieCode) return "Une catégorie d'observation doit être sélectionnée.";
    return null;
  };

  const validerEtape2 = (): string | null => {
    if (typeValeur === "numerique" && (!uniteId || Number(uniteId) <= 0)) {
      return "Une unité de mesure est requise pour une observation numérique.";
    }
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

  /* ---------- Enregistrement ---------- */
  const enregistrer = async () => {
    setErreur(null);

    const err1 = validerEtape1();
    if (err1) {
      setEtape(1);
      return setErreur(err1);
    }
    const err2 = validerEtape2();
    if (err2) {
      setEtape(2);
      return setErreur(err2);
    }

    setEnCours(true);
    try {
      const codifsValides = codifications
        .map((c) => ({
          codeSystem: c.codeSystem.trim().toUpperCase(),
          code: c.code.trim(),
        }))
        .filter((c) => c.code.length > 0 && c.codeSystem.length > 0);

      if (definitionEnEdition) {
        // Mise à jour des champs
        const payload: ModificationObservationDefinitionInput = {
          libelle: libelle.trim(),
          code: code.trim().toUpperCase(),
          typeValeur,
          categorieCode,
          uniteId: typeValeur === "numerique" ? Number(uniteId) : null,
        };
        const ok = await onEnregistrer(payload, definitionEnEdition.id);
        if (!ok) {
          setErreur("Impossible d'enregistrer la définition.");
          return;
        }
        // Mise à jour des codifications si le parent l'a fourni
        if (onEnregistrerCodifications) {
          await onEnregistrerCodifications(definitionEnEdition.id, codifsValides);
        }
      } else {
        const payload: NouvelleObservationDefinitionInput = {
          code: code.trim().toUpperCase(),
          libelle: libelle.trim(),
          typeValeur,
          categorieCode,
          uniteId: typeValeur === "numerique" ? Number(uniteId) : null,
          codifications: codifsValides,
        };
        const ok = await onEnregistrer(payload);
        if (!ok) {
          setErreur("Impossible de créer la définition.");
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
        : "Enregistrer la définition"
    : "Continuer";

  const categorieSelectionnee = categoriesFeuilles.find((c) => c.code === categorieCode);
  const cheminCategorie = categorieSelectionnee
    ? categorieSelectionnee.chemin.length > 1
      ? categorieSelectionnee.chemin.join(" › ")
      : categorieSelectionnee.libelle
    : "";
  const niveauCategorie = categorieSelectionnee?.niveau ?? 0;

  const uniteSelectionnee = unitesActives.find((u) => String(u.id) === uniteId);
  const libelleUnite = uniteSelectionnee
    ? `${uniteSelectionnee.code} — ${uniteSelectionnee.libelle}`
    : "";

  /* ---------- Handlers codifications ---------- */
  const ajouterCodification = () => {
    const systemeDefaut =
      codeSystemsActifs[0]?.code ?? "";
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

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={enCours}
      libelle={estEdition ? "Modifier la définition" : "Nouvelle définition"}
    >
      <div className="flex flex-col h-full min-h-0">
        {/* ============ En-tête ============ */}
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2937] leading-tight">
              {estEdition ? "Modifier la définition" : "Nouvelle définition"}
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

        {/* ============ Stepper ============ */}
        <Stepper etapeCourante={etape} />

        {/* ============ Contenu ============ */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {erreur && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-[#b42318] text-[12px] font-medium"
            >
              {erreur}
            </div>
          )}

          {/* ---------------- ÉTAPE 1 — Identité ---------------- */}
          {etape === 1 && (
            <>
              <div>
                <label htmlFor="obs-code" className={LABEL}>
                  Code <b className="text-[#b42318]">*</b>
                </label>
                <input
                  id="obs-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX : TA_SYS"
                  disabled={estEdition || enCours}
                  className={`${CHAMP} font-mono font-bold uppercase`}
                />
                <p className={AIDE}>
                  Unique, en majuscules, non modifiable après création.
                </p>
              </div>

              <div>
                <label htmlFor="obs-libelle" className={LABEL}>
                  Libellé <b className="text-[#b42318]">*</b>
                </label>
                <input
                  id="obs-libelle"
                  type="text"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                  placeholder="ex : Tension artérielle systolique"
                  disabled={enCours}
                  className={CHAMP}
                />
                <p className={AIDE}>Nom affiché dans les dossiers patients.</p>
              </div>

              <div>
                <label htmlFor="obs-categorie" className={LABEL}>
                  Catégorie <b className="text-[#b42318]">*</b>
                </label>
                <select
                  id="obs-categorie"
                  value={categorieCode}
                  onChange={(e) => setCategorieCode(e.target.value)}
                  disabled={enCours || categoriesFeuilles.length === 0}
                  className={CHAMP}
                >
                  <option value="" disabled>
                    — Sélectionner une catégorie —
                  </option>
                  {categoriesFeuilles.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.chemin.length > 1
                        ? c.chemin.join(" › ")
                        : c.libelle}
                    </option>
                  ))}
                </select>
                {niveauCategorie > 0 ? (
                  <p className={AIDE}>
                    Niveau {niveauCategorie} sur 3 · seules les catégories finales sont
                    proposées.
                  </p>
                ) : (
                  <p className={AIDE}>
                    {categoriesFeuilles.length === 0
                      ? "Aucune catégorie feuille disponible. Créez-en une dans « Catégories »."
                      : "Seules les catégories finales sont proposées."}
                  </p>
                )}
              </div>
            </>
          )}

          {/* ---------------- ÉTAPE 2 — Valeur et unité ---------------- */}
          {etape === 2 && (
            <>
              <Rappel code={code} libelle={libelle} chemin={cheminCategorie} />

              <div>
                <div className={LABEL}>
                  Type de valeur <b className="text-[#b42318]">*</b>
                </div>
                <div className="flex gap-3">
                  {(
                    [
                      {
                        valeur: "numerique" as const,
                        titre: "Numérique",
                        detail: "Mesure chiffrée avec unité",
                      },
                      {
                        valeur: "texte" as const,
                        titre: "Qualitative",
                        detail: "Choix dans une liste de valeurs",
                      },
                    ]
                  ).map((t) => {
                    const actif = typeValeur === t.valeur;
                    return (
                      <button
                        key={t.valeur}
                        type="button"
                        onClick={() => {
                          setTypeValeur(t.valeur);
                          if (t.valeur === "texte") setUniteId("");
                          else if (!uniteId && unitesActives[0])
                            setUniteId(String(unitesActives[0].id));
                        }}
                        disabled={enCours}
                        aria-pressed={actif}
                        className={`flex-1 p-3 rounded-[10px] flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                          actif
                            ? "border-2 border-[#1f9d55] bg-[#e7f6ed]"
                            : "border border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                        } disabled:opacity-50`}
                      >
                        <div>
                          <div className="font-bold text-[#1f2937] text-sm">
                            {t.titre}
                          </div>
                          <div className="text-[12px] text-[#5b6472]">
                            {t.detail}
                          </div>
                        </div>
                        {actif && (
                          <Check className="w-[18px] h-[18px] text-[#1f9d55] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="obs-unite" className={LABEL}>
                  Unité{" "}
                  {typeValeur === "numerique" && <b className="text-[#b42318]">*</b>}
                </label>
                <select
                  id="obs-unite"
                  value={uniteId}
                  onChange={(e) => setUniteId(e.target.value)}
                  disabled={enCours || typeValeur === "texte"}
                  className={CHAMP}
                >
                  <option value="">— Choisir une unité —</option>
                  {unitesActives.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} — {u.libelle}
                    </option>
                  ))}
                </select>
                {onOuvrirGestionUnites ? (
                  <p className={AIDE}>
                    {unitesActives.length} unité{unitesActives.length > 1 ? "s" : ""}{" "}
                    disponible{unitesActives.length > 1 ? "s" : ""}.{" "}
                    <button
                      type="button"
                      onClick={onOuvrirGestionUnites}
                      className="text-[#14703c] font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                    >
                      Gérer les unités
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </p>
                ) : (
                  <p className={AIDE}>
                    {unitesActives.length} unité
                    {unitesActives.length > 1 ? "s" : ""} disponible
                    {unitesActives.length > 1 ? "s" : ""}.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ---------------- ÉTAPE 3 — Codifications ---------------- */}
          {etape === 3 && (
            <>
              <Rappel code={code} libelle={libelle} chemin={cheminCategorie} />

              {codifications.length === 0 && (
                <div className="p-3 bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] text-[#8a5300]">
                  <b className="text-sm">Aucune codification externe pour l'instant.</b>
                  <div className="text-[12px] mt-0.5">
                    Vous pouvez enregistrer : la définition sera signalée « À codifier ».
                  </div>
                </div>
              )}

              <div className="font-bold text-[#1f2937] text-sm">
                Codifications externes
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
                      <label className={LABEL}>Terminologie</label>
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
                        placeholder="ex : 8867-4"
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

        {/* ============ Pied de tiroir ============ */}
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

export default FormulaireObservationDefinitionModale;