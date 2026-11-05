// ui/commun.tsx
import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  ChevronDown,
  ClipboardList,
  Droplets,
  FlaskConical,
  Layers,
  Package,
  Pill,
  Plus,
  Ruler,
  Search,
  Syringe,
  X,
} from "lucide-react";
import { refApi, messageErreur } from "@/briques/stock-commun/api";
import { Bouton, Erreur } from "@/briques/stock-commun/ui";
import type { Option } from "@/briques/stock-commun/types";

/* ================================================================== *
 * Types
 * ================================================================== */
export interface Lien {
  libelle: string;
  onClick: () => void;
}

export interface Exemple {
  titre: string;
  /** Sous-titre ; à défaut, le `code` des valeurs est affiché. */
  detail?: string;
  groupe?: string;
  /** Valeurs appliquées au formulaire quand on clique sur la carte. */
  valeurs: Record<string, any>;
}

export interface ChampDef {
  cle: string;
  libelle: string;
  type: "texte" | "pastilles";
  requis?: boolean;
  placeholder?: string;
  aide?: string;
  defaut?: any;
  choix?: { valeur: string; libelle: string }[];
}

export interface FormProps {
  config: ConfigRef;
  item: any | null;
  onTermine: () => void;
  onFermer: () => void;
}

export interface ConfigRef {
  titre: string;
  nouveau: string;
  modifier: string;
  vide: string;
  icone: React.ReactNode;
  api: {
    liste: () => Promise<any[]>;
    creer: (p: any) => Promise<any>;
    modifier: (id: number, p: any) => Promise<any>;
    supprimer: (id: number) => Promise<any>;
  };
  champs: ChampDef[];
  exemples?: Exemple[];
  resume?: (x: any) => string;
  formulaire?: React.FC<FormProps>;
}

export interface LigneComposition {
  principeActifId: number | "";
  role: "actif" | "adjuvant";
  forceNum: string;
  uniteNumId: number | "";
}

/* ================================================================== *
 * Icônes, styles
 * ================================================================== */
const ic = "h-4 w-4";

/** Une seule icône par rubrique, réutilisée partout (menu, tiroirs, listes). */
export const IC: Record<string, React.ReactNode> = {
  produits: <Package className={ic} />,
  medicaments: <Pill className={ic} />,
  principes: <FlaskConical className={ic} />,
  familles: <Layers className={ic} />,
  presentations: <ClipboardList className={ic} />,
  conditionnements: <Boxes className={ic} />,
  formes: <Droplets className={ic} />,
  voies: <Syringe className={ic} />,
  unites: <Ruler className={ic} />,
};

export const CHAMP =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40";

/* ================================================================== *
 * Constantes
 * ================================================================== */
export type UcumCategorie = "masse" | "volume" | "activite" | "concentration";

export const UCUM_COURANTS: { code: string; libelle: string; categorie: UcumCategorie }[] = [
  { code: "kg", libelle: "Kilogramme", categorie: "masse" },
  { code: "g", libelle: "Gramme", categorie: "masse" },
  { code: "mg", libelle: "Milligramme", categorie: "masse" },
  { code: "µg", libelle: "Microgramme", categorie: "masse" },
  { code: "ng", libelle: "Nanogramme", categorie: "masse" },
  { code: "L", libelle: "Litre", categorie: "volume" },
  { code: "dL", libelle: "Décilitre", categorie: "volume" },
  { code: "mL", libelle: "Millilitre", categorie: "volume" },
  { code: "[iU]", libelle: "Unité Internationale", categorie: "activite" },
  { code: "U", libelle: "Unité enzymatique", categorie: "activite" },
  { code: "%", libelle: "Pourcentage", categorie: "concentration" },
  { code: "mmol", libelle: "Millimole", categorie: "concentration" },
  { code: "mEq", libelle: "Milliéquivalent", categorie: "concentration" },
];

