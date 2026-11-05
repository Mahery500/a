/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Pill,
  Send,
  ShieldAlert,
} from "lucide-react";
import type {
  ActePrescritItem,
  DemandeActeItem,
  DiagnosticMedical,
} from "@/briques/consultation-active";
import type { Allergie } from "@/briques/allergies";
import type { OrdonnanceItem } from "@/briques/ordonnances/api/ordonnances.api";
import type { OngletConsultation } from "./TabsConsultation";
import { PanneauHistoriqueMedical } from "@/briques/historique-medical";

type Vue = "resume" | "dossier";

export interface ResumeConsultationProps {
  diagnostics: DiagnosticMedical[];
  actes: ActePrescritItem[];
  demandes: DemandeActeItem[];
  ordonnances: OrdonnanceItem[];
  allergiesActives?: Allergie[];
  onOuvrirOnglet: (onglet: OngletConsultation) => void;
  onOuvrirDossier?: () => void;

  /** Nécessaires pour l'onglet « Dossier patient ». */
  patientId?: number | null;
  encounterId?: number;

  /**
   * Si fourni, affiche un chevron `›` dans la barre d'onglets qui permet
   * au parent de replier la colonne en rail 52 px.
   */
  onReplier?: () => void;
}

interface SectionDef {
  id: OngletConsultation;
  titre: string;
  icone: React.ReactNode;
  count: number;
  vide: string;
  items: React.ReactNode[];
}

