
 // src/briques/entreprises/ui/PanneauEntreprises.tsx

import React, { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  MapPin,
  MoreHorizontal,
  Edit2,
  Trash2,
  Printer,
  FileDown,
  UploadCloud,
  Loader2,
  ChevronDown,
} from "lucide-react";

import { ModeAffichage } from "@/cerveau/permissions/types";
import { ModaleConfirmationSuppression } from "@/noyau/ui/ModaleConfirmationSuppression";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { ouvrirPdf } from "@/noyau/http/pdf";

import type {
  EntreprisePartenaire,
  NouvelleEntrepriseInput,
  ModificationEntrepriseInput,
  Smie,
} from "../modele/entreprise.types";

import { useEntreprises, type FiltreSmie } from "../hooks/useEntreprises";
import { entreprisesApi } from "../api/entreprises.api";
import { FormulaireEntrepriseTiroir } from "./FormulaireEntrepriseTiroir";
import { FicheEntrepriseTiroir } from "./FicheEntrepriseTiroir";
import { FormulaireImportModale, patientsApi } from "@/briques/patients";

/* =============== Tokens graphiques =============== */

const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";

const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const BTN_SECONDAIRE =
  `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;

const BTN_PRIMAIRE =
  `${BTN_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;

const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";

const CHIP =
  "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

/* =============== Helpers =============== */

const chipSmie = (smie?: Smie | null): string =>
  smie === "asina"
    ? "bg-[#e7f6ed] text-[#14703c]"
    : smie === "serenite"
      ? "bg-[#eef2ff] text-[#3730a3]"
      : "bg-[#f0f2f1] text-[#5b6472]";

type MenuOuvert =
  | {
      kind: "cartes";
      entreprise: EntreprisePartenaire;
      top: number;
      right: number;
    }
  | {
      kind: "actions";
      entreprise: EntreprisePartenaire;
      top: number;
      right: number;
    };

/* =============== Panneau =============== */

export interface PanneauEntreprisesProps {
  mode?: ModeAffichage;
}

export const PanneauEntreprises: React.FC<PanneauEntreprisesProps> = ({
  mode = "edition",
}) => {
  const notif = useNotifier();
  const estModeLectureSeule = mode === "lecture";

  const {
    entreprises,
    entreprisesToutes,
    totalEntreprises,
    stats,
    chargement,
    erreur,
    recherche,
    setRecherche,
    filtreSmie,
    setFiltreSmie,
    recharger,
    creerEntreprise,
    modifierEntreprise,
    supprimerEntreprise,
  } = useEntreprises();

  /* =============== États des tiroirs et modales =============== */

  const [tiroirFormulaireOuvert, setTiroirFormulaireOuvert] =
    useState(false);

  const [entrepriseEnEdition, setEntrepriseEnEdition] =
    useState<EntreprisePartenaire | null>(null);

  const [ficheEntreprise, setFicheEntreprise] =
    useState<EntreprisePartenaire | null>(null);

  const [entrepriseASupprimer, setEntrepriseASupprimer] =
    useState<EntreprisePartenaire | null>(null);

  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  const [telechargementId, setTelechargementId] = useState<number | null>(
    null,
  );

  const [modalImportOuverte, setModalImportOuverte] = useState(false);

  const [entreprisePourImport, setEntreprisePourImport] =
    useState<EntreprisePartenaire | null>(null);

  const [impressionEntrepriseId, setImpressionEntrepriseId] =
    useState<number | null>(null);

  const [menu, setMenu] = useState<MenuOuvert | null>(null);

  /* =============== Fermeture des menus =============== */

  useEffect(() => {
    if (!menu) return;

    const fermer = () => setMenu(null);

    const echapper = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(null);
      }
    };

    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", echapper);

    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", echapper);
    };
  }, [menu]);

  if (mode === "masque") return null;

  /* =============== Ouverture des interfaces =============== */

  const ouvrirCreation = () => {
    setMenu(null);
    setFicheEntreprise(null);
    setEntrepriseEnEdition(null);
    setTiroirFormulaireOuvert(true);
  };

  const ouvrirEdition = (entreprise: EntreprisePartenaire) => {
    setMenu(null);
    setFicheEntreprise(null);
    setEntrepriseEnEdition(entreprise);
    setTiroirFormulaireOuvert(true);
  };

  const ouvrirImport = (entreprise: EntreprisePartenaire) => {
    setMenu(null);
    setFicheEntreprise(null);
    setEntreprisePourImport(entreprise);
    setModalImportOuverte(true);
  };

  const fermerFormulaire = () => {
    setTiroirFormulaireOuvert(false);
    setEntrepriseEnEdition(null);
  };

  const fermerFiche = () => {
    setFicheEntreprise(null);
  };

  /* =============== Enregistrement entreprise =============== */

  const handleEnregistrer = async (
    saisie: NouvelleEntrepriseInput | ModificationEntrepriseInput,
    id?: number,
  ): Promise<EntreprisePartenaire | null> => {
    try {
      if (id !== undefined) {
        const resultat = await modifierEntreprise(id, saisie);

        // Le hook peut renvoyer null/false en cas d'échec.
        if (!resultat) return null;

        await recharger();

        return resultat as EntreprisePartenaire;
      }

      const resultat = await creerEntreprise(
        saisie as NouvelleEntrepriseInput,
      );

      if (!resultat) return null;

      await recharger();

      return resultat as EntreprisePartenaire;
    } catch (err) {
      notif.erreur(
        messageErreur(err, "Impossible d'enregistrer l'entreprise."),
      );

      return null;
    }
  };

  /* =============== Impression des cartes =============== */

  const imprimerCartes = async (entreprise: EntreprisePartenaire) => {
    if (impressionEntrepriseId !== null) return;

    setImpressionEntrepriseId(entreprise.id);

    try {
      await ouvrirPdf(
        `/patients/cartes-adherents/all?idEntreprise=${entreprise.id}`,
        `cartes_adherents_entreprise_${entreprise.id}.pdf`,
      );
    } catch (err) {
      notif.erreur(
        messageErreur(
          err,
          `Impossible de générer les cartes de ${entreprise.nom}.`,
        ),
      );
    } finally {
      setImpressionEntrepriseId(null);
    }
  };

  const handleTelechargerCartes = async (
    entreprise: EntreprisePartenaire,
  ) => {
    setTelechargementId(entreprise.id);

    try {
      await entreprisesApi.telechargerCartesAdherentsPdf(
        entreprise.id,
        entreprise.nom,
      );

      notif.succes(
        `Carnet de cartes d'adhérents généré pour « ${entreprise.nom} ».`,
      );
    } catch (err) {
      notif.erreur(
        messageErreur(
          err,
          "Impossible de générer les cartes d'adhérents.",
        ),
      );
    } finally {
      setTelechargementId(null);
    }
  };

  /* =============== Import des salariés =============== */

  const handleImporterExcel = async (
    fichier: File,
    idEntreprise: number,
  ): Promise<boolean> => {
    try {
      const resultat = await patientsApi.importerExcel(
        fichier,
        idEntreprise,
      );

      notif.succes(resultat.message);

      await recharger();

      return true;
    } catch (err) {
      notif.erreur(
        messageErreur(err, "Échec de l'importation des salariés."),
      );

      return false;
    }
  };

  /* =============== Suppression =============== */

  const confirmerSuppression = async () => {
    if (!entrepriseASupprimer) return;

    setSuppressionEnCours(true);

    try {
      const supprime = await supprimerEntreprise(
        entrepriseASupprimer.id,
        entrepriseASupprimer.nom,
      );

      if (supprime) {
        setEntrepriseASupprimer(null);
        setFicheEntreprise(null);
      }
    } finally {
      setSuppressionEnCours(false);
    }
  };

  /* =============== Données des filtres =============== */

  const optionsEntreprises = entreprisesToutes.map((entreprise) => ({
    id: entreprise.id,
    nom: entreprise.nom,
  }));

  const pilulesSmie: {
    cle: FiltreSmie;
    label: string;
    n: number;
  }[] = [
    { cle: "toutes", label: "Toutes", n: stats.total },
    { cle: "asina", label: "ASINA", n: stats.asina },
    { cle: "serenite", label: "La Sérénité", n: stats.serenite },
  ];

  /* =============== Rendu =============== */

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* En-tête */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            Entreprises adhérentes
          </h1>

          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Affiliations, matricules et cartes d'adhérents des entreprises
            partenaires.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recharger}
            disabled={chargement}
            className={`${BTN_SECONDAIRE} !px-2.5`}
            title="Rafraîchir"
            aria-label="Rafraîchir la liste"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                chargement ? "animate-spin text-[#1f9d55]" : ""
              }`}
            />
          </button>

          {!estModeLectureSeule && (
            <button
              type="button"
              onClick={ouvrirCreation}
              className={BTN_PRIMAIRE}
            >
              <Plus className="h-[18px] w-[18px]" />
              Nouvelle entreprise
            </button>
          )}
        </div>
      </div>

      {/* Statistiques */}

      <div
        className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 min-h-14 py-3`}
      >
        <span className="text-[13px]">
          <b className="text-[15px]">{stats.total}</b>{" "}
          entreprise{stats.total > 1 ? "s" : ""}
        </span>

        <span className="text-[13px]">
          <b className="text-[15px]">{stats.salaries}</b>{" "}
          salarié{stats.salaries > 1 ? "s" : ""}
        </span>

        <span className="text-[13px]">
          <b className="text-[15px]">{stats.asina}</b> SMIE ASINA
        </span>

        <span className="text-[13px]">
          <b className="text-[15px]">{stats.serenite}</b> La Sérénité
        </span>
      </div>

      {/* Recherche et filtres */}

      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none" />

          <input
            type="search"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Filtrer par nom, raison sociale ou sigle…"
            aria-label="Rechercher une entreprise"
            className={`${CHAMP} w-full pl-9`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pilulesSmie.map((pilule) => {
            const actif = filtreSmie === pilule.cle;

            return (
              <button
                key={pilule.cle}
                type="button"
                onClick={() => setFiltreSmie(pilule.cle)}
                aria-pressed={actif}
                className={`px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer transition ${FOCUS} ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
                }`}
              >
                {pilule.label} · {pilule.n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Erreur de chargement */}

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

      {/* Tableau des entreprises */}

      <div className={`${CARTE} overflow-hidden`}>
        {chargement ? (
          <div className="p-12 text-center text-[#5b6472]">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55] mx-auto mb-2" />

            <span className="text-xs">
              Chargement des entreprises…
            </span>
          </div>
        ) : entreprises.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px]">
            {entreprisesToutes.length === 0
              ? "Aucune entreprise partenaire enregistrée."
              : "Aucune entreprise ne correspond aux filtres appliqués."}
          </div>
        ) : (
          <>
            {/* En-tête du tableau */}

            <div className="bg-[#fafbfa] flex items-center h-10 px-4 gap-3 border-b border-[#e5e7eb] min-w-[900px]">
              <span className="w-[40px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                ID
              </span>

              <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Entreprise
              </span>

              <span className="w-[190px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                SMIE et racine
              </span>

              <span className="w-[170px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Adresse
              </span>

              <span className="w-[110px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Salariés
              </span>

              <span className="w-[110px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                Cartes
              </span>

              <span className="w-[36px]" />
            </div>

            {/* Lignes cliquables */}

            {entreprises.map((entreprise) => {
              const sansAgents =
                !entreprise.nombreAgents || entreprise.nombreAgents <= 0;

              return (
                <div
                  key={entreprise.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Afficher la fiche de ${entreprise.nom}`}
                  onClick={() => setFicheEntreprise(entreprise)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      setFicheEntreprise(entreprise);
                    }
                  }}
                  className="h-[64px] flex items-center px-4 gap-3 border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors cursor-pointer min-w-[900px] focus-visible:outline-2 focus-visible:outline-[#1f9d55]"
                >
                  {/* Identifiant */}

                  <span className="w-[40px] shrink-0 font-mono text-xs text-[#5b6472]">
                    {entreprise.id}
                  </span>

                  {/* Nom et raison sociale */}

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1f2937] truncate">
                      {entreprise.nom}
                    </div>

                    {entreprise.raisonSociale &&
                      entreprise.raisonSociale !== entreprise.nom && (
                        <div className="text-[12px] text-[#5b6472] truncate">
                          {entreprise.raisonSociale}
                        </div>
                      )}
                  </div>

                  {/* SMIE et matricule */}

                  <div className="w-[190px] shrink-0 flex items-center gap-1.5 overflow-hidden">
                    <span
                      className={`${CHIP} ${chipSmie(entreprise.smie)}`}
                    >
                      {entreprise.smie === "serenite"
                        ? "Sérénité"
                        : entreprise.smie === "asina"
                          ? "ASINA"
                          : "—"}
                    </span>

                    {entreprise.matriculeAsina && (
                      <span className="inline-block bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-xs font-bold whitespace-nowrap">
                        {entreprise.matriculeAsina}
                      </span>
                    )}
                  </div>

                  {/* Adresse */}

                  <div className="w-[170px] shrink-0 flex items-center gap-1.5 text-[13px] text-[#1f2937] min-w-0">
                    <MapPin className="h-4 w-4 text-[#5b6472] shrink-0" />

                    <span
                      className="truncate"
                      title={entreprise.adresse}
                    >
                      {entreprise.adresse || "—"}
                    </span>
                  </div>

                  {/* Salariés */}

                  <div className="w-[110px] shrink-0 text-[13px]">
                    {entreprise.nombreAgents != null ? (
                      <b className="text-[#1f2937]">
                        {entreprise.nombreAgents} salarié
                        {entreprise.nombreAgents > 1 ? "s" : ""}
                      </b>
                    ) : (
                      <span className="text-[#5b6472] italic">—</span>
                    )}
                  </div>

                  {/* Menu des cartes */}

                  <div
                    className="w-[110px] shrink-0"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={sansAgents}
                      onClick={(event) => {
                        event.stopPropagation();

                        const rect =
                          event.currentTarget.getBoundingClientRect();

                        setMenu({
                          kind: "cartes",
                          entreprise,
                          top: rect.bottom + 4,
                          right: window.innerWidth - rect.right,
                        });
                      }}
                      title={
                        sansAgents
                          ? "Aucun salarié à imprimer"
                          : "Actions cartes"
                      }
                      aria-haspopup="menu"
                      className={`h-9 px-3 rounded-[10px] text-[12px] font-semibold inline-flex items-center gap-1.5 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS}`}
                    >
                      Cartes
                      <ChevronDown className="h-3.5 w-3.5 text-[#5b6472]" />
                    </button>
                  </div>

                  {/* Menu des actions rapides */}

                  <div
                    className="w-[36px] shrink-0 text-center"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {!estModeLectureSeule && (
                      <button
                        type="button"
                        aria-label={`Actions pour ${entreprise.nom}`}
                        aria-haspopup="menu"
                        onClick={(event) => {
                          event.stopPropagation();

                          const rect =
                            event.currentTarget.getBoundingClientRect();

                          setMenu({
                            kind: "actions",
                            entreprise,
                            top: rect.bottom + 4,
                            right: window.innerWidth - rect.right,
                          });
                        }}
                        className={`h-8 w-8 grid place-items-center rounded-md text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer transition ${FOCUS}`}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pied du tableau */}

            <div className="px-4 py-2.5 border-t border-[#f0f2f1] bg-[#fafbfa] text-[11px] text-[#5b6472]">
              <strong className="font-bold text-[#1f2937]">
                {entreprises.length}
              </strong>{" "}
              entreprise{entreprises.length > 1 ? "s" : ""} affichée
              {entreprises.length > 1 ? "s" : ""} sur {totalEntreprises}
            </div>
          </>
        )}
      </div>

      {/* Menus déroulants */}

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
            {menu.kind === "cartes" ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={impressionEntrepriseId !== null}
                  onClick={() => {
                    void imprimerCartes(menu.entreprise);
                    setMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
                >
                  {impressionEntrepriseId === menu.entreprise.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#5b6472]" />
                  ) : (
                    <Printer className="h-3.5 w-3.5 text-[#5b6472]" />
                  )}

                  Imprimer les cartes
                </button>

                <button
                  type="button"
                  role="menuitem"
                  disabled={telechargementId !== null}
                  onClick={() => {
                    void handleTelechargerCartes(menu.entreprise);
                    setMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
                >
                  {telechargementId === menu.entreprise.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#5b6472]" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 text-[#5b6472]" />
                  )}

                  Télécharger le PDF
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => ouvrirEdition(menu.entreprise)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5 text-[#5b6472]" />
                  Modifier
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => ouvrirImport(menu.entreprise)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-[#5b6472]" />
                  Importer des salariés (Excel)
                </button>

                <div className="my-1 border-t border-[#f0f2f1]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setEntrepriseASupprimer(menu.entreprise);
                    setMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#b42318] hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Tiroir de création et de modification */}

      <FormulaireEntrepriseTiroir
        ouvert={tiroirFormulaireOuvert}
        entrepriseEnEdition={entrepriseEnEdition}
        onFermer={fermerFormulaire}
        onEnregistrer={handleEnregistrer}
      />

      {/* Fiche détaillée de l'entreprise */}

      <FicheEntrepriseTiroir
        ouvert={ficheEntreprise !== null}
        entreprise={ficheEntreprise}
        mode={mode}
        onFermer={fermerFiche}
        onModifier={() => {
          if (ficheEntreprise) {
            ouvrirEdition(ficheEntreprise);
          }
        }}
        onImporter={() => {
          if (ficheEntreprise) {
            ouvrirImport(ficheEntreprise);
          }
        }}
        onImprimer={async () => {
          if (ficheEntreprise) {
            await imprimerCartes(ficheEntreprise);
          }
        }}
        onTelechargerPdf={async () => {
          if (ficheEntreprise) {
            await handleTelechargerCartes(ficheEntreprise);
          }
        }}
        onSupprimer={() => {
          if (ficheEntreprise) {
            setEntrepriseASupprimer(ficheEntreprise);
            setFicheEntreprise(null);
          }
        }}
        enCours={suppressionEnCours}
      />

      {/* Import Excel des salariés */}

      <FormulaireImportModale
        ouvert={modalImportOuverte}
        entreprises={
          entreprisePourImport
            ? [
                {
                  id: entreprisePourImport.id,
                  nom: entreprisePourImport.nom,
                },
              ]
            : optionsEntreprises
        }
        onFermer={() => {
          setModalImportOuverte(false);
          setEntreprisePourImport(null);
        }}
        onImporter={handleImporterExcel}
      />

      {/* Confirmation de suppression */}

      <ModaleConfirmationSuppression
        ouvert={entrepriseASupprimer !== null}
        onFermer={() => setEntrepriseASupprimer(null)}
        onConfirmer={confirmerSuppression}
        enCours={suppressionEnCours}
        titre="Supprimer l'entreprise partenaire"
        message="Voulez-vous vraiment supprimer cette entreprise de la convention ? Les salariés et dossiers rattachés peuvent être impactés."
        nomElement={entrepriseASupprimer?.nom}
      />
    </div>
  );
};

export default PanneauEntreprises;