export const UCUM_CATEGORIES: { id: UcumCategorie; titre: string }[] = [
  { id: "masse", titre: "Masse" },
  { id: "volume", titre: "Volume" },
  { id: "activite", titre: "Activité" },
  { id: "concentration", titre: "Concentration" },
];

export const UNITES_BASE = [
  { valeur: "comprime", libelle: "Comprimé", singulier: "comprimé", pluriel: "comprimés", plaquette: true },
  { valeur: "gelule", libelle: "Gélule", singulier: "gélule", pluriel: "gélules", plaquette: true },
  { valeur: "flacon", libelle: "Flacon", singulier: "flacon", pluriel: "flacons", plaquette: false },
  { valeur: "ampoule", libelle: "Ampoule", singulier: "ampoule", pluriel: "ampoules", plaquette: false },
  { valeur: "sachet", libelle: "Sachet", singulier: "sachet", pluriel: "sachets", plaquette: false },
  { valeur: "tube", libelle: "Tube", singulier: "tube", pluriel: "tubes", plaquette: false },
];

export const FORCE_VALIDE = /^\d+(\.\d+)?$/;

/* ================================================================== *
 * Utilitaires
 * ================================================================== */
export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const trier = <T,>(liste: T[], cle: (x: T) => string): T[] =>
  [...liste].sort((a, b) => cle(a).localeCompare(cle(b), "fr"));

export const libelleDe = (x: any): string => x.libelle ?? x.nom ?? x.name ?? `#${x.id}`;
export const enOption = (x: any): Option => ({ id: x.id, libelle: libelleDe(x) });
const options = (liste: () => Promise<any[]>) => async () => (await liste()).map(enOption);

export const listeFamilles = options(refApi.familles.liste);
export const listePrincipes = options(refApi.principesActifs.liste);
export const listeFormes = options(refApi.formes.liste);
export const listeVoies = options(refApi.voies.liste);

export const nomUnite = (valeur: string | undefined, n: number) => {
  const u = UNITES_BASE.find((x) => x.valeur === valeur);
  if (!u) return n > 1 ? "unités" : "unité";
  return n > 1 ? u.pluriel : u.singulier;
};

export const detailCond = (c: any, pres: any): string => {
  const b = Number(c?.nbUnitesParBoite);
  if (!(b > 0)) return "";
  const p = Number(c.nbUnitesParPlaquette);
  return `${b} ${nomUnite(pres?.uniteBase, b)} par boîte${p > 0 ? ` · ${p} par plaquette` : ""}`;
};

export const exemplesLibelles = (libelles: string[]): Exemple[] =>
  libelles.map((libelle) => ({ titre: libelle, valeurs: { libelle } }));

export const exemplesCodes = (paires: [string, string][]): Exemple[] =>
  paires.map(([libelle, code]) => ({ titre: libelle, valeurs: { libelle, code } }));

export const ligneVide = (): LigneComposition => ({
  principeActifId: "",
  role: "actif",
  forceNum: "",
  uniteNumId: "",
});

export const normaliserForce = (s: string) => s.trim().replace(",", ".");

export const famillesDe = (x: any): number[] =>
  (x.familleIds ?? x.familles ?? []).map((f: any) => (typeof f === "object" ? f.id : f));

export const lignesDe = (x: any): LigneComposition[] =>
  (x.ingredients ?? []).map(
    (l: any): LigneComposition => ({
      principeActifId: l.principeActifId ?? l.principeActif?.id ?? "",
      role: l.role === "adjuvant" ? "adjuvant" : "actif",
      forceNum: l.forceNum != null ? String(l.forceNum) : "",
      uniteNumId: l.uniteNumId ?? l.uniteNum?.id ?? "",
    }),
  );

export const compositionDe = (x: any): string => x.nomNormalise || x.libelle || `Médicament #${x.id}`;

/* ================================================================== *
 * Hooks
 * ================================================================== */
