/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { ActeMedical } from "../modele/catalogue-actes.types";
import { ObservationDefinition, ActeObservationLiaison } from "@/briques/observation-definitions";
import { observationDefinitionApi } from "@/briques/observation-definitions/api/observation-definition.api";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { Plus, Trash2, Activity, ArrowUp, ArrowDown } from "lucide-react";

export interface ModaleObservationsActeProps {
  ouvert: boolean;
  acte: ActeMedical | null;
  onFermer: () => void;
}

export const ModaleObservationsActe: React.FC<ModaleObservationsActeProps> = ({
  ouvert,
  acte,
  onFermer,
}) => {
  const notif = useNotifier();

  const [toutesDefinitions, setToutesDefinitions] = useState<ObservationDefinition[]>([]);
  const [liaisons, setLiaisons] = useState<ActeObservationLiaison[]>([]);
  const [chargement, setChargement] = useState(false);
  const [enCoursEnregistrement, setEnCoursEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert || !acte) return;

    let annule = false;
    setChargement(true);
    setErreur(null);

    Promise.all([
      observationDefinitionApi.listerDefinitions(true),
      observationDefinitionApi.recupererObservationsActe(acte.id),
    ])
      .then(([defs, obsExistantes]) => {
        if (annule) return;
        setToutesDefinitions(defs);
        setLiaisons(obsExistantes.sort((a, b) => a.ordre - b.ordre));
      })
      .catch((err) => {
        if (annule) return;
        setErreur(messageErreur(err, "Impossible de charger le moule d’observations de l’acte."));
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [ouvert, acte]);

  const handleAjouterObservation = (obsId: number) => {
    if (liaisons.some((l) => l.observationId === obsId)) return;
    const def = toutesDefinitions.find((d) => d.id === obsId);
    if (!def) return;

    const nouvelOrdre = liaisons.length + 1;
    setLiaisons((prev) => [
      ...prev,
      {
        observationId: obsId,
        ordre: nouvelOrdre,
        obligatoire: false,
        observation: def,
      },
    ]);
  };

  const handleSupprimer = (obsId: number) => {
    setLiaisons((prev) => {
      const filtrees = prev.filter((l) => l.observationId !== obsId);
      return filtrees.map((item, index) => ({ ...item, ordre: index + 1 }));
    });
  };

  const handleBasculeObligatoire = (obsId: number) => {
    setLiaisons((prev) =>
      prev.map((l) => (l.observationId === obsId ? { ...l, obligatoire: !l.obligatoire } : l)),
    );
  };

  const handleMonter = (index: number) => {
    if (index <= 0) return;
    setLiaisons((prev) => {
      const copie = [...prev];
      const temp = copie[index - 1];
      copie[index - 1] = copie[index];
      copie[index] = temp;
      return copie.map((item, idx) => ({ ...item, ordre: idx + 1 }));
    });
  };

  const handleDescendre = (index: number) => {
    if (index >= liaisons.length - 1) return;
    setLiaisons((prev) => {
      const copie = [...prev];
      const temp = copie[index + 1];
      copie[index + 1] = copie[index];
      copie[index] = temp;
      return copie.map((item, idx) => ({ ...item, ordre: idx + 1 }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acte) return;

    setEnCoursEnregistrement(true);
    setErreur(null);
    try {
      await observationDefinitionApi.definirObservationsActe(
        acte.id,
        liaisons.map((l, index) => ({
          observationId: l.observationId,
          ordre: index + 1,
          obligatoire: l.obligatoire,
        })),
      );
      notif.succes(`Moule d’observations de l’acte « ${acte.libelle} » enregistré.`);
      onFermer();
    } catch (err) {
      setErreur(messageErreur(err, "Échec de l’enregistrement du moule d’observations."));
    } finally {
      setEnCoursEnregistrement(false);
    }
  };

  if (!acte) return null;

  const observationsDisponibles = toutesDefinitions.filter(
    (d) => !liaisons.some((l) => l.observationId === d.id),
  );

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCoursEnregistrement ? () => {} : onFermer}
      titre={`Moule d’observations attendues : ${acte.libelle} (${acte.code})`}
      largeurMax="md"
      enfants={
        <form id="form-observations-acte" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-start gap-2">
            <Activity className="w-4 h-4 text-asina-600 shrink-0 mt-0.5" />
            <div className="text-[11px] space-y-0.5">
              <span className="font-bold text-slate-800 block">
                Règle médicale du moule d’observations
              </span>
              <span>
                Définissez les paramètres cliniques obligatoires ou recommandés que le soignant doit
                renseigner lors de la réalisation de cet acte. Un acte qui attend des observations
                obligatoires ne peut être marqué « Réalisé » que lorsque toutes sont renseignées.
              </span>
            </div>
          </div>

          {chargement ? (
            <div className="p-8 text-center text-slate-400">
              Chargement des observations de l’acte...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Sélecteur d'ajout d'observation */}
              {observationsDisponibles.length > 0 && (
                <div className="flex gap-2 items-center">
                  <select
                    id="select-ajout-obs"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAjouterObservation(Number(e.target.value));
                        e.target.value = "";
                      }
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs focus:border-asina-500 font-medium"
                  >
                    <option value="" disabled>
                      + Ajouter une observation attendue au moule...
                    </option>
                    {observationsDisponibles.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.libelle} (
                        {d.typeValeur === "numerique" ? d.uniteCode || "num" : "texte"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Liste ordonnée des observations attendues */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">
                  Observations attendues ({liaisons.length})
                </span>

                {liaisons.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    Aucune observation attendue pour cet acte (l’acte se conclut sans relevé de
                    paramètres).
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {liaisons.map((item, idx) => {
                      const def =
                        item.observation ||
                        toutesDefinitions.find((d) => d.id === item.observationId);
                      return (
                        <div
                          key={item.observationId}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-600">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">
                                {def?.libelle || `Observation #${item.observationId}`}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                                <span>{def?.code}</span>
                                <span>•</span>
                                <span>
                                  {def?.typeValeur === "numerique"
                                    ? `Numérique (${def.uniteCode || "sans unité"})`
                                    : "Texte"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                              <input
                                type="checkbox"
                                checked={item.obligatoire}
                                onChange={() => handleBasculeObligatoire(item.observationId)}
                                className="rounded text-asina-600"
                              />
                              <span
                                className={
                                  item.obligatoire ? "font-bold text-amber-700" : "text-slate-600"
                                }
                              >
                                Obligatoire
                              </span>
                            </label>

                            <div className="flex items-center border border-slate-200 rounded bg-slate-50">
                              <button
                                type="button"
                                onClick={() => handleMonter(idx)}
                                disabled={idx === 0}
                                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                title="Monter d’un rang"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDescendre(idx)}
                                disabled={idx === liaisons.length - 1}
                                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                title="Descendre d’un rang"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSupprimer(item.observationId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Retirer du moule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-observations-acte"
            onAnnuler={onFermer}
            enCours={enCoursEnregistrement}
            desactive={enCoursEnregistrement || chargement}
            labelValider="Enregistrer le moule"
          />
        </div>
      }
    />
  );
};
