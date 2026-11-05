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
  Search,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { GestionCategoriesModale } from "@/noyau/referentiels/categories";
import { useReferentielsHabilitations } from "@/noyau/referentiels/habilitations";
import {
  ActeMedical,
  NouvelActeInput,
  ModificationActeInput,
  NouvelleCategorieInput,
} from "../modele/catalogue-actes.types";
import { useCatalogueActes } from "../hooks/useCatalogueActes";
import { FormulaireActeModale } from "./FormulaireActeModale";
import { ModaleObservationsActe } from "./ModaleObservationsActe";
import { FormulaireCodificationsActeModale } from "./FormulaireCodificationsActeModale";
import { GestionCodeSystemsModale } from "@/briques/observation-definitions/ui/GestionCodeSystemsModale";

/* =====================================================================
 *  Tokens du design (maquette « Catalogue d'actes — liste »)
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BOUTON_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BOUTON_SECONDAIRE = `${BOUTON_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BOUTON_PRIMAIRE = `${BOUTON_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const PUCE =
  "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

interface MenuActions {
  acte: ActeMedical;
  top: number;
  right: number;
}

export interface PanneauCatalogueActesProps {
  mode?: ModeAffichage;
}

/* ===================================================================== */
/*  Composant                                                            */
/* ===================================================================== */
export const PanneauCatalogueActes: React.FC<PanneauCatalogueActesProps> = ({
  mode = "edition",
}) => {
  if (mode === "masque") return null;
  const estModeLectureSeule = mode === "lecture";

  const {
    actes,
    actesTous,
    categories,
    categoriesArbre,
    categoriesChargement,
    changerParentCategorie,
    typesServices,
    codeSystems,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    categorieFiltre,
    setCategorieFiltre,
    statutFiltre,
    setStatutFiltre,
    corpsMedicalFiltre,
    setCorpsMedicalFiltre,
    recharger,
    creerActe,
    modifierActe,
    basculerStatutActe,
    creerCategorie,
    definirCodifications,
    creerCodeSystem,
    basculerActivationCodeSystem,
  } = useCatalogueActes();

  const { corpsMedicaux } = useReferentielsHabilitations();

  /* ---------- Modales ---------- */
  const [modalActeOuverte, setModalActeOuverte] = useState(false);
  const [acteEnEdition, setActeEnEdition] = useState<ActeMedical | null>(null);

  const [modalCategoriesOuverte, setModalCategoriesOuverte] = useState(false);

  const [modalObservationsOuverte, setModalObservationsOuverte] = useState(false);
  const [actePourObservations, setActePourObservations] = useState<ActeMedical | null>(null);

  const [modalCodifOuverte, setModalCodifOuverte] = useState(false);
  const [actePourCodif, setActePourCodif] = useState<ActeMedical | null>(null);

  const [modalCodeSystemsOuverte, setModalCodeSystemsOuverte] = useState(false);

  /* ---------- Menu « ⋯ » ---------- */
  const [menu, setMenu] = useState<MenuActions | null>(null);

  useEffect(() => {
    if (!menu) return;
    const fermer = () => setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);

  /* ---------- Compteurs ---------- */
  const compteParCode = useMemo(() => {
    const map: Record<string, number> = {};
    actesTous.forEach((a) => {
      const c = a.categorie?.code;
      if (c) map[c] = (map[c] ?? 0) + 1;
    });
    return map;
  }, [actesTous]);

  const nbSansCodification = actesTous.filter(
    (a) => !a.codifications || a.codifications.length === 0,
  ).length;

  const nomTypeService = (id: number) => {
    const t = typesServices.find((item) => item.id === id);
    return t ? t.nom : `#${id}`;
  };

  /* ---------- Handlers ---------- */
  const handleEnregistrerActe = async (
    saisie: NouvelActeInput | ModificationActeInput,
    id?: number,
  ): Promise<boolean> => {
    if (id) return modifierActe(id, saisie as ModificationActeInput);
    return creerActe(saisie as NouvelActeInput);
  };

  const handleCreerCategorie = async (
    saisie: NouvelleCategorieInput,
  ): Promise<boolean> => {
    return creerCategorie(saisie);
  };

  const ouvrirMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    acte: ActeMedical,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({
      acte,
      top: Math.min(r.bottom + 4, window.innerHeight - 240),
      right: window.innerWidth - r.right,
    });
  };

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            Catalogue d'actes médicaux
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Actes cliniques, explorations et soins infirmiers autorisés par profession.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalCategoriesOuverte(true)}
            className={BOUTON_SECONDAIRE}
            title="Gérer l'arborescence des catégories d'actes"
          >
            Catégories ({categories.length})
          </button>

          {!estModeLectureSeule && (
            <button
              type="button"
              onClick={() => setModalCodeSystemsOuverte(true)}
              className={BOUTON_SECONDAIRE}
              title="Gérer les terminologies (LOINC, CCAM, CIM-10, SNOMED…)"
            >
              Terminologies ({codeSystems.length})
            </button>
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
              onClick={() => {
                setActeEnEdition(null);
                setModalActeOuverte(true);
              }}
              disabled={categories.length === 0}
              className={BOUTON_PRIMAIRE}
              title={
                categories.length === 0
                  ? "Créez d'abord une catégorie d'acte"
                  : undefined
              }
            >
              <Plus className="h-[18px] w-[18px]" />
              Nouvel acte
            </button>
          )}
        </div>
      </div>

      {/* ===================== Carte statistiques ===================== */}
      <div
        className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 h-14`}
      >
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.total}</b> actes
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.actifs}</b> actifs
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.inactifs}</b> archivés
        </span>
        <span className="text-[13px] text-[#5b6472]">
          <b className="text-[#1f2937] text-[15px]">{stats.totalCat}</b> catégories
        </span>

        {nbSansCodification > 0 && (
          <span
            className={`${PUCE} ml-auto bg-[#fff4e0] text-[#8a5300] px-3.5 py-1.5 text-[13px]`}
            title="Associez un code externe (CCAM, LOINC…) pour améliorer l'interopérabilité"
          >
            {nbSansCodification} acte{nbSansCodification > 1 ? "s" : ""} sans
            codification externe
          </span>
        )}
      </div>

      {/* ===================== Filtres ===================== */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6472] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par code, libellé ou catégorie…"
            aria-label="Rechercher un acte"
            className={`${CHAMP} w-full pl-9`}
          />
        </div>

        <select
          value={categorieFiltre}
          onChange={(e) => setCategorieFiltre(e.target.value)}
          aria-label="Filtrer par catégorie"
          className={`${CHAMP} md:w-[210px]`}
        >
          <option value="tous">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.code}>
              {c.chemin.length > 1
                ? `${"— ".repeat(c.chemin.length - 1)}${c.libelle}`
                : c.libelle}
            </option>
          ))}
        </select>

        <select
          value={corpsMedicalFiltre}
          onChange={(e) => setCorpsMedicalFiltre(e.target.value)}
          aria-label="Filtrer par corps médical"
          className={`${CHAMP} md:w-[210px]`}
        >
          <option value="tous">Tous les corps médicaux</option>
          {corpsMedicaux.map((c) => (
            <option key={c.code} value={c.code}>
              {c.libelle}
            </option>
          ))}
        </select>

        <select
          value={statutFiltre}
          onChange={(e) =>
            setStatutFiltre(
              e.target.value as "tous" | "actifs" | "inactifs",
            )
          }
          aria-label="Filtrer par statut"
          className={`${CHAMP} md:w-[170px]`}
        >
          <option value="tous">Tous statuts</option>
          <option value="actifs">Actifs seuls</option>
          <option value="inactifs">Inactifs seuls</option>
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
        ) : actes.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px]">
            {actesTous.length === 0
              ? "Aucun acte enregistré dans le catalogue."
              : "Aucun acte ne correspond aux critères de recherche."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    { label: "Code", w: "w-[202px]" },
                    { label: "Acte", w: "w-auto" },
                    { label: "Habilitations", w: "w-[212px]" },
                    { label: "Services", w: "w-[142px]" },
                    { label: "Codification", w: "w-[122px]" },
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
                {actes.map((a) => {
                  const chemin =
                    a.categorie.chemin.length > 1
                      ? a.categorie.chemin.join(" › ")
                      : a.categorie.libelle;

                  const servicesLabel =
                    a.typeServiceIds.length === 0
                      ? "Tous les services"
                      : a.typeServiceIds.map(nomTypeService).join(", ");

                  return (
                    <tr
                      key={a.id}
                      className="h-[54px] border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                    >
                      {/* Code */}
                      <td className="px-4 py-2">
                        <span className="inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap">
                          {a.code}
                        </span>
                      </td>

                      {/* Acte */}
                      <td className="px-4 py-2 min-w-0">
                        <div className="font-bold text-[#1f2937] truncate">
                          {a.libelle}
                        </div>
                        <div className="text-[12px] text-[#5b6472] truncate">
                          {chemin}
                        </div>
                      </td>

                      {/* Habilitations */}
                      <td className="px-4 py-2">
                        {a.habilitations.length === 0 ? (
                          <span className="italic text-[#5b6472] text-[11px]">
                            Aucune
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {a.habilitations.map((h, i) => (
                              <span
                                key={`${h.corpsMedicalCode}-${h.specialiteCode ?? "-"}-${i}`}
                                className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold border border-[#1f9d55] text-[#14703c] bg-white whitespace-nowrap"
                                title={h.corpsMedicalLibelle ?? h.corpsMedicalCode}
                              >
                                {h.corpsMedicalLibelle ?? h.corpsMedicalCode}
                                {h.specialiteLibelle
                                  ? ` · ${h.specialiteLibelle}`
                                  : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Services */}
                      <td className="px-4 py-2">
                        <span
                          className={`text-[12px] ${
                            a.typeServiceIds.length === 0
                              ? "text-[#5b6472]"
                              : "text-[#1f2937] font-medium"
                          } block truncate`}
                          title={servicesLabel}
                        >
                          {servicesLabel}
                        </span>
                      </td>

                      {/* Codification */}
                      <td className="px-4 py-2">
                        {!a.codifications || a.codifications.length === 0 ? (
                          estModeLectureSeule ? (
                            <span className="text-[11px] italic text-[#5b6472]">
                              Aucune
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActePourCodif(a);
                                setModalCodifOuverte(true);
                              }}
                              className={`${PUCE} bg-[#fff4e0] text-[#8a5300] hover:bg-[#ffe9c7] cursor-pointer ${FOCUS}`}
                              title="Associer un code système (CCAM, LOINC, CIM-10…)"
                            >
                              À codifier
                            </button>
                          )
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {a.codifications.slice(0, 1).map((c, i) => (
                              <span
                                key={i}
                                className="bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[10px] font-bold whitespace-nowrap"
                                title={`${c.codeSystem} : ${c.code}`}
                              >
                                {c.codeSystem}:{c.code}
                              </span>
                            ))}
                            {a.codifications.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActePourCodif(a);
                                  setModalCodifOuverte(true);
                                }}
                                className="text-[10px] font-bold text-[#3730a3] hover:underline cursor-pointer"
                                title="Voir toutes les codifications"
                              >
                                +{a.codifications.length - 1}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-2">
                        {estModeLectureSeule ? (
                          <span
                            className={`${PUCE} ${
                              a.actif
                                ? "bg-[#e7f6ed] text-[#14703c]"
                                : "bg-[#f0f2f1] text-[#5b6472]"
                            }`}
                          >
                            {a.actif ? "Actif" : "Inactif"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={a.actif}
                            aria-label={`${a.actif ? "Désactiver" : "Activer"} ${a.libelle}`}
                            onClick={() => basculerStatutActe(a)}
                            className={`inline-flex items-center gap-2 cursor-pointer ${FOCUS}`}
                          >
                            <span
                              className={`relative w-[34px] h-5 rounded-full transition-colors ${
                                a.actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                  a.actif ? "left-4" : "left-0.5"
                                }`}
                              />
                            </span>
                            <span
                              className={`text-[12px] font-bold ${
                                a.actif ? "text-[#14703c]" : "text-[#5b6472]"
                              }`}
                            >
                              {a.actif ? "Actif" : "Inactif"}
                            </span>
                          </button>
                        )}
                      </td>

                      {/* Menu actions */}
                      <td className="px-2 py-2 text-center">
                        {!estModeLectureSeule && (
                          <button
                            type="button"
                            aria-label={`Actions pour ${a.libelle}`}
                            aria-haspopup="menu"
                            onClick={(e) => ouvrirMenu(e, a)}
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

        {!chargement && actes.length > 0 && (
          <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-[11px] text-[#5b6472]">
            <strong className="font-bold text-[#1f2937]">{actes.length}</strong>{" "}
            acte{actes.length > 1 ? "s" : ""} affiché
            {actes.length > 1 ? "s" : ""}
            {actes.length !== actesTous.length && (
              <> · sur {actesTous.length} au total</>
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
            className="fixed z-50 w-60 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActeEnEdition(menu.acte);
                setModalActeOuverte(true);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#5b6472]" />
              Modifier l'acte
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActePourCodif(menu.acte);
                setModalCodifOuverte(true);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Tag className="h-3.5 w-3.5 text-[#5b6472]" />
              Codifications externes
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActePourObservations(menu.acte);
                setModalObservationsOuverte(true);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-[#5b6472]" />
              Moule d'observations
            </button>

            <div className="my-1 border-t border-[#f0f2f1]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                basculerStatutActe(menu.acte);
                setMenu(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer ${
                menu.acte.actif
                  ? "text-[#b42318] hover:bg-rose-50"
                  : "text-[#14703c] hover:bg-[#e7f6ed]"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {menu.acte.actif ? "Désactiver" : "Réactiver"}
            </button>
          </div>
        </>
      )}

      {/* ===================== Modales ===================== */}
      <FormulaireActeModale
        ouvert={modalActeOuverte}
        acteEnEdition={acteEnEdition}
        categories={categories}
        typesServices={typesServices}
        codeSystems={codeSystems}
        onFermer={() => setModalActeOuverte(false)}
        onEnregistrer={handleEnregistrerActe}
        onEnregistrerCodifications={definirCodifications}
      />

      <GestionCategoriesModale
        ouvert={modalCategoriesOuverte}
        titre="Catégories d'actes médicaux"
        libelleSingulier="catégorie d'acte"
        arbre={categoriesArbre}
        categories={categories}
        chargement={categoriesChargement}
        compteParCode={compteParCode}
        onFermer={() => setModalCategoriesOuverte(false)}
        onCreer={handleCreerCategorie}
        onChangerParent={changerParentCategorie}
        
      />

      <ModaleObservationsActe
        ouvert={modalObservationsOuverte}
        acte={actePourObservations}
        onFermer={() => {
          setModalObservationsOuverte(false);
          setActePourObservations(null);
        }}
      />

      <FormulaireCodificationsActeModale
        ouvert={modalCodifOuverte}
        acte={actePourCodif}
        codeSystems={codeSystems}
        onFermer={() => {
          setModalCodifOuverte(false);
          setActePourCodif(null);
        }}
        onEnregistrer={definirCodifications}
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

export default PanneauCatalogueActes;