/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
  Volume2,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useInfirmerieFile } from "../hooks/useInfirmerieFile";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import {
  jouerCarillonFile,
  annoncerVocalementTicket,
  diffuserAnnonceTicket,
} from "@/noyau/utils/carillon";
import {
  estActesEnSuspens,
  estConflitActesDemandes,
  extraireCodesActes,
} from "@/noyau/http/erreursCloture";
import { EtatRendezVous, PatientEnCours } from "../modele/infirmerie-file.types";
import { TiroirPriseEnCharge, AiguillageCible } from "./TiroirPriseEnCharge";
import {
  TiroirClotureSoins,
  ResultatCloture,
} from "./TiroirClotureSoins";
import { ModaleReorientationService } from "@/briques/soins-actes/ui/ModaleReorientationService";
import { soinsActesApi } from "@/briques/soins-actes";

export interface PriseEnChargeInfo {
  patientId: number;
  encounterId: number;
  numTicket: string;
  patientNom?: string;
}

export interface PanneauInfirmerieFileProps {
  mode?: ModeAffichage;
  siteActifId?: number | null;
  siteNom?: string;
  allergies?: string[];
  patientEnCoursActif?: {
    patientId: number;
    encounterId: number;
    numTicket?: string;
    patientNom?: string;
  } | null;
  onPrendreEnChargeSucces?: (info: PriseEnChargeInfo) => void;
  onOuvrirSoinsPatient?: () => void;
  onTermineSucces?: () => void;
}

