/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Loader2, X } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { soinsActesApi } from "../api/soins-actes.api";
import { ActeSaisiItem, StatutActe } from "../modele/soin-acte.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

/** Une ligne du moule d'observations (réponse de GET /acte_definitions/{id}/observations). */
export interface ChampObservationMoule {
  ordre: number;
  obligatoire: boolean;
  observation: {
    id: number;
    code: string;
    libelle: string;
    typeValeur: string; // 'numerique' | 'texte'
    actif: boolean;
    uniteId: number | null;
    uniteCode: string | null;
    uniteLibelle: string | null;
  };
}

export interface ActeDefinitionPourRealisation {
  id: number;
  code: string;
  libelle: string;
}

export interface ModaleRealisationActeProps {
  ouvert: boolean;
  encounterId: number | null;
  acteDefinition: ActeDefinitionPourRealisation | null;
  /** Optionnel : la ligne de demande à laquelle cet acte répond. */
  ligneDemandeId?: number | null;
  /** Renseigné si on complète un acte déjà existant (au lieu d'en créer un). */
  acteExistantId?: number | null;
  onFermer: () => void;
  onTermine: (acte: ActeSaisiItem) => void;
}

export const ModaleRealisationActe: React.FC<ModaleRealisationActeProps> = ({
  ouvert,
  encounterId,
  acteDefinition,
  ligneDemandeId = null,
  acteExistantId = null,
  onFermer,
  onTermine,
}) => {
  const [moule, setMoule] = useState<ChampObservationMoule[]>([]);
  const [valeurs, setValeurs] = useState<Record<number, string>>({});
  const [interpretations, setInterpretations] = useState<Record<number, string>>({});
  const [chargementMoule, setChargementMoule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Chargement du moule dès l'ouverture
  useEffect(() => {
    if (!ouvert || !acteDefinition) {
      setMoule([]);
      return;
    }
    let annule = false;
    setChargementMoule(true);
    setErreur(null);
    setValeurs({});
    setInterpretations({});

    soinsActesApi
      .recupererObservationsAttendues(acteDefinition.id)
      .then((items) => {
        if (annule) return;
        setMoule(items as ChampObservationMoule[]);
      })
      .catch((err) => {
        if (!annule) setErreur(extraireMessageErreur(err));
      })
      .finally(() => {
        if (!annule) setChargementMoule(false);
      });

    return () => {
      annule = true;
    };
  }, [ouvert, acteDefinition]);

  /** Observations obligatoires du moule pour lesquelles aucune valeur n'est saisie. */
  const obligatoiresManquantes = useMemo(
    () => moule.filter((m) => m.obligatoire && (valeurs[m.observation.id] ?? "").trim() === ""),
    [moule, valeurs],
  );

  const totalRenseignees = useMemo(
    () => moule.filter((m) => (valeurs[m.observation.id] ?? "").trim() !== "").length,
    [moule, valeurs],
  );

  /** Statut à envoyer au backend pour respecter ses propres règles. */
  const statutCible: StatutActe =
    moule.length === 0 || obligatoiresManquantes.length === 0 ? "realise" : "en_cours";

  /** Peut-on fermer avec "Réalisé" ? */
  const peutMarquerRealise = obligatoiresManquantes.length === 0;

  const setValeur = (id: number, v: string) => {
    setValeurs((prev) => ({ ...prev, [id]: v }));
    setErreur(null);
  };
  const setInterpretation = (id: number, v: string) => {
    setInterpretations((prev) => ({ ...prev, [id]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encounterId || !acteDefinition) return;

    // 1. Créer (ou récupérer) l'acte avec le bon statut d'emblée
    setSubmitting(true);
    setErreur(null);
    try {
      let acteId = acteExistantId;

      if (acteId === null) {
        const acte = await soinsActesApi.saisirActe({
          encounterId,
          acteDefinitionId: acteDefinition.id,
          statut: statutCible,
          ligneDemandeId: ligneDemandeId ?? null,
        });
        acteId = acte.id;
      }

      // 2. Enchaîner les observations renseignées
      for (const m of moule) {
        const valeur = (valeurs[m.observation.id] ?? "").trim();
        if (valeur === "") continue;

        await soinsActesApi.ajouterObservation(acteId, {
          observationDefinitionId: m.observation.id,
          valeur,
          interpretation: (interpretations[m.observation.id] ?? "").trim() || null,
        });
      }

      // 3. Recharger l'acte complet pour le renvoyer au parent
      const actes = await soinsActesApi.listerActesEncounter(encounterId);
      const final = actes.find((a) => a.id === acteId);
      if (final) onTermine(final);

      onFermer();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!acteDefinition) return null;

  const libelleUnite = (m: ChampObservationMoule) =>
    m.observation.uniteCode || m.observation.uniteLibelle || "";

  return (
    <Modale
      ouvert={ouvert}
      onFermer={submitting ? () => {} : onFermer}
      titre={
        acteExistantId
          ? `Compléter : ${acteDefinition.libelle}`
          : `Réaliser : ${acteDefinition.libelle}`
      }
      icone={<Activity className="h-4 w-4 text-asina-600" />}
      largeurMax="md"
      enfants={
        <form id="form-realisation-acte" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-asina-700 bg-white border border-asina-200 px-1.5 py-0.5 rounded text-[11px]">
                {acteDefinition.code}
              </span>
              <span className="font-semibold text-slate-900">{acteDefinition.libelle}</span>
            </div>
            {ligneDemandeId && (
              <p className="text-[11px] text-slate-500">
                Répond à la demande n° <span className="font-mono">{ligneDemandeId}</span>
              </p>
            )}
          </div>

          {chargementMoule ? (
            <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Chargement du moule d'observations…</span>
            </div>
          ) : moule.length === 0 ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
              <div>
                <span className="font-bold block">Aucune observation attendue</span>
                <span className="text-[11px]">
                  Cet acte se conclut sans relevé de paramètres. Il sera marqué « Réalisé »
                  directement.
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Barre de complétion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span className="font-semibold">
                    {totalRenseignees} / {moule.length} paramètre{moule.length > 1 ? "s" : ""} saisi
                    {totalRenseignees > 1 ? "s" : ""}
                  </span>
                </div>
                {obligatoiresManquantes.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {obligatoiresManquantes.length} obligatoire
                    {obligatoiresManquantes.length > 1 ? "s" : ""} manquante
                    {obligatoiresManquantes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Champs du moule, dans l'ordre du catalogue */}
              <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                {moule.map((m) => {
                  const val = valeurs[m.observation.id] ?? "";
                  const interp = interpretations[m.observation.id] ?? "";
                  const manquant = m.obligatoire && val.trim() === "";
                  return (
                    <div
                      key={m.observation.id}
                      className={`p-3 rounded-lg border transition ${
                        manquant
                          ? "border-amber-300 bg-amber-50/40"
                          : val.trim() !== ""
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <label
                          htmlFor={`obs-${m.observation.id}`}
                          className="font-semibold text-slate-800 flex-1"
                        >
                          {m.observation.libelle}
                          {m.obligatoire && <span className="text-rose-600 ml-1">*</span>}
                          <span className="font-mono text-[10px] text-slate-400 ml-1.5 font-normal">
                            {m.observation.code}
                          </span>
                        </label>
                        {libelleUnite(m) && (
                          <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                            {libelleUnite(m)}
                          </span>
                        )}
                      </div>

                      <input
                        id={`obs-${m.observation.id}`}
                        type="text"
                        inputMode={m.observation.typeValeur === "numerique" ? "decimal" : "text"}
                        value={val}
                        onChange={(e) => setValeur(m.observation.id, e.target.value)}
                        disabled={submitting}
                        placeholder={
                          m.observation.typeValeur === "numerique"
                            ? "Valeur chiffrée…"
                            : "Saisir un texte…"
                        }
                        className="w-full border border-slate-300 rounded p-2 text-xs focus:outline-none focus:border-asina-500"
                      />

                      <input
                        type="text"
                        value={interp}
                        onChange={(e) => setInterpretation(m.observation.id, e.target.value)}
                        disabled={submitting}
                        placeholder="Interprétation (facultatif)"
                        className="w-full mt-1.5 border border-slate-200 rounded p-1.5 text-[11px] italic text-slate-600 focus:outline-none focus:border-asina-500"
                      />
                    </div>
                  );
                })}
              </div>

              {statutCible === "en_cours" && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    L'acte sera enregistré en <strong>« En cours »</strong> tant que les
                    observations obligatoires ne sont pas toutes saisies. Tu pourras compléter plus
                    tard depuis la liste des actes.
                  </span>
                </div>
              )}
            </>
          )}
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-realisation-acte"
            onAnnuler={onFermer}
            enCours={submitting || chargementMoule}
            desactive={submitting || chargementMoule}
            labelValider={
              statutCible === "realise"
                ? acteExistantId
                  ? "Compléter et valider"
                  : "Réaliser l'acte"
                : "Enregistrer (en cours)"
            }
          />
        </div>
      }
    />
  );
};

export default ModaleRealisationActe;