export const useSoumission = () => {
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const lancer = async (action: () => Promise<void>, defaut: string) => {
    setOccupe(true);
    setErreur(null);
    try {
      await action();
    } catch (e) {
      setErreur(messageErreur(e, defaut));
    } finally {
      setOccupe(false);
    }
  };
  return { erreur, setErreur, occupe, lancer };
};

export const useInfo = () => {
  const [info, setInfo] = useState<string | null>(null);
  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(null), 3000);
    return () => clearTimeout(t);
  }, [info]);
  return { info, setInfo };
};

/* ================================================================== *
 * UI de base
 * ================================================================== */
/** Champ avec libellé ; `liens` = raccourcis « + Rubrique » vers l'onglet concerné. */
export const Champ: React.FC<{
  libelle?: string;
  requis?: boolean;
  liens?: Lien[];
  aide?: string;
  children: React.ReactNode;
}> = ({ libelle, requis, liens, aide, children }) => (
  <div className="text-sm">
    {(libelle || liens) && (
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="font-medium text-gray-700">
          {libelle}
          {requis && <span className="ml-0.5 text-teal-700">*</span>}
        </span>
        <span className="flex gap-3">
          {liens?.map((l) => (
            <button
              key={l.libelle}
              type="button"
              onClick={l.onClick}
              title={`Ouvrir « ${l.libelle} »`}
              className="inline-flex items-center gap-0.5 text-xs text-teal-700 hover:underline"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              {l.libelle}
            </button>
          ))}
        </span>
      </div>
    )}
    {children}
    {aide && <p className="mt-1 text-xs text-gray-500">{aide}</p>}
  </div>
);

export const Info: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
    >
      <Check className="h-4 w-4" aria-hidden="true" />
      {message}
    </div>
  ) : null;

export const Apercu: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">{children}</div>
);

export const Alerte: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    role="alert"
    className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
  >
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <div>{children}</div>
  </div>
);

/** Tiroir latéral : en-tête, contenu, et pied unique (erreur + Annuler / valider). */
export const Tiroir: React.FC<{
  titre: string;
  icone: React.ReactNode;
  onFermer: () => void;
  onValider: () => void;
  erreur: string | null;
  occupe: boolean;
  ok: string;
  children: React.ReactNode;
}> = ({ titre, icone, onFermer, onValider, erreur, occupe, ok, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFermer]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onFermer} />
      <aside
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement && !e.target.dataset.noSubmit) {
            e.preventDefault();
            onValider();
          }
        }}
      >
        <header className="flex items-center gap-3 border-b px-5 py-4">
          <div className="rounded-lg bg-teal-50 p-2 text-teal-700">{icone}</div>
          <h2 className="flex-1 text-base font-semibold text-gray-900">{titre}</h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 pb-32">{children}</div>
        <footer className="space-y-3 border-t bg-white px-5 py-4">
          <Erreur message={erreur} />
          <div className="flex justify-end gap-2">
            <Bouton disabled={occupe} onClick={onFermer}>
              Annuler
            </Bouton>
            <Bouton variante="primaire" disabled={occupe} onClick={onValider}>
              {occupe ? "Enregistrement…" : ok}
            </Bouton>
          </div>
        </footer>
      </aside>
    </div>
  );
};

/** Choix unique sous forme de cartes (mode plaquettes / unité, UCUM / libre…). */
export function Choix<T extends string>({
  options: opts,
  valeur,
  onChange,
}: {
  options: { valeur: T; titre: string; detail: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <button
            key={o.valeur}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(o.valeur)}
            className={`rounded-xl border px-3 py-2.5 text-left transition ${
              actif
                ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                : "border-gray-300 bg-white hover:border-teal-600"
            }`}
          >
            <div className="text-sm font-medium text-gray-900">{o.titre}</div>
            <div className="text-xs text-gray-500">{o.detail}</div>
          </button>
        );
      })}
    </div>
  );
}

