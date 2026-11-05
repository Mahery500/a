/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Check, Clock, CheckCircle2, Plus, XCircle } from "lucide-react";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import type { ActeDefinitionApiOutput } from "../api/consultation-active.contrats";
import type { DemandeActeItem, PrioriteDemande } from "../modele/consultation-active.types";

export interface OngletDemandesProps {
  catalogueActes: ActeDefinitionApiOutput[];
  demandesActes: DemandeActeItem[];
  estModifiable: boolean;
  onCreerDemande: (input: {
    acteDefinitionId: number;
    priorite: PrioriteDemande;
    urgente: boolean;
    serviceId: number;
    commentaire: string | null;
  }) => Promise<unknown>;
}

/* ---------- Tokens (repris de la maquette) ---------- */
const CHAMP =
  "w-full h-10 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";

const LABEL = "block text-xs font-bold text-[#5b6472] mb-1.5";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

const formaterHeure = (iso: string): string => {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const libelleStatut = (statut?: string): { texte: string; classes: string; icone: React.ReactNode } => {
  const s = (statut ?? "en_attente").toLowerCase();
  if (s === "realise") {
    return {
      texte: "Réalisé",
      classes: "bg-[#e7f6ed] text-[#14703c]",
      icone: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
    };
  }
  if (s === "en_cours") {
    return {
      texte: "En cours",
      classes: "bg-[#eef2ff] text-[#3730a3]",
      icone: <Clock className="h-3 w-3" aria-hidden="true" />,
    };
  }
  if (s === "annule") {
    return {
      texte: "Annulé",
      classes: "bg-[#fef3f2] text-[#b42318]",
      icone: <XCircle className="h-3 w-3" aria-hidden="true" />,
    };
  }
  return {
    texte: "En attente",
    classes: "bg-[#fff4e0] text-[#8a5300]",
    icone: <Clock className="h-3 w-3" aria-hidden="true" />,
  };
};

export const OngletDemandes: React.FC<OngletDemandesProps> = ({
  catalogueActes,
  demandesActes,
  estModifiable,
  onCreerDemande,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();

  const [acteId, setActeId] = useState("");
  const [instruction, setInstruction] = useState("");
  const [priorite, setPriorite] = useState<PrioriteDemande>("NORMALE");
  const [serviceId, setServiceId] = useState("3");
  const [enCours, setEnCours] = useState(false);

  const urgente = priorite !== "NORMALE";
  const compteur = demandesActes.length;

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estModifiable || !acteId) return;
    setEnCours(true);
    try {
      await onCreerDemande({
        acteDefinitionId: Number(acteId),
        priorite,
        urgente,
        serviceId: serviceId ? Number(serviceId) : 3,
        commentaire: instruction.trim() || null,
      });
      notifierSucces("Demande d'acte émise.");
      setActeId("");
      setInstruction("");
      setPriorite("NORMALE");
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="p-5 flex flex-col lg:flex-row gap-5">
      {/* ================================================================ */}
      {/*  Colonne gauche : formulaire                                     */}
      {/* ================================================================ */}
      <div className="flex-1 min-w-0">
        {estModifiable ? (
          <form onSubmit={soumettre} className="space-y-3.5">
            {/* --- Acte prescrit --- */}
            <div>
              <label htmlFor="dem-acte" className={LABEL}>
                Acte médical ou soin prescrit{" "}
                <b className="text-[#b42318]">*</b>
              </label>
              <select
                id="dem-acte"
                required
                value={acteId}
                onChange={(e) => setActeId(e.target.value)}
                disabled={enCours}
                className={CHAMP}
              >
                <option value="">Sélectionner un acte à prescrire…</option>
                {catalogueActes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.libelle} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            {/* --- Destinataire --- */}
            <div>
              <label htmlFor="dem-service" className={LABEL}>
                Destinataire ou unité <b className="text-[#b42318]">*</b>
              </label>
              <select
                id="dem-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={enCours}
                className={CHAMP}
              >
                <option value="3">Infirmerie (Soins infirmiers)</option>
                <option value="2">Laboratoire d'analyses</option>
                <option value="4">Imagerie & Radiologie</option>
                <option value="1">Consultation / Général</option>
              </select>
            </div>

            {/* --- Priorité : 2 cartes --- */}
            <div>
              <div className={LABEL}>
                Priorité <b className="text-[#b42318]">*</b>
              </div>
              <div
                className="grid grid-cols-2 gap-3"
                role="radiogroup"
                aria-label="Priorité de la demande"
              >
                <CartePriorite
                  actif={priorite === "NORMALE"}
                  onClick={() => setPriorite("NORMALE")}
                  desactive={enCours}
                  titre="Normale"
                  sousTitre="Pendant la consultation"
                />
                <CartePriorite
                  actif={priorite === "URGENTE"}
                  onClick={() => setPriorite("URGENTE")}
                  desactive={enCours}
                  titre="Urgente"
                  sousTitre="Signalée en tête de file"
                />
              </div>
            </div>

            {/* --- Instructions --- */}
            <div>
              <label htmlFor="dem-instruction" className={LABEL}>
                Instructions{" "}
                <span className="font-normal">(facultatif)</span>
              </label>
              <input
                id="dem-instruction"
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={enCours}
                placeholder="Instructions cliniques, posologie ou précisions d'exécution…"
                className={CHAMP}
              />
            </div>

            {/* --- Bouton --- */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!acteId || enCours}
                className={`h-10 px-4 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
              >
                <Plus className="h-4 w-4" />
                <span>{enCours ? "Enregistrement…" : "Émettre la demande"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-[10px] bg-[#fff4e0] border border-[#f3d9a8] text-[#8a5300] text-xs">
            Mode lecture seule : la création de demandes est désactivée.
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  Colonne droite : demandes émises                                */}
      {/* ================================================================ */}
      <aside
        className="lg:w-[330px] lg:shrink-0 lg:border-l lg:border-[#f0f2f1] lg:pl-5"
        aria-label="Demandes émises"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#1f2937]">
            Demandes émises
          </span>
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f2f1] text-[#5b6472] tabular-nums">
            {compteur}
          </span>
        </div>

        {compteur === 0 ? (
          <div className="py-6 px-3 text-center text-xs text-[#5b6472] italic border border-dashed border-[#e5e7eb] rounded-[10px]">
            Aucune demande émise pour ce patient.
          </div>
        ) : (
          <ul className="max-h-[400px] overflow-y-auto">
            {demandesActes.map((dem) => {
              const statut = libelleStatut(dem.statut);
              return (
                <li
                  key={dem.id}
                  className="flex items-start gap-3 py-2.5 border-t border-[#f0f2f1] first:border-t-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1f2937] leading-snug">
                      <b className="truncate">{dem.acteDefinitionLibelle}</b>
                      {dem.acteDefinitionCode && (
                        <>
                          {" "}
                          <span className="font-mono text-[10px] text-[#5b6472] font-normal">
                            {dem.acteDefinitionCode}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5b6472] truncate mt-0.5">
                      {dem.serviceNom || "Infirmerie"} ·{" "}
                      {dem.urgente ? "Urgente" : "Normale"} ·{" "}
                      {formaterHeure(dem.dateDemande)}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${statut.classes}`}
                  >
                    {statut.icone}
                    {statut.texte}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 *  Carte de sélection de la priorité (utilisée en paire)
 * ------------------------------------------------------------------ */
const CartePriorite: React.FC<{
  actif: boolean;
  onClick: () => void;
  desactive?: boolean;
  titre: string;
  sousTitre: string;
}> = ({ actif, onClick, desactive, titre, sousTitre }) => (
  <button
    type="button"
    role="radio"
    aria-checked={actif}
    onClick={onClick}
    disabled={desactive}
    className={`text-left p-3 rounded-[10px] flex items-start justify-between gap-2 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS} ${
      actif
        ? "border-2 border-[#1f9d55] bg-[#e7f6ed]"
        : "border border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
    }`}
  >
    <div className="min-w-0">
      <div className="font-bold text-sm text-[#1f2937]">{titre}</div>
      <div className="text-[12px] text-[#5b6472]">{sousTitre}</div>
    </div>
    {actif && (
      <Check
        className="h-[18px] w-[18px] shrink-0 text-[#1f9d55]"
        strokeWidth={2.5}
        aria-hidden="true"
      />
    )}
  </button>
);

export default OngletDemandes;