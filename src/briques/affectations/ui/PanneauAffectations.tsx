
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  MoreHorizontal,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Calendar,
} from "lucide-react";

import { useIsMobile } from "@/noyau/ui/mobile";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { VueMobileAffectations } from "./mobile";

import { ModaleConfirmationSuppression } from "@/noyau/ui/ModaleConfirmationSuppression";

import {
  AffectationPersonnel,
  NouvelleAffectationInput,
  ModificationAffectationInput,
} from "../modele/affectation.types";

import { useAffectations } from "../hooks/useAffectations";
import { FormulaireAffectationTiroir } from "./FormulaireAffectationTiroir";

// ------------------------------------------------------------------
// PROPS
// ------------------------------------------------------------------

export interface PanneauAffectationsProps {
  mode?: ModeAffichage;
}

// ------------------------------------------------------------------
// AIGUILLEUR MOBILE / DESKTOP
// ------------------------------------------------------------------

/**
 * Aiguilleur responsive :
 * - Mobile : cartes et sheets.
 * - Desktop : tableau existant.
 */
export const PanneauAffectations: React.FC<
  PanneauAffectationsProps
> = ({ mode = "edition" }) => {
  const isMobile = useIsMobile();

  if (mode === "masque") {
    return null;
  }

  return isMobile ? (
    <VueMobileAffectations mode={mode} />
  ) : (
    <PanneauAffectationsDesktop mode={mode} />
  );
};

// ------------------------------------------------------------------
// DESIGN TOKENS DESKTOP
// ------------------------------------------------------------------

const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";

