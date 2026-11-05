/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  UserCheck,
  RefreshCw,
  AlertTriangle,
  HeartPulse,
  ShieldAlert,
  Volume2,
  FolderHeart,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useConsultationFile } from "../hooks/useConsultationFile";
import type {
  PatientFileMedecin,
  ConsultationEnCours,
  RendezVousDuJourMedecin,
} from "../modele/consultation-file.types";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import {
  jouerCarillonFile,
  annoncerVocalementTicket,
  diffuserAnnonceTicket,
} from "@/noyau/utils/carillon";
import { ModaleSelectionTypeEncounter } from "@/briques/type-encounters";

/**
 * Sous-ensemble de `ConsultationEnCours` suffisant pour l'affichage de la
 * bannière et la navigation. Permet au parent de passer un objet partiel
 * (state local) sans devoir injecter des champs techniques inutiles ici.
 */
export interface ConsultationEnCoursResume {
  patientId?: number | null;
  encounterId?: number | null;
  numTicket?: string | null;
  patientNom?: string | null;
  dureeMinutes?: number | null;
}

/* =====================================================================
 *  Tokens du design (maquettes Fm1 / Fm2)
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] border border-[#1f9d55] text-white hover:bg-[#14703c]`;
const CHIP = "inline-block rounded-full text-xs font-bold px-2.5 py-0.5 whitespace-nowrap";
const CHIP_GRIS = `${CHIP} bg-[#f0f2f1] text-[#5b6472]`;
const CHIP_AMB = `${CHIP} bg-[#fff4e0] text-[#8a5300]`;
const CHIP_ROUGE = `${CHIP} bg-[#fdeceb] text-[#b42318]`;
const CHIP_VERT = `${CHIP} bg-[#e7f6ed] text-[#14703c]`;
const CHIP_INDIGO = `${CHIP} bg-[#eef2ff] text-[#3730a3]`;
const CODE_CHIP =
  "font-mono text-xs font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] inline-block";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

const SEUIL_ATTENTE_LONGUE_MIN = 120; // 2h
const ONGLETS = ["file", "rdv"] as const;
type Onglet = (typeof ONGLETS)[number];

const FILTRES_RDV = [
  { cle: "tous", label: "Tous" },
  { cle: "attendus", label: "Attendus" },
  { cle: "arrives", label: "Arrivés" },
  { cle: "termines", label: "Terminés" },
] as const;
type FiltreRdv = (typeof FILTRES_RDV)[number]["cle"];

/* ---------- Helpers ---------- */
function formaterAttente(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

function formatRelatif(date: Date | null): string {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 5) return "à l'instant";
  if (diff < 60) return `il y a ${diff} s`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  return `il y a ${h} h`;
}

