/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { MedicamentCatalogue } from "@/briques/ordonnances/api/ordonnances.api";

const LIMITE = 30;

const normaliser = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export interface RechercheMedicamentProps {
  medicaments: MedicamentCatalogue[];
  valeur: string;
  onChange: (id: string) => void;
  exclusIds?: string[];
  chargement?: boolean;
  disabled?: boolean;
}

export const RechercheMedicament: React.FC<RechercheMedicamentProps> = ({
  medicaments,
  valeur,
  onChange,
  exclusIds = [],
  chargement = false,
  disabled = false,
}) => {
  const [requete, setRequete] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [indexActif, setIndexActif] = useState(0);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listeRef = useRef<HTMLUListElement>(null);

  const selectionne = valeur ? (medicaments.find((m) => String(m.id) === valeur) ?? null) : null;

  const jetons = normaliser(requete).split(/\s+/).filter(Boolean);
  const resultats = medicaments.filter((m) => {
    if (exclusIds.includes(String(m.id))) return false;
    if (jetons.length === 0) return true;
    const texte = normaliser(`${m.libelle} ${m.forme ?? ""} ${m.code ?? ""}`);
    return jetons.every((j) => texte.includes(j));
  });
  const affiches = resultats.slice(0, LIMITE);
  const restants = resultats.length - affiches.length;

  useEffect(() => {
    const surClic = (e: MouseEvent) => {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    listeRef.current
      ?.querySelector<HTMLElement>('[data-actif="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [indexActif, ouvert]);

  const choisir = (m: MedicamentCatalogue) => {
    onChange(String(m.id));
    setRequete("");
    setOuvert(false);
  };

  const effacer = () => {
    onChange("");
    setRequete("");
    setOuvert(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const surTouche = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOuvert(true);
      setIndexActif((i) => Math.min(i + 1, Math.max(affiches.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndexActif((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (ouvert && affiches[indexActif]) choisir(affiches[indexActif]);
    } else if (e.key === "Escape") {
      setOuvert(false);
    }
  };

  if (selectionne) {
    return (
      <div className="flex items-center justify-between gap-2 bg-white border border-violet-300 rounded-lg p-2 text-xs">
        <span className="min-w-0 truncate">
          <strong className="text-slate-900">{selectionne.libelle}</strong>
          {selectionne.forme && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-semibold">
              {selectionne.forme}
            </span>
          )}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={effacer}
            className="shrink-0 text-slate-400 hover:text-slate-700 cursor-pointer"
            title="Changer de médicament"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={conteneurRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={ouvert}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={chargement ? "Chargement du catalogue…" : "Rechercher un médicament…"}
        value={requete}
        onChange={(e) => {
          setRequete(e.target.value);
          setIndexActif(0);
          setOuvert(true);
        }}
        onFocus={() => setOuvert(true)}
        onKeyDown={surTouche}
        className="w-full bg-white border border-slate-300 rounded-lg p-2 pl-8 text-xs focus:outline-hidden focus:ring-1 focus:ring-violet-500 disabled:bg-slate-100"
      />
      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />

      {ouvert && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {chargement ? (
            <p className="px-3 py-2 text-xs text-slate-400">Chargement…</p>
          ) : affiches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">
              {requete.trim()
                ? `Aucun médicament pour « ${requete.trim()} »`
                : "Catalogue vide."}
            </p>
          ) : (
            <ul ref={listeRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
              {affiches.map((m, i) => (
                <li
                  key={m.id}
                  role="option"
                  aria-selected={i === indexActif}
                  data-actif={i === indexActif}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choisir(m);
                  }}
                  onMouseEnter={() => setIndexActif(i)}
                  className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-2 ${
                    i === indexActif ? "bg-violet-50" : ""
                  }`}
                >
                  <span className="min-w-0 truncate">
                    <strong className="text-slate-900">{m.libelle}</strong>
                    {m.forme && <span className="ml-1.5 text-slate-500">{m.forme}</span>}
                  </span>
                  {m.code && (
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{m.code}</span>
                  )}
                </li>
              ))}
              {restants > 0 && (
                <li className="px-3 py-1.5 text-[10px] text-slate-400 italic border-t border-slate-100">
                  + {restants} autre{restants > 1 ? "s" : ""}… affinez la recherche
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RechercheMedicament;