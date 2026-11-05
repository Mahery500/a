/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from "react";
import {
  Activity,
  Heart,
  Thermometer,
  Gauge,
  Wind,
  Scale,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldAlert,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useConstantesVitales } from "../hooks/useConstantesVitales";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { ChampObservationMoule } from "../modele/constante-vitale.types";

export interface PanneauConstantesVitalesProps {
  mode?: ModeAffichage;
  encounterId?: number | null;
  patientNom?: string;
  ticketNumero?: string;
  onSucces?: () => void;
}

function obtenirIconeChamp(code: string) {
  const c = code.toUpperCase();
  if (c.includes("TA") || c.includes("TENS") || c.includes("PAS") || c.includes("PAD")) {
    return <Gauge className="h-4 w-4 text-rose-600" />;
  }
  if (c.includes("TEMP") || c.includes("FIEVR")) {
    return <Thermometer className="h-4 w-4 text-amber-500" />;
  }
  if (c.includes("POULS") || c.includes("FC") || c.includes("CARD")) {
    return <Heart className="h-4 w-4 text-rose-500" />;
  }
  if (c.includes("SPO2") || c.includes("SAT") || c.includes("OXY")) {
    return <Wind className="h-4 w-4 text-sky-500" />;
  }
  if (c.includes("POIDS") || c.includes("MASS") || c.includes("IMC")) {
    return <Scale className="h-4 w-4 text-emerald-500" />;
  }
  if (c.includes("GLYC") || c.includes("SUCR")) {
    return <Droplet className="h-4 w-4 text-purple-500" />;
  }
  return <Activity className="h-4 w-4 text-indigo-500" />;
}

function obtenirPlaceholderChamp(code: string, unite?: string | null): string {
  const c = code.toUpperCase();
  if (c.includes("TA") || c.includes("TENS")) return "ex: 120/80";
  if (c.includes("PAS")) return "ex: 120";
  if (c.includes("PAD")) return "ex: 80";
  if (c.includes("TEMP")) return "ex: 37.2";
  if (c.includes("POULS") || c.includes("FC")) return "ex: 75";
  if (c.includes("SPO2") || c.includes("SAT")) return "ex: 98";
  if (c.includes("POIDS")) return "ex: 70";
  if (c.includes("TAILLE")) return "ex: 175";
  if (c.includes("GLYC")) return "ex: 1.05";
  return unite ? `Valeur en ${unite}` : "Valeur mesurée";
}

