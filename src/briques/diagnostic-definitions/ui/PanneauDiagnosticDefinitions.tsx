// src/briques/diagnostic-definitions/ui/PanneauDiagnosticDefinitions.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Tag,
  Power,
  RefreshCw,
  Search,
  BookMarked,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import {
  DiagnosticDefinition,
  NouvelleDiagnosticDefinitionInput,
  ModificationDiagnosticDefinitionInput,
} from "../modele/diagnostic-definition.types";
import { useDiagnosticDefinitions } from "../hooks/useDiagnosticDefinitions";
import { FormulaireDiagnosticDefinitionModale } from "./FormulaireDiagnosticDefinitionModale";
import { FormulaireCodificationsDiagnosticModale } from "./FormulaireCodificationsDiagnosticModale";
import { GestionCodeSystemsModale } from "@/briques/observation-definitions/ui/GestionCodeSystemsModale";

/* =====================================================================
 *  Tokens du design (maquette « Référentiel des diagnostics — liste »)
 *  vert #1f9d55 · vert clair #e7f6ed · vert foncé #14703c
 *  bordure #e5e7eb · séparateur #f0f2f1 · ink #1f2937 · ink2 #5b6472
 *  ambre #fff4e0 / #8a5300 · erreur #b42318 · ext #eef2ff / #3730a3
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BOUTON_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BOUTON_SECONDAIRE = `${BOUTON_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BOUTON_PRIMAIRE = `${BOUTON_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";
const CHIP_CODE =
  "inline-block max-w-full truncate bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const CHIP_EXT =
  "inline-block bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const CHIP_HABIL =
  "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold border border-[#1f9d55] text-[#14703c] bg-white whitespace-nowrap";
const CHIP_OVERFLOW =
  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f2f1] text-[#5b6472] whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

interface MenuActions {
  definition: DiagnosticDefinition;
  top: number;
  right: number;
}

export interface PanneauDiagnosticDefinitionsProps {
  mode?: ModeAffichage;
}

export const PanneauDiagnosticDefinitions: React.FC<PanneauDiagnosticDefinitionsProps> = ({
  mode = "edition",
}) => {
  /* -------- Hooks : tous avant le retour anticipé (Rules of Hooks) -------- */
  const {
    definitions,
    definitionsToutes,
    chapitres,
    codeSystems,
    chargement,
    erreur,
    recherche,
    setRecherche,
    filtreChapitre,
    setFiltreChapitre,
    filtreActif,
    setFiltreActif,
    recharger,
    creerDefinition,
    modifierDefinition,
    changerActivation,
    definirCodifications,
    creerCodeSystem,
    basculerActivationCodeSystem,
  } = useDiagnosticDefinitions();

  const [modaleFormulaireOuverte, setModaleFormulaireOuverte] = useState(false);
  const [definitionEnEdition, setDefinitionEnEdition] =
    useState<DiagnosticDefinition | null>(null);
  const [modaleCodificationsOuverte, setModaleCodificationsOuverte] = useState(false);
  const [definitionCodifications, setDefinitionCodifications] =
    useState<DiagnosticDefinition | null>(null);
  const [modaleCodeSystemsOuverte, setModaleCodeSystemsOuverte] = useState(false);
  const [menu, setMenu] = useState<MenuActions | null>(null);

  useEffect(() => {
    if (!menu) return;
    const fermer = () => setMenu(null);
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", surTouche);
    };
  }, [menu]);

  const stats = useMemo(() => {
    const total = definitionsToutes.length;
    const actifs = definitionsToutes.filter((d) => d.actif).length;
    const inactifs = total - actifs;
    const sansChapitre = definitionsToutes.filter((d) => !d.chapitre?.trim()).length;
    return { total, actifs, inactifs, chapitres: chapitres.length, sansChapitre };
  }, [definitionsToutes, chapitres.length]);

  /* -------- Retour anticipé (après les hooks) -------- */
  if (mode === "masque") return null;
  const estModeLectureSeule = mode === "lecture";

  /* -------- Handlers -------- */
  const handleOuvrirCreation = () => {
    setDefinitionEnEdition(null);
    setModaleFormulaireOuverte(true);
  };

  const handleOuvrirModification = (def: DiagnosticDefinition) => {
    setDefinitionEnEdition(def);
    setModaleFormulaireOuverte(true);
  };

  const handleOuvrirCodifications = (def: DiagnosticDefinition) => {
    setDefinitionCodifications(def);
    setModaleCodificationsOuverte(true);
  };

  const handleEnregistrerFormulaire = async (
    saisie: NouvelleDiagnosticDefinitionInput | ModificationDiagnosticDefinitionInput,
  ) => {
    if (definitionEnEdition) {
      return modifierDefinition(definitionEnEdition.id, saisie);
    }
    return creerDefinition(saisie as NouvelleDiagnosticDefinitionInput);
  };

  const ouvrirMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    def: DiagnosticDefinition,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({
      definition: def,
      top: Math.min(r.bottom + 4, window.innerHeight - 220),
      right: window.innerWidth - r.right,
    });
  };

  /* -------- Rendu -------- */
  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            Référentiel des diagnostics et CIM-10
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Diagnostics médicaux, chapitres nosologiques et codifications internationales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={recharger}
            disabled={chargement}
            className={`${BOUTON_SECONDAIRE} !px-2.5`}
            title="Rafraîchir"
            aria-label="Rafraîchir la liste"
          >
            <RefreshCw
              className={`h-4 w-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
          </button>
          {!estModeLectureSeule && (
            <button
              type="button"
              onClick={() => setModaleCodeSystemsOuverte(true)}
              className={BOUTON_SECONDAIRE}
              title="Gérer les référentiels de terminologies (CIM-10, CIM-11, SNOMED-CT, etc.)"
            >
              <BookMarked className="h-4 w-4 text-[#5b6472]" />
              Terminologies ({codeSystems.length})
            </button>
          )}
          {!estModeLectureSeule && (
            <button
              type="button"
              onClick={handleOuvrirCreation}
              className={BOUTON_PRIMAIRE}
            >
              <Plus className="h-[18px] w-[18px]" />
              Nouveau diagnostic
            </button>
          )}
        </div>
      </div>

      {/* ===================== Bandeau statistiques ===================== */}
      <div className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 h-14`}>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.total}</b> diagnostics
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.actifs}</b> actifs
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.chapitres}</b> chapitres
        </span>
        {stats.sansChapitre > 0 && (
          <span
            className={`${PUCE} ml-auto bg-[#fff4e0] text-[#8a5300] px-3.5 py-1.5 text-[13px]`}
            title="Renseignez le chapitre nosologique sur les fiches concernées"
          >
            {stats.sansChapitre} diagnostic{stats.sansChapitre > 1 ? "s" : ""} sans chapitre
          </span>
        )}
      </div>

      {/* ===================== Filtres ===================== */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par code, libellé, chapitre ou codification…"
            aria-label="Rechercher un diagnostic"
            className={`${CHAMP} w-full pl-9`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltreActif("tous")}
            aria-pressed={filtreActif === "tous"}
            className={`px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer transition ${FOCUS} ${
              filtreActif === "tous"
                ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
            }`}
          >
            Tous · {stats.total}
          </button>
          <button
            type="button"
            onClick={() => setFiltreActif("actifs")}
            aria-pressed={filtreActif === "actifs"}
            className={`px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer transition ${FOCUS} ${
              filtreActif === "actifs"
                ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
            }`}
          >
            Actifs · {stats.actifs}
          </button>
          {(stats.inactifs > 0 || filtreActif === "inactifs") && (
            <button
              type="button"
              onClick={() => setFiltreActif("inactifs")}
              aria-pressed={filtreActif === "inactifs"}
              className={`px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer transition ${FOCUS} ${
                filtreActif === "inactifs"
                  ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                  : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
              }`}
            >
              Inactifs · {stats.inactifs}
            </button>
          )}
        </div>

        <select
          value={filtreChapitre}
          onChange={(e) => setFiltreChapitre(e.target.value)}
          aria-label="Filtrer par chapitre"
          className={`${CHAMP} md:w-[210px]`}
        >
          <option value="tous">Tous les chapitres</option>
          {chapitres.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
      </div>

      {/* ===================== État d'erreur ===================== */}
      {erreur && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-rose-700 text-xs flex items-center justify-between">
          <span>{erreur}</span>
          <button
            type="button"
            onClick={recharger}
            className="font-bold underline cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ===================== Tableau ===================== */}
      <div className={`${CARTE} overflow-hidden`}>
        {chargement ? (
          <div className="p-12 text-center text-[#5b6472]">
            <div className="flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55]" />
              <span className="text-xs">Chargement du référentiel diagnostique…</span>
            </div>
          </div>
        ) : definitions.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px]">
            {definitionsToutes.length === 0
              ? "Aucun diagnostic enregistré dans le référentiel."
              : "Aucun diagnostic ne correspond aux critères de recherche."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    { label: "Code", w: "w-[202px]" },
                    { label: "Diagnostic", w: "w-auto" },
                    { label: "Habilitations", w: "w-[302px]" },
                    { label: "Codification", w: "w-[142px]" },
                    { label: "Statut", w: "w-[122px]" },
                    { label: "", w: "w-[52px]" },
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`${h.w} bg-[#fafbfa] text-left h-10 px-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-t border-[#e5e7eb]`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {definitions.map((def) => {
                  const premiereHabilitation = def.habilitations[0];
                  const suppHabilitations = Math.max(0, def.habilitations.length - 1);
                  const premiereCodification = def.codifications[0];
                  const suppCodifications = Math.max(0, def.codifications.length - 1);
                  const chapitreAffiche = def.chapitre?.trim();

                  return (
                    <tr
                      key={def.id}
                      className="h-[54px] border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                    >
                      {/* Code */}
                      <td className="px-4 py-2">
                        <span className={CHIP_CODE} title={def.code}>
                          {def.code}
                        </span>
                      </td>

                      {/* Diagnostic */}
                      <td className="px-4 py-2 min-w-0">
                        <div className="font-bold text-[#1f2937] truncate">{def.libelle}</div>
                        <div className="text-[12px] text-[#5b6472] truncate">
                          {chapitreAffiche ? (
                            chapitreAffiche
                          ) : (
                            <span className="italic">Sans chapitre</span>
                          )}
                        </div>
                      </td>

                      {/* Habilitations */}
                      <td className="px-4 py-2">
                        {premiereHabilitation ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={CHIP_HABIL}
                              title={
                                premiereHabilitation.corpsMedicalLibelle ??
                                premiereHabilitation.corpsMedicalCode
                              }
                            >
                              {premiereHabilitation.corpsMedicalLibelle ??
                                premiereHabilitation.corpsMedicalCode}
                              {premiereHabilitation.specialiteLibelle
                                ? ` · ${premiereHabilitation.specialiteLibelle}`
                                : ""}
                            </span>
                            {suppHabilitations > 0 && (
                              <span
                                className={CHIP_OVERFLOW}
                                title={def.habilitations
                                  .slice(1)
                                  .map(
                                    (h) =>
                                      `${h.corpsMedicalLibelle ?? h.corpsMedicalCode}${
                                        h.specialiteLibelle
                                          ? ` · ${h.specialiteLibelle}`
                                          : ""
                                      }`,
                                  )
                                  .join("\n")}
                              >
                                +{suppHabilitations}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-[#5b6472] text-[11px]">
                            Aucune
                          </span>
                        )}
                      </td>

                      {/* Codification */}
                      <td className="px-4 py-2">
                        {premiereCodification ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={CHIP_EXT}
                              title={`${premiereCodification.codeSystem} : ${premiereCodification.code}`}
                            >
                              {premiereCodification.codeSystem} · {premiereCodification.code}
                            </span>
                            {suppCodifications > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOuvrirCodifications(def)}
                                className="text-[10px] font-bold text-[#3730a3] hover:underline cursor-pointer"
                                title="Voir toutes les codifications"
                              >
                                +{suppCodifications}
                              </button>
                            )}
                          </div>
                        ) : estModeLectureSeule ? (
                          <span className="italic text-[#5b6472] text-[11px]">
                            Aucune
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOuvrirCodifications(def)}
                            className={`${PUCE} bg-[#fff4e0] text-[#8a5300] hover:bg-[#ffe9c7] cursor-pointer ${FOCUS}`}
                            title="Associer un code système (CIM-10, SNOMED…)"
                          >
                            À codifier
                          </button>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-2">
                        {estModeLectureSeule ? (
                          <span
                            className={`${PUCE} ${
                              def.actif
                                ? "bg-[#e7f6ed] text-[#14703c]"
                                : "bg-[#f0f2f1] text-[#5b6472]"
                            }`}
                          >
                            {def.actif ? "Actif" : "Inactif"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={def.actif}
                            aria-label={`${def.actif ? "Désactiver" : "Activer"} ${def.libelle}`}
                            onClick={() => changerActivation(def.id, !def.actif)}
                            className={`inline-flex items-center gap-2 cursor-pointer ${FOCUS}`}
                          >
                            <span
                              className={`relative w-[34px] h-5 rounded-full transition-colors ${
                                def.actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                  def.actif ? "left-4" : "left-0.5"
                                }`}
                              />
                            </span>
                            <span
                              className={`text-[12px] font-bold ${
                                def.actif ? "text-[#14703c]" : "text-[#5b6472]"
                              }`}
                            >
                              {def.actif ? "Actif" : "Inactif"}
                            </span>
                          </button>
                        )}
                      </td>

                      {/* Actions ⋯ */}
                      <td className="px-2 py-2 text-center">
                        {!estModeLectureSeule && (
                          <button
                            type="button"
                            aria-label={`Actions pour ${def.libelle}`}
                            aria-haspopup="menu"
                            onClick={(e) => ouvrirMenu(e, def)}
                            className={`w-9 h-9 grid place-items-center rounded-[10px] text-[#5b6472] hover:bg-[#fafbfa] hover:text-[#1f2937] cursor-pointer transition-colors ${FOCUS}`}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!chargement && definitions.length > 0 && (
          <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-[11px] text-[#5b6472]">
            <strong className="font-bold text-[#1f2937]">{definitions.length}</strong>{" "}
            diagnostic{definitions.length > 1 ? "s" : ""} affiché
            {definitions.length > 1 ? "s" : ""}
            {definitions.length !== definitionsToutes.length && (
              <> · sur {definitionsToutes.length} au total</>
            )}
          </div>
        )}
      </div>

      {/* ===================== Menu contextuel ⋯ ===================== */}
      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            style={{ top: menu.top, right: menu.right }}
            className="fixed z-50 w-60 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleOuvrirModification(menu.definition);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#5b6472]" />
              Modifier le diagnostic
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleOuvrirCodifications(menu.definition);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Tag className="h-3.5 w-3.5 text-[#5b6472]" />
              Codifications externes
            </button>

            <div className="my-1 border-t border-[#f0f2f1]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                changerActivation(menu.definition.id, !menu.definition.actif);
                setMenu(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer ${
                menu.definition.actif
                  ? "text-[#b42318] hover:bg-rose-50"
                  : "text-[#14703c] hover:bg-[#e7f6ed]"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {menu.definition.actif ? "Désactiver" : "Réactiver"}
            </button>
          </div>
        </>
      )}

      {/* ===================== Modales ===================== */}
      <FormulaireDiagnosticDefinitionModale
        ouvert={modaleFormulaireOuverte}
        onFermer={() => setModaleFormulaireOuverte(false)}
        definitionExistante={definitionEnEdition}
        chapitresConnus={chapitres}
        codeSystems={codeSystems}
        onEnregistrer={handleEnregistrerFormulaire}
      />

      <FormulaireCodificationsDiagnosticModale
        ouvert={modaleCodificationsOuverte}
        onFermer={() => setModaleCodificationsOuverte(false)}
        definition={definitionCodifications}
        codeSystems={codeSystems}
        onEnregistrer={definirCodifications}
      />

      <GestionCodeSystemsModale
        ouvert={modaleCodeSystemsOuverte}
        onFermer={() => setModaleCodeSystemsOuverte(false)}
        codeSystems={codeSystems}
        onCreerCodeSystem={creerCodeSystem}
        onBasculerActivation={basculerActivationCodeSystem}
      />
    </div>
  );
};

export default PanneauDiagnosticDefinitions;