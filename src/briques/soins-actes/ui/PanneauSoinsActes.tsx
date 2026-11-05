// src/briques/soins-actes/ui/PanneauSoinsActes.tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Plus,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useSoinsActes } from "../hooks/useSoinsActes";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import {
  estActesEnSuspens,
  estConflitActesDemandes,
  extraireCodesActes,
} from "@/noyau/http/erreursCloture";
import { soinsActesApi } from "../api/soins-actes.api";
import {
  StatutActe,
  LIBELLES_STATUT_ACTE,
  ActeSaisiItem,
} from "../modele/soin-acte.types";
import { ModaleReorientationService } from "./ModaleReorientationService";
import { PanneauConstats } from "@/briques/constats";
import type { ChampObservationMoule } from "./ModaleRealisationActe";

/* =====================================================================
 *  Tokens du design (maquette « Actes et soins »)
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] border border-[#1f9d55] text-white hover:bg-[#14703c]`;
const CHIP_EN_COURS =
  "inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-[3px] rounded-full bg-[#1f9d55] text-white";
const CHIP_AMBER =
  "inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-[3px] rounded-full bg-[#fff4e0] text-[#8a5300]";
const CHIP_GR =
  "inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-[3px] rounded-full bg-[#e7f6ed] text-[#14703c]";
const CHIP_NEUTRE =
  "inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-[3px] rounded-full bg-[#f0f2f1] text-[#5b6472]";
const CODE =
  "font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] whitespace-nowrap inline-block";
const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mt-3 mb-3";
const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const HELP = "text-[12px] text-[#5b6472] mt-1.5";
const SELECT =
  "w-full h-10 border border-[#e5e7eb] rounded-[10px] px-3 text-sm bg-white text-[#1f2937] " +
  "focus:outline-none focus:border-[#1f9d55] focus:ring-2 focus:ring-[#e7f6ed]";

/* ===================================================================== */

export interface PanneauSoinsActesProps {
  mode?: ModeAffichage;
  encounterId?: number | null;
  patientId?: number | null;
  patientNom?: string;
  ticketNumero?: string;
  /** Si undefined, la pastille allergies n'est pas affichée. */
  allergies?: string[];
  dureeMinutes?: number;
  onTermineSucces?: () => void;
}

interface ValeurChamp {
  valeur: string;
  interpretation: string;
}

