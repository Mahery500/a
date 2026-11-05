/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { LIBELLES_DOMAINE_SERVICE } from "@/briques/services/modele/service.types";
import type {
  OptionServiceSite,
  OptionSite,
} from "@/briques/affectations/modele/affectation.types";
import { LABEL, CHAMP, AIDE, Requis } from "./stylesFormulaire";

export interface ValeurAffectation {
  siteId: string;
  serviceId: string;
  /** ISO YYYY-MM-DD. */
  dateDebut: string;
  dateFin: string;
  estPrincipal: boolean;
}

export const aujourdhuiIso = (): string => new Date().toISOString().slice(0, 10);

export const affectationVide = (): ValeurAffectation => ({
  siteId: "",
  serviceId: "",
  dateDebut: aujourdhuiIso(),
  dateFin: "",
  estPrincipal: true,
});

export interface ChampsAffectationProps {
  valeur: ValeurAffectation;
  onChange: (maj: Partial<ValeurAffectation>) => void;
  optionsSites: OptionSite[];
  optionsServices: OptionServiceSite[];
  chargement?: boolean;
  erreurChargement?: string | null;
  /** Message d'incompatibilité profil / service (null = OK). */
  incompatibilite?: string | null;
  /** Phrase ajoutée après le message d'incompatibilité. */
  conseil?: string;
  desactive?: boolean;
}

/**
 * Champs communs de l'étape 4 « Affectation » (création de compte)
 * et du panneau « Changer de service » (fiche utilisateur).
 */
export const ChampsAffectation: React.FC<ChampsAffectationProps> = ({
  valeur,
  onChange,
  optionsSites,
  optionsServices,
  chargement = false,
  erreurChargement = null,
  incompatibilite = null,
  conseil = "Choisis un autre service.",
  desactive = false,
}) => {
  // Services du site choisi uniquement (siteId 0 = service commun à tous les sites)
  const servicesDuSite = useMemo(() => {
    if (!valeur.siteId) return [];
    const id = Number(valeur.siteId);
    return optionsServices.filter((s) => s.siteId === id || s.siteId === 0);
  }, [optionsServices, valeur.siteId]);

  const bloque = desactive || chargement;

  return (
    <>
      {erreurChargement && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs">
          {erreurChargement}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label className={LABEL}>
          Site d’implantation <Requis />
          <select
            value={valeur.siteId}
            onChange={(e) => onChange({ siteId: e.target.value, serviceId: "" })}
            disabled={bloque || optionsSites.length === 0}
            className={CHAMP}
          >
            <option value="">{chargement ? "Chargement…" : "Choisir un établissement"}</option>
            {optionsSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        </label>

        <label className={LABEL}>
          Service <Requis />
          <select
            value={valeur.serviceId}
            onChange={(e) => onChange({ serviceId: e.target.value })}
            disabled={bloque || !valeur.siteId || servicesDuSite.length === 0}
            aria-invalid={Boolean(incompatibilite)}
            className={`${CHAMP} ${incompatibilite ? "border-[#b42318]" : ""}`}
          >
            <option value="">Choisir le service</option>
            {servicesDuSite.map((s) => (
              <option key={s.serviceId} value={s.serviceId}>
                {s.nomService}
                {s.domaine ? ` — ${LIBELLES_DOMAINE_SERVICE[s.domaine]}` : ""}
              </option>
            ))}
          </select>
          <span className={AIDE}>
            {valeur.siteId && servicesDuSite.length === 0 && !chargement
              ? "Aucun service n’est rattaché à ce site."
              : "Services du site choisi uniquement."}
          </span>
        </label>
      </div>

      {incompatibilite && (
        <div
          role="alert"
          className="bg-[#fef3f2] border border-[#fda29b] text-[#912018] rounded-[10px] px-3 py-2.5 text-xs"
        >
          <b>Affectation impossible.</b> {incompatibilite} {conseil}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label className={LABEL}>
          Date de prise de fonction <Requis />
          <input
            type="date"
            value={valeur.dateDebut}
            onChange={(e) => onChange({ dateDebut: e.target.value })}
            disabled={desactive}
            className={CHAMP}
          />
        </label>
        <label className={LABEL}>
          Date de fin (optionnelle)
          <input
            type="date"
            value={valeur.dateFin}
            onChange={(e) => onChange({ dateFin: e.target.value })}
            disabled={desactive}
            className={CHAMP}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-[#1f2937] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={valeur.estPrincipal}
          onChange={(e) => onChange({ estPrincipal: e.target.checked })}
          disabled={desactive}
          className="h-4 w-4 accent-[#1f9d55]"
        />
        Définir comme affectation principale
      </label>
    </>
  );
};

export default ChampsAffectation;