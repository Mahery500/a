/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Printer,
  ClipboardEdit,
  UploadCloud,
  Loader2,
  Download,
  X,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useSession } from "@/cerveau/session";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { ouvrirPdf, chargerPdf } from "@/noyau/http/pdf";
import { formaterDate } from "@/noyau/utils/dates";
import {
  PatientFiche,
  CompleterFicheInput,
} from "../modele/patient.types";
import { usePatients } from "../hooks/usePatients";
import { DetailPatientModale } from "./DetailPatientModale";
import { FormulaireCompleterFicheModale } from "./FormulaireCompleterFicheModale";
import { FormulaireImportModale } from "./FormulaireImportModale";

/* =====================================================================
 *  Tokens du design (maquette « Répertoire des patients »)
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:cursor-not-allowed";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] disabled:opacity-50`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] border border-[#1f9d55] text-white hover:bg-[#14703c] disabled:bg-[#cbd5e1] disabled:border-[#cbd5e1]`;
const CHAMP =
  "h-10 border border-[#e5e7eb] rounded-[10px] px-3 text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#e7f6ed]";
const CHIP_ON =
  "border border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold rounded-full px-3.5 py-1.5 text-[13px] cursor-pointer transition-colors";
const CHIP_OFF =
  "border border-[#e5e7eb] bg-white text-[#5b6472] rounded-full px-3.5 py-1.5 text-[13px] cursor-pointer hover:bg-[#fafbfa] transition-colors";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

const PAGE_SIZE = 20;

type FiltreAffiliation = "tous" | "agents" | "ayantsDroit" | "simples";

interface MenuActions {
  patient: PatientFiche;
  top: number;
  right: number;
}

interface ApercuLot {
  url: string;
  nomFichier: string;
}

/* ---------- Helpers ---------- */
const initiales = (p: PatientFiche): string => {
  const n = (p.nom ?? "").trim();
  const pr = (p.prenom ?? "").trim();
  if (n && pr) return (n[0] + pr[0]).toUpperCase();
  if (n) return n.slice(0, 2).toUpperCase();
  if (pr) return pr.slice(0, 2).toUpperCase();
  return "??";
};

const ligneNaissance = (p: PatientFiche): string => {
  const parts: string[] = [];
  if (p.dateNaissance) {
    const prefixe = p.sexe === "F" ? "Née" : p.sexe === "M" ? "Né" : "Né(e)";
    parts.push(`${prefixe} le ${formaterDate(p.dateNaissance)}`);
  }
  if (p.sexe) {
    parts.push(p.sexe === "F" ? "Femme" : p.sexe === "M" ? "Homme" : p.sexe);
  }
  return parts.join(" · ") || "Date de naissance non renseignée";
};

const libelleAffiliation = (p: PatientFiche): string => {
  if (p.statut === "Agent") return "Salarié";
  if (p.statut) return `Ayant droit · ${p.statut}`;
  return "Patient libre";
};

const nomFichierSur = (texte: string): string =>
  texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "entreprise";

/* ===================================================================== */
export interface PanneauPatientsProps {
  mode?: ModeAffichage;
}

