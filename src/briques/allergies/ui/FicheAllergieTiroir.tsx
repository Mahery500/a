// src/briques/allergies/ui/FicheAllergieTiroir.tsx

import React, { useState } from "react";
import { Plus, Repeat, X } from "lucide-react";

import type { ModeAffichage } from "@/cerveau/permissions/types";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";

import {
  LIBELLES_CATEGORIE,
  type Allergie,
  type AllergieDefinitionSummary,
  type ChangerStatutInput,
  type NouvelleReactionInput,
  type ReferentielsAllergie,
} from "../modele/allergie.types";
import {
  BadgeCriticalite,
  BadgeSeverite,
  BadgeStatut,
  BadgeVerification,
} from "./BadgesAllergie";
import { FormulaireChangerStatutModale } from "./FormulaireChangerStatutModale";
import { FormulaireReactionTiroir } from "./FormulaireReactionTiroir";

const LABEL = "text-[12px] font-bold text-[#5b6472] mb-1";
const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";

const fmt = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";

export interface FicheAllergieTiroirProps {
  ouvert: boolean;
  allergie: Allergie | null;
  mode?: ModeAffichage;
  definitionsActives: AllergieDefinitionSummary[];
  referentiels: ReferentielsAllergie | null;
  enCours: boolean;
  onFermer: () => void;
  onChangerStatut: (id: number, input: ChangerStatutInput) => Promise<boolean>;
  onAjouterReaction: (
    id: number,
    input: NouvelleReactionInput,
  ) => Promise<boolean>;
}

const Champ: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div className={LABEL}>{label}</div>
    <div className="text-sm text-[#1f2937]">{children}</div>
  </div>
);

export const FicheAllergieTiroir: React.FC<FicheAllergieTiroirProps> = ({
  ouvert,
  allergie,
  mode = "edition",
  definitionsActives,
  referentiels,
  enCours,
  onFermer,
  onChangerStatut,
  onAjouterReaction,
}) => {
  const [statutOuvert, setStatutOuvert] = useState(false);
  const [reactionOuvert, setReactionOuvert] = useState(false);
  const lectureSeule = mode === "lecture";

  const libelle = allergie
    ? (allergie.allergieDefinitionLibelle ??
      allergie.principeActifLibelle ??
      `Allergie #${allergie.id}`)
    : "";

  return (
    <>
      <TiroirLateral
        ouvert={ouvert}
        onFermer={onFermer}
        libelle="Fiche allergie"
      >
        {allergie && (
          <div className="flex flex-col h-full min-h-0">
            <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold leading-tight truncate">
                  {libelle}
                </h2>
                <p className="text-[12px] text-[#5b6472] mt-0.5">
                  {LIBELLES_CATEGORIE[allergie.categorie]}
                  {allergie.allergieDefinitionCode
                    ? ` · ${allergie.allergieDefinitionCode}`
                    : allergie.principeActifId
                      ? ` · Principe actif #${allergie.principeActifId}`
                      : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onFermer}
                aria-label="Fermer"
                className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <BadgeStatut statut={allergie.statut} />
                <BadgeCriticalite valeur={allergie.criticalite} />
                <BadgeVerification valeur={allergie.verificationStatut} />
              </div>

              <div className={SECTION}>Détails</div>
              <div className="grid grid-cols-2 gap-4">
                <Champ label="Type">
                  {allergie.type === "allergy" ? "Allergie" : "Intolérance"}
                </Champ>
                <Champ label="Dernière occurrence">
                  {fmt(allergie.derniereOccurrence)}
                </Champ>
                <Champ label="Date de début">{fmt(allergie.dateDebut)}</Champ>
                <Champ label="Date de fin">{fmt(allergie.dateFin)}</Champ>
              </div>

              {allergie.allergieDefinitionCodifications.length > 0 && (
                <Champ label="Codifications">
                  <div className="flex flex-wrap gap-1.5">
                    {allergie.allergieDefinitionCodifications.map((c) => (
                      <span
                        key={`${c.codeSystem}|${c.code}`}
                        className="px-2 py-0.5 rounded-md bg-[#e7f6ed] text-[#14703c] font-mono text-xs font-bold"
                      >
                        {c.codeSystem} : {c.code}
                      </span>
                    ))}
                  </div>
                </Champ>
              )}

              {allergie.note && (
                <Champ label="Note clinique">
                  <p className="whitespace-pre-wrap">{allergie.note}</p>
                </Champ>
              )}

              <div className={SECTION}>
                Réactions ({allergie.reactions.length})
              </div>
              {allergie.reactions.length === 0 ? (
                <p className="text-[13px] text-[#5b6472]">
                  Aucune réaction documentée.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {allergie.reactions.map((r) => (
                    <li
                      key={r.id}
                      className="p-3 border border-[#e5e7eb] rounded-[10px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-sm">{r.manifestation}</b>
                        <BadgeSeverite valeur={r.severite} />
                      </div>
                      <div className="text-[12px] text-[#5b6472] mt-1">
                        {fmt(r.dateReaction)}
                        {r.exposition ? ` · ${r.exposition}` : ""}
                        {r.allergieDefinitionLibelle
                          ? ` · ${r.allergieDefinitionLibelle}`
                          : ""}
                      </div>
                      {r.description && (
                        <p className="text-[13px] mt-1.5 whitespace-pre-wrap">
                          {r.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!lectureSeule && (
              <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatutOuvert(true)}
                  disabled={enCours}
                  className={BTN}
                >
                  <Repeat className="w-4 h-4" />
                  Changer le statut
                </button>
                <button
                  type="button"
                  onClick={() => setReactionOuvert(true)}
                  disabled={enCours}
                  className={BTN_PRIMAIRE}
                >
                  <Plus className="w-[18px] h-[18px]" />
                  Ajouter une réaction
                </button>
              </div>
            )}
          </div>
        )}
      </TiroirLateral>

      {allergie && (
        <>
          <FormulaireChangerStatutModale
            ouvert={statutOuvert}
            allergie={allergie}
            referentiels={referentiels}
            enCours={enCours}
            onFermer={() => setStatutOuvert(false)}
            onValider={async (input) => {
              const ok = await onChangerStatut(allergie.id, input);
              if (ok) setStatutOuvert(false);
              return ok;
            }}
          />
          <FormulaireReactionTiroir
            ouvert={reactionOuvert}
            allergieId={allergie.id}
            definitionsActives={definitionsActives}
            referentiels={referentiels}
            enCours={enCours}
            onFermer={() => setReactionOuvert(false)}
            onValider={async (input) => {
              const ok = await onAjouterReaction(allergie.id, input);
              if (ok) setReactionOuvert(false);
              return ok;
            }}
          />
        </>
      )}
    </>
  );
};

export default FicheAllergieTiroir;