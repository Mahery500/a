/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useInfirmerieHistorique } from "../hooks/useInfirmerieHistorique";
import { ActeHistorique, FiltresHistorique, ObservationHistorique } from "../modele/infirmerie-historique.types";
import { TiroirDetailHistorique } from "./TiroirDetailHistorique";

export interface PanneauInfirmerieHistoriqueProps {
  mode?: ModeAffichage;
  patientIdFiltre?: number | null;
}

/* ---------- Styles ---------- */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const CHAMP =
  "h-10 border border-[#e5e7eb] rounded-[10px] px-3 text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const BTN_SECONDAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const CODE = "font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] inline-block";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

/* ---------- Helpers ---------- */
const formatDateHeure = (iso: string): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const datePart = d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const heurePart = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `${datePart} · ${heurePart}`;
  } catch {
    return iso;
  }
};

/**
 * Détecte les valeurs cliniques improbables (même logique que PanneauSoinsActes).
 */
function estValeurAberrante(o: ObservationHistorique): string | null {
  const texte = `${o.code} ${(o as { libelle?: string }).libelle ?? ""}`.toUpperCase();
  const v = parseFloat(o.valeur.replace(",", "."));
  if (!Number.isFinite(v)) return null;

  if (/SYSTOL|\bPAS\b/.test(texte) && (v < 60 || v > 250))
    return "Valeur improbable";
  if (/DIASTOL|\bPAD\b/.test(texte) && (v < 30 || v > 150))
    return "Valeur improbable";
  if (/POULS|\bFC\b/.test(texte) && (v < 30 || v > 220))
    return "Valeur improbable";
  if (/TEMP/.test(texte) && (v < 34 || v > 43))
    return "Valeur improbable";
  if (/SPO2|SAT/.test(texte) && (v < 50 || v > 100))
    return "Valeur improbable";
  return null;
}

const libelleObservation = (o: ObservationHistorique): string =>
  (o as { libelle?: string }).libelle?.trim() || o.code;

/* ---------- Composant principal ---------- */
type FiltreStatut = "tous" | "realises" | "annules";

