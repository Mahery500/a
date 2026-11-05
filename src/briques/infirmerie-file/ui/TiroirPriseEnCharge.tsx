/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useTypeServiceActif } from "@/cerveau/session";
import { typeEncounterApi } from "@/briques/type-encounters";
import type { TypeEncounter } from "@/briques/type-encounters";
import { messageErreur } from "@/noyau/utils/erreur";

export interface AiguillageCible {
  id: number;
  numTicket: string;
  patientNom?: string;
  type?: "RDV" | "SANS_RDV";
  attenteMinutes?: number;
}

export interface TiroirPriseEnChargeProps {
  ouvert: boolean;
  aiguillage: AiguillageCible | null;
  /** Filtre les types d'encounter par type de service (défaut : service actif de session). */
  typeServiceId?: number | null;
  onFermer: () => void;
  /** Doit renvoyer true si succès (le tiroir se ferme). */
  onValider: (typeEncounterId: number) => Promise<boolean>;
}

const CLE_DERNIER_TYPE = "asina_dernier_type_encounter_infirmerie";

export const TiroirPriseEnCharge: React.FC<TiroirPriseEnChargeProps> = ({
  ouvert,
  aiguillage,
  typeServiceId: typeServiceIdProp,
  onFermer,
  onValider,
}) => {
  const typeServiceActif = useTypeServiceActif();
  const typeServiceId =
    typeServiceIdProp !== undefined ? typeServiceIdProp : typeServiceActif;

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

    typeEncounterApi
      .lister(true, typeServiceId ?? undefined)
      .then((liste) => {
        if (annule) return;
        setTypes(liste);

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
        if (!annule) setErreur(messageErreur(err, "Impossible de charger les types de prise en charge."));
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectionne || enCours) return;
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

  useEffect(() => {
    if (!ouvert) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enCours) onFermer();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [ouvert, enCours, onFermer]);

  if (!ouvert || !aiguillage) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
        onClick={enCours ? undefined : onFermer}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Prise en charge · Ticket ${aiguillage.numTicket}`}
        className="absolute top-0 right-0 bottom-0 w-[560px] max-w-full bg-white flex flex-col"
        style={{ boxShadow: "-12px 0 40px rgba(15,27,61,.25)" }}
      >
        {/* Header */}
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2937]">
              Prise en charge · Ticket {aiguillage.numTicket}
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Précisez la nature de la rencontre avant d'ouvrir le dossier.
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? undefined : onFermer}
            disabled={enCours}
            aria-label="Fermer"
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form
          id="form-tiroir-prise-en-charge"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4"
        >
          {/* Carte patient */}
          <div className="bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px] p-3.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[12px] bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px]">
                {aiguillage.numTicket}
              </span>
              <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0f2f1] text-[#5b6472]">
                {aiguillage.type === "RDV" ? "RDV" : "Sans RDV"}
              </span>
            </div>
            <div className="font-bold text-[16px] text-[#1f2937] mt-1.5">
              {aiguillage.patientNom || "Patient"}
            </div>
            {aiguillage.attenteMinutes !== undefined && (
              <div className="text-[12px] text-[#5b6472]">
                Attente : {aiguillage.attenteMinutes} min
              </div>
            )}
          </div>

          {erreur && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[12px]"
            >
              {erreur}
            </div>
          )}

          {chargement ? (
            <p className="text-[#5b6472] text-sm py-4 text-center">
              Chargement des types disponibles…
            </p>
          ) : types.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-[10px] text-[12px]">
              Aucun type de prise en charge n'est autorisé pour ce service. Demandez à un
              administrateur de les configurer dans{" "}
              <strong>Administration › Types de Prise en Charge</strong>.
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="tiroir-type-encounter"
                  className="block text-[12px] font-bold text-[#5b6472] mb-1.5"
                >
                  Type de prise en charge <span className="text-[#b42318]">*</span>
                </label>
                <select
                  id="tiroir-type-encounter"
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  disabled={enCours}
                  className="w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] focus:border-[#1f9d55] focus:outline-none focus:ring-1 focus:ring-[#1f9d55]/20"
                >
                  <option value="" disabled>
                    — Sélectionner —
                  </option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.libelle} ({t.code})
                    </option>
                  ))}
                </select>
                <p className="text-[12px] text-[#5b6472] mt-1.5">
                  Détermine la nature clinique de la rencontre et les statistiques d'activité.
                </p>
              </div>

              {selectionne?.description && (
                <div className="bg-[#e7f6ed] border border-[#1f9d55] rounded-[10px] p-3 text-[#14703c]">
                  <div className="text-[11px] font-bold uppercase tracking-wide">
                    Description du type
                  </div>
                  <p className="text-[13px] mt-1 leading-relaxed">{selectionne.description}</p>
                </div>
              )}

              <p className="text-[12px] text-[#5b6472]">
                À la confirmation, le dossier s'ouvre et le patient passe en statut « En cours ».
              </p>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="h-[72px] px-6 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white shrink-0">
          <button
            type="button"
            onClick={onFermer}
            disabled={enCours}
            className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-sm font-semibold text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="form-tiroir-prise-en-charge"
            disabled={enCours || !selectionne}
            className="h-10 px-4 rounded-[10px] bg-[#1f9d55] hover:bg-[#14703c] text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {enCours ? "Confirmation…" : "Confirmer la prise en charge"}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default TiroirPriseEnCharge;