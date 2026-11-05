/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Tag,
  Power,
  Activity,
  RefreshCw,
  FolderTree,
  Scale,
  BookMarked,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { GestionCategoriesModale } from "@/noyau/referentiels/categories";
import {
  ObservationDefinition,
  NouvelleObservationDefinitionInput,
  ModificationObservationDefinitionInput,
} from "../modele/observation-definition.types";
import { useObservationDefinitions } from "../hooks/useObservationDefinitions";
import { FormulaireObservationDefinitionModale } from "./FormulaireObservationDefinitionModale";
import { FormulaireCodificationsModale } from "./FormulaireCodificationsModale";
import { GestionUnitesModale } from "./GestionUnitesModale";
import { GestionCodeSystemsModale } from "./GestionCodeSystemsModale";

/* =====================================================================
 *  Tokens du design
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BOUTON_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BOUTON_SECONDAIRE = `${BOUTON_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BOUTON_PRIMAIRE = `${BOUTON_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

interface MenuActions {
  definition: ObservationDefinition;
  top: number;
  right: number;
}

/* =====================================================================
 *  Composant principal
 * ===================================================================== */
export const PanneauObservationDefinitions: React.FC<{ mode?: ModeAffichage }> = ({
  mode = "edition",
}) => {
  const estModeLectureSeule = mode === "lecture";

  const {
    definitions,
    definitionsToutes,
    unites,
    codeSystems,
    categories,
    categoriesArbre,
    categoriesChargement,
    creerCategorie,
    changerParentCategorie,
    chargement,
    erreur,
    recherche,
    setRecherche,
    filtreType,
    setFiltreType,
    filtreActif,
    setFiltreActif,
    filtreCategorie,
    setFiltreCategorie,
    recharger,
    creerDefinition,
    modifierDefinition,
    definirCodifications,
    creerUnite,
    basculerActivationUnite,
    creerCodeSystem,
    basculerActivationCodeSystem,
  } = useObservationDefinitions();

  /* ---------- Modales ---------- */
  const [modalDefOuverte, setModalDefOuverte] = useState(false);
  const [definitionEnEdition, setDefinitionEnEdition] =
    useState<ObservationDefinition | null>(null);

  const [modalCodifOuverte, setModalCodifOuverte] = useState(false);
  const [definitionPourCodif, setDefinitionPourCodif] =
    useState<ObservationDefinition | null>(null);

  const [modalUnitesOuverte, setModalUnitesOuverte] = useState(false);
  const [modalCodeSystemsOuverte, setModalCodeSystemsOuverte] = useState(false);
  const [modalCategoriesOuverte, setModalCategoriesOuverte] = useState(false);

  /* ---------- Menu « ⋯ » ---------- */
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

  /* ---------- Compte d'observations par code de catégorie ---------- */
  const compteParCode = useMemo(() => {
    const map: Record<string, number> = {};
    definitionsToutes.forEach((d) => {
      const c = d.categorie?.code;
      if (c) map[c] = (map[c] ?? 0) + 1;
    });
    return map;
  }, [definitionsToutes]);

  if (mode === "masque") return null;

  /* ---------- Handlers ---------- */
  const handleEnregistrerDef = async (
    saisie: NouvelleObservationDefinitionInput | ModificationObservationDefinitionInput,
    id?: number,
  ): Promise<boolean> => {
    if (id) {
      return modifierDefinition(id, saisie as ModificationObservationDefinitionInput);
    }
    return creerDefinition(saisie as NouvelleObservationDefinitionInput);
  };

  const ouvrirCreation = () => {
    setDefinitionEnEdition(null);
    setModalDefOuverte(true);
  };

  const ouvrirEdition = (def: ObservationDefinition) => {
    setDefinitionEnEdition(def);
    setModalDefOuverte(true);
  };

  const ouvrirCodifications = (def: ObservationDefinition) => {
    setDefinitionPourCodif(def);
    setModalCodifOuverte(true);
  };

  /* ---------- Statistiques dérivées ---------- */
  const nbSansCodification = definitionsToutes.filter(
    (d) => !d.codifications || d.codifications.length === 0,
  ).length;

  const stats = {
    total: definitionsToutes.length,
    actives: definitionsToutes.filter((d) => d.actif).length,
    numeriques: definitionsToutes.filter((d) => d.typeValeur === "numerique").length,
    qualitatives: definitionsToutes.filter((d) => d.typeValeur === "texte").length,
    categories: categories.length,
  };

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête + actions ===================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight text-[#1f2937]">
            Observations cliniques
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Référentiel des paramètres cliniques, constantes et mesures des actes médicaux.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalCategoriesOuverte(true)}
            className={BOUTON_SECONDAIRE}
            title="Gérer l'arborescence des catégories d'observations"
          >
            Catégories ({categories.length})
          </button>

          {!estModeLectureSeule && (
            <>
              <button
                type="button"
                onClick={() => setModalUnitesOuverte(true)}
                className={BOUTON_SECONDAIRE}
                title="Gérer les unités de mesure"
              >
                Unités ({unites.length})
              </button>

              <button
                type="button"
                onClick={() => setModalCodeSystemsOuverte(true)}
                className={BOUTON_SECONDAIRE}
                title="Gérer les terminologies (LOINC, SNOMED…)"
              >
                Terminologies ({codeSystems.length})
              </button>
            </>
          )}

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
              onClick={ouvrirCreation}
              disabled={categories.length === 0}
              className={BOUTON_PRIMAIRE}
              title={
                categories.length === 0
                  ? "Créez d'abord une catégorie d'observation"
                  : undefined
              }
            >
              <Plus className="h-[18px] w-[18px]" />
              Nouvelle définition
            </button>
          )}
        </div>
      </div>

      {/* ===================== Carte statistiques ===================== */}
      <div
        className={`${CARTE} flex flex-wrap items-center gap-x-8 gap-y-2 px-5 h-14`}
      >
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.total}</b> définitions
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.actives}</b> actives
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.numeriques}</b> numériques
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.qualitatives}</b> qualitatives
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.categories}</b> catégories
        </span>

        {nbSansCodification > 0 && (
          <span
            className={`${PUCE} ml-auto bg-[#fff4e0] text-[#8a5300] px-3.5 py-1.5 text-[13px]`}
            title="Associez un code externe (LOINC, SNOMED…) pour améliorer l'interopérabilité"
          >
            {nbSansCodification} définition{nbSansCodification > 1 ? "s" : ""} sans
            codification externe
          </span>
        )}
      </div>

      {/* ===================== Barre de filtres ===================== */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par code, libellé, unité ou code LOINC…"
          aria-label="Rechercher une définition d'observation"
          className={`${CHAMP} flex-1`}
        />

        <select
          value={filtreCategorie}
          onChange={(e) => setFiltreCategorie(e.target.value)}
          aria-label="Filtrer par catégorie"
          className={`${CHAMP} md:w-[200px]`}
        >
          <option value="toutes">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.code}>
              {c.niveau > 1 ? `${"— ".repeat(c.niveau - 1)}${c.libelle}` : c.libelle}
            </option>
          ))}
        </select>

        <select
          value={filtreType}
          onChange={(e) =>
            setFiltreType(e.target.value as "tous" | "numerique" | "texte")
          }
          aria-label="Filtrer par type de valeur"
          className={`${CHAMP} md:w-[170px]`}
        >
          <option value="tous">Tous types</option>
          <option value="numerique">Numérique</option>
          <option value="texte">Texte</option>
        </select>

        <select
          value={filtreActif}
          onChange={(e) =>
            setFiltreActif(e.target.value as "tous" | "actifs" | "inactifs")
          }
          aria-label="Filtrer par statut"
          className={`${CHAMP} md:w-[170px]`}
        >
          <option value="tous">Tous statuts</option>
          <option value="actifs">Actifs</option>
          <option value="inactifs">Désactivés</option>
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
              <span className="text-xs">Chargement de la nomenclature…</span>
            </div>
          </div>
        ) : definitions.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px]">
            {definitionsToutes.length === 0
              ? "Aucune définition d'observation enregistrée."
              : "Aucune définition ne correspond aux critères de recherche."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    { label: "Code", w: "w-[122px]" },
                    { label: "Définition", w: "w-auto" },
                    { label: "Type et unité", w: "w-[212px]" },
                    { label: "Codification externe", w: "w-[192px]" },
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
                  const chemin =
                    def.categorie.chemin.length > 1
                      ? def.categorie.chemin.join(" › ")
                      : def.categorie.libelle;

                  return (
                    <tr
                      key={def.id}
                      className="h-[54px] border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className="inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-xs font-bold whitespace-nowrap">
                          {def.code}
                        </span>
                      </td>

                      <td className="px-4 py-2 min-w-0">
                        <div className="font-bold text-[#1f2937] truncate">
                          {def.libelle}
                        </div>
                        <div className="text-xs text-[#5b6472] truncate">
                          {chemin}
                        </div>
                      </td>

                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`${PUCE} ${
                              def.typeValeur === "numerique"
                                ? "bg-[#f0f2f1] text-[#1f2937]"
                                : "bg-[#eef2ff] text-[#3730a3]"
                            }`}
                          >
                            {def.typeValeur === "numerique" ? "Numérique" : "Texte"}
                          </span>
                          {def.typeValeur === "numerique" && def.uniteCode && (
                            <span className="font-mono text-xs font-bold text-[#1f2937]">
                              {def.uniteCode}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2">
                        {!def.codifications || def.codifications.length === 0 ? (
                          estModeLectureSeule ? (
                            <span className="text-[11px] italic text-[#5b6472]">
                              Aucune
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => ouvrirCodifications(def)}
                              className={`${PUCE} bg-[#fff4e0] text-[#8a5300] hover:bg-[#ffe9c7] cursor-pointer ${FOCUS}`}
                              title="Associer un code externe (LOINC, SNOMED…)"
                            >
                              À codifier
                            </button>
                          )
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {def.codifications.slice(0, 2).map((c, i) => (
                              <span
                                key={i}
                                className="bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[11px] font-bold whitespace-nowrap"
                                title={`${c.codeSystem} : ${c.code}`}
                              >
                                {c.codeSystem}:{c.code}
                              </span>
                            ))}
                            {def.codifications.length > 2 && (
                              <button
                                type="button"
                                onClick={() => ouvrirCodifications(def)}
                                className="text-[10px] font-bold text-[#3730a3] hover:underline cursor-pointer"
                                title="Voir toutes les codifications"
                              >
                                +{def.codifications.length - 2}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

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
                            onClick={() => modifierDefinition(def.id, { actif: !def.actif })}
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
                              className={`text-xs font-bold ${
                                def.actif ? "text-[#14703c]" : "text-[#5b6472]"
                              }`}
                            >
                              {def.actif ? "Actif" : "Inactif"}
                            </span>
                          </button>
                        )}
                      </td>

                      <td className="px-2 py-2 text-center">
                        {!estModeLectureSeule && (
                          <button
                            type="button"
                            aria-label={`Actions pour ${def.libelle}`}
                            aria-haspopup="menu"
                            onClick={(e) => {
                              const r = e.currentTarget.getBoundingClientRect();
                              setMenu({
                                definition: def,
                                top: r.bottom + 4,
                                right: window.innerWidth - r.right,
                              });
                            }}
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
            définition{definitions.length > 1 ? "s" : ""} affichée
            {definitions.length > 1 ? "s" : ""}
            {definitions.length !== definitionsToutes.length && (
              <> · sur {definitionsToutes.length} au total</>
            )}
          </div>
        )}
      </div>

      {/* ===================== Menu « ⋯ » ===================== */}
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
            className="fixed z-50 w-56 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                ouvrirEdition(menu.definition);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#5b6472]" />
              Modifier la définition
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                ouvrirCodifications(menu.definition);
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
                modifierDefinition(menu.definition.id, { actif: !menu.definition.actif });
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
      <FormulaireObservationDefinitionModale
        ouvert={modalDefOuverte}
        definitionEnEdition={definitionEnEdition}
        unites={unites}
        codeSystems={codeSystems}
        categories={categories}
        onFermer={() => setModalDefOuverte(false)}
        onEnregistrer={handleEnregistrerDef}
        onEnregistrerCodifications={definirCodifications}
        onOuvrirGestionUnites={() => setModalUnitesOuverte(true)}
      />

      <GestionCategoriesModale
        ouvert={modalCategoriesOuverte}
        titre="Catégories d'observations"
        libelleSingulier="catégorie d'observation"
        arbre={categoriesArbre}
        categories={categories}
        chargement={categoriesChargement}
        compteParCode={compteParCode}
        onFermer={() => setModalCategoriesOuverte(false)}
        onCreer={async (saisie) =>
          creerCategorie(saisie.code, saisie.libelle, saisie.parentCode ?? null)
        }
        onChangerParent={changerParentCategorie}
      />

      <FormulaireCodificationsModale
        ouvert={modalCodifOuverte}
        definition={definitionPourCodif}
        codeSystems={codeSystems}
        onFermer={() => setModalCodifOuverte(false)}
        onEnregistrer={definirCodifications}
      />

      <GestionUnitesModale
        ouvert={modalUnitesOuverte}
        unites={unites}
        onFermer={() => setModalUnitesOuverte(false)}
        onCreerUnite={creerUnite}
        onBasculerActivation={basculerActivationUnite}
      />

      <GestionCodeSystemsModale
        ouvert={modalCodeSystemsOuverte}
        codeSystems={codeSystems}
        onFermer={() => setModalCodeSystemsOuverte(false)}
        onCreerCodeSystem={creerCodeSystem}
        onBasculerActivation={basculerActivationCodeSystem}
      />
    </div>
  );
};

export default PanneauObservationDefinitions;