function dateAujourdhui(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ---------- Sous-composants ---------- */

const StatsBar: React.FC<{
  enAttente: number;
  enConsultation: number;
  rdvDuJour: number;
  arrives: number;
  appelsExpires: number;
}> = ({ enAttente, enConsultation, rdvDuJour, arrives, appelsExpires }) => (
  <div
    className={`${CARTE} h-14 flex items-center px-5 gap-7 overflow-x-auto scrollbar-none`}
  >
    <span className="text-sm text-[#1f2937] whitespace-nowrap">
      <b className="text-base">{enAttente}</b> en attente
    </span>
    <span className="text-sm text-[#1f2937] whitespace-nowrap">
      <b className="text-base">{enConsultation}</b> en consultation
    </span>
    <span className="text-sm text-[#1f2937] whitespace-nowrap">
      <b className="text-base">{rdvDuJour}</b> RDV du jour
    </span>
    <span className="text-sm text-[#1f2937] whitespace-nowrap">
      <b className="text-base">{arrives}</b> arrivé{arrives > 1 ? "s" : ""}
    </span>
    {appelsExpires > 0 && (
      <span className={`${CHIP_AMB} ml-auto !px-3.5 !py-1.5 !text-[13px]`}>
        {appelsExpires} appel{appelsExpires > 1 ? "s" : ""} expiré
        {appelsExpires > 1 ? "s" : ""} à traiter
      </span>
    )}
  </div>
);

const BanniereEnCours: React.FC<{
  enCours: ConsultationEnCoursResume;
  onOuvrir: () => void;
  onVoirDossier: () => void;
}> = ({ enCours, onOuvrir, onVoirDossier }) => (
  <div className="bg-[#e7f6ed] border border-[#1f9d55] rounded-[14px] px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-3.5 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#1f9d55] text-white shrink-0">
        Consultation en cours
      </span>
      {enCours.numTicket && (
        <span className="font-mono font-bold text-sm bg-white text-[#14703c] border border-[#1f9d55]/30 rounded-md px-2.5 py-1 shrink-0">
          {enCours.numTicket}
        </span>
      )}
      <div className="min-w-0">
        <div className="font-bold text-[18px] text-[#14703c] leading-tight truncate">
          {enCours.patientNom || `Patient #${enCours.patientId}`}
        </div>
        <div className="text-xs text-[#14703c]/90">
          Dossier #{enCours.encounterId} · démarrée il y a {enCours.dureeMinutes || 0} min
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button type="button" onClick={onOuvrir} className={BTN_PRIMAIRE}>
        <Stethoscope className="w-4 h-4" />
        Ouvrir la consultation
      </button>
      <button type="button" onClick={onVoirDossier} className={BTN_SECONDAIRE}>
        <FolderHeart className="w-4 h-4" />
        Dossier patient
      </button>
    </div>
  </div>
);

const LigneFileAttente: React.FC<{
  patient: PatientFileMedecin;
  appelEnCours: boolean;
  onRappeler: () => void;
  onAppeler: () => void;
  onPrendreEnCharge: () => void;
}> = ({ patient: p, appelEnCours, onRappeler, onAppeler, onPrendreEnCharge }) => {
  const attenteLongue = p.attenteMinutes >= SEUIL_ATTENTE_LONGUE_MIN;

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-t border-[#f0f2f1] min-h-[72px]">
      <span className="font-bold text-[#1f2937] w-7 shrink-0">#{p.position}</span>
      <span className={CODE_CHIP}>{p.numTicket}</span>

      <div className="flex-1 min-w-[180px]">
        <div className="font-bold text-sm text-[#1f2937] truncate">{p.patientNom}</div>
        {p.matricule && (
          <div className="text-xs text-[#5b6472] font-mono truncate">
            Matricule : {p.matricule}
          </div>
        )}
      </div>

      <span className={CHIP_GRIS}>{p.type === "RDV" ? "RDV" : "Sans RDV"}</span>

      <div className="w-52 shrink-0">
        {attenteLongue ? (
          <>
            <div className="font-bold text-[13px] text-[#8a5300]">
              {formaterAttente(p.attenteMinutes)} d'attente
            </div>
            <div className="text-xs text-[#5b6472]">Attente anormalement longue</div>
          </>
        ) : (
          <div className="text-[13px] text-[#1f2937]">
            {formaterAttente(p.attenteMinutes)}
          </div>
        )}
      </div>

      <div className="w-[200px] flex gap-1.5 shrink-0">
        {p.appele && <span className={CHIP_AMB}>Appelé</span>}
        {p.appele && p.appelExpire && <span className={CHIP_ROUGE}>Appel expiré</span>}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {p.appele ? (
          <>
            <button
              type="button"
              disabled={appelEnCours}
              onClick={onRappeler}
              className={`${BTN_SECONDAIRE} !h-9 !px-3 !text-xs`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {appelEnCours ? "Appel…" : "Rappeler"}
            </button>
            <button
              type="button"
              disabled={appelEnCours}
              onClick={onPrendreEnCharge}
              className={`${BTN_PRIMAIRE} !h-9 !px-3 !text-xs`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Prendre en charge
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={appelEnCours}
            onClick={onAppeler}
            className={`${BTN_SECONDAIRE} !h-9 !px-3 !text-xs`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            {appelEnCours ? "Appel…" : "Appeler"}
          </button>
        )}
      </div>
    </div>
  );
};

const StatutRdvChip: React.FC<{ etat: RendezVousDuJourMedecin["etat"]; numTicket?: string | null }> = ({
  etat,
  numTicket,
}) => {
  if (etat === "TERMINE") return <span className={CHIP_VERT}>Terminé</span>;
  if (etat === "ARRIVE")
    return (
      <span className={CHIP_INDIGO}>
        Arrivé{numTicket ? ` · ticket ${numTicket}` : ""}
      </span>
    );
  if (etat === "EN_COURS") return <span className={CHIP_INDIGO}>En cours</span>;
  return <span className={CHIP_GRIS}>Attendu</span>;
};

/* ---------- Props ---------- */
export interface PanneauConsultationFileProps {
  mode?: ModeAffichage;
  siteActifId?: number | null;
  consultationEnCours?: ConsultationEnCours | null;
  onPriseEnChargeSucces?: () => void;
  onPrendreEnChargeSucces?: (patientId: number, encounterId?: number) => void;
  onOuvrirConsultation?: () => void;
  onVoirDossier?: () => void;
}

export const PanneauConsultationFile: React.FC<PanneauConsultationFileProps> = ({
  mode = "edition",
  consultationEnCours,
  onPriseEnChargeSucces,
  onPrendreEnChargeSucces,
  onOuvrirConsultation,
  onVoirDossier,
}) => {
  const {
    fileAttente,
    patientEnCours,
    rendezVous,
    chargement,
    appelEnCours,
    erreur,
    derniereSync,
    prendreEnCharge,
    appeler,
    rafraichir,
  } = useConsultationFile();

  const { notifierSucces, notifierErreur, info: notifierInfo } = useNotifier();
  const estModifiable = mode === "edition";

  // Tick toutes les 5 s pour rafraîchir "il y a X s"
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const [ongletActif, setOngletActif] = useState<Onglet>("file");
  const [filtreRdv, setFiltreRdv] = useState<FiltreRdv>("tous");
  const [dateAffichee, setDateAffichee] = useState<string>(() => dateAujourdhui());

  const [aiguillageAConfirmer, setAiguillageAConfirmer] = useState<{
    id: number;
    numTicket: string;
    patientNom?: string;
  } | null>(null);

    /**
   * Consultation en cours affichée en bannière.
   *
   * Le parent (`AssemblageConsultation`) ne stocke que l'essentiel
   * (patientId, encounterId, numTicket, patientNom) : sa simple présence
   * PROUVE qu'une consultation est active. On complète donc les champs
   * manquants requis par le type `ConsultationEnCours` avant de le passer
   * aux sous-composants, sinon `enCours === undefined` empêche la bannière
   * de s'afficher (`enCoursEffectif?.enCours` est falsy).
   *
   * Priorité : le hook (source de vérité serveur) prime si disponible ;
   * le parent ne sert qu'au tout premier rendu / pendant la prise en charge.
   */
  const enCoursEffectif: ConsultationEnCours | null = consultationEnCours
    ? {
        enCours: true,
        aiguillageId: null,
        ticketId: null,
        debut: null,
        patientId: consultationEnCours.patientId ?? null,
        encounterId: consultationEnCours.encounterId ?? null,
        numTicket: consultationEnCours.numTicket ?? null,
        patientNom: consultationEnCours.patientNom ?? null,
        dureeMinutes: consultationEnCours.dureeMinutes ?? 0,
      }
    : patientEnCours;

  const rdvArrives = useMemo(
    () => rendezVous.filter((r) => r.etat === "ARRIVE" || r.etat === "EN_COURS").length,
    [rendezVous],
  );
  const nbAppelsExpires = useMemo(
    () => fileAttente.filter((p) => p.appele && p.appelExpire).length,
    [fileAttente],
  );

  const rdvFiltres = useMemo(() => {
    if (filtreRdv === "tous") return rendezVous;
    if (filtreRdv === "attendus")
      return rendezVous.filter(
        (r) => r.etat === "PAS_ENCORE_ARRIVE" || r.etat === "EN_ATTENTE",
      );
    if (filtreRdv === "arrives") return rendezVous.filter((r) => r.etat === "ARRIVE");
    return rendezVous.filter((r) => r.etat === "TERMINE");
  }, [rendezVous, filtreRdv]);

  const compteursFiltres: Record<FiltreRdv, number> = {
    tous: rendezVous.length,
    attendus: rendezVous.filter(
      (r) => r.etat === "PAS_ENCORE_ARRIVE" || r.etat === "EN_ATTENTE",
    ).length,
    arrives: rendezVous.filter((r) => r.etat === "ARRIVE").length,
    termines: rendezVous.filter((r) => r.etat === "TERMINE").length,
  };

  /** Étape 1 : appel + annonce vocale */
  const gererAppel = async (aiguillageId: number, numTicket: string, serviceLabel: string) => {
    if (!estModifiable) return;
    try {
      const res = await appeler(aiguillageId);
      jouerCarillonFile();
      annoncerVocalementTicket(res.numTicket, serviceLabel);
      diffuserAnnonceTicket({
        ticketId: res.ticketId,
        numTicket: res.numTicket,
        serviceLabel,
        at: Date.now(),
      });
      notifierSucces(`Patient appelé (${numTicket}).`);
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  /** Étape 2 : confirmation de prise en charge (via modale de sélection de type) */
  const confirmerPriseEnCharge = async (typeEncounterId: number): Promise<boolean> => {
    if (!aiguillageAConfirmer) return false;
    try {
      const res = await prendreEnCharge(aiguillageAConfirmer.id, typeEncounterId);
      notifierSucces(`Patient pris en charge (Ticket ${res.numTicket}).`);
      onPriseEnChargeSucces?.();
      onPrendreEnChargeSucces?.(res?.patientId ?? 0, res?.encounterId ?? undefined);
      return true;
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
      return false;
    }
  };

  /** Appel d'un RDV arrivé depuis l'onglet RDV */
  const gererAppelRdv = async (rdv: RendezVousDuJourMedecin) => {
    const cible = fileAttente.find((f) => f.patientId === rdv.patientId);
    if (!cible) {
      notifierInfo(
        `Le ticket de ${rdv.patientNom} n'est pas encore dans la file. ` +
          `Le patient doit être enregistré à l'accueil.`,
      );
      return;
    }
    await gererAppel(cible.aiguillageId, cible.numTicket, "Consultation médicale");
    setOngletActif("file");
  };

  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous ne disposez pas des autorisations requises pour consulter la file d'attente médicale.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* ===================== En-tête : titre + synchro + refresh ===================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#1f2937] leading-tight">
            File d'attente médecin
          </h1>
          <p className="text-[13px] text-[#5b6472]">Patients en attente et rendez-vous du jour.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#5b6472] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Synchronisation automatique · à jour {formatRelatif(derniereSync)}
          </span>
          <button
            type="button"
            onClick={rafraichir}
            disabled={chargement}
            className={`${BTN_SECONDAIRE} ${FOCUS}`}
          >
            <RefreshCw
              className={`w-4 h-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* ===================== Bannière consultation en cours ===================== */}
      {enCoursEffectif?.enCours && enCoursEffectif.patientId && enCoursEffectif.encounterId && (
        <BanniereEnCours
          enCours={enCoursEffectif}
          onOuvrir={onOuvrirConsultation ?? (() => {})}
          onVoirDossier={onVoirDossier ?? (() => {})}
        />
      )}

      {/* ===================== Barre de statistiques ===================== */}
      <StatsBar
        enAttente={fileAttente.length}
        enConsultation={enCoursEffectif?.enCours ? 1 : 0}
        rdvDuJour={rendezVous.length}
        arrives={rdvArrives}
        appelsExpires={nbAppelsExpires}
      />

      {/* ===================== Carte : onglets + contenu ===================== */}
      <div className={`${CARTE} overflow-hidden`}>
        {/* Tabs */}
        <div
          className="flex border-b border-[#e5e7eb] overflow-x-auto scrollbar-none"
          role="tablist"
        >
          {(
            [
              { id: "file" as const, label: "File d'attente", count: fileAttente.length },
              { id: "rdv" as const, label: "Rendez-vous du jour", count: rendezVous.length },
            ]
          ).map((t) => {
            const actif = ongletActif === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => setOngletActif(t.id)}
                className={`px-5 h-12 flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer transition-colors border-b-2 ${FOCUS} ${
                  actif
                    ? "text-[#14703c] font-bold border-[#1f9d55]"
                    : "text-[#5b6472] font-semibold border-transparent hover:text-[#1f2937]"
                }`}
              >
                {t.label}
                <span
                  className={`px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                    actif ? "bg-[#e7f6ed] text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== Onglet File d'attente ===== */}
        {ongletActif === "file" && (
          <>
            <div className="px-5 py-4">
              <div className="font-bold text-base text-[#1f2937]">
                Salle d'attente médicale ({fileAttente.length} patient
                {fileAttente.length > 1 ? "s" : ""})
              </div>
              <div className="text-xs text-[#5b6472] mt-0.5">
                Ordre de passage prioritaire · le plus ancien en premier.
              </div>
            </div>

            {chargement && fileAttente.length === 0 ? (
              <div className="p-12 text-center text-[#5b6472] text-sm border-t border-[#f0f2f1]">
                <RefreshCw className="w-5 h-5 animate-spin text-[#1f9d55] mx-auto mb-2" />
                Chargement de la file…
              </div>
            ) : fileAttente.length === 0 ? (
              <div className="p-12 text-center border-t border-[#f0f2f1]">
                <HeartPulse className="w-10 h-10 text-[#5b6472] mx-auto mb-2" strokeWidth={1.5} />
                <div className="text-sm font-bold text-[#1f2937]">Aucun patient en attente</div>
                <p className="text-xs text-[#5b6472] mt-1">
                  Tous les patients orientés vers ce service ont été pris en charge.
                </p>
              </div>
            ) : (
              fileAttente.map((p) => (
                <LigneFileAttente
                  key={p.aiguillageId}
                  patient={p}
                  appelEnCours={appelEnCours === p.aiguillageId}
                  onAppeler={() => gererAppel(p.aiguillageId, p.numTicket, "Consultation médicale")}
                  onRappeler={() =>
                    gererAppel(p.aiguillageId, p.numTicket, "Consultation médicale")
                  }
                  onPrendreEnCharge={() =>
                    setAiguillageAConfirmer({
                      id: p.aiguillageId,
                      numTicket: p.numTicket,
                      patientNom: p.patientNom,
                    })
                  }
                />
              ))
            )}
          </>
        )}

        {/* ===== Onglet Rendez-vous du jour ===== */}
        {ongletActif === "rdv" && (
          <>
            {/* Filtres + navigation date */}
            <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {FILTRES_RDV.map((f) => {
                  const actif = filtreRdv === f.cle;
                  return (
                    <button
                      key={f.cle}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => setFiltreRdv(f.cle)}
                      className={`px-3.5 py-1.5 rounded-full border text-[13px] cursor-pointer transition-colors ${FOCUS} ${
                        actif
                          ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                          : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
                      }`}
                    >
                      {f.label} · {compteursFiltres[f.cle]}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Jour précédent"
                  className={`${BTN_SECONDAIRE} !w-10 !px-0 !justify-center`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-bold text-sm text-[#1f2937] whitespace-nowrap capitalize">
                  {dateAffichee}
                </span>
                <button
                  type="button"
                  aria-label="Jour suivant"
                  className={`${BTN_SECONDAIRE} !w-10 !px-0 !justify-center`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tableau des RDV */}
            <div className="bg-[#fafbfa] border-y border-[#e5e7eb] flex items-center px-5 h-10 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
              <span className="w-[82px]">Heure</span>
              <span className="flex-1">Patient et motif</span>
              <span className="w-[222px]">Statut</span>
              <span className="w-[150px]" aria-hidden="true" />
            </div>

            {rdvFiltres.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#5b6472]">
                Aucun rendez-vous dans cette catégorie.
              </div>
            ) : (
              rdvFiltres.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-5 min-h-[64px] border-t border-[#f0f2f1]"
                >
                  <span className="font-mono text-[16px] font-bold text-[#1f2937] w-[70px] shrink-0">
                    {r.heure}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#1f2937] truncate">
                      {r.patientNom}
                    </div>
                    <div className="text-xs text-[#5b6472] truncate">{r.motif}</div>
                  </div>
                  <div className="w-[210px] shrink-0">
                    <StatutRdvChip etat={r.etat} numTicket={r.numTicket} />
                  </div>
                  <div className="w-[150px] text-right shrink-0">
                    {r.etat === "TERMINE" && (
                      <button
                        type="button"
                        onClick={() =>
                          onPrendreEnChargeSucces?.(r.patientId, r.encounterId ?? undefined)
                        }
                        className={`${BTN_SECONDAIRE} !h-9 !px-3 !text-xs`}
                      >
                        Voir
                      </button>
                    )}
                    {r.etat === "ARRIVE" && (
                      <button
                        type="button"
                        disabled={!estModifiable}
                        onClick={() => gererAppelRdv(r)}
                        className={`${BTN_PRIMAIRE} !h-9 !px-3 !text-xs`}
                      >
                        Appeler
                      </button>
                    )}
                    {(r.etat === "PAS_ENCORE_ARRIVE" ||
                      r.etat === "EN_ATTENTE" ||
                      r.etat === "EN_COURS") && (
                      <span
                        className="text-[20px] text-[#5b6472] select-none"
                        aria-hidden="true"
                      >
                        ⋯
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {erreur && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{erreur}</span>
        </div>
      )}

      {/* Modale de sélection du type d'encounter (prise en charge) */}
      <ModaleSelectionTypeEncounter
        ouvert={aiguillageAConfirmer !== null}
        titre={`Type de prise en charge${
          aiguillageAConfirmer ? ` — Ticket ${aiguillageAConfirmer.numTicket}` : ""
        }`}
        patientNom={aiguillageAConfirmer?.patientNom}
        numTicket={aiguillageAConfirmer?.numTicket}
        onFermer={() => setAiguillageAConfirmer(null)}
        onValider={confirmerPriseEnCharge}
      />
    </div>
  );
};

export default PanneauConsultationFile;