const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] focus:outline-hidden focus:border-[#1f9d55]";

const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold";

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------

interface MenuActions {
  affectation: AffectationPersonnel;
  top: number;
  right: number;
}

// ------------------------------------------------------------------
// VUE DESKTOP
// ------------------------------------------------------------------

const PanneauAffectationsDesktop: React.FC<
  PanneauAffectationsProps
> = ({ mode = "edition" }) => {
  const estModeLectureSeule = mode === "lecture";

  const {
    affectations,
    affectationsToutes,
    optionsPersonnel,
    optionsServices,
    optionsSites,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    filtreSiteId,
    setFiltreSiteId,
    filtreActif,
    setFiltreActif,
    recharger,
    creerAffectation,
    modifierAffectation,
    supprimerAffectation,
  } = useAffectations();

  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  const [affectationEnEdition, setAffectationEnEdition] =
    useState<AffectationPersonnel | null>(null);

  const [affectationASupprimer, setAffectationASupprimer] =
    useState<AffectationPersonnel | null>(null);

  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const [menu, setMenu] = useState<MenuActions | null>(null);

  // Ferme le menu au scroll, resize ou Échap.
  useEffect(() => {
    if (!menu) return;

    const fermer = () => setMenu(null);

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
      }
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

  // ----------------------------------------------------------------
  // FORMATAGE
  // ----------------------------------------------------------------

  const initialesAgent = (aff: AffectationPersonnel) => {
    const n = aff.nomPersonnel?.trim() ?? "";
    const p = aff.prenomPersonnel?.trim() ?? "";

    if (n && p) {
      return `${p.charAt(0)}${n.charAt(0)}`.toUpperCase();
    }

    if (n) {
      return n.slice(0, 2).toUpperCase();
    }

    return "??";
  };

  const nomAffiche = (aff: AffectationPersonnel) => {
    const n = aff.nomPersonnel?.trim() ?? "";
    const p = aff.prenomPersonnel?.trim() ?? "";

    return `${n} ${p}`.trim() || `Personnel #${aff.staffId}`;
  };

  // ----------------------------------------------------------------
  // ENREGISTREMENT
  // ----------------------------------------------------------------

  const handleEnregistrer = async (
    saisie: NouvelleAffectationInput | ModificationAffectationInput,
    id?: number,
  ): Promise<boolean> => {
    if (id) {
      return modifierAffectation(
        id,
        saisie as ModificationAffectationInput,
      );
    }

    return creerAffectation(saisie as NouvelleAffectationInput);
  };

  // ----------------------------------------------------------------
  // SUPPRESSION
  // ----------------------------------------------------------------

  const handleConfirmerSuppression = async () => {
    if (!affectationASupprimer) return;

    setSuppressionEnCours(true);

    try {
      const succes = await supprimerAffectation(
        affectationASupprimer.id,
        nomAffiche(affectationASupprimer),
      );

      if (succes) {
        setAffectationASupprimer(null);
      }
    } finally {
      setSuppressionEnCours(false);
    }
  };

  // ----------------------------------------------------------------
  // MENU ACTIONS
  // ----------------------------------------------------------------

  const ouvrirMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    aff: AffectationPersonnel,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();

    setMenu({
      affectation: aff,
      top: r.bottom + 4,
      right: window.innerWidth - r.right,
    });
  };

  // ----------------------------------------------------------------
  // FILTRES
  // ----------------------------------------------------------------

  const pilulesFiltre: {
    cle: "tous" | "actifs" | "inactifs";
    libelle: string;
    n: number;
  }[] = [
    {
      cle: "tous",
      libelle: "Toutes",
      n: stats.total,
    },
    {
      cle: "actifs",
      libelle: "Actives",
      n: stats.actives,
    },
    {
      cle: "inactifs",
      libelle: "Clôturées",
      n: stats.inactives,
    },
  ];

  // ----------------------------------------------------------------
  // STATISTIQUES
  // ----------------------------------------------------------------

  const statistiques = [
    {
      valeur: stats.total,
      libelle: "Affectations",
    },
    {
      valeur: stats.actives,
      libelle: "Actives",
    },
    {
      valeur: stats.inactives,
      libelle: "Clôturées",
    },
    {
      valeur: stats.agentsAffectes,
      libelle: "Personnels répartis",
    },
  ];

  // ----------------------------------------------------------------
  // RENDU
  // ----------------------------------------------------------------

  return (
    <div className="space-y-3.5 text-[#1f2937]">

      {/* ==========================================================
          CARTE EN-TÊTE + STATISTIQUES
      ========================================================== */}

      <section className={CARTE}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">

          <div>
            <h1 className="m-0 text-[22px] font-bold leading-tight">
              Affectations du personnel
            </h1>

            <p className="mt-0.5 mb-0 text-[13px] text-[#5b6472]">
              Répartition opérationnelle du personnel soignant et
              administratif aux sites et services.
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={recharger}
              disabled={chargement}
              title="Rafraîchir"
              aria-label="Rafraîchir la liste"
              className="h-10 w-10 grid place-items-center border border-[#e5e7eb] rounded-[10px] bg-white text-[#5b6472] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  chargement
                    ? "animate-spin text-[#1f9d55]"
                    : ""
                }`}
              />
            </button>

            {!estModeLectureSeule && (
              <button
                type="button"
                onClick={() => {
                  setAffectationEnEdition(null);
                  setTiroirOuvert(true);
                }}
                className="h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#1f9d55] bg-[#1f9d55] text-white hover:bg-[#14703c] hover:border-[#14703c] cursor-pointer transition"
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle affectation</span>
              </button>
            )}

          </div>
        </div>

        <div className="flex flex-wrap border-t border-[#f0f2f1]">
          {statistiques.map((s) => (
            <div
              key={s.libelle}
              className="flex-1 min-w-[140px] px-5 py-3 text-xs text-[#5b6472] border-r border-[#f0f2f1] last:border-r-0"
            >
              <b className="block text-[19px] text-[#1f2937]">
                {s.valeur}
              </b>
              {s.libelle}
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================================
          FILTRES + TABLEAU
      ========================================================== */}

      <section className={`${CARTE} overflow-hidden`}>

        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">

          {pilulesFiltre.map((p) => {
            const actif = filtreActif === p.cle;

            return (
              <button
                key={p.cle}
                type="button"
                onClick={() => setFiltreActif(p.cle)}
                className={`px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer transition ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
                }`}
              >
                {p.libelle} ({p.n})
              </button>
            );
          })}

          <input
            type="search"
            aria-label="Rechercher"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par agent, service, rôle ou site…"
            className={`${CHAMP} flex-1 min-w-[220px]`}
          />

          <select
            aria-label="Filtrer par site"
            value={filtreSiteId === "tous" ? "" : filtreSiteId}
            onChange={(e) => {
              const val = e.target.value;
              setFiltreSiteId(
                val === "" ? "tous" : Number(val),
              );
            }}
            className={CHAMP}
          >
            <option value="">Tous les établissements</option>

            {optionsSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>

        </div>

        {/* ERREUR */}

        {erreur && (
          <div className="mx-5 mb-3.5 p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-rose-700 text-xs flex items-center justify-between">
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

        {/* CHARGEMENT */}

        {chargement ? (
          <div className="p-12 text-center text-[#5b6472] border-t border-[#e5e7eb]">
            <div className="flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55]" />
              <span className="text-[13px]">
                Chargement des affectations...
              </span>
            </div>
          </div>

        ) : affectations.length === 0 ? (

          /* AUCUN RÉSULTAT */

          <div className="p-12 text-center text-[#5b6472] text-[13px] border-t border-[#e5e7eb]">
            {affectationsToutes.length === 0
              ? "Aucune affectation enregistrée dans le système."
              : "Aucune affectation ne correspond aux filtres appliqués."}
          </div>

        ) : (

          /* TABLEAU */

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">

              <thead>
                <tr>
                  {[
                    "Agent",
                    "Site",
                    "Service",
                    "Période",
                    "Statut",
                  ].map((t) => (
                    <th
                      key={t}
                      className="bg-[#fafbfa] text-left px-5 h-10 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-t border-[#e5e7eb] whitespace-nowrap"
                    >
                      {t}
                    </th>
                  ))}

                  {!estModeLectureSeule && (
                    <th className="bg-[#fafbfa] w-14 px-5 h-10 border-b border-t border-[#e5e7eb]">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {affectations.map((aff) => {
                  const attenue = aff.actif ? "" : "opacity-60";

                  return (
                    <tr
                      key={aff.id}
                      className="hover:bg-[#fafbfa] transition-colors"
                    >

                      {/* AGENT */}

                      <td
                        className={`h-[54px] px-5 border-b border-[#f0f2f1] ${attenue}`}
                      >
                        <div className="flex items-center gap-3">

                          <div
                            aria-hidden="true"
                            className={`h-9 w-9 shrink-0 rounded-[10px] grid place-items-center text-xs font-bold select-none ${
                              aff.actif
                                ? "bg-[#e7f6ed] text-[#14703c]"
                                : "bg-[#f0f2f1] text-[#5b6472]"
                            }`}
                          >
                            {initialesAgent(aff)}
                          </div>

                          <div className="min-w-0">
                            <b className="block font-bold truncate">
                              {nomAffiche(aff)}
                            </b>

                            <small className="text-xs text-[#5b6472]">
                              {aff.rolePersonnel}
                            </small>
                          </div>

                        </div>
                      </td>

                      {/* SITE */}

                      <td
                        className={`h-[54px] px-5 border-b border-[#f0f2f1] ${attenue}`}
                      >
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1f2937]">
                          <MapPin className="h-3.5 w-3.5 text-[#5b6472] shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {aff.nomSite}
                          </span>
                        </span>
                      </td>

                      {/* SERVICE */}

                      <td
                        className={`h-[54px] px-5 border-b border-[#f0f2f1] ${attenue}`}
                      >
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1f2937]">
                          <Building2 className="h-3.5 w-3.5 text-[#5b6472] shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {aff.nomService}
                          </span>
                        </span>
                      </td>

                      {/* PÉRIODE */}

                      <td
                        className={`h-[54px] px-5 border-b border-[#f0f2f1] ${attenue}`}
                      >
                        <div className="flex flex-col text-xs">

                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#1f2937]">
                            <Calendar className="h-3 w-3 text-[#5b6472]" />

                            {aff.dateFin
                              ? `${aff.dateDebut} → ${aff.dateFin}`
                              : `Depuis le ${aff.dateDebut}`}
                          </span>

                          {aff.estPrincipal && (
                            <span
                              className={`${PUCE} mt-0.5 bg-[#e7f6ed] text-[#14703c] w-fit`}
                            >
                              Principale
                            </span>
                          )}

                        </div>
                      </td>

                      {/* STATUT */}

                      <td className="h-[54px] px-5 border-b border-[#f0f2f1]">
                        <span
                          className={`${PUCE} ${
                            aff.actif
                              ? "bg-[#e7f6ed] text-[#14703c]"
                              : "bg-[#f0f2f1] text-[#5b6472]"
                          }`}
                        >
                          {aff.actif ? "Active" : "Clôturée"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      {!estModeLectureSeule && (
                        <td className="h-[54px] px-5 border-b border-[#f0f2f1]">
                          <button
                            type="button"
                            aria-label={`Actions pour ${nomAffiche(aff)}`}
                            aria-haspopup="menu"
                            onClick={(e) => ouvrirMenu(e, aff)}
                            className="h-9 w-9 grid place-items-center border border-[#e5e7eb] rounded-[10px] text-[#5b6472] bg-white hover:bg-[#fafbfa] cursor-pointer transition"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      )}

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}

      </section>

      {/* ==========================================================
          MENU ACTIONS
      ========================================================== */}

      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
          />

          <div
            role="menu"
            style={{
              top: menu.top,
              right: menu.right,
            }}
            className="fixed z-50 w-52 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAffectationEnEdition(menu.affectation);
                setTiroirOuvert(true);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#5b6472]" />
              Modifier
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAffectationASupprimer(menu.affectation);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#b42318] hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>

          </div>
        </>
      )}

      {/* ==========================================================
          TIROIR CRÉATION / ÉDITION
      ========================================================== */}

      <FormulaireAffectationTiroir
        ouvert={tiroirOuvert}
        affectationEnEdition={affectationEnEdition}
        optionsPersonnel={optionsPersonnel}
        optionsServices={optionsServices}
        optionsSites={optionsSites}
        affectationsExistantes={affectationsToutes}
        onFermer={() => {
          setTiroirOuvert(false);
          setAffectationEnEdition(null);
        }}
        onEnregistrer={handleEnregistrer}
      />

      {/* ==========================================================
          CONFIRMATION SUPPRESSION
      ========================================================== */}

      <ModaleConfirmationSuppression
        ouvert={affectationASupprimer !== null}
        onFermer={() => setAffectationASupprimer(null)}
        onConfirmer={handleConfirmerSuppression}
        enCours={suppressionEnCours}
        titre="Supprimer l'affectation"
        message="Voulez-vous vraiment retirer cette affectation de personnel ?"
        nomElement={
          affectationASupprimer
            ? `${nomAffiche(affectationASupprimer)} (${affectationASupprimer.nomService})`
            : undefined
        }
      />

    </div>
  );
};

// ------------------------------------------------------------------
// EXPORT PAR DÉFAUT
// ------------------------------------------------------------------

export default PanneauAffectations;
