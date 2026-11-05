// src/briques/entreprises/ui/FicheEntrepriseTiroir.tsx
import React, { useState } from "react";
import {
  X, Users, UploadCloud, Printer, FileDown, Trash2, Edit2, Loader2,
} from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { EntreprisePartenaire } from "../modele/entreprise.types";
import { libelleSmie } from "./FormulaireEntrepriseTiroir";

const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center justify-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";
const BTN_DANGER =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#fda29b] bg-white text-[#b42318] hover:bg-rose-50 cursor-pointer transition disabled:opacity-50";
const EXT_CHIP =
  "inline-block bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";

const Ligne: React.FC<{ libelle: string; children: React.ReactNode }> = ({
  libelle,
  children,
}) => (
  <div className="flex gap-3 py-2.5 border-t border-[#f0f2f1] first:border-t-0 first:pt-1">
    <span className="text-[12px] font-bold text-[#5b6472] w-[150px] shrink-0">{libelle}</span>
    <span className="flex-1 text-[13px] text-[#1f2937] min-w-0 break-words">{children}</span>
  </div>
);

const Vide: React.FC = () => (
  <span className="text-[#5b6472] italic text-[12px]">Non renseigné</span>
);

export interface FicheEntrepriseTiroirProps {
  ouvert: boolean;
  entreprise: EntreprisePartenaire | null;
  mode?: ModeAffichage;
  onFermer: () => void;
  onModifier: () => void;
  onImporter: () => void;
  onImprimer: () => Promise<void> | void;
  onTelechargerPdf: () => Promise<void> | void;
  onSupprimer: () => void;
  enCours?: boolean;
}

export const FicheEntrepriseTiroir: React.FC<FicheEntrepriseTiroirProps> = ({
  ouvert,
  entreprise,
  mode = "edition",
  onFermer,
  onModifier,
  onImporter,
  onImprimer,
  onTelechargerPdf,
  onSupprimer,
  enCours = false,
}) => {
  const estLectureSeule = mode === "lecture";
  const [impressionEnCours, setImpressionEnCours] = useState(false);
  const [telechargementEnCours, setTelechargementEnCours] = useState(false);

  if (!entreprise) return null;

  const nbAgents = entreprise.nombreAgents ?? 0;
  const sansAgents = nbAgents === 0;

  const handleImprimer = async () => {
    setImpressionEnCours(true);
    try {
      await onImprimer();
    } finally {
      setImpressionEnCours(false);
    }
  };

  const handleTelecharger = async () => {
    setTelechargementEnCours(true);
    try {
      await onTelechargerPdf();
    } finally {
      setTelechargementEnCours(false);
    }
  };

  const carteEnCours = impressionEnCours || telechargementEnCours;

  return (
    <TiroirLateral ouvert={ouvert} onFermer={onFermer} libelle={entreprise.nom}>
      <div className="flex flex-col h-full min-h-0">
        {/* En-tête */}
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold text-[#1f2937] leading-tight truncate">
              {entreprise.nom}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              {entreprise.smie && (
                <span className={`${PUCE} bg-[#e7f6ed] text-[#14703c]`}>
                  {libelleSmie(entreprise.smie)}
                </span>
              )}
              {entreprise.matriculeAsina && (
                <span className={EXT_CHIP}>Racine : {entreprise.matriculeAsina}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onFermer}
            disabled={enCours}
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className={SECTION}>Identité</div>
          <div>
            <Ligne libelle="Raison sociale">
              {entreprise.raisonSociale || <Vide />}
            </Ligne>
            <Ligne libelle="Adresse">{entreprise.adresse || <Vide />}</Ligne>
            <Ligne libelle="Contact">{entreprise.contact || <Vide />}</Ligne>
            <Ligne libelle="N° CNAPS">
              {entreprise.numeroCnaps ? (
                <span className="font-mono">{entreprise.numeroCnaps}</span>
              ) : (
                <Vide />
              )}
            </Ligne>
          </div>

          <div className={SECTION}>Salariés</div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#5b6472]" />
            <div>
              <b className="text-lg text-[#1f2937]">{nbAgents}</b>{" "}
              <span className="text-[13px] text-[#5b6472]">
                salarié{nbAgents > 1 ? "s" : ""} enregistré{nbAgents > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {!estLectureSeule && (
            <button
              type="button"
              onClick={onImporter}
              disabled={enCours}
              className={`${BTN} w-full`}
            >
              <UploadCloud className="w-4 h-4" />
              Importer des salariés
            </button>
          )}

          <div className={SECTION}>Cartes d'adhérents</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImprimer}
              disabled={carteEnCours || sansAgents || enCours}
              className={`${BTN} flex-1`}
              title={sansAgents ? "Aucun salarié à imprimer" : undefined}
            >
              {impressionEnCours ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              Imprimer
            </button>
            <button
              type="button"
              onClick={handleTelecharger}
              disabled={carteEnCours || sansAgents || enCours}
              className={`${BTN} flex-1`}
              title={sansAgents ? "Aucun salarié à exporter" : undefined}
            >
              {telechargementEnCours ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              PDF
            </button>
          </div>
          {sansAgents && (
            <p className="text-[11px] text-[#5b6472] italic">
              Importez d'abord des salariés pour générer les cartes.
            </p>
          )}
        </div>

        {/* Pied */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-between shrink-0">
          {!estLectureSeule ? (
            <button
              type="button"
              onClick={onSupprimer}
              disabled={enCours}
              className={BTN_DANGER}
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onFermer}
              disabled={enCours}
              className={BTN}
            >
              Fermer
            </button>
            {!estLectureSeule && (
              <button
                type="button"
                onClick={onModifier}
                disabled={enCours}
                className={BTN_PRIMAIRE}
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}
          </div>
        </div>
      </div>
    </TiroirLateral>
  );
};

export default FicheEntrepriseTiroir;