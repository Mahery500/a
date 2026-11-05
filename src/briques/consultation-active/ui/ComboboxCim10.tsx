/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Search, Check } from "lucide-react";
import type { DiagnosticDefinitionItem } from "@/briques/consultation-active";

export interface ComboboxCim10Props {
  options: DiagnosticDefinitionItem[];
  valeurSelectionnee: DiagnosticDefinitionItem | null;
  onChange: (option: DiagnosticDefinitionItem | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ComboboxCim10: React.FC<ComboboxCim10Props> = ({
  options,
  valeurSelectionnee,
  onChange,
  placeholder = "Tapez un code ou un nom : J18, pneumonie…",
  disabled = false,
}) => {
  const [requete, setRequete] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [indexActif, setIndexActif] = useState(0);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const surClic = (e: MouseEvent) => {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, []);

  const q = requete.trim().toLowerCase();
  const filtres = q
    ? options.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.libelle.toLowerCase().includes(q) ||
          o.codifications?.some((c) => c.code.toLowerCase().includes(q)),
      )
    : options;
  const affiches = filtres.slice(0, 40);

  const choisir = (o: DiagnosticDefinitionItem) => {
    onChange(o);
    setRequete("");
    setOuvert(false);
  };

  const surTouche = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOuvert(true);
      setIndexActif((i) => Math.min(i + 1, affiches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexActif((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && ouvert && affiches[indexActif]) {
      e.preventDefault();
      choisir(affiches[indexActif]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  };

  if (valeurSelectionnee) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-asina-50 border border-asina-200 text-xs">
        <span className="min-w-0 flex items-center gap-2">
          <span className="font-mono font-bold text-asina-800">{valeurSelectionnee.code}</span>
          <span className="text-slate-800 truncate">{valeurSelectionnee.libelle}</span>
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer text-[11px] font-semibold shrink-0"
            aria-label="Changer de diagnostic"
          >
            Changer
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={conteneurRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={ouvert}
          aria-autocomplete="list"
          value={requete}
          onChange={(e) => {
            setRequete(e.target.value);
            setIndexActif(0);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          onKeyDown={surTouche}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-asina-500 focus:ring-1 focus:ring-asina-500 disabled:bg-slate-100"
        />
      </div>

      {ouvert && (
        <div className="absolute z-30 mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {affiches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">
              {q ? `Aucun résultat pour « ${requete.trim()} »` : "Aucun diagnostic disponible."}
            </p>
          ) : (
            <ul role="listbox" className="py-1">
              {affiches.map((o, i) => (
                <li
                  key={o.id}
                  role="option"
                  aria-selected={i === indexActif}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choisir(o);
                  }}
                  onMouseEnter={() => setIndexActif(i)}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 ${
                    i === indexActif ? "bg-asina-50" : ""
                  }`}
                >
                  <span className="font-mono font-bold text-asina-800 min-w-[60px]">{o.code}</span>
                  <span className="flex-1 truncate text-slate-800">{o.libelle}</span>
                  {o.codifications && o.codifications.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {o.codifications.map((c) => `${c.codeSystem}:${c.code}`).join(", ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ComboboxCim10;