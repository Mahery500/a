/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FolderHeart,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions/types";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import {
  estActesEnSuspens,
  estConflitActesDemandes,
  extraireCodesActes,
} from "@/noyau/http/erreursCloture";
import { useConsultationActive } from "../hooks/useConsultationActive";
import { useOrdonnances } from "@/briques/ordonnances/hooks/useOrdonnances";
import { SelecteurActe } from "@/briques/actes-realisation";
import { PanneauAllergies, useAllergiesActives } from "@/briques/allergies";

import { EnTetePatientConsultation } from "./EnTetePatientConsultation";
import { OngletConsultation } from "./TabsConsultation";
import { BarreActionConsultation } from "./BarreActionConsultation";
import { OngletDiagnostic } from "./OngletDiagnostic";
import { OngletDemandes } from "./OngletDemandes";
import { OngletOrdonnance } from "./OngletOrdonnance";
import { OngletActesExternes } from "./OngletActesExternes";
import { ResumeConsultation } from "./ResumeConsultation";
import { NavigationSections } from "./NavigationSections";
import { OngletConstats } from "./OngletConstats";

export interface PanneauConsultationActiveProps {
  mode?: ModeAffichage;
  encounterId?: number | null;
  patientId?: number | null;
  patientNom?: string;
  ticketNumero?: string;
  medecinNom?: string;
  onClotureSucces?: () => void;
  onConsultationTerminee?: () => void;
  /** @deprecated — les allergies sont chargées automatiquement. */
  allergies?: string[];
  dureeMinutes?: number;
  onVoirDossiers?: () => void;
}

/* ------------------------------------------------------------------ *
 *  Ordre des sections — source de vérité LOCALE
 * ------------------------------------------------------------------ */
const ORDRE_SECTIONS: OngletConsultation[] = [
  "diag",
  "constat",
  "allergies",
  "actes",
  "ext",
  "dem",
  "ord",
];

const SECTION_INFO: Record<
  OngletConsultation,
  { titre: string; sousTitre: string }
> = {
  diag: {
    titre: "Diagnostic",
    sousTitre: "Section 1 sur 7 · à renseigner avant la clôture",
  },
  constat: {
    titre: "Constats",
    sousTitre: "Section 2 sur 7 · observations cliniques",
  },
  allergies: {
    titre: "Allergies",
    sousTitre: "Section 3 sur 7 · vérification avant prescription",
  },
  actes: {
    titre: "Actes et résultats",
    sousTitre: "Section 4 sur 7 · actes réalisés en consultation",
  },
  ext: {
    titre: "Actes externes",
    sousTitre: "Section 5 sur 7 · actes réalisés hors établissement",
  },
  dem: {
    titre: "Demandes aux soignants",
    sousTitre: "Section 6 sur 7 · prescriptions à exécuter",
  },
  ord: {
    titre: "Ordonnance",
    sousTitre: "Section 7 sur 7 · médicaments prescrits",
  },
};

export const PanneauConsultationActive: React.FC<
  PanneauConsultationActiveProps