export const PanneauInfirmerieHistorique: React.FC<PanneauInfirmerieHistoriqueProps> = ({
  mode = "lecture",
}) => {
  const [saisiePatient, setSaisiePatient] = useState("");
  const [saisieDu, setSaisieDu] = useState("");
  const [saisieAu, setSaisieAu] = useState("");
  const [erreurFiltre, setErreurFiltre] = useState<string | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [acteSelectionne, setActeSelectionne] = useState<ActeHistorique | null>(null);

  const { items, chargement, hasMore, erreur, appliquerFiltres, chargerPlus, rafraichir } =
    useInfirmerieHistorique();

  const handleFiltrer = (e: React.FormEvent) => {
    e.preventDefault();
    const p = saisiePatient.trim();
    if (p !== "" && !/^\d+$/.test(p)) {
      setErreurFiltre("Le numéro de patient doit être un identifiant numérique.");
      return;
    }
    if (saisieDu && saisieAu && saisieDu > saisieAu) {
      setErreurFiltre("La date de début doit être antérieure à la date de fin.");
      return;
    }
    setErreurFiltre(null);
    const filtres: FiltresHistorique = {
      patientId: p === "" ? undefined : Number(p),
      du: saisieDu || undefined,
      au: saisieAu || undefined,
    };
    appliquerFiltres(filtres);
  };

  const handleReinitialiser = () => {
    setSaisiePatient("");
    setSaisieDu("");
    setSaisieAu("");
    setErreurFiltre(null);
    setFiltreStatut("tous");
    appliquerFiltres({});
  };

  /* ---------- Filtrage par statut + calcul des stats ---------- */
  const itemsFiltres = useMemo(() => {
    if (filtreStatut === "tous") return items;
    if (filtreStatut === "realises")
      return items.filter((a) => a.statut === "realise" && !a.saisiParErreur);
    return items.filter((a) => a.statut === "annule" || a.saisiParErreur);
  }, [items, filtreStatut]);

  const stats = useMemo(() => {
    const realises = items.filter((a) => a.statut === "realise" && !a.saisiParErreur).length;
    const annules = items.filter((a) => a.statut === "annule" || a.saisiParErreur).length;
    const patients = new Set(items.map((a) => a.patientId)).size;
    const avecAlertes = items.filter((a) =>
      a.observations.some((o) => estValeurAberrante(o) !== null),
    ).length;
    return { total: items.length, realises, annules, patients, avecAlertes };
  }, [items]);

  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous ne disposez pas des autorisations nécessaires pour consulter l'historique des soins.
      </div>
    );
  }

  const pilules: { cle: FiltreStatut; libelle: string; n: number }[] = [
    { cle: "tous", libelle: "Tous", n: stats.total },
    { cle: "realises", libelle: "Réalisés", n: stats.realises },
    { cle: "annules", libelle: "Annulés", n: stats.annules },
  ];

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* En-tête */}
      <div>
        <h1 className="text-[22px] font-bold leading-tight">Historique des soins</h1>
        <p className="text-[13px] text-[#5b6472] mt-0.5">
          Soins paramédicaux dispensés par votre compte · recherche médico-légale
        </p>
      </div>

      {/* Carte de filtres */}
      <form onSubmit={handleFiltrer} className={`${CARTE} p-4`}>
        <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mb-3">
          Filtres de recherche médico-légale
        </div>

        <div className="flex flex-wrap items-end gap-3.5">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[12px] font-bold text-[#5b6472] mb-1.5">
              N° dossier patient
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5b6472] pointer-events-none" />
              <input
                type="text"
                placeholder="Ex. : 1042"
                value={saisiePatient}
                onChange={(e) => setSaisiePatient(e.target.value)}
                className={`${CHAMP} w-full pl-9`}
              />
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-[12px] font-bold text-[#5b6472] mb-1.5">
              Date de début (du)
            </label>
            <input
              type="date"
              value={saisieDu}
              onChange={(e) => setSaisieDu(e.target.value)}
              className={`${CHAMP} w-full`}
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-[12px] font-bold text-[#5b6472] mb-1.5">
              Date de fin (au)
            </label>
            <input
              type="date"
              value={saisieAu}
              onChange={(e) => setSaisieAu(e.target.value)}
              className={`${CHAMP} w-full`}
            />
          </div>

          <button type="submit" className={BTN_PRIMAIRE}>
            Appliquer
          </button>
          <button
            type="button"
            onClick={handleReinitialiser}
            className={BTN_SECONDAIRE}
            title="Réinitialiser les filtres"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        </div>

        {/* Pilules de filtre par statut */}
        <div className="flex flex-wrap gap-2 mt-3.5">
          {pilules.map((p) => {
            const actif = filtreStatut === p.cle;
            return (
              <button
                key={p.cle}
                type="button"
                onClick={() => setFiltreStatut(p.cle)}
                aria-pressed={actif}
                className={`rounded-full px-3.5 py-1.5 text-[13px] border cursor-pointer transition-colors ${FOCUS} ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
                }`}
              >
                {p.libelle} · {p.n}
              </button>
            );
          })}
        </div>
      </form>

      {(erreur || erreurFiltre) && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{erreurFiltre || erreur}</span>
        </div>
      )}

      {/* Barre de stats */}
      <div className={`${CARTE} min-h-[56px] flex flex-wrap items-center gap-x-7 gap-y-2 px-5 py-2`}>
        <span className="text-[13px]">
          <b className="text-[15px]">{stats.total}</b> acte{stats.total > 1 ? "s" : ""}
        </span>
        <span className="text-[13px]">
          <b className="text-[15px]">{stats.realises}</b> réalisé{stats.realises > 1 ? "s" : ""}
        </span>
        <span className="text-[13px]">
          <b className="text-[15px]">{stats.annules}</b> annulé{stats.annules > 1 ? "s" : ""}
        </span>
        <span className="text-[13px]">
          <b className="text-[15px]">{stats.patients}</b> patient{stats.patients > 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={rafraichir}
          disabled={chargement}
          className={`${BTN_SECONDAIRE} ml-auto !px-2.5`}
          title="Actualiser"
        >
          <RefreshCw className={`h-4 w-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`} />
        </button>
        {stats.avecAlertes > 0 && (
          <span className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff4e0] text-[#8a5300]">
            <AlertTriangle className="h-3.5 w-3.5" />
            {stats.avecAlertes} acte{stats.avecAlertes > 1 ? "s" : ""} avec valeurs à vérifier
          </span>
        )}
      </div>

      {/* Tableau */}
      <div className={`${CARTE} overflow-hidden`}>
        {/* En-tête */}
        <div className="bg-[#fafbfa] border-b border-[#e5e7eb] flex items-center h-10 px-5 gap-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472] min-w-[900px]">
          <span style={{ width: 190 }}>Date et heure</span>
          <span style={{ width: 130 }}>Code</span>
          <span style={{ flex: 1.2, minWidth: 180 }}>Acte et patient</span>
          <span style={{ flex: 1.3, minWidth: 200 }}>Résultats</span>
          <span style={{ width: 120 }}>Statut</span>
          <span style={{ width: 30 }} />
        </div>

        {chargement && items.length === 0 ? (
          <p className="text-xs text-[#5b6472] py-10 text-center">Chargement de l’historique…</p>
        ) : itemsFiltres.length === 0 ? (
          <div className="py-12 text-center text-[#5b6472] text-sm">
            <XCircle className="h-7 w-7 mx-auto text-[#5b6472] mb-2" />
            <b className="block text-[#1f2937]">Aucun acte enregistré</b>
            Aucun acte ne correspond aux critères sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {itemsFiltres.map((a) => {
              const observationsAberrantes = a.observations.filter(
                (o) => estValeurAberrante(o) !== null,
              );
              const statutLabel =
                a.saisiParErreur
                  ? "Saisi par erreur"
                  : a.statut === "realise"
                    ? "Réalisé"
                    : a.statut === "annule"
                      ? "Annulé"
                      : a.statut;

              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActeSelectionne(a)}
                  className="w-full min-w-[900px] h-16 flex items-center px-5 gap-3 border-b border-[#f0f2f1] bg-white hover:bg-[#fafbfa] text-left cursor-pointer transition-colors"
                >
                  <span style={{ width: 190 }} className="text-[13px] text-[#1f2937]">
                    {formatDateHeure(a.dateRealisation)}
                  </span>
                  <span style={{ width: 130 }}>
                    <span className={CODE}>{a.acteDefinitionCode}</span>
                  </span>
                  <span style={{ flex: 1.2, minWidth: 180 }} className="min-w-0">
                    <b className="block text-[14px] text-[#1f2937] truncate">
                      {a.acteDefinitionLibelle}
                    </b>
                    <span className="block text-[12px] text-[#5b6472] truncate">
                      {a.patientNom} · Dossier #{a.encounterId}
                    </span>
                  </span>
                  <span
                    style={{ flex: 1.3, minWidth: 200 }}
                    className="flex flex-wrap gap-1.5"
                  >
                    {a.observations.length === 0 ? (
                      <span className="text-[12px] italic text-[#5b6472]">—</span>
                    ) : (
                      a.observations.map((o) => {
                        const alerte = estValeurAberrante(o);
                        return (
                          <span
                            key={o.id}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                              alerte
                                ? "bg-[#fff4e0] text-[#8a5300]"
                                : "bg-[#f0f2f1] text-[#5b6472]"
                            }`}
                          >
                            {alerte ? "⚠ " : ""}
                            {libelleObservation(o)} {o.valeur}
                            {o.unite ? ` ${o.unite}` : ""}
                          </span>
                        );
                      })
                    )}
                  </span>
                  <span style={{ width: 120 }}>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        a.saisiParErreur
                          ? "bg-rose-50 text-rose-700"
                          : a.statut === "realise"
                            ? "bg-[#e7f6ed] text-[#14703c]"
                            : "bg-[#f0f2f1] text-[#5b6472]"
                      }`}
                    >
                      {!a.saisiParErreur && a.statut === "realise" && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {statutLabel}
                    </span>
                  </span>
                  <span style={{ width: 30 }} className="text-center">
                    <Eye className="h-4 w-4 text-[#5b6472] mx-auto" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!chargement && itemsFiltres.length > 0 && (
          <div className="px-5 py-3 border-t border-[#f0f2f1] bg-[#fafbfa] text-[12px] text-[#5b6472]">
            <b className="font-bold text-[#1f2937]">{itemsFiltres.length}</b> affiché
            {itemsFiltres.length > 1 ? "s" : ""} sur {items.length}
          </div>
        )}
      </div>

      {hasMore && !chargement && (
        <div className="text-center">
          <button type="button" onClick={chargerPlus} className={BTN_SECONDAIRE}>
            Charger plus d'actes
          </button>
        </div>
      )}

      <TiroirDetailHistorique
        ouvert={acteSelectionne !== null}
        acte={acteSelectionne}
        onFermer={() => setActeSelectionne(null)}
      />
    </div>
  );
};

export default PanneauInfirmerieHistorique;