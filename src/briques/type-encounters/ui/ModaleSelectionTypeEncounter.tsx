/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Stethoscope } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { ChampSelection } from "@/noyau/ui/ChampSelection";
import { useTypeServiceActif } from "@/cerveau/session";
import { typeEncounterApi } from "../api/type-encounter.api";
import { TypeEncounter } from "../modele/type-encounter.types";
import { messageErreur } from "@/noyau/utils/erreur";

const CLE_DERNIER_TYPE = "asina_dernier_type_encounter";

export interface ModaleSelectionTypeEncounterProps {
  ouvert: boolean;
  titre?: string;
  patientNom?: string;
  numTicket?: string;
  /**
   * Filtre les types de prise en charge autorisés pour ce type de service.
   *
   * - non fourni (undefined) → le modal utilise automatiquement le type de
   *   service du service actif de la session (via useTypeServiceActif()).
   * - `null` explicite → pas de filtre : toutes les natures actives sont proposées.
   * - nombre → filtre sur ce type de service précis.
   */
  typeServiceId?: number | null;
  onFermer: () => void;
  /** Doit renvoyer true si succès : la modale se ferme alors. */
  onValider: (typeEncounterId: number) => Promise<boolean>;
}

export const ModaleSelectionTypeEncounter: React.FC<ModaleSelectionTypeEncounterProps> = ({
  ouvert,
  titre = "Type de prise en charge",
  patientNom,
  numTicket,
  typeServiceId: typeServiceIdProp,
  onFermer,
  onValider,
}) => {
  // Le service actif de la session fournit son type de service par défaut.
  const typeServiceActif = useTypeServiceActif();

  // Priorité : prop explicite > service actif de la session > pas de filtre.
  const typeServiceId = typeServiceIdProp !== undefined ? typeServiceIdProp : typeServiceActif;

  const [types, setTypes] = useState<TypeEncounter[]>([]);
  const [typeId, setTypeId] = useState<string>("");
  const [chargement, setChargement] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    let annule = false;
    setChargement(true);
    setErreur(null);

    // ↓ Filtre côté backend : ?actif=true&typeServiceId=X
    typeEncounterApi
      .lister(true, typeServiceId ?? undefined)
      .then((liste) => {
        if (annule) return;
        setTypes(liste);

        // Pré-sélection : dernier utilisé s'il est toujours actif et autorisé,
        // sinon CONS_GEN, sinon le premier.
        let dernier: number | null = null;
        try {
          const brut = localStorage.getItem(CLE_DERNIER_TYPE);
          if (brut) dernier = Number(brut);
        } catch {
          /* ignore */
        }

        const choix =
          liste.find((t) => t.id === dernier)?.id ??
          liste.find((t) => t.code === "CONS_GEN")?.id ??
          liste[0]?.id ??
          null;

        setTypeId(choix !== null ? String(choix) : "");
      })
      .catch((err) => {
        if (!annule) {
          setErreur(messageErreur(err, "Impossible de charger les types de prise en charge."));
        }
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [ouvert, typeServiceId]);

  const selectionne = useMemo(
    () => types.find((t) => String(t.id) === typeId) ?? null,
    [types, typeId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectionne) return;

    setEnCours(true);
    setErreur(null);
    try {
      const ok = await onValider(selectionne.id);
      if (ok) {
        try {
          localStorage.setItem(CLE_DERNIER_TYPE, String(selectionne.id));
        } catch {
          /* ignore */
        }
        onFermer();
      }
    } catch (err) {
      setErreur(messageErreur(err, "Échec de la prise en charge."));
    } finally {
      setEnCours(false);
    }
  };

  // Distingue "aucun type configuré" et "aucun type autorisé pour ce service".
  const aucunTypePourCeService = !chargement && types.length === 0 && typeServiceId != null;

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre={titre}
      icone={<Stethoscope className="h-4 w-4 text-asina-600" />}
      largeurMax="md"
      description="Sélectionnez la nature de cette rencontre avant d'ouvrir le dossier."
      enfants={
        <form
          id="form-selection-type-encounter"
          onSubmit={handleSubmit}
          className="space-y-4 text-xs"
        >
          {(patientNom || numTicket) && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              {numTicket && (
                <span className="font-mono text-[10px] bg-white text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold inline-block">
                  Ticket {numTicket}
                </span>
              )}
              {patientNom && (
                <span className="block text-sm font-bold text-slate-900">{patientNom}</span>
              )}
            </div>
          )}

          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          {chargement ? (
            <p className="text-slate-400 py-4 text-center">Chargement des types disponibles…</p>
          ) : types.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px]">
              {aucunTypePourCeService ? (
                <>
                  Aucun type de prise en charge n'est autorisé pour ce service. Demandez à un
                  administrateur de les configurer dans{" "}
                  <strong>Administration › Types de Prise en Charge</strong> (fiche du type : «
                  Types de service autorisés »).
                </>
              ) : (
                <>
                  Aucun type de prise en charge actif n'est configuré. Demandez à un administrateur
                  de les activer dans <strong>Administration › Types de Prise en Charge</strong>.
                </>
              )}
            </div>
          ) : (
            <>
              <ChampSelection
                label="Type de prise en charge *"
                valeur={typeId}
                onChange={setTypeId}
                obligatoire
                desactive={enCours}
                placeholderOption="— Sélectionner —"
                options={types.map((t) => ({
                  valeur: String(t.id),
                  libelle: `${t.libelle} (${t.code})`,
                }))}
                aide="Détermine la nature clinique de la rencontre et conditionne les statistiques d'activité."
              />

              {selectionne?.description && (
                <div className="p-3 bg-asina-50/60 border border-asina-150 rounded-lg text-[11px] text-asina-900 italic">
                  {selectionne.description}
                </div>
              )}
            </>
          )}
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-selection-type-encounter"
            onAnnuler={onFermer}
            enCours={enCours}
            desactive={enCours || !selectionne}
            labelValider="Confirmer la prise en charge"
          />
        </div>
      }
    />
  );
};

export default ModaleSelectionTypeEncounter;