> = ({
  mode = "edition",
  encounterId,
  patientId,
  patientNom,
  ticketNumero,
  medecinNom,
  onClotureSucces,
  onConsultationTerminee,
  dureeMinutes = 0,
  onVoirDossiers,
}) => {
  const estModifiable = mode === "edition";

  const [ongletActif, setOngletActif] = useState<OngletConsultation>("diag");
  const [navReplie, setNavReplie] = useState(false);
  const [resumeReplie, setResumeReplie] = useState(false);
  const [clotureEnCours, setClotureEnCours] = useState(false);
  const { notifierSucces, notifierErreur } = useNotifier();

  const {
    allergies: allergiesActives,
    libelles: allergiesLibelles,
    critiques: allergiesCritiques,
  } = useAllergiesActives(patientId);

  const {
    diagnostics,
    catalogueDiagnostics,
    actesPrescrits,
    demandesActes,
    catalogueActes,
    poserDiagnostic,
    creerDemandeActe,
    cloturerConsultation,
    rafraichir,
    enregistrerActeExterneComplet,
    recupererObservationsAttendues,
    listerPiecesJointes,
    ajouterPieceJointe,
    changerStatutPieceJointe,
    telechargerPieceJointe,
    constatsCount,
  } = useConsultationActive(encounterId, patientId);

  const {
    medicaments,
    ordonnances,
    chargement: chargementMedicaments,
    erreurMedicaments,
    enCours: ordonnanceEnCours,
    creer: creerOrdonnance,
    annuler: annulerOrdonnance,
  } = useOrdonnances(encounterId);

  const clotureCallback = onClotureSucces ?? onConsultationTerminee;

  /* ---------- Séparation actes internes / externes ---------- */
  const idsActesExternes = useMemo(() => {
    const ids = new Set<number>();
    catalogueActes.forEach((a) => {
      if (a.categorie?.code?.toUpperCase() === "ACTE_EXTERNE") {
        ids.add(a.id);
      }
    });
    return ids;
  }, [catalogueActes]);

  const actesInternes = useMemo(
    () => actesPrescrits.filter((a) => !idsActesExternes.has(a.acteDefinitionId)),
    [actesPrescrits, idsActesExternes],
  );

  const actesExternes = useMemo(
    () => actesPrescrits.filter((a) => idsActesExternes.has(a.acteDefinitionId)),
    [actesPrescrits, idsActesExternes],
  );

  const filtreCategorieActesInternes = useMemo<string[] | undefined>(() => {
    if (idsActesExternes.size === 0) return undefined;
    const codes = new Set<string>();
    catalogueActes.forEach((a) => {
      const code = a.categorie?.code?.toUpperCase();
      if (code && code !== "ACTE_EXTERNE") codes.add(code);
    });
    return Array.from(codes);
  }, [catalogueActes, idsActesExternes]);

  const actesEnSuspensCount = useMemo(
    () =>
      actesPrescrits.filter(
        (a) => a.statut === "planifie" || a.statut === "en_cours",
      ).length,
    [actesPrescrits],
  );

  /* ---------- Raccourci clavier Alt + ↑ / ↓ ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const idx = ORDRE_SECTIONS.indexOf(ongletActif);
      if (idx < 0) return;
      e.preventDefault();
      if (e.key === "ArrowUp" && idx > 0) {
        setOngletActif(ORDRE_SECTIONS[idx - 1]);
      } else if (
        e.key === "ArrowDown" &&
        idx < ORDRE_SECTIONS.length - 1
      ) {
        setOngletActif(ORDRE_SECTIONS[idx + 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ongletActif]);

  /* ---------- Clôture ---------- */
  const handleCloturer = async () => {
    if (!estModifiable || !encounterId) return;

    const actesEnSuspens = actesPrescrits.filter(
      (a) => a.statut === "planifie" || a.statut === "en_cours",
    );

    if (actesEnSuspens.length > 0) {
      notifierErreur(
        `Actes en suspens : ${actesEnSuspens
          .map((a) => a.code)
          .filter(Boolean)
          .join(", ")}. Terminez-les avant de clôturer.`,
      );
      return;
    }

    setClotureEnCours(true);
    try {
      try {
        await cloturerConsultation(false);
      } catch (err: unknown) {
        if (estConflitActesDemandes(err)) {
          const codes = extraireCodesActes(err.message);
          const liste = codes.length > 0 ? `\n• ${codes.join("\n• ")}` : "";
          if (
            !window.confirm(
              `Il reste des actes demandés non réalisés :${liste}\n\nForcer la clôture ?`,
            )
          ) {
            return;
          }
          await cloturerConsultation(true);
        } else if (estActesEnSuspens(err)) {
          notifierErreur(err.message);
          return;
        } else {
          throw err;
        }
      }

      notifierSucces("Consultation clôturée.");
      clotureCallback?.();
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setClotureEnCours(false);
    }
  };

  /* ---------- Garde-fous ---------- */
  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Accès refusé à la consultation médicale.
      </div>
    );
  }

  if (!encounterId) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
        <Stethoscope className="h-10 w-10 text-slate-300 mx-auto" />
        <h4 className="text-sm font-bold text-slate-700">
          Aucune consultation active
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Appelez un patient depuis la file d&apos;attente pour démarrer une
          consultation.
        </p>
      </div>
    );
  }

  /* ---------- Compteurs par section ---------- */
  const counts: Record<OngletConsultation, number> = {
    diag: diagnostics.length,
    constat: constatsCount,
    allergies: allergiesActives.length,
    actes: actesInternes.length,
    ext: actesExternes.length,
    dem: demandesActes.length,
    ord: ordonnances.length,
  };

  const idxActif = ORDRE_SECTIONS.indexOf(ongletActif);
  const precedentId = idxActif > 0 ? ORDRE_SECTIONS[idxActif - 1] : null;
  const suivantId =
    idxActif >= 0 && idxActif < ORDRE_SECTIONS.length - 1
      ? ORDRE_SECTIONS[idxActif + 1]
      : null;

  const infoSection = SECTION_INFO[ongletActif];

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <div className="flex flex-col gap-3.5 h-full min-h-0">
      {/* ===================== Bandeau patient ===================== */}
      <div className="shrink-0">
        <EnTetePatientConsultation
          patientNom={patientNom}
          ticketNumero={ticketNumero}
          encounterId={encounterId}
          allergies={allergiesLibelles}
          allergiesCritiques={allergiesCritiques.map(
            (a) =>
              a.allergieDefinitionLibelle ??
              a.principeActifLibelle ??
              `Allergie #${a.id}`,
          )}
          dureeMinutes={dureeMinutes}
          onVoirDossiers={onVoirDossiers}
          onVoirAllergies={() => setOngletActif("allergies")}
        />
      </div>

      {/* ===================== Bandeau allergies critiques ===================== */}
      {allergiesCritiques.length > 0 && (
        <div
          role="alert"
          className="shrink-0 bg-rose-50 border border-rose-300 rounded-[14px] px-4 py-3 flex items-start gap-2.5"
        >
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-[13px] text-rose-800 leading-relaxed">
            <b>Allergies à criticité élevée :</b>{" "}
            {allergiesCritiques
              .map(
                (a) =>
                  a.allergieDefinitionLibelle ??
                  a.principeActifLibelle ??
                  `Allergie #${a.id}`,
              )
              .join(" · ")}
            .{" "}
            <span className="italic">
              Vérifiez avant toute prescription.
            </span>
          </div>
        </div>
      )}

      {/* ===================== Grille 3 colonnes =====================
       *  Desktop : lg:flex-1 lg:min-h-0 → remplit l'espace entre bandeaux
       *  et footer ; chaque colonne gère son propre scroll.
       *  Mobile  : hauteur naturelle, la page entière défile.
       * ============================================================ */}
      <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:flex-1 lg:min-h-0">
        {/* ----- Colonne 1 : Navigation (244 px / 64 px en rail) ----- */}
        <div
          className={`w-full lg:shrink-0 lg:min-h-0 lg:overflow-hidden transition-[width] duration-300 ease-in-out ${
            navReplie ? "lg:w-[64px]" : "lg:w-[244px]"
          }`}
        >
          <NavigationSections
            actif={ongletActif}
            onChange={setOngletActif}
            counts={counts}
            replie={navReplie}
            onToggleReplie={() => setNavReplie((v) => !v)}
          />
        </div>

        {/* ----- Colonne 2 : Contenu actif (flexible) ----- */}
        <section className="flex-1 min-w-0 bg-white border border-[#e5e7eb] rounded-[14px] flex flex-col overflow-hidden lg:min-h-0">
          {/* En-tête de section */}
          <div className="h-16 px-5 flex flex-col justify-center border-b border-[#f0f2f1] shrink-0">
            <div className="font-bold text-[18px] text-[#1f2937] leading-tight">
              {infoSection.titre}
            </div>
            <div className="text-[12px] text-[#5b6472] mt-0.5">
              {infoSection.sousTitre}
            </div>
          </div>

          {/* Contenu de la section (scroll interne) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {ongletActif === "diag" && (
              <OngletDiagnostic
                catalogue={catalogueDiagnostics}
                estModifiable={estModifiable}
                onPoser={async (input) => {
                  await poserDiagnostic(input);
                  await rafraichir();
                }}
              />
            )}

            {ongletActif === "constat" && (
              <OngletConstats mode={mode} encounterId={encounterId} />
            )}

            {ongletActif === "allergies" && (
              <div className="p-5">
                <PanneauAllergies
                  mode={mode}
                  patientId={patientId ?? null}
                  patientNom={patientNom}
                />
              </div>
            )}

            {ongletActif === "actes" && (
              <div className="p-5">
                <SelecteurActe
                  mode={mode}
                  encounterId={encounterId}
                  patientId={patientId}
                  filtreCategorieCodes={filtreCategorieActesInternes}
                  onEnregistre={() => {
                    notifierSucces("Acte enregistré.");
                    void rafraichir();
                  }}
                  afficherPanneauActes={false}
                />
              </div>
            )}

            {ongletActif === "ext" && (
              <OngletActesExternes
                catalogueActes={catalogueActes}
                actesPrescrits={actesPrescrits}
                estModifiable={estModifiable}
                onEnregistrer={(input) =>
                  enregistrerActeExterneComplet({ ...input, encounterId })
                }
                recupererMoule={recupererObservationsAttendues}
                listerPiecesJointes={listerPiecesJointes}
                ajouterPieceJointe={ajouterPieceJointe}
                changerStatutPieceJointe={changerStatutPieceJointe}
                telechargerPieceJointe={telechargerPieceJointe}
              />
            )}

            {ongletActif === "dem" && (
              <OngletDemandes
                catalogueActes={catalogueActes}
                demandesActes={demandesActes}
                estModifiable={estModifiable}
                onCreerDemande={async (input) => {
                  await creerDemandeActe(input);
                  await rafraichir();
                }}
              />
            )}

            {ongletActif === "ord" && (
              <OngletOrdonnance
                encounterId={encounterId}
                patientNom={patientNom}
                ticketNumero={ticketNumero}
                medecinNom={medecinNom}
                estModifiable={estModifiable}
                medicaments={medicaments}
                ordonnances={ordonnances}
                chargementMedicaments={chargementMedicaments}
                erreurMedicaments={erreurMedicaments}
                ordonnanceEnCours={ordonnanceEnCours}
                onCreerOrdonnance={creerOrdonnance}
                onAnnulerOrdonnance={annulerOrdonnance}
              />
            )}
          </div>

          {/* Pied navigation sections */}
          <div className="h-14 px-5 border-t border-[#f0f2f1] bg-white flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => precedentId && setOngletActif(precedentId)}
              disabled={!precedentId}
              className="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold inline-flex items-center gap-1.5 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              {precedentId ? SECTION_INFO[precedentId].titre : "Précédent"}
            </button>
            <button
              type="button"
              onClick={() => suivantId && setOngletActif(suivantId)}
              disabled={!suivantId}
              className="h-9 px-3.5 rounded-[10px] text-[13px] font-semibold inline-flex items-center gap-1.5 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {suivantId ? SECTION_INFO[suivantId].titre : "Suivant"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* ----- Colonne 3 : Dossier patient (340 px / 52 px en rail) ----- */}
        {resumeReplie ? (
          <>
            {/* Desktop : rail 52 px */}
            <div className="hidden lg:flex lg:w-[52px] lg:shrink-0 lg:min-h-0">
              <div className="w-full bg-white border border-[#e5e7eb] rounded-[14px] h-full flex flex-col items-center pt-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setResumeReplie(false)}
                  aria-label="Déplier le dossier patient"
                  title="Déplier le dossier patient"
                  className="w-11 h-11 grid place-items-center rounded-[10px] text-[#14703c] hover:bg-[#fafbfa] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <FolderHeart
                  className="w-[22px] h-[22px] text-[#14703c]"
                  aria-hidden="true"
                />
                <span
                  className="inline-block bg-[#f0f2f1] text-[#5b6472] rounded-full px-1.5 py-2.5 text-[12px] font-bold mt-1 select-none"
                  style={{ writingMode: "vertical-rl" }}
                >
                  Dossier patient
                </span>
              </div>
            </div>

            {/* Mobile : toujours déployé (pas de bouton de repli) */}
            <div className="lg:hidden w-full min-h-0">
              <ResumeConsultation
                diagnostics={diagnostics}
                actes={actesPrescrits}
                demandes={demandesActes}
                ordonnances={ordonnances}
                allergiesActives={allergiesActives}
                onOuvrirOnglet={setOngletActif}
                onOuvrirDossier={onVoirDossiers}
                patientId={patientId}
                encounterId={encounterId}
              />
            </div>
          </>
        ) : (
          <div className="w-full lg:w-[340px] lg:shrink-0 lg:min-h-0">
            <ResumeConsultation
              diagnostics={diagnostics}
              actes={actesPrescrits}
              demandes={demandesActes}
              ordonnances={ordonnances}
              allergiesActives={allergiesActives}
              onOuvrirOnglet={setOngletActif}
              onOuvrirDossier={onVoirDossiers}
              patientId={patientId}
              encounterId={encounterId}
              onReplier={() => setResumeReplie(true)}
            />
          </div>
        )}
      </div>

      {/* ===================== Barre d'actions pleine largeur =====================
       *  shrink-0 : hauteur fixe, ne participe pas au partage d'espace.
       *  Plus de sticky : c'est le flex-column qui garantit qu'elle reste
       *  en bas, au-dessus du viewport.
       *  ========================================================================== */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mb-4 lg:-mb-8 shrink-0">
        <BarreActionConsultation
          diagnostics={counts.diag}
          actes={counts.actes + counts.ext}
          demandes={counts.dem}
          ordonnances={counts.ord}
          estModifiable={estModifiable}
          enCours={clotureEnCours}
          onCloturer={handleCloturer}
          actesEnSuspens={actesEnSuspensCount}
          onOuvrirOnglet={setOngletActif}
          collant={false}
        />
      </div>
    </div>
  );
};

export default PanneauConsultationActive;