export const PanneauConstantesVitales: React.FC<PanneauConstantesVitalesProps> = ({
  mode = "edition",
  encounterId,
  patientNom,
  ticketNumero,
  onSucces,
}) => {
  const formId = useId();
  const {
    actesConstantes,
    acteSelectionneId,
    setActeSelectionneId,
    mouleObservations,
    chargementMoule,
    valeursSaisies,
    interpretationsSaisies,
    setValeurObservation,
    setInterpretationObservation,
    observationsHistorique,
    chargement,
    sauvegardeEnCours,
    erreur,
    soumettre,
    reinitialiserSaisie,
    alertesActives,
    rafraichir,
  } = useConstantesVitales(encounterId);

  const { notifierSucces, notifierErreur } = useNotifier();
  const [commentaire, setCommentaire] = useState("");
  const [champInterpretationOuvert, setChampInterpretationOuvert] = useState<
    Record<number, boolean>
  >({});

  const estModifiable = mode === "edition";

  // Compter le nombre de champs renseignés dans la saisie active
  const nombreChampsRemplis = Object.values(valeursSaisies).filter(
    (v) => v !== undefined && v !== null && String(v).trim() !== "",
  ).length;

  const toggleInterpretation = (obsId: number) => {
    setChampInterpretationOuvert((prev) => ({
      ...prev,
      [obsId]: !prev[obsId],
    }));
  };

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estModifiable) return;

    if (nombreChampsRemplis === 0) {
      notifierErreur("Veuillez renseigner au moins une mesure de constante vitale.");
      return;
    }

    try {
      await soumettre(true);
      notifierSucces("Constantes vitales enregistrées avec succès dans le dossier.");
      setCommentaire("");
      setChampInterpretationOuvert({});
      if (onSucces) {
        onSucces();
      }
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous ne disposez pas des autorisations nécessaires pour accéder aux constantes vitales.
      </div>
    );
  }

  if (!encounterId) {
    return (
      <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
        <Activity className="h-10 w-10 text-slate-300 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">Aucun patient en cours de soins</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Pour enregistrer ou consulter les constantes vitales, veuillez d'abord prendre en charge
          un patient depuis la file d'attente de l'infirmerie.
        </p>
      </div>
    );
  }

  const acteActif = actesConstantes.find((a) => a.id === acteSelectionneId);

  return (
    <div className="space-y-6">
      {/* En-tête patient en cours */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 font-bold shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                Prise de constantes vitales
              </span>
              {ticketNumero && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                  Ticket {ticketNumero}
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono">Dossier #{encounterId}</span>
            </div>
            <h2 className="font-bold text-slate-900 text-base mt-0.5">{patientNom || "Patient"}</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={rafraichir}
          disabled={chargement}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${chargement ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {erreur && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{erreur}</span>
        </div>
      )}

      {/* Alertes cliniques calculées en temps réel */}
      {alertesActives.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2 animate-slide-in">
          <div className="flex items-center gap-2 font-bold text-red-800 uppercase tracking-wide text-[11px]">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span>Vigilance clinique immédiate</span>
          </div>
          <ul className="space-y-1 text-xs">
            {alertesActives.map((a, idx) => (
              <li
                key={idx}
                className={`flex items-center gap-2 font-semibold ${
                  a.severite === "critique" ? "text-red-950 font-bold" : "text-amber-900"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    a.severite === "critique" ? "bg-red-600 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>
                  <strong>[{a.parametre}]</strong> {a.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale : Sélection de l'acte et champs d'observations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          {/* Étape 1 : Choix de l'acte de constantes (Catégorie 3) */}
          <div className="space-y-2.5 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="h-4 w-4 text-rose-600" />
                <span>Actes de constantes (Catégorie #3)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {actesConstantes.length} acte{actesConstantes.length > 1 ? "s" : ""} disponible
                {actesConstantes.length > 1 ? "s" : ""}
              </span>
            </div>

            {actesConstantes.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" />
                <span>
                  Aucun acte de constantes configuré dans la catégorie 3. Vous pouvez en créer dans
                  le Catalogue des Actes (Administration).
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {actesConstantes.map((acte) => {
                  const estActif = acte.id === acteSelectionneId;
                  return (
                    <button
                      key={acte.id}
                      type="button"
                      onClick={() => setActeSelectionneId(acte.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                        estActif
                          ? "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-200 shadow-2xs"
                          : "bg-slate-50 hover:bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <Activity
                        className={`h-3.5 w-3.5 ${estActif ? "text-rose-600" : "text-slate-400"}`}
                      />
                      <span>{acte.libelle}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-white/80 px-1 py-0.2 rounded border border-slate-200">
                        {acte.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Étape 2 : Champs d'observation de l'acte cliqué */}
          <form id={formId} onSubmit={gererSoumission} className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Paramètres d'observations</span>
                    {acteActif && (
                      <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        {acteActif.libelle}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Saisie souple : vous pouvez renseigner uniquement les constantes prises (prises
                    partielles acceptées).
                  </p>
                </div>

                {nombreChampsRemplis > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {nombreChampsRemplis} paramètre{nombreChampsRemplis > 1 ? "s" : ""} saisi
                    {nombreChampsRemplis > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {chargementMoule ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-rose-600" />
                  <p>Chargement du masque d'observations pour cet acte…</p>
                </div>
              ) : mouleObservations.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-2">
                  <Activity className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">
                    Aucun paramètre d'observation spécifique configuré pour cet acte.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Sélectionnez un autre acte de constantes ci-dessus, ou liez des observations à
                    cet acte depuis le Catalogue des Actes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {mouleObservations.map((champ: ChampObservationMoule) => {
                    const valeurActuelle = valeursSaisies[champ.observationId] ?? "";
                    const interpActuelle = interpretationsSaisies[champ.observationId] ?? "";
                    const estOuvert =
                      champInterpretationOuvert[champ.observationId] || Boolean(interpActuelle);

                    return (
                      <div
                        key={champ.observationId}
                        className={`p-3.5 rounded-xl border transition space-y-2 ${
                          valeurActuelle
                            ? "bg-rose-50/30 border-rose-200 shadow-2xs"
                            : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                            {obtenirIconeChamp(champ.code)}
                            <span className="truncate">{champ.libelle}</span>
                          </label>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {champ.unite && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shadow-2xs">
                                {champ.unite}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleInterpretation(champ.observationId)}
                              title="Ajouter une interprétation ou note clinique"
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-pointer transition ${
                                estOuvert
                                  ? "bg-rose-100 text-rose-800 font-bold"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                              }`}
                            >
                              Interprétation
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type={champ.typeValeur === "numerique" ? "text" : "text"}
                            disabled={!estModifiable || sauvegardeEnCours}
                            value={valeurActuelle}
                            onChange={(e) =>
                              setValeurObservation(champ.observationId, e.target.value)
                            }
                            placeholder={obtenirPlaceholderChamp(champ.code, champ.unite)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-hidden transition"
                          />
                        </div>

                        {estOuvert && (
                          <div className="pt-1">
                            <input
                              type="text"
                              disabled={!estModifiable || sauvegardeEnCours}
                              value={interpActuelle}
                              onChange={(e) =>
                                setInterpretationObservation(champ.observationId, e.target.value)
                              }
                              placeholder="Note / Interprétation (ex: Normal, À recontrôler...)"
                              className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px] text-slate-700 italic focus:ring-1 focus:ring-rose-400 focus:outline-hidden"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note ou commentaire soignant */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Commentaire ou observation générale (optionnel)
              </label>
              <input
                type="text"
                disabled={!estModifiable || sauvegardeEnCours}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ex : Patient calme, repos 5 min avant prise de tension..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Actions de validation */}
            {estModifiable && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sauvegardeEnCours || nombreChampsRemplis === 0}
                  className="flex-1 py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sauvegardeEnCours ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Enregistrement en cours…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>
                        Enregistrer les constantes{" "}
                        {nombreChampsRemplis > 0
                          ? `(${nombreChampsRemplis} saisie${nombreChampsRemplis > 1 ? "s" : ""})`
                          : ""}
                      </span>
                    </>
                  )}
                </button>

                {nombreChampsRemplis > 0 && (
                  <button
                    type="button"
                    onClick={reinitialiserSaisie}
                    disabled={sauvegardeEnCours}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Colonne latérale : Historique des constantes du dossier */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs h-fit">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Constantes enregistrées</h3>
              <p className="text-xs text-slate-500">
                Paramètres mesurés pour ce dossier ({observationsHistorique.length})
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>

          {chargement && observationsHistorique.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chargement des données…</p>
          ) : observationsHistorique.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs space-y-1">
              <Activity className="h-6 w-6 text-slate-300 mx-auto" />
              <p>Aucune constante enregistrée pour le moment dans ce dossier.</p>
              <p className="text-[11px] text-slate-400">
                Remplissez les champs à gauche et cliquez sur Enregistrer.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {observationsHistorique.map((obs) => (
                <li key={obs.id} className="py-3 text-xs flex justify-between items-start gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{obs.libelle || obs.code}</span>
                      <span className="font-mono text-[10px] text-slate-400">#{obs.code}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-slate-950 font-black font-mono text-sm">
                        {obs.valeur}
                      </span>
                      {obs.unite && (
                        <span className="text-slate-500 text-[11px] font-semibold">
                          {obs.unite}
                        </span>
                      )}
                    </div>
                    {obs.interpretation && (
                      <p className="text-[11px] text-rose-700 italic bg-rose-50/60 px-1.5 py-0.5 rounded border border-rose-100 w-fit">
                        {obs.interpretation}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanneauConstantesVitales;
