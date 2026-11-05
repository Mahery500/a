/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Activity,
  ClipboardList,
  FileDown,
  Pill,
  Send,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";

export type OngletConsultation =
  | "diag"
  | "constat"
  | "allergies"
  | "actes"
  | "ext"
  | "dem"
  | "ord";

const TABS: Array<{ id: OngletConsultation; label: string; icon: React.ReactNode }> = [
  { id: "diag", label: "Diagnostic", icon: <ClipboardList className="h-3.5 w-3.5" /> },
  { id: "constat", label: "Constats", icon: <Stethoscope className="h-3.5 w-3.5" /> },
  { id: "allergies", label: "Allergies", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  { id: "actes", label: "Actes et résultats", icon: <Activity className="h-3.5 w-3.5" /> },
  { id: "ext", label: "Actes externes", icon: <FileDown className="h-3.5 w-3.5" /> },
  { id: "dem", label: "Demandes aux soignants", icon: <Send className="h-3.5 w-3.5" /> },
  { id: "ord", label: "Ordonnance", icon: <Pill className="h-3.5 w-3.5" /> },
];

export interface TabsConsultationProps {
  actif: OngletConsultation;
  onChange: (o: OngletConsultation) => void;
  counts: Record<OngletConsultation, number>;
}

export const TabsConsultation: React.FC<TabsConsultationProps> = ({
  actif,
  onChange,
  counts,
}) => (
  <div
    className="flex border-b border-[#e5e7eb] overflow-x-auto scrollbar-none"
    role="tablist"
    aria-label="Sections de la consultation"
  >
    {TABS.map((t) => {
      const estActif = actif === t.id;
      return (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={estActif}
          onClick={() => onChange(t.id)}
          className={`px-4 h-12 text-sm flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            estActif
              ? "text-[#14703c] font-bold border-[#1f9d55]"
              : "text-[#5b6472] font-semibold border-transparent hover:text-[#1f2937]"
          }`}
        >
          {t.icon}
          <span>{t.label}</span>
          <span
            className={`px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
              estActif ? "bg-[#e7f6ed] text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"
            }`}
          >
            {counts[t.id] ?? 0}
          </span>
        </button>
      );
    })}
  </div>
);

export default TabsConsultation;