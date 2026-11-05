// src/briques/allergies/ui/FormulaireChangerStatutModale.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";

import type {
  Allergie,
  AllergieStatut,
  ChangerStatutInput,
  ReferentielsAllergie,
} from "../modele/allergie.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";

export interface FormulaireChangerStatutModaleProps {
  ouvert: boolean;
  allergie: Allergie;
  referentiels: ReferentielsAllergie | null;
  enCours: boolean;
  onFermer: () => void;
  onValider: (input: ChangerStatutInput) => Promise<boolean>;
}

export const FormulaireChangerStatutModale: React.FC<
  FormulaireChangerStatutModaleProps
> = ({ ouvert, allergie, referentiels, enCours, onFermer, onValider }) => {
  const [statut, setStatut] = useState<AllergieStatut>(allergie.statut);
  const [dateFin, setDateFin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    setStatut(allergie.statut);
    setDateFin(allergie.dateFin?.slice(0, 10) ?? "");
    setErreur(null);
  }, [ouvert, allergie]);

  const aujourdhui = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const j = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${j}`;
  }, []);

  // Résolution : une allergie résolue ne peut plus revenir à "active"
  const statutsDisponibles = (referentiels?.statuts ?? []).filter(
    (o) => !(allergie.statut === "resolved" && o.valeur === "active"),
  );

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (dateFin && statut !== "resolved") {
      return setErreur("La date de fin n'est valide qu'avec le statut « résolue ».");
    }
    if (dateFin && dateFin > aujourdhui) {
      return setErreur("La date de fin ne peut pas être dans le futur.");
    }
    if (
      dateFin &&
      allergie.dateDebut &&
      dateFin < allergie.dateDebut.slice(0, 10)
    ) {
      return setErreur("La date de fin ne peut pas précéder la date de début.");
    }

    await onValider({
      statut,
      dateFin: statut === "resolved" ? dateFin || null : null,
    });
  };

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre="Changer le statut de l'allergie"
      largeurMax="sm"
      enfants={
        <form id="form-statut-allergie" onSubmit={soumettre} className="space-y-3.5 text-sm">
          {erreur && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-[12px]"
            >
              {erreur}
            </div>
          )}

          <div>
            <label htmlFor="statut-select" className={LABEL}>
              Statut cible
            </label>
            <select
              id="statut-select"
              value={statut}
              onChange={(e) => {
                const v = e.target.value as AllergieStatut;
                setStatut(v);
                if (v !== "resolved") setDateFin("");
              }}
              disabled={enCours}
              className={CHAMP}
            >
              {statutsDisponibles.map((o) => (
                <option key={o.valeur} value={o.valeur}>
                  {o.libelle}
                </option>
              ))}
            </select>
          </div>

          {statut === "resolved" && (
            <div>
              <label htmlFor="date-fin" className={LABEL}>
                Date de fin <span className="font-normal">(défaut : aujourd'hui)</span>
              </label>
              <input
                id="date-fin"
                type="date"
                value={dateFin}
                max={aujourdhui}
                onChange={(e) => setDateFin(e.target.value)}
                disabled={enCours}
                className={CHAMP}
              />
            </div>
          )}
        </form>
      }
      pied={
        <ActionsFormulaire
          idFormulaire="form-statut-allergie"
          onAnnuler={onFermer}
          enCours={enCours}
          labelValider="Confirmer"
        />
      }
    />
  );
};

export default FormulaireChangerStatutModale;