export const PanneauSoinsActes: React.FC<PanneauSoinsActesProps> = ({
  mode = "edition",
  encounterId,
  patientId,
  patientNom,
  ticketNumero,
  allergies,
  dureeMinutes = 0,
  onTermineSucces,
}) => {
  const {
    actesSaisis,
    actesDemandes,
    catalogueRealisable,
    chargement,
    actionEnCours,
    erreur,
    changerStatut,
    terminerPriseEnCharge,
    orienterPatient,
    rafraichir,
  } = useSoinsActes(encounterId, patientId);

  const { notifierSucces, notifierErreur } = useNotifier();
  const estModifiable = mode === "edition";

  /* ---------- Sélection ---------- */
  const [acteDefinitionId, setActeDefinitionId] = useState<number | null>(null);
  const [ligneDemandeId, setLigneDemandeId] = useState<number | null>(null);

  /* ---------- Moule d'observations inline ---------- */
  const [moule, setMoule] = useState<ChampObservationMoule[]>([]);
  const [chargementMoule, setChargementMoule] = useState(false);
  const [champs, setChamps] = useState<Record<number, ValeurChamp>>({});
  const [erreursChamps, setErreursChamps] = useState<Record<number, string>>({});

  /* ---------- Enregistrement / clôture ---------- */
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [clotureEnCours, setClotureEnCours] = useState(false);
  const [modaleReorientationOuverte, setModaleReorientationOuverte] = useState(false);

  const aDesAllergies = allergies !== undefined && allergies.length > 0;

  /* ---------- Charge le moule dès la sélection ---------- */
  useEffect(() => {
    if (!acteDefinitionId) {
      setMoule([]);
      setChamps({});
      setErreursChamps({});
      return;
    }

    let actif = true;
    setChargementMoule(true);
    setMoule([]);
    setChamps({});
    setErreursChamps({});

    soinsActesApi
      .recupererObservationsAttendues(acteDefinitionId)
      .then((items) => {
        if (actif) setMoule(items as ChampObservationMoule[]);
      })
      .catch((err) => {
        if (actif) notifierErreur(extraireMessageErreur(err));
      })
      .finally(() => {
        if (actif) setChargementMoule(false);
      });

    return () => {
      actif = false;
    };
  }, [acteDefinitionId, notifierErreur]);

  /* ---------- Sélection unifiée (prescriptions + catalogue) ---------- */
  const valeurSelect = useMemo(() => {
    if (ligneDemandeId !== null) return `presc-${ligneDemandeId}`;
    if (acteDefinitionId !== null) return `cat-${acteDefinitionId}`;
    return "";
  }, [ligneDemandeId, acteDefinitionId]);

  const handleSelect = (v: string) => {
    setErreursChamps({});
    if (v.startsWith("presc-")) {
      const ligneId = Number(v.replace("presc-", ""));
      const demande = actesDemandes.find((d) => d.id === ligneId);
      if (demande) {
        setActeDefinitionId(demande.acteDefinitionId);
        setLigneDemandeId(ligneId);
      }
    } else if (v.startsWith("cat-")) {
      setActeDefinitionId(Number(v.replace("cat-", "")));
      setLigneDemandeId(null);
    } else {
      setActeDefinitionId(null);
      setLigneDemandeId(null);
    }
  };

  const acteSelectionne = catalogueRealisable.find((c) => c.id === acteDefinitionId);

  /* ---------- Plausibilité (warn only, ne bloque pas) ---------- */
  const verifierPlausibilite = (
    champ: ChampObservationMoule,
    raw: string,
  ): string | null => {
    if (champ.observation.typeValeur !== "numerique") return null;
    const v = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(v)) return null;

    const texte = `${champ.observation.code} ${champ.observation.libelle}`.toUpperCase();

    // Tension systolique / PAS
    if (/SYSTOL|\bPAS\b/.test(texte)) {
      if (v < 60 || v > 250)
        return "Valeur improbable : vérifiez la saisie (ex. 120).";
    }
    // Tension diastolique / PAD
    if (/DIASTOL|\bPAD\b/.test(texte)) {
      if (v < 30 || v > 150)
        return "Valeur improbable : vérifiez la saisie (ex. 80).";
    }
    // Pouls / fréquence cardiaque
    if (/POULS|\bFC\b/.test(texte)) {
      if (v < 30 || v > 220)
        return "Valeur improbable : vérifiez la saisie (ex. 75).";
    }
    // Température
    if (/TEMP/.test(texte)) {
      if (v < 34 || v > 43)
        return "Valeur improbable : vérifiez la saisie (ex. 37.0).";
    }
    // SpO2 / Saturation
    if (/SPO2|SAT/.test(texte)) {
      if (v < 50 || v > 100)
        return "Valeur improbable : vérifiez la saisie (ex. 98).";
    }
    return null;
  };

  const setValeurChamp = (obsId: number, valeur: string) => {
    setChamps((prev) => ({
      ...prev,
      [obsId]: { valeur, interpretation: prev[obsId]?.interpretation ?? "" },
    }));

    const champ = moule.find((c) => c.observation.id === obsId);
    if (!champ) return;
    const warning = verifierPlausibilite(champ, valeur);
    setErreursChamps((prev) => {
      const next = { ...prev };
      if (warning) next[obsId] = warning;
      else delete next[obsId];
      return next;
    });
  };

  const setInterpretationChamp = (obsId: number, interpretation: string) => {
    setChamps((prev) => ({
      ...prev,
      [obsId]: { valeur: prev[obsId]?.valeur ?? "", interpretation },
    }));
  };

  /* ---------- Statut / obligatoires manquantes ---------- */
  const obligatoiresManquantes = useMemo(
    () =>
      moule.filter(
        (c) => c.obligatoire && (champs[c.observation.id]?.valeur ?? "").trim() === "",
      ),
    [moule, champs],
  );

  const peutTerminer =
    moule.length === 0 || obligatoiresManquantes.length === 0;

  const statutCible: StatutActe = peutTerminer ? "realise" : "en_cours";

  /* ---------- Enregistrer l'acte ---------- */
  const enregistrerActe = async () => {
    if (!encounterId || !acteDefinitionId || enregistrementEnCours) return;

    setEnregistrementEnCours(true);
    try {
      const acte = await soinsActesApi.saisirActe({
        encounterId,
        acteDefinitionId,
        statut: statutCible,
        ligneDemandeId: ligneDemandeId ?? null,
      });

      for (const champ of moule) {
        const saisie = champs[champ.observation.id];
        const valeur = (saisie?.valeur ?? "").trim();
        if (valeur === "") continue;

        await soinsActesApi.ajouterObservation(acte.id, {
          observationDefinitionId: champ.observation.id,
          valeur,
          interpretation: saisie?.interpretation.trim() || null,
        });
      }

      notifierSucces(
        statutCible === "realise"
          ? "Acte enregistré et terminé."
          : "Acte enregistré (en cours : observations obligatoires manquantes).",
      );

      // Réinitialiser la saisie
      setActeDefinitionId(null);
      setLigneDemandeId(null);
      setMoule([]);
      setChamps({});
      setErreursChamps({});

      await rafraichir();
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  /* ---------- Clôturer la prise en charge ---------- */
  const actesEnSuspensCount = actesSaisis.filter(
    (a) => a.statut === "planifie" || a.statut === "en_cours",
  ).length;

  const gererCloture = async () => {
    if (!estModifiable) return;
    if (actesEnSuspensCount > 0) {
      const codes = actesSaisis
        .filter((a) => a.statut === "planifie" || a.statut === "en_cours")
        .map((a) => a.acteDefinitionCode)
        .filter(Boolean)
        .join(", ");
      notifierErreur(
        `Actes en suspens : ${codes}. Terminez-les ou annulez-les avant de clôturer.`,
      );
      return;
    }

    setClotureEnCours(true);
    try {
      try {
        await terminerPriseEnCharge(false);
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
          await terminerPriseEnCharge(true);
        } else if (estActesEnSuspens(err)) {
          notifierErreur(err.message);
          return;
        } else {
          throw err;
        }
      }
      notifierSucces("Prise en charge terminée avec succès.");
      onTermineSucces?.();
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setClotureEnCours(false);
    }
  };

  /* ---------- Réorientation ---------- */
  const handleOrienter = async (serviceId: number): Promise<boolean> => {
    try {
      await orienterPatient(serviceId);
      notifierSucces(
        "Patient réorienté. Il apparaîtra dans la file du service destinataire.",
      );
      return true;
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
      return false;
    }
  };

  /* ---------- Garde-fous ---------- */
  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous ne disposez pas des droits nécessaires pour accéder aux actes de soins.
      </div>
    );
  }

  if (!encounterId) {
    return (
      <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-2">
        <Stethoscope className="h-8 w-8 text-slate-300 mx-auto" />
        <h4 className="text-sm font-bold text-slate-700">
          Aucun patient en cours de soins
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Prenez un patient en charge depuis la file d'attente pour démarrer la
          réalisation des actes et soins.
        </p>
      </div>
    );
  }

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight">Actes et soins</h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Enregistrer les actes réalisés pour le patient pris en charge.
          </p>
        </div>

        {estModifiable && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setModaleReorientationOuverte(true)}
              disabled={actionEnCours || clotureEnCours}
              className={BTN_SECONDAIRE}
              title="Orienter le patient vers un autre service sans clôturer"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Réorienter vers un service
            </button>
          </div>
        )}
      </div>

      {/* ===================== Bandeau patient ===================== */}
      <div className="bg-[#e7f6ed] border border-[#1f9d55] rounded-[14px] px-5 py-3 flex flex-wrap items-center gap-3.5">
        <span className={CHIP_EN_COURS}>Consultation en cours</span>
        {ticketNumero && (
          <span className="font-mono text-[12px] font-bold bg-white text-[#14703c] border border-[#1f9d55]/40 rounded-md px-[7px] py-[3px]">
            {ticketNumero}
          </span>
        )}
        <b className="text-[16px] text-[#14703c] flex-1 min-w-0 truncate">
          {patientNom || "Patient"}
        </b>
        <span className="text-[13px] text-[#14703c]/90 whitespace-nowrap">
          Dossier #{encounterId} · pris en charge il y a {dureeMinutes} min
        </span>
        {allergies !== undefined && (
          <span className={CHIP_AMBER}>
            {aDesAllergies
              ? `⚠ Allergies : ${allergies!.join(", ")}`
              : "⚠ Allergies non renseignées"}
          </span>
        )}
      </div>

      {/* ===================== Erreur globale ===================== */}
      {erreur && (
        <div className="p-3.5 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{erreur}</span>
        </div>
      )}

      {/* ===================== Deux colonnes ===================== */}
      <div className="flex flex-col lg:flex-row gap-3.5 items-start">
        {/* ---------- Colonne principale ---------- */}
        <section className={`${CARTE} flex-1 min-w-0 w-full p-5`}>
          <b className="text-[16px]">Enregistrer un acte</b>

          {/* ----- Section Acte ----- */}
          <div className={SECTION}>Acte</div>

          <label htmlFor="acte-select" className={LABEL}>
            Acte à enregistrer <span className="text-[#b42318]">*</span>
          </label>
          <select
            id="acte-select"
            value={valeurSelect}
            onChange={(e) => handleSelect(e.target.value)}
            disabled={actionEnCours || enregistrementEnCours}
            className={SELECT}
          >
            <option value="">
              {catalogueRealisable.length === 0
                ? "Aucun acte réalisable pour ce service"
                : "— Choisir un acte —"}
            </option>

            {actesDemandes.length > 0 && (
              <optgroup label="Prescriptions en attente">
                {actesDemandes.map((d) => (
                  <option key={`presc-${d.id}`} value={`presc-${d.id}`}>
                    {d.urgente ? "⚠ " : ""}
                    {d.acteDefinitionLibelle} ({d.acteDefinitionCode})
                  </option>
                ))}
              </optgroup>
            )}

            {catalogueRealisable.length > 0 && (
              <optgroup label="Catalogue du service">
                {catalogueRealisable.map((c) => (
                  <option key={`cat-${c.id}`} value={`cat-${c.id}`}>
                    {c.libelle} ({c.code})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <p className={HELP}>
            Choisissez l'acte réalisé parmi le catalogue du service.
          </p>

          {/* ----- Section Résultats (observations) ----- */}
          {acteDefinitionId && (
            <>
              <div className={SECTION}>Résultats</div>

              {chargementMoule ? (
                <div className="py-8 flex items-center justify-center gap-2 text-[#5b6472] text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-[#1f9d55]" />
                  Chargement des paramètres attendus…
                </div>
              ) : moule.length === 0 ? (
                <div className="p-3 rounded-[10px] bg-[#e7f6ed] border border-[#1f9d55]/30 text-[#14703c] text-xs flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Cet acte n'attend aucune observation. Il sera marqué{" "}
                    <b>« Réalisé »</b> directement.
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {moule.map((champ) => {
                      const id = champ.observation.id;
                      const v = champs[id]?.valeur ?? "";
                      const interp = champs[id]?.interpretation ?? "";
                      const warning = erreursChamps[id];
                      const unite =
                        champ.observation.uniteCode ||
                        champ.observation.uniteLibelle ||
                        "";
                      const manquant =
                        champ.obligatoire && v.trim() === "" && !warning;

                      return (
                        <div key={id}>
                          <label
                            htmlFor={`champ-${id}`}
                            className={LABEL}
                          >
                            {champ.observation.libelle}
                            {champ.obligatoire && (
                              <span className="text-[#b42318]"> *</span>
                            )}
                          </label>

                          <div
                            className={`flex items-center h-10 border rounded-[10px] bg-white px-3 ${
                              warning || manquant
                                ? "border-[#b42318]"
                                : "border-[#e5e7eb] focus-within:border-[#1f9d55] focus-within:ring-2 focus-within:ring-[#e7f6ed]"
                            }`}
                          >
                            <input
                              id={`champ-${id}`}
                              type="text"
                              inputMode={
                                champ.observation.typeValeur === "numerique"
                                  ? "decimal"
                                  : "text"
                              }
                              value={v}
                              disabled={enregistrementEnCours}
                              onChange={(e) => setValeurChamp(id, e.target.value)}
                              placeholder={
                                champ.observation.typeValeur === "numerique"
                                  ? "Valeur"
                                  : "Texte"
                              }
                              className="flex-1 min-w-0 h-full bg-transparent outline-none text-sm font-semibold"
                            />
                            {unite && (
                              <span className="text-[12px] text-[#5b6472] ml-2 shrink-0">
                                {unite}
                              </span>
                            )}
                          </div>

                          {warning ? (
                            <p className="text-[12px] font-bold text-[#b42318] mt-1.5">
                              {warning}
                            </p>
                          ) : manquant ? (
                            <p className="text-[12px] font-bold text-[#b42318] mt-1.5">
                              Champ obligatoire.
                            </p>
                          ) : (
                            <input
                              type="text"
                              value={interp}
                              disabled={enregistrementEnCours}
                              onChange={(e) =>
                                setInterpretationChamp(id, e.target.value)
                              }
                              placeholder="Interprétation (facultatif)"
                              className="w-full mt-1 bg-transparent border border-[#f0f2f1] rounded-md px-2 py-1 text-[11px] italic text-[#5b6472] focus:outline-none focus:border-[#1f9d55]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {obligatoiresManquantes.length > 0 && (
                    <div className="mt-3.5 p-2.5 rounded-[10px] bg-[#fff4e0] border border-[#f3d9a8] text-[#8a5300] text-xs flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        {obligatoiresManquantes.length} champ
                        {obligatoiresManquantes.length > 1 ? "s" : ""} obligatoire
                        {obligatoiresManquantes.length > 1 ? "s" : ""} vide
                        {obligatoiresManquantes.length > 1 ? "s" : ""} : l'acte sera
                        enregistré <b>« En cours »</b> et pourra être complété plus
                        tard.
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ----- Bouton d'enregistrement ----- */}
          {acteDefinitionId && (
            <button
              type="button"
              onClick={enregistrerActe}
              disabled={
                enregistrementEnCours ||
                chargementMoule ||
                (!acteSelectionne && ligneDemandeId === null)
              }
              className={`${BTN_PRIMAIRE} w-full justify-center mt-5`}
            >
              {enregistrementEnCours ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {statutCible === "realise"
                    ? "Enregistrer l'acte"
                    : "Enregistrer l'acte (en cours)"}
                </>
              )}
            </button>
          )}
        </section>

        {/* ---------- Colonne latérale ---------- */}
        <section className={`${CARTE} w-full lg:w-[380px] lg:shrink-0 flex flex-col`}>
          <div className="px-5 pt-4 pb-3 border-b border-[#f0f2f1] flex items-baseline justify-between gap-2">
            <div>
              <b className="text-[16px] block">
                Actes de ce dossier · {actesSaisis.length}
              </b>
              <span className="text-[12px] text-[#5b6472]">
                {actesSaisis.filter((a) => a.statut === "realise").length} acte
                {actesSaisis.filter((a) => a.statut === "realise").length > 1
                  ? "s"
                  : ""}{" "}
                enregistré
                {actesSaisis.filter((a) => a.statut === "realise").length > 1
                  ? "s"
                  : ""}
              </span>
            </div>
          </div>

          {chargement && actesSaisis.length === 0 ? (
            <p className="text-[12px] text-[#5b6472] py-6 text-center">
              Chargement des actes…
            </p>
          ) : actesSaisis.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-10 text-center px-5">
              <ClipboardList
                className="h-7 w-7 text-[#5b6472]"
                strokeWidth={1.6}
              />
              <b className="text-sm text-[#1f2937]">Aucun acte enregistré</b>
              <p className="text-[12px] text-[#5b6472] max-w-[240px]">
                Les actes saisis pour ce dossier apparaîtront ici.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f2f1] max-h-[560px] overflow-y-auto">
              {actesSaisis.map((acte) => (
                <LigneActeSaisie
                  key={acte.id}
                  acte={acte}
                  estModifiable={estModifiable}
                  desactive={actionEnCours}
                  onMarquerRealise={async (id) => {
                    try {
                      await changerStatut(id, "realise");
                      notifierSucces("Acte marqué comme réalisé.");
                    } catch (err) {
                      notifierErreur(extraireMessageErreur(err));
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ===================== Constats ===================== */}
      <section className={`${CARTE} p-5`}>
        <PanneauConstats mode={mode} encounterId={encounterId} />
      </section>

      {/* ===================== Modale réorientation ===================== */}
      <ModaleReorientationService
        ouvert={modaleReorientationOuverte}
        encounterId={encounterId}
        onFermer={() => setModaleReorientationOuverte(false)}
        onOrienter={handleOrienter}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Ligne d'un acte enregistré (colonne droite)
 * ------------------------------------------------------------------ */
const LigneActeSaisie: React.FC<{
  acte: ActeSaisiItem;
  estModifiable: boolean;
  desactive: boolean;
  onMarquerRealise: (id: number) => Promise<void>;
}> = ({ acte, estModifiable, desactive, onMarquerRealise }) => {
  const aUneValeurImprobable = acte.observations.some((o) => {
    const v = parseFloat(o.valeur.replace(",", "."));
    if (!Number.isFinite(v)) return false;
    const texte = `${o.code} ${o.libelle ?? ""}`.toUpperCase();
    if (/SYSTOL|\bPAS\b/.test(texte)) return v < 60 || v > 250;
    if (/DIASTOL|\bPAD\b/.test(texte)) return v < 30 || v > 150;
    return false;
  });

  return (
    <li className="px-5 py-3">
      <div className="flex items-start justify-between gap-2">
        <b className="text-sm text-[#1f2937] truncate">
          {acte.acteDefinitionLibelle}
        </b>
        <ChipStatutActe statut={acte.statut} />
      </div>

      <div className="mt-0.5">
        <span className={CODE}>{acte.acteDefinitionCode}</span>
      </div>

      {acte.observations.length > 0 && (
        <div className="font-mono text-[12px] text-[#5b6472] mt-2 leading-[1.7]">
          {acte.observations.map((o) => (
            <div key={o.id}>
              {o.libelle || o.code} :{" "}
              <b className="text-[#1f2937]">
                {o.valeur} {o.uniteCode || o.unite || ""}
              </b>
              {o.interpretation && (
                <span className="italic"> ({o.interpretation})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {acte.resultats.length > 0 && (
        <div className="mt-2 space-y-1">
          {acte.resultats.map((r) => (
            <div
              key={r.id}
              className="text-[11px] bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 text-emerald-900"
            >
              <b className="font-semibold">{r.type} :</b>{" "}
              {r.conclusion || r.resultat}
            </div>
          ))}
        </div>
      )}

      {aUneValeurImprobable && (
        <div className="mt-2">
          <span className={CHIP_AMBER}>⚠ Valeurs à vérifier</span>
        </div>
      )}

      {estModifiable &&
        (acte.statut === "planifie" || acte.statut === "en_cours") && (
          <button
            type="button"
            disabled={desactive}
            onClick={() => onMarquerRealise(acte.id)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
          >
            <ChevronRight className="h-3 w-3" />
            Marquer comme réalisé
          </button>
        )}
    </li>
  );
};

const ChipStatutActe: React.FC<{ statut: StatutActe }> = ({ statut }) => {
  if (statut === "realise") {
    return (
      <span className={CHIP_GR}>
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        {LIBELLES_STATUT_ACTE[statut]}
      </span>
    );
  }
  if (statut === "en_cours" || statut === "planifie") {
    return <span className={CHIP_AMBER}>{LIBELLES_STATUT_ACTE[statut]}</span>;
  }
  return <span className={CHIP_NEUTRE}>{LIBELLES_STATUT_ACTE[statut]}</span>;
};

export default PanneauSoinsActes;