const ETAT_LABELS: Record<EtatRendezVous, { label: string; classe: string }> = {
  PAS_ENCORE_ARRIVE: {
    label: "Pas encore arrivé",
    classe: "bg-slate-100 text-slate-600 border-slate-200",
  },
  ARRIVE: { label: "Arrivé au centre", classe: "bg-sky-50 text-sky-700 border-sky-200" },
  EN_ATTENTE: { label: "En attente", classe: "bg-amber-50 text-amber-700 border-amber-200" },
  EN_COURS: { label: "En cours", classe: "bg-blue-50 text-blue-700 border-blue-200" },
  TERMINE: { label: "Terminé", classe: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function formatRelatif(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "à l'instant";
  if (diff < 60) return `il y a ${diff} s`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  return `il y a ${h} h`;
}

export const PanneauInfirmerieFile: React.FC<PanneauInfirmerieFileProps> = ({
  mode = "edition",
  siteActifId,
  siteNom,
  allergies,
  patientEnCoursActif,
  onPrendreEnChargeSucces,
  onOuvrirSoinsPatient,
  onTermineSucces,
}) => {
  const {
    fileAttente,
    patientEnCours,
    rendezVous,
    rdvArrives,
    actesAFaire,
    actesUrgents,
    chargement,
    erreur,
    actionEnCours,
    derniereSync,
    prendreEnCharge,
    rafraichir,
    appeler,
  } = useInfirmerieFile();

  const { notifierSucces, notifierErreur } = useNotifier();
  const estModifiable = mode === "edition";

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const [aiguillageAConfirmer, setAiguillageAConfirmer] = useState<AiguillageCible | null>(null);
  const [modaleReorientationOuverte, setModaleReorientationOuverte] = useState(false);
  const [tiroirClotureOuvert, setTiroirClotureOuvert] = useState(false);
  const [clotureEnCours, setClotureEnCours] = useState(false);
  const [erreurCloture, setErreurCloture] = useState<string | null>(null);

  const enCoursEffectif: PatientEnCours | null =
    patientEnCours ??
    (patientEnCoursActif
      ? {
          enCours: true,
          patientId: patientEnCoursActif.patientId,
          encounterId: patientEnCoursActif.encounterId,
          numTicket: patientEnCoursActif.numTicket ?? null,
          patientNom: patientEnCoursActif.patientNom ?? null,
          dureeMinutes: 0,
          aiguillageId: null,
          ticketId: null,
          debut: null,
        }
      : null);

  /* ---------- Stats pour le tiroir de clôture ---------- */
  const actesEnSuspensPourCePatient = useMemo(() => {
    if (!enCoursEffectif?.patientId) return 0;
    return actesAFaire.filter((a) => a.patientId === enCoursEffectif.patientId).length;
  }, [actesAFaire, enCoursEffectif?.patientId]);

  const ouvrirTiroir = (aiguillage: AiguillageCible) => {
    setAiguillageAConfirmer(aiguillage);
  };

  const confirmerPriseEnCharge = async (typeEncounterId: number): Promise<boolean> => {
    if (!aiguillageAConfirmer) return false;
    const { id, numTicket, patientNom } = aiguillageAConfirmer;
    try {
      const res = await prendreEnCharge(id, typeEncounterId);
      notifierSucces(`Patient pris en charge avec succès (Ticket ${res.numTicket}).`);

      const patientConcerne = fileAttente.find((f) => f.aiguillageId === id);
      const nomFinal =
        patientConcerne?.patientNom || patientNom || `Patient #${res.patientId}`;

      if (onPrendreEnChargeSucces) {
        onPrendreEnChargeSucces({
          patientId: res.patientId,
          encounterId: res.encounterId,
          numTicket: res.numTicket || numTicket,
          patientNom: nomFinal,
        });
      }
      return true;
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
      return false;
    }
  };

  const ouvrirSoinsPatientEnCours = () => {
    if (onOuvrirSoinsPatient) {
      onOuvrirSoinsPatient();
      return;
    }
    if (
      enCoursEffectif &&
      onPrendreEnChargeSucces &&
      enCoursEffectif.patientId &&
      enCoursEffectif.encounterId
    ) {
      onPrendreEnChargeSucces({
        patientId: enCoursEffectif.patientId,
        encounterId: enCoursEffectif.encounterId,
        numTicket: enCoursEffectif.numTicket || "",
        patientNom: enCoursEffectif.patientNom || undefined,
      });
    }
  };

  /** Réorientation « rapide » : redirige sans clôturer (encounter reste actif). */
  const handleOrienterRapide = async (serviceId: number): Promise<boolean> => {
    if (!enCoursEffectif?.encounterId) return false;
    try {
      await soinsActesApi.orienterPatient(enCoursEffectif.encounterId, serviceId);
      notifierSucces(
        "Patient réorienté. Il apparaîtra dans la file du service destinataire, " +
          "la prise en charge actuelle reste ouverte.",
      );
      setModaleReorientationOuverte(false);
      await rafraichir();
      return true;
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
      return false;
    }
  };

  /**
   * Clôture depuis le tiroir : orientation d'abord (si demandée), puis terminer.
   * La réorientation est appelée AVANT pour garantir que le patient figure dans
   * la file du service destinataire même si la clôture est retardée.
   */
  const handleClotureConfirmee = async (resultat: ResultatCloture): Promise<void> => {
    const encounterId = enCoursEffectif?.encounterId;
    if (!encounterId) return;

    setClotureEnCours(true);
    setErreurCloture(null);
    try {
      // 1) Réorientation (optionnelle) : crée le nouvel aiguillage
      if (resultat.orienterVersServiceId) {
        try {
          await soinsActesApi.orienterPatient(
            encounterId,
            resultat.orienterVersServiceId,
          );
        } catch (err) {
          setErreurCloture(extraireMessageErreur(err));
          return;
        }
      }

      // 2) Clôture de l'encounter
      try {
        await soinsActesApi.terminerEncounter(encounterId, false);
      } catch (err) {
        if (estConflitActesDemandes(err) || estActesEnSuspens(err)) {
          const codes =
            err instanceof Error ? extraireCodesActes(err.message) : [];
          const liste = codes.length > 0 ? `\n• ${codes.join("\n• ")}` : "";
          const ok = window.confirm(
            `Il reste des actes en suspens :${liste}\n\nForcer la clôture de la prise en charge ?`,
          );
          if (!ok) {
            return;
          }
          await soinsActesApi.terminerEncounter(encounterId, true);
        } else {
          throw err;
        }
      }

      notifierSucces(
        resultat.orienterVersServiceId
          ? "Patient réorienté et prise en charge clôturée."
          : "Prise en charge terminée.",
      );
      setTiroirClotureOuvert(false);
      await rafraichir();
      onTermineSucces?.();
    } catch (err) {
      const msg = extraireMessageErreur(err);
      setErreurCloture(msg);
      notifierErreur(msg);
    } finally {
      setClotureEnCours(false);
    }
  };

  const gererAppel = async (aiguillageId: number, numTicket: string) => {
    if (!estModifiable) return;
    try {
      const res = await appeler(aiguillageId);
      jouerCarillonFile();
      annoncerVocalementTicket(res.numTicket, "Infirmerie");
      diffuserAnnonceTicket({
        ticketId: res.ticketId,
        numTicket: res.numTicket,
        serviceLabel: "Infirmerie",
        at: Date.now(),
      });
      notifierSucces(`Patient appelé (${numTicket}).`);
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous ne disposez pas des autorisations nécessaires pour consulter la file d'attente des
        soins.
      </div>
    );
  }

  const enCours = enCoursEffectif?.enCours === true;
  const aDesAllergies = allergies !== undefined && allergies.length > 0;

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">File de soins</h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Infirmerie{siteNom ? ` (${siteNom})` : " (service)"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <span className="text-[12px] text-[#5b6472] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            Synchronisation automatique
            {derniereSync && ` · à jour ${formatRelatif(derniereSync)}`}
          </span>
          <button
            type="button"
            onClick={rafraichir}
            disabled={chargement}
            className="h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`} />
            Rafraîchir
          </button>
        </div>
      </div>

      {erreur && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
          {erreur}
        </div>
      )}

      {/* Bannière patient en cours */}
      {enCours && enCoursEffectif && (
        <div className="bg-[#e7f6ed] border border-[#1f9d55] rounded-[14px] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#1f9d55] text-white shrink-0">
              Patient en cours
            </span>
            {enCoursEffectif.numTicket && (
              <span className="font-mono font-bold text-[18px] leading-none bg-white border border-[#1f9d55] rounded-md px-3 py-1.5 text-[#14703c] shrink-0">
                {enCoursEffectif.numTicket}
              </span>
            )}
            <div className="min-w-0">
              <div className="font-bold text-[18px] leading-tight text-[#14703c] truncate">
                {enCoursEffectif.patientNom || `Patient #${enCoursEffectif.patientId}`}
              </div>
              <div className="text-[12px] text-[#14703c]">
                Dossier #{enCoursEffectif.encounterId} · pris en charge depuis{" "}
                {enCoursEffectif.dureeMinutes || 0} min
              </div>
            </div>

            {allergies !== undefined && (
              <span
                className={`shrink-0 text-[12px] font-semibold px-3 py-2 rounded-[10px] ${
                  aDesAllergies
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-[#fff4e0] text-[#8a5300]"
                }`}
              >
                {aDesAllergies
                  ? `⚠ Allergies : ${allergies!.join(", ")}`
                  : "⚠ Allergies non renseignées"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={ouvrirSoinsPatientEnCours}
              className="h-10 px-4 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              Actes et soins
            </button>

            {/* Réorientation rapide : redirige sans clôturer */}
            <button
              type="button"
              onClick={() => setModaleReorientationOuverte(true)}
              disabled={!enCoursEffectif.encounterId}
              title="Rediriger le patient sans clôturer la prise en charge en cours"
              className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#fafbfa] transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Réorienter
            </button>

            {/* Clôture avec réorientation optionnelle dans le tiroir */}
            <button
              type="button"
              onClick={() => {
                setErreurCloture(null);
                setTiroirClotureOuvert(true);
              }}
              disabled={!enCoursEffectif.encounterId}
              className="h-10 px-4 rounded-[10px] border-transparent bg-transparent text-[#b42318] text-sm font-semibold inline-flex items-center gap-2 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Terminer les soins
            </button>
          </div>
        </div>
      )}

      {/* Barre de stats */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] min-h-[56px] flex flex-wrap items-center gap-x-7 gap-y-2 px-5 py-2">
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{fileAttente.length}</b> en attente
        </span>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{enCours ? 1 : 0}</b> en cours
        </span>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">
            {rdvArrives} / {rendezVous.length}
          </b>{" "}
          RDV du jour arrivés
        </span>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{actesAFaire.length}</b> actes à faire
        </span>
        <span className="text-[12px] text-[#5b6472] ml-auto">
          {actesUrgents.length} urgent{actesUrgents.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* 2 colonnes */}
      <div className="flex flex-col lg:flex-row gap-3.5">
        <section className="flex-1 lg:flex-[1.7] bg-white border border-[#e5e7eb] rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0f2f1]">
            <h3 className="text-base font-bold text-[#1f2937]">
              Patients en attente de soins · {fileAttente.length}
            </h3>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Ordre de passage prioritaire selon l'heure d'aiguillage.
            </p>
          </div>

          {chargement && fileAttente.length === 0 ? (
            <p className="text-xs text-[#5b6472] py-8 text-center">Chargement de la file…</p>
          ) : fileAttente.length === 0 ? (
            <div className="text-center py-12 text-[#5b6472] text-sm">
              <b className="block text-[#1f2937] mb-1">Aucun patient en attente</b>
              Aucun patient n'attend actuellement dans ce service.
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f2f1]">
              {fileAttente.map((f) => {
                const appelant = actionEnCours === f.aiguillageId;
                const texteAppel = f.appele
                  ? f.dateAppel
                    ? `Appelé ${formatRelatif(f.dateAppel)} · en attente de prise en charge`
                    : "Appelé · en attente de prise en charge"
                  : `Attente : ${f.attenteMinutes} min`;

                return (
                  <li
                    key={f.aiguillageId}
                    className="min-h-[64px] flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <span className="font-bold text-[#1f2937] w-7 shrink-0">#{f.position}</span>
                    <span className="font-mono font-bold text-[12px] bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] shrink-0">
                      {f.numTicket}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#1f2937] truncate">{f.patientNom}</div>
                      <div className="text-[12px] text-[#5b6472] truncate">{texteAppel}</div>
                    </div>
                    <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0f2f1] text-[#5b6472] shrink-0">
                      {f.type === "RDV" ? "RDV" : "Sans RDV"}
                    </span>

                    {estModifiable && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {f.appele ? (
                          <>
                            <button
                              type="button"
                              disabled={appelant}
                              onClick={() => gererAppel(f.aiguillageId, f.numTicket)}
                              className="h-10 px-3.5 rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-[#fafbfa] transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Volume2 className="w-4 h-4" />
                              {appelant ? "Appel…" : "Rappeler"}
                            </button>
                            <button
                              type="button"
                              disabled={appelant || enCours}
                              onClick={() =>
                                ouvrirTiroir({
                                  id: f.aiguillageId,
                                  numTicket: f.numTicket,
                                  patientNom: f.patientNom,
                                  type: f.type,
                                  attenteMinutes: f.attenteMinutes,
                                })
                              }
                              className="h-10 px-3.5 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Prendre en charge
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={appelant}
                            onClick={() => gererAppel(f.aiguillageId, f.numTicket)}
                            className="h-10 px-3.5 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <ArrowRight className="w-4 h-4" />
                            {appelant ? "Appel…" : "Appeler"}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="lg:flex-1 bg-white border border-[#e5e7eb] rounded-[14px] p-5">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#1f2937]">
              Rendez-vous du jour · {rendezVous.length}
            </h3>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Planning prévisionnel du service.
            </p>
          </div>

          {rendezVous.length === 0 ? (
            <div className="text-center py-8 text-[#5b6472] text-sm">
              <b className="block text-[#1f2937] mb-1">Aucun rendez-vous prévu</b>
              Aucun rendez-vous n'est prévu aujourd'hui.
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f2f1] max-h-[420px] overflow-y-auto pr-1">
              {rendezVous.map((r) => {
                const conf = ETAT_LABELS[r.etat] || {
                  label: r.etat,
                  classe: "bg-slate-100 text-slate-600 border-slate-200",
                };
                return (
                  <li key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-[#1f2937] text-sm block">
                        {r.heure.length >= 5 ? r.heure.slice(0, 5) : r.heure}
                      </span>
                      <p className="text-[12px] text-[#1f2937] font-medium truncate">
                        {r.patientNom}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${conf.classe}`}
                    >
                      {conf.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <TiroirPriseEnCharge
        ouvert={aiguillageAConfirmer !== null}
        aiguillage={aiguillageAConfirmer}
        onFermer={() => setAiguillageAConfirmer(null)}
        onValider={confirmerPriseEnCharge}
      />

      <ModaleReorientationService
        ouvert={modaleReorientationOuverte}
        encounterId={enCoursEffectif?.encounterId ?? null}
        numTicket={enCoursEffectif?.numTicket ?? undefined}
        patientNom={enCoursEffectif?.patientNom ?? undefined}
        onFermer={() => setModaleReorientationOuverte(false)}
        onOrienter={handleOrienterRapide}
      />

      <TiroirClotureSoins
        ouvert={tiroirClotureOuvert}
        encounterId={enCoursEffectif?.encounterId ?? null}
        patientNom={enCoursEffectif?.patientNom ?? undefined}
        numTicket={enCoursEffectif?.numTicket ?? undefined}
        dureeMinutes={enCoursEffectif?.dureeMinutes || 0}
        actesEnSuspens={actesEnSuspensPourCePatient}
        serviceActuelId={siteActifId}
        siteId={siteActifId}
        enCours={clotureEnCours}
        erreur={erreurCloture}
        onFermer={() => {
          if (clotureEnCours) return;
          setTiroirClotureOuvert(false);
          setErreurCloture(null);
        }}
        onConfirmer={handleClotureConfirmee}
      />
    </div>
  );
};

export default PanneauInfirmerieFile;