/** Pastille cliquable (choix d'une unité de base, sélection de familles). */
export const Pastille: React.FC<{ actif: boolean; onClick: () => void; children: React.ReactNode }> = ({
  actif,
  onClick,
  children,
}) => (
  <button
    type="button"
    aria-pressed={actif}
    onClick={onClick}
    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
      actif
        ? "border-teal-700 bg-teal-700 text-white"
        : "border-gray-300 bg-white text-gray-700 hover:border-teal-600"
    }`}
  >
    {actif && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
    {children}
  </button>
);

/** Exemples cliquables (un clic remplit les champs du formulaire). */
export const Exemples: React.FC<{
  exemples: Exemple[];
  courant: Record<string, any>;
  onChoisir: (e: Exemple) => void;
}> = ({ exemples, courant, onChoisir }) => {
  const groupes = Array.from(new Set(exemples.map((e) => e.groupe ?? "")));
  return (
    <div className="space-y-3">
      {groupes.map((g) => (
        <div key={g}>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {g || "Exemples courants"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {exemples
              .filter((e) => (e.groupe ?? "") === g)
              .map((e) => {
                const actif = Object.entries(e.valeurs).every(([k, v]) => (courant[k] ?? "") === v);
                const sousTitre = e.detail ?? e.valeurs.code;
                return (
                  <button
                    key={e.titre}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => onChoisir(e)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      actif
                        ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                        : "border-gray-200 bg-white hover:border-teal-500"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{e.titre}</div>
                    {sousTitre && (
                      <div className={`text-xs text-gray-500 ${e.detail ? "" : "font-mono"}`}>{sousTitre}</div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export const Combobox: React.FC<{
  libelle?: string;
  requis?: boolean;
  icone: React.ReactNode;
  options: Option[];
  valeur: number | "";
  onChange: (v: number | "") => void;
  placeholder: string;
  effacable?: boolean;
  liens?: Lien[];
}> = ({ libelle, requis, icone, options, valeur, onChange, placeholder, effacable, liens }) => {
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState("");
  const choisie = options.find((o) => o.id === valeur);
  const filtrees = options.filter((o) => norm(o.libelle).includes(norm(requete)));
  const fermer = () => {
    setOuvert(false);
    setRequete("");
  };

  return (
    <Champ libelle={libelle} requis={requis} liens={liens}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={ouvert}
          className={`${CHAMP} flex items-center gap-2 text-left`}
        >
          <span className="text-teal-700">{icone}</span>
          <span className={`flex-1 truncate ${choisie ? "text-gray-900" : "text-gray-400"}`}>
            {choisie ? choisie.libelle : placeholder}
          </span>
          {choisie && effacable && (
            <span
              role="button"
              aria-label="Retirer"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </button>
        {ouvert && (
          <>
            <div className="fixed inset-0 z-10" onClick={fermer} />
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 p-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                  <input
                    autoFocus
                    data-no-submit="1"
                    value={requete}
                    onChange={(e) => setRequete(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (filtrees[0]) {
                          onChange(filtrees[0].id);
                          fermer();
                        }
                      }
                    }}
                    placeholder="Rechercher…"
                    aria-label="Rechercher"
                    className={`${CHAMP} pl-8`}
                  />
                </div>
              </div>
              <ul role="listbox" className="max-h-52 overflow-y-auto py-1">
                {filtrees.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={o.id === valeur}
                      onClick={() => {
                        onChange(o.id);
                        fermer();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-teal-50"
                    >
                      <span className="flex-1 truncate">{o.libelle}</span>
                      {o.id === valeur && <Check className="h-4 w-4 text-teal-700" />}
                    </button>
                  </li>
                ))}
                {filtrees.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Aucun résultat</li>}
              </ul>
            </div>
          </>
        )}
      </div>
    </Champ>
  );
};