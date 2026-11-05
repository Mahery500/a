import React, { useMemo, useState } from "react";
import { Activity, Plus, ChevronRight } from "lucide-react";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { formaterDateHeure } from "@/noyau/utils/dates";
import { ModaleActeExterne } from "./ModaleActeExterne";
import { SectionPiecesJointes } from "./SectionPiecesJointes";
import type { ActePrescritItem } from "../modele/consultation-active.types";
import type { ActeDefinitionApiOutput } from "../api/consultation-active.contrats";


interface ChampMouleApi {
  ordre: number;
  obligatoire: boolean;
  observation: {
    id: number;
    code: string;
    libelle: string;
    typeValeur: "numerique" | "texte";
    uniteCode?: string | null;
    uniteLibelle?: string | null;
  };
}

export interface OngletActesExternesProps {
  catalogueActes: ActeDefinitionApiOutput[];
  actesPrescrits: ActePrescritItem[];
  estModifiable: boolean;
  onEnregistrer: (
    input: Omit<NouvelActeExterneInput, "encounterId">,
  ) => Promise<{ finalise: boolean }>;
  recupererMoule: (acteDefinitionId: number) => Promise<ChampMouleApi[]>;
  listerPiecesJointes: (resultatId: number) => Promise<PieceJointeItem[]>;
  ajouterPieceJointe: (resultatId: number, pj: NouvellePieceJointe) => Promise<PieceJointeItem>;
  changerStatutPieceJointe: (id: number, statut: "actif" | "saisi_par_erreur") => Promise<PieceJointeItem>;
  telechargerPieceJointe: (id: number) => Promise<Blob>;
}

import type {
  NouvelActeExterneInput,
  NouvellePieceJointe,
  PieceJointeItem,
} from "../modele/consultation-active.types";

export const OngletActesExternes: React.FC<OngletActesExternesProps> = ({
  catalogueActes,
  actesPrescrits,
  estModifiable,
  onEnregistrer,
  recupererMoule,
  listerPiecesJointes,
  ajouterPieceJointe,
  changerStatutPieceJointe,
  telechargerPieceJointe,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();
  const [modaleOuverte, setModaleOuverte] = useState(false);

  // Actes externes = ceux dont le code commence par "EXT-" (à défaut : tous).
  // Une fois les fixtures ACTE_EXTERNE en place, filtrer sur categorie.code === "ACTE_EXTERNE".
  const actesExternesCatalogue = useMemo(() => {
    const parCategorie = catalogueActes.filter(
      (a) => a.categorie?.code?.toUpperCase() === "ACTE_EXTERNE",
    );
    if (parCategorie.length > 0) return parCategorie;
    // fallback : tous les actes restent sélectionnables tant que la catégorie n'existe pas
    return catalogueActes;
  }, [catalogueActes]);

  const actesExternesSaisis = useMemo(() => {
    const idsExternes = new Set(actesExternesCatalogue.map((a) => a.id));
    return actesPrescrits.filter((a) => idsExternes.has(a.acteDefinitionId));
  }, [actesPrescrits, actesExternesCatalogue]);

  const handleEnregistrer = async (input: Omit<NouvelActeExterneInput, "encounterId">) => {
    const res = await onEnregistrer(input);
    if (res.finalise) {
      setModaleOuverte(false);
    } else {
      notifierSucces("Acte enregistré en cours, à compléter.");
    }
    return res;
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-asina-600" />
            Actes réalisés à l'extérieur
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Enregistrez une IRM, un bilan biologique ou tout acte effectué hors de notre structure.
          </p>
        </div>
        {estModifiable && (
          <button
            type="button"
            onClick={() => setModaleOuverte(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-asina-600 hover:bg-asina-700 text-white cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Enregistrer un acte externe
          </button>
        )}
      </div>

      {actesExternesSaisis.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Aucun acte externe enregistré pour cette consultation.
        </div>
      ) : (
        <ul className="space-y-3">
          {actesExternesSaisis.map((a) => {
            const resultat = a.resultats?.[0];
            const actif = a.statut === "realise" || a.statut === "en_cours";
            return (
              <li
                key={a.id}
                className="p-3 rounded-xl border border-slate-200 bg-white space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{a.libelle}</div>
                    <div className="text-[11px] text-slate-500">
                      {a.code} · {formaterDateHeure(a.dateRealisation)}
                    </div>
                    {resultat && (
                      <div className="mt-1 text-[11px] text-slate-700">
                        <b>Type :</b> {resultat.type}
                        {resultat.conclusion && ` · ${resultat.conclusion}`}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.statut === "realise"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {a.statut === "realise" ? "Réalisé" : "En cours"}
                  </span>
                </div>

                {resultat && actif && (
                  <SectionPiecesJointes
                    resultatId={resultat.id}
                    estModifiable={estModifiable}
                    lister={listerPiecesJointes}
                    uploader={ajouterPieceJointe}
                    changerStatut={changerStatutPieceJointe}
                    telecharger={telechargerPieceJointe}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ModaleActeExterne
        ouvert={modaleOuverte}
        catalogueActes={actesExternesCatalogue}
        onFermer={() => setModaleOuverte(false)}
        onEnregistrer={handleEnregistrer}
        recupererMoule={recupererMoule}
      />
    </div>
  );
};