export const PanneauPatients: React.FC<PanneauPatientsProps> = ({ mode = "edition" }) => {
  if (mode === "masque") return null;

  const estModeLectureSeule = mode === "lecture";
  const notif = useNotifier();

  /* ---------- Rôle : seul l'admin voit l'import ---------- */
  const { utilisateur } = useSession();
  const estAdmin =
    utilisateur?.roles?.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN") ?? false;

  const {
    patients,
    patientsTous,
    entreprises,
    chargement,
    stats,
    recherche,
    setRecherche,
    filtreEntrepriseId,
    setFiltreEntrepriseId,
    filtreAffiliation,
    setFiltreAffiliation,
    completerFiche,
    importerExcel,
  } = usePatients();

  /* ---------- Modales ---------- */
  const [patientDetail, setPatientDetail] = useState<PatientFiche | null>(null);
  const [patientACompleter, setPatientACompleter] = useState<PatientFiche | null>(null);
  const [modalImportOuverte, setModalImportOuverte] = useState(false);

  /* ---------- Pagination + menu + impression ---------- */
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<MenuActions | null>(null);
  const [impressionEnCours, setImpressionEnCours] = useState<string | null>(null);
  const [apercu, setApercu] = useState<ApercuLot | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* ---------- Retour à la page 1 sur changement de filtre ---------- */
  useEffect(() => {
    setPage(1);
  }, [recherche, filtreEntrepriseId, filtreAffiliation]);

  /* ---------- Fermeture menu au clic extérieur ---------- */
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

  /* ---------- Aperçu : fermeture avec Échap + libération de l'URL ---------- */
  useEffect(() => {
    if (!apercu) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setApercu(null);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      URL.revokeObjectURL(apercu.url);
    };
  }, [apercu]);

  /* ---------- Statistiques "sans contact" ---------- */
  const patientsSansContact = useMemo(
    () => patients.filter((p) => !p.telephone).length,
    [patients],
  );

  /* ---------- Pagination ---------- */
  const pages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  const pageActuelle = Math.min(page, pages);
  const debut = (pageActuelle - 1) * PAGE_SIZE;
  const pagePatients = patients.slice(debut, debut + PAGE_SIZE);

  /* ---------- Lot d'impression : toutes les cartes de l'entreprise choisie ---------- */
  const entrepriseChoisie = filtreEntrepriseId !== "tous";
  const nomEntrepriseLot = entrepriseChoisie
    ? (entreprises.find((e) => e.id === filtreEntrepriseId)?.nom ?? "Entreprise")
    : null;
  const lotPret = entrepriseChoisie && !chargement;
  const lotIndisponible = !lotPret || impressionEnCours !== null;
  const cheminLot = entrepriseChoisie
    ? `/patients/cartes-adherents/all?idEntreprise=${filtreEntrepriseId}`
    : "";
  const nomFichierLot = `cartes_adherent_${nomFichierSur(nomEntrepriseLot ?? "lot")}.pdf`;

  /* ---------- Handlers ---------- */
  const handleCompleter = async (id: string, saisie: CompleterFicheInput): Promise<boolean> => {
    return completerFiche(id, saisie);
  };

  const handleImporter = async (fichier: File, idEntreprise: number): Promise<boolean> => {
    // Garde-fou : un non-admin ne déclenche jamais l'import
    if (!estAdmin) return false;
    return importerExcel(fichier, idEntreprise);
  };

  const ouvrirMenu = (e: React.MouseEvent<HTMLButtonElement>, patient: PatientFiche) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({
      patient,
      top: Math.min(r.bottom + 4, window.innerHeight - 200),
      right: window.innerWidth - r.right,
    });
  };

  const imprimerUne = async (patient: PatientFiche) => {
    if (impressionEnCours) return;
    setImpressionEnCours(`patient-${patient.id}`);
    try {
      await ouvrirPdf(
        `/patients/${patient.id}/carte-adherent`,
        `carte_adherent_${patient.id}.pdf`,
      );
    } catch (err) {
      notif.erreur(
        messageErreur(err, `Impossible de générer la carte de ${patient.nom} ${patient.prenom}.`),
      );
    } finally {
      setImpressionEnCours(null);
    }
  };

  /** Un seul PDF pour toutes les cartes de l'entreprise. */
  const imprimerLot = async () => {
    if (lotIndisponible) return;
    setImpressionEnCours("lot");
    try {
      await ouvrirPdf(cheminLot, nomFichierLot);
      notif.succes("Cartes de l'entreprise générées.");
    } catch (err) {
      notif.erreur(messageErreur(err, "Impossible de générer les cartes."));
    } finally {
      setImpressionEnCours(null);
    }
  };

  /** Aperçu du lot dans une fenêtre, avant impression. */
  const apercuLot = async () => {
    if (lotIndisponible) return;
    setImpressionEnCours("apercu");
    try {
      const blob = await chargerPdf(cheminLot);
      setApercu({
        url: URL.createObjectURL(blob),
        nomFichier: nomFichierLot,
      });
    } catch (err) {
      notif.erreur(messageErreur(err, "Impossible de générer l'aperçu."));
    } finally {
      setImpressionEnCours(null);
    }
  };

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">Répertoire des patients</h1>
          <p className="text-[13px] text-[#5b6472] mt-1">
            Salariés conventionnés et ayants droit. Recherche tolérante aux fautes et aux accents.
          </p>
        </div>

        {!estModeLectureSeule && (
          <div className="flex flex-wrap gap-2.5">
            {/* Visible uniquement pour l'admin */}
            {estAdmin && (
              <button
                type="button"
                onClick={() => setModalImportOuverte(true)}
                disabled={entreprises.length === 0}
                className={BTN_SECONDAIRE}
                title={
                  entreprises.length === 0 ? "Créez d'abord une entreprise partenaire" : undefined
                }
              >
                <UploadCloud className="w-4 h-4" />
                Importer un fichier Excel
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===================== Statistiques ===================== */}
      <section
        aria-label="Statistiques"
        className={`${CARTE} flex flex-wrap items-center gap-x-0 gap-y-2 px-5 py-3.5`}
      >
        <div className="flex-1 min-w-[100px] pr-5">
          <small className="block text-[12px] text-[#5b6472]">Patients</small>
          <b className="text-[22px] font-bold text-[#1f2937]">{stats.total}</b>
        </div>
        <div className="flex-1 min-w-[100px] px-5 border-l border-[#f0f2f1]">
          <small className="block text-[12px] text-[#5b6472]">Salariés</small>
          <b className="text-[22px] font-bold text-[#1f2937]">{stats.agents}</b>
        </div>
        <div className="flex-1 min-w-[100px] px-5 border-l border-[#f0f2f1]">
          <small className="block text-[12px] text-[#5b6472]">Ayants droit</small>
          <b className="text-[22px] font-bold text-[#1f2937]">{stats.ayantsDroit}</b>
        </div>
        <div className="flex-1 min-w-[100px] px-5 border-l border-[#f0f2f1]">
          <small className="block text-[12px] text-[#5b6472]">Patients libres</small>
          <b className="text-[22px] font-bold text-[#1f2937]">{stats.simples}</b>
        </div>

        {patientsSansContact > 0 && (
          <span className="ml-2 inline-block text-[12px] font-bold bg-[#fff4e0] text-[#8a5300] rounded-full px-3 py-1 whitespace-nowrap">
            {patientsSansContact === patients.length
              ? "Aucun contact renseigné sur cette page"
              : `${patientsSansContact} contact${patientsSansContact > 1 ? "s" : ""} à renseigner`}
          </span>
        )}
      </section>

      {/* ===================== Carte tableau ===================== */}
      <section className={`${CARTE} overflow-hidden`}>
        {/* Barre de filtres */}
        <div className="px-5 py-3.5 flex flex-wrap gap-2.5 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6472] pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, prénom ou matricule"
              aria-label="Rechercher un patient"
              className={`${CHAMP} w-full pl-9`}
            />
          </div>

          <select
            value={filtreEntrepriseId === "tous" ? "" : filtreEntrepriseId}
            onChange={(e) => {
              const val = e.target.value;
              setFiltreEntrepriseId(val === "" ? "tous" : Number(val));
            }}
            aria-label="Entreprise"
            className={CHAMP}
          >
            <option value="">Toutes les entreprises</option>
            {entreprises.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.nom}
              </option>
            ))}
          </select>

          <select
            value={filtreAffiliation}
            onChange={(e) => setFiltreAffiliation(e.target.value as FiltreAffiliation)}
            aria-label="Régime"
            className={CHAMP}
          >
            <option value="tous">Tous les régimes</option>
            <option value="agents">Salariés</option>
            <option value="ayantsDroit">Ayants droit</option>
            <option value="simples">Patients libres</option>
          </select>
        </div>

        {/* Chips de filtre rapide + impression du lot de l'entreprise */}
        <div className="px-5 pb-3.5 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={() => setFiltreAffiliation("tous")}
            aria-pressed={filtreAffiliation === "tous"}
            className={`${filtreAffiliation === "tous" ? CHIP_ON : CHIP_OFF} ${FOCUS}`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setFiltreAffiliation("agents")}
            aria-pressed={filtreAffiliation === "agents"}
            className={`${filtreAffiliation === "agents" ? CHIP_ON : CHIP_OFF} ${FOCUS}`}
          >
            Salariés
          </button>
          <button
            type="button"
            onClick={() => setFiltreAffiliation("ayantsDroit")}
            aria-pressed={filtreAffiliation === "ayantsDroit"}
            className={`${filtreAffiliation === "ayantsDroit" ? CHIP_ON : CHIP_OFF} ${FOCUS}`}
          >
            Ayants droit
          </button>

          <span className="flex-1" />

          <span className="text-xs text-[#5b6472]">
            {entrepriseChoisie
              ? `Toutes les cartes · ${nomEntrepriseLot}`
              : "Choisissez une entreprise pour imprimer son lot"}
          </span>

          <button
            type="button"
            onClick={apercuLot}
            disabled={lotIndisponible || estModeLectureSeule}
            title={
              !entrepriseChoisie
                ? "Choisissez d'abord une entreprise"
                : "Aperçu des cartes de l'entreprise"
            }
            className={`${BTN_SECONDAIRE} ${FOCUS}`}
          >
            {impressionEnCours === "apercu" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Aperçu
          </button>

          <button
            type="button"
            onClick={imprimerLot}
            disabled={lotIndisponible || estModeLectureSeule}
            title={
              !entrepriseChoisie
                ? "Choisissez d'abord une entreprise"
                : "Imprimer toutes les cartes de l'entreprise dans un seul PDF"
            }
            className={`${BTN_PRIMAIRE} ${FOCUS}`}
          >
            {impressionEnCours === "lot" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Imprimer les cartes
          </button>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm border-collapse">
            <thead>
              <tr className="bg-[#fafbfa] border-y border-[#e5e7eb]">
                {["Patient", "Matricule", "Affiliation", "Contact"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]"
                  >
                    {h}
                  </th>
                ))}
                <th className="w-[56px] px-4 py-2.5" aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {chargement ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#5b6472] text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1f9d55]" />
                    Chargement des dossiers patients...
                  </td>
                </tr>
              ) : pagePatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#5b6472] text-[13px]">
                    {patientsTous.length === 0
                      ? "Aucun patient enregistré sur le serveur."
                      : "Aucun patient ne correspond aux critères de recherche."}
                  </td>
                </tr>
              ) : (
                pagePatients.map((p) => {
                  const aff = libelleAffiliation(p);
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                    >
                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-[#f0f2f1] text-[#5b6472] text-[12px] font-bold flex items-center justify-center shrink-0">
                            {initiales(p)}
                          </span>
                          <div className="min-w-0">
                            <b className="block text-[14px] text-[#1f2937] truncate">
                              {p.nom} {p.prenom}
                            </b>
                            <span className="text-[12px] text-[#5b6472] truncate block">
                              {ligneNaissance(p)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Matricule */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px]">
                          {p.matricule || `#${p.id}`}
                        </span>
                      </td>

                      {/* Affiliation */}
                      <td className="px-4 py-3">
                        <span className="inline-block text-[12px] font-bold bg-[#f0f2f1] text-[#1f2937] rounded-full px-2.5 py-0.5">
                          {aff}
                        </span>
                        {p.nomEntreprise && (
                          <div className="text-[12px] text-[#5b6472] mt-0.5 truncate">
                            {p.nomEntreprise}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.telephone ? (
                          <span className="text-[13px] text-[#1f2937]">{p.telephone}</span>
                        ) : (
                          <span className="inline-block text-[12px] font-bold bg-[#fff4e0] text-[#8a5300] rounded-full px-2.5 py-0.5">
                            À renseigner
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-3 text-right">
                        {!estModeLectureSeule && (
                          <button
                            type="button"
                            onClick={(e) => ouvrirMenu(e, p)}
                            aria-label={`Actions pour ${p.nom} ${p.prenom}`}
                            aria-haspopup="menu"
                            className={`w-10 h-10 grid place-items-center rounded-[10px] text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer transition-colors ${FOCUS}`}
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!chargement && patients.length > 0 && (
          <div className="border-t border-[#f0f2f1] px-5 py-3 flex justify-between items-center flex-wrap gap-2">
            <span className="text-xs text-[#5b6472] tabular-nums">
              {debut + 1} à {Math.min(debut + PAGE_SIZE, patients.length)} sur {patients.length}{" "}
              patient{patients.length > 1 ? "s" : ""}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageActuelle <= 1}
                className={BTN_SECONDAIRE}
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={pageActuelle >= pages}
                className={BTN_SECONDAIRE}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </section>

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
                setPatientDetail(menu.patient);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#5b6472]" />
              Voir le dossier
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const p = menu.patient;
                setMenu(null);
                void imprimerUne(p);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#5b6472]" />
              Imprimer la carte
            </button>

            {!estModeLectureSeule && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setPatientACompleter(menu.patient);
                  setMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
              >
                <ClipboardEdit className="w-3.5 h-3.5 text-[#5b6472]" />
                Compléter la fiche
              </button>
            )}
          </div>
        </>
      )}

      {/* ===================== Aperçu du lot ===================== */}
      {apercu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1b3d]/45 p-4"
          onClick={() => setApercu(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apercu-lot-titre"
            onClick={(e) => e.stopPropagation()}
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[14px] bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#e5e7eb] px-5 py-4">
              <div>
                <h2 id="apercu-lot-titre" className="text-base font-bold text-[#1f2937]">
                  Aperçu des cartes · {nomEntrepriseLot}
                </h2>
                <p className="mt-0.5 text-xs text-[#5b6472]">
                  Recto puis verso, 2 cartes par page
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApercu(null)}
                aria-label="Fermer l'aperçu"
                className={`w-10 h-10 grid place-items-center rounded-[10px] text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer ${FOCUS}`}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <iframe
              ref={iframeRef}
              src={apercu.url}
              title="Aperçu des cartes d'adhérent"
              className="min-h-0 flex-1 bg-[#f6f8f7]"
            />

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
              <button type="button" onClick={() => setApercu(null)} className={BTN_SECONDAIRE}>
                Fermer
              </button>
              <a href={apercu.url} download={apercu.nomFichier} className={BTN_SECONDAIRE}>
                <Download className="w-4 h-4" aria-hidden="true" />
                Télécharger
              </a>
              <button
                type="button"
                onClick={() => iframeRef.current?.contentWindow?.print()}
                className={BTN_PRIMAIRE}
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Modales ===================== */}
      <DetailPatientModale
        ouvert={patientDetail !== null}
        patient={patientDetail}
        onFermer={() => setPatientDetail(null)}
        onOuvrirCompleter={
          !estModeLectureSeule && patientDetail
            ? () => setPatientACompleter(patientDetail)
            : undefined
        }
      />

      <FormulaireCompleterFicheModale
        ouvert={patientACompleter !== null}
        patient={patientACompleter}
        onFermer={() => setPatientACompleter(null)}
        onCompleter={handleCompleter}
      />

      {/* Modale d'import : montée uniquement pour l'admin */}
      {estAdmin && (
        <FormulaireImportModale
          ouvert={modalImportOuverte}
          entreprises={entreprises}
          onFermer={() => setModalImportOuverte(false)}
          onImporter={handleImporter}
        />
      )}
    </div>
  );
};

export default PanneauPatients;