export const ResumeConsultation: React.FC<ResumeConsultationProps> = ({
  diagnostics,
  actes,
  demandes,
  ordonnances,
  allergiesActives = [],
  onOuvrirOnglet,
  onOuvrirDossier,
  patientId,
  encounterId,
  onReplier,
}) => {
  const [vue, setVue] = useState<Vue>("resume");

  const sections: SectionDef[] = [
    {
      id: "diag",
      titre: "Diagnostics",
      icone: <ClipboardList className="h-3.5 w-3.5" />,
      count: diagnostics.length,
      vide: "Aucun diagnostic posé",
      items: diagnostics.map((d) => (
        <div key={d.id} className="py-1">
          <span className="font-mono text-[10px] font-bold text-rose-700">
            [{d.code}]
          </span>{" "}
          <span className="text-[#1f2937]">{d.libelle}</span>
          <div className="text-[10px] text-[#5b6472] capitalize">
            {d.type} · {d.statut}
          </div>
        </div>
      )),
    },
    {
      id: "allergies",
      titre: "Allergies",
      icone: <ShieldAlert className="h-3.5 w-3.5" />,
      count: allergiesActives.length,
      vide: "Aucune allergie active",
      items: allergiesActives.map((a) => (
        <div key={a.id} className="py-1">
          <div
            className={`truncate ${
              a.criticalite === "high"
                ? "text-rose-700 font-bold"
                : "text-[#1f2937]"
            }`}
          >
            {a.criticalite === "high" && "⚠ "}
            {a.allergieDefinitionLibelle ??
              a.principeActifLibelle ??
              `Allergie #${a.id}`}
          </div>
          <div className="text-[10px] text-[#5b6472]">
            {a.type === "allergy" ? "Allergie" : "Intolérance"} ·{" "}
            {a.statut === "active"
              ? "Active"
              : a.statut === "inactive"
                ? "Inactive"
                : "Résolue"}
          </div>
        </div>
      )),
    },
    {
      id: "actes",
      titre: "Actes",
      icone: <Activity className="h-3.5 w-3.5" />,
      count: actes.length,
      vide: "Aucun acte",
      items: actes.map((a) => (
        <div key={a.id} className="py-1">
          <div className="text-[#1f2937] truncate">{a.libelle}</div>
          <div className="text-[10px] text-[#5b6472] font-mono">
            {a.statut}
          </div>
        </div>
      )),
    },
    {
      id: "dem",
      titre: "Demandes",
      icone: <Send className="h-3.5 w-3.5" />,
      count: demandes.length,
      vide: "Aucune demande",
      items: demandes.map((d) => (
        <div key={d.id} className="py-1">
          <div className="text-[#1f2937] truncate">
            {d.acteDefinitionLibelle}
          </div>
          {d.urgente && (
            <span className="text-[9px] font-bold text-rose-700 uppercase">
              Urgent
            </span>
          )}
        </div>
      )),
    },
    {
      id: "ord",
      titre: "Ordonnance",
      icone: <Pill className="h-3.5 w-3.5" />,
      count: ordonnances.length,
      vide: "Aucune ordonnance",
      items: ordonnances.flatMap((o) =>
        (o.lignes ?? []).map((l, i) => (
          <div key={`${o.id}-${i}`} className="py-1">
            <div className="text-[#1f2937] truncate">
              {l.medicamentLibelle ??
                l.medicamentNom ??
                `Médicament #${l.medicamentId}`}
            </div>
            <div className="text-[10px] text-[#5b6472]">
              {l.quantite} u. · {l.posologie}
            </div>
          </div>
        )),
      ),
    },
  ];

  return (
    <aside
      className="bg-white rounded-[14px] border border-[#e5e7eb] overflow-hidden flex flex-col h-full min-h-0"
      aria-label="Résumé de la consultation"
    >
      {/* ---------- Barre d'onglets + bouton de repli ---------- */}
      <div className="flex border-b border-[#e5e7eb] shrink-0">
        <button
          type="button"
          onClick={() => setVue("resume")}
          className={`flex-1 h-10 text-sm cursor-pointer transition-colors ${
            vue === "resume"
              ? "text-[#14703c] font-bold border-b-2 border-[#1f9d55]"
              : "text-[#5b6472] font-semibold border-b-2 border-transparent hover:text-[#1f2937]"
          }`}
        >
          Résumé
        </button>

        <button
          type="button"
          onClick={() => {
            setVue("dossier");
            if (!patientId) onOuvrirDossier?.();
          }}
          className={`flex-1 h-10 text-sm cursor-pointer transition-colors ${
            vue === "dossier"
              ? "text-[#14703c] font-bold border-b-2 border-[#1f9d55]"
              : "text-[#5b6472] font-semibold border-b-2 border-transparent hover:text-[#1f2937]"
          }`}
        >
          Dossier patient
        </button>

        {onReplier && (
          <button
            type="button"
            onClick={onReplier}
            aria-label="Réduire le dossier patient"
            title="Réduire le dossier patient"
            className="w-9 grid place-items-center text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] cursor-pointer shrink-0 border-l border-[#f0f2f1] transition-colors focus-visible:outline-2 focus-visible:outline-[#1f9d55]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ---------- Corps défilant ---------- */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {vue === "resume" ? (
          <div>
            {sections.map((s, idx) => (
              <div
                key={s.id}
                className={`px-4 py-3 ${
                  idx < sections.length - 1
                    ? "border-b border-[#f0f2f1]"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOuvrirOnglet(s.id)}
                  className="flex items-center justify-between w-full mb-1.5 cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[#1f2937] group-hover:text-[#14703c]">
                    {s.icone}
                    <span>{s.titre}</span>
                    {s.count > 0 && (
                      <CheckCircle2
                        className="h-3 w-3 text-[#1f9d55]"
                        aria-label="Renseigné"
                      />
                    )}
                  </span>

                  <ChevronRight className="h-3 w-3 text-[#5b6472] group-hover:text-[#14703c]" />
                </button>

                {s.count === 0 ? (
                  <p className="text-[11px] text-[#5b6472] italic">
                    {s.vide}
                  </p>
                ) : (
                  <div className="text-xs space-y-0.5 max-h-40 overflow-y-auto pr-1">
                    {s.items}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <PanneauHistoriqueMedical
            patientId={patientId}
            encounterCourantId={encounterId}
          />
        )}
      </div>
    </aside>
  );
};

export default ResumeConsultation;