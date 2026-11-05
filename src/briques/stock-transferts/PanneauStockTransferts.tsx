// stock-transferts/PanneauStockTransferts.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Check,
  Loader2,
  Minus,
  MoreHorizontal,
  Package,
  Plus,
  X,
} from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions";
import { stockApi, refApi, messageErreur } from "../stock-commun/api";
import { useListe } from "../stock-commun/useListe";
import { Erreur, formatDate } from "../stock-commun/ui";
import type { StatutTransfert } from "../stock-commun/types";
import { useStockPermissions } from "@/assemblages/stock/useStockPermissions";
import { GardeAccesStock } from "@/assemblages/stock/GardeAccesStock";

/* -------------------------------------------------------------------------- */
/*  Tokens de style (cahier des charges)                                       */
/* -------------------------------------------------------------------------- */

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-1";

// Boutons : 40 px (48 px mobile), rayon 10 px, texte 14 px
const BTN = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_PRIMAIRE = `${BTN} bg-green-700 text-white hover:bg-green-800`;
const BTN_SECONDAIRE = `${BTN} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;

// Cartes : blanc, bordure 1 px, rayon 14 px, sans ombre
const CARTE = "rounded-[14px] border border-gray-200 bg-white";

// Libellé de champ : 12 px gras gris
const LIBELLE = "text-xs font-bold text-gray-600";
// En-tête de tableau : 11 px gras capitales .05em gris
const TH =
  "h-11 border-b border-gray-200 bg-gray-50 px-4 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-gray-600";

// Pastille de filtre : padding 6 14, 13 px, bordure verte si active
const filtreCls = (actif: boolean) =>
  `inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-[14px] py-[6px] text-[13px] transition md:min-h-0 ${FOCUS} ${
    actif
      ? "border-green-600 bg-green-50 font-semibold text-green-800"
      : "border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50"
  }`;

const statuts: Record<StatutTransfert, { t: string; cls: string }> = {
  en_attente: { t: "En attente", cls: "bg-amber-50 text-amber-800" },
  valide: { t: "Validé", cls: "bg-green-50 text-green-800" },
  annule: { t: "Annulé", cls: "bg-red-50 text-red-700" },
};

const FILTRES: { cle: "tous" | StatutTransfert; t: string }[] = [
  { cle: "tous", t: "Tous" },
  { cle: "en_attente", t: "En attente" },
  { cle: "valide", t: "Validés" },
  { cle: "annule", t: "Annulés" },
];

/** « 33 boîtes + 10 u. » */
const enBoites = (unites: number, parBoite: number) => {
  const boites = Math.floor(unites / parBoite);
  const reste = unites % parBoite;
  return `${boites} boîte${boites > 1 ? "s" : ""}${reste ? ` + ${reste} u.` : ""}`;
};

/* -------------------------------------------------------------------------- */
/*  Petits composants                                                          */
/* -------------------------------------------------------------------------- */

/** Pastille : rayon 999, 12 px gras, padding 2 px 10 px */
const Pastille: React.FC<{ texte: string; cls: string }> = ({ texte, cls }) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full px-[10px] py-[2px] text-xs font-bold ${cls}`}
  >
    {texte}
  </span>
);

/** Code technique : monospace 12 px gras, fond vert clair, rayon 6, padding 3 7 */
const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="rounded-md bg-green-50 px-[7px] py-[3px] font-mono text-xs font-bold text-green-800">
    {children}
  </code>
);

const Etoile = () => (
  <span className="ml-0.5 text-red-600" aria-hidden="true">
    *
  </span>
);

/** Menu « ⋯ » à la place des icônes d'action */
const MenuLigne: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const clic = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("mousedown", clic);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", clic);
      document.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
        className={`flex h-11 w-11 items-center justify-center rounded-[10px] text-gray-600 hover:bg-gray-100 md:h-9 md:w-9 ${FOCUS}`}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>
      {ouvert && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-52 rounded-[10px] border border-gray-200 bg-white p-1 shadow-lg"
          onClick={() => setOuvert(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const ItemMenu: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, danger, children }) => (
  <button
    type="button"
    role="menuitem"
    disabled={disabled}
    onClick={onClick}
    className={`flex min-h-[44px] w-full items-center rounded-md px-3 text-left text-sm font-medium disabled:opacity-50 md:min-h-[36px] ${FOCUS} ${
      danger ? "text-red-700 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

/** Stepper 3 étapes : cercle vert plein = étape faite / en cours */
const ETAPES = ["Lot", "Destination", "Quantité"];

const Stepper: React.FC<{ etape: number }> = ({ etape }) => (
  <ol className="flex items-center gap-2" aria-label="Étapes du transfert">
    {ETAPES.map((nom, i) => {
      const n = i + 1;
      const faite = n < etape;
      const courante = n === etape;
      const pleine = faite || courante;
      return (
        <li
          key={nom}
          className="flex flex-1 items-center gap-2 last:flex-none"
          aria-current={courante ? "step" : undefined}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
              pleine ? "border-green-700 bg-green-700 text-white" : "border-gray-300 bg-white text-gray-500"
            }`}
          >
            {faite ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
          </span>
          <span className={`text-[13px] ${courante ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
            {nom}
          </span>
          {n < ETAPES.length && (
            <span className={`h-0.5 flex-1 rounded ${faite ? "bg-green-700" : "bg-gray-200"}`} aria-hidden="true" />
          )}
        </li>
      );
    })}
  </ol>
);

/** Tiroir 560 px à droite (desktop) / volet du bas (mobile) */
const Tiroir: React.FC<{ titre: string; sousTitre?: string; onFermer: () => void; children: React.ReactNode }> = ({
  titre,
  sousTitre,
  onFermer,
  children,
}) => {
  const panneau = useRef<HTMLDivElement>(null);
  const fermerRef = useRef(onFermer);
  fermerRef.current = onFermer;

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    panneau.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        fermerRef.current();
        return;
      }
      if (e.key !== "Tab" || !panneau.current) return;
      const f = panneau.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!f.length) return;
      const premier = f[0];
      const dernier = f[f.length - 1];
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("keydown", touche);
      precedent?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onFermer} aria-hidden="true" />
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tiroir-titre"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-[20px] bg-white shadow-2xl outline-none md:h-full md:max-h-none md:w-[560px] md:rounded-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-300 md:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h3 id="tiroir-titre" className="text-[19px] font-bold text-gray-900">
              {titre}
            </h3>
            {sousTitre && <p className="text-[13px] text-gray-600">{sousTitre}</p>}
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onFermer}
            className={`flex h-11 w-11 items-center justify-center rounded-[10px] text-gray-600 hover:bg-gray-100 md:h-10 md:w-10 ${FOCUS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Formulaire (3 étapes)                                                      */
/* -------------------------------------------------------------------------- */

const FormulaireTransfert: React.FC<{
  origineId: number;
  onTermine: () => void;
  onAnnuler: () => void;
}> = ({ origineId, onTermine, onAnnuler }) => {
  const sites = useListe(stockApi.sites);
  const stocks = useListe(() => stockApi.niveaux(origineId), [origineId]);
  const produits = useListe(stockApi.produits);
  const conds = useListe(refApi.conditionnements.liste);
  const [etape, setEtape] = useState(1);
  const [destId, setDestId] = useState<number | "">("");
  const [stockId, setStockId] = useState<number | "">("");
  const [boites, setBoites] = useState("1");
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  // Unités par boîte : valeur de l'API stocks si présente, sinon produit -> conditionnement
  const parBoiteDe = (produitId?: number, direct?: number | null): number => {
    if (Number(direct) > 0) return Number(direct);
    const p = produits.items.find((x) => x.id === produitId);
    const c = conds.items.find((x: any) => x.id === p?.conditionnementId);
    return Number((c as any)?.nbUnitesParBoite) || 0;
  };

  const lots = stocks.items.filter((s) => s.quantite > 0);
  const ligne = stocks.items.find((s) => s.id === stockId);
  const parBoite = parBoiteDe(ligne?.produitId, ligne?.nbUnitesParBoite);
  const maxBoites = parBoite > 0 && ligne ? Math.floor(ligne.quantite / parBoite) : 0;
  const nb = Number(boites);
  const nbValide = Number.isInteger(nb) && nb >= 1;

  const origine = sites.items.find((s) => s.id === origineId);
  const destination = sites.items.find((s) => s.id === destId);
  const destinations = sites.items.filter((s) => s.id !== origineId);

  const choisirLot = (id: number) => {
    setStockId(id);
    setBoites("1");
    setErreur(null);
  };

  const valider = async () => {
    if (!destId) return setErreur("Choisissez le site de destination.");
    if (!ligne?.produitId || !ligne.lotId) return setErreur("Choisissez un lot.");
    if (!(parBoite > 0))
      return setErreur("Conditionnement inconnu pour ce produit : transfert en boîtes impossible.");
    if (!nbValide) return setErreur("Indiquez un nombre entier de boîtes.");
    if (nb > maxBoites)
      return setErreur(`Stock insuffisant : ${maxBoites} boîte(s) complète(s) disponible(s).`);
    setOccupe(true);
    setErreur(null);
    try {
      await stockApi.creerTransfert({
        siteOrigineId: origineId,
        siteDestinationId: Number(destId),
        produitId: ligne.produitId,
        lotId: ligne.lotId,
        quantite: nb,
      });
      onTermine();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setOccupe(false);
    }
  };

  const suivant = () => {
    setErreur(null);
    if (etape === 1) {
      if (!ligne) return setErreur("Choisissez un lot.");
      return setEtape(2);
    }
    if (etape === 2) {
      if (!destId) return setErreur("Choisissez le site de destination.");
      return setEtape(3);
    }
    valider();
  };

  const retour = () => {
    setErreur(null);
    if (etape === 1) onAnnuler();
    else setEtape(etape - 1);
  };

  const continuerDesactive =
    occupe ||
    (etape === 1 && !ligne) ||
    (etape === 2 && !destId) ||
    (etape === 3 && (!(parBoite > 0) || !nbValide || nb > maxBoites));

  return (
    <>
      <div className="border-b border-gray-200 px-5 py-4">
        <Stepper etape={etape} />
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 text-sm">
        <Erreur message={erreur} />

        {/* Rappel du contexte */}
        {etape > 1 && ligne && (
          <div className={`${CARTE} flex items-center gap-3 p-3`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gray-100 text-gray-600">
              <Package className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-gray-900">{ligne.produitLibelle}</p>
              <p className="text-xs text-gray-600">
                <Code>{ligne.lotNumero ?? "—"}</Code>
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-gray-600">
              {parBoite > 0 ? enBoites(ligne.quantite, parBoite) : `${ligne.quantite} u.`}
            </span>
          </div>
        )}

        {/* Étape 1 : lot */}
        {etape === 1 && (
          <section aria-labelledby="t-lot" className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h4 id="t-lot" className={LIBELLE}>
                Lot à transférer
                <Etoile />
              </h4>
              <span className="text-xs text-gray-600">Depuis {origine?.name ?? "le site actif"}</span>
            </div>

            {lots.length === 0 ? (
              <p className="rounded-[10px] border border-dashed border-gray-300 p-4 text-center text-gray-600">
                Aucun lot en stock sur ce site.
              </p>
            ) : (
              <div role="radiogroup" aria-labelledby="t-lot" className="space-y-2">
                {lots.map((s) => {
                  const pb = parBoiteDe(s.produitId, s.nbUnitesParBoite);
                  const actif = s.id === stockId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      onClick={() => choisirLot(s.id)}
                      className={`flex min-h-[56px] w-full items-center gap-3 rounded-[10px] border p-3 text-left transition ${FOCUS} ${
                        actif
                          ? "border-green-600 bg-green-50"
                          : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                          actif ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Package className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-gray-900">{s.produitLibelle}</span>
                        <span className="mt-0.5 block">
                          <Code>{s.lotNumero ?? "—"}</Code>
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-xs tabular-nums text-gray-600">
                        {pb > 0 ? enBoites(s.quantite, pb) : `${s.quantite} u.`}
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          actif ? "text-green-700" : "text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-5 w-5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Étape 2 : destination */}
        {etape === 2 && (
          <section aria-labelledby="t-dest" className="space-y-2">
            <h4 id="t-dest" className={LIBELLE}>
              Site de destination
              <Etoile />
            </h4>
            <div role="radiogroup" aria-labelledby="t-dest" className="flex flex-wrap gap-2">
              {destinations.map((s) => {
                const actif = s.id === destId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={actif}
                    onClick={() => setDestId(s.id)}
                    className={filtreCls(actif)}
                  >
                    {actif && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    {s.name}
                  </button>
                );
              })}
              {destinations.length === 0 && <p className="text-gray-600">Aucun autre site disponible.</p>}
            </div>
            <p className="text-xs text-gray-600">
              Le stock sera retiré de {origine?.name ?? "le site actif"} et ajouté au site choisi.
            </p>
          </section>
        )}

        {/* Étape 3 : quantité */}
        {etape === 3 && (
          <section aria-labelledby="t-qte" className="space-y-3">
            <label id="t-qte" htmlFor="nb-boites" className={`block ${LIBELLE}`}>
              Quantité à transférer
              <Etoile />
            </label>

            {!ligne ? (
              <p className="text-gray-600">Choisissez d’abord un lot.</p>
            ) : !(parBoite > 0) ? (
              <p className="rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {produits.items.length === 0 || conds.items.length === 0
                  ? "Chargement du conditionnement…"
                  : "Ce produit n’a pas de conditionnement : transfert en boîtes impossible."}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center overflow-hidden rounded-[10px] border border-gray-300 bg-white">
                    <button
                      type="button"
                      aria-label="Moins une boîte"
                      disabled={nb <= 1}
                      onClick={() => setBoites(String(Math.max(1, nb - 1)))}
                      className={`flex h-12 w-12 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 md:h-10 md:w-10 ${FOCUS}`}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <input
                      id="nb-boites"
                      type="number"
                      min={1}
                      step={1}
                      max={maxBoites || undefined}
                      inputMode="numeric"
                      aria-describedby="aide-qte"
                      aria-invalid={nbValide && nb > maxBoites}
                      value={boites}
                      onChange={(e) => setBoites(e.target.value)}
                      className="h-12 w-16 border-x border-gray-200 text-center text-sm tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600 md:h-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="Plus une boîte"
                      disabled={nb >= maxBoites}
                      onClick={() => setBoites(String(Math.min(maxBoites, (nbValide ? nb : 0) + 1)))}
                      className={`flex h-12 w-12 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 md:h-10 md:w-10 ${FOCUS}`}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <span className="text-gray-700">boîte{nb > 1 ? "s" : ""}</span>
                  <button
                    type="button"
                    onClick={() => setBoites(String(maxBoites))}
                    disabled={maxBoites === 0 || nb === maxBoites}
                    className={`ml-auto min-h-[44px] rounded-[10px] px-3 text-[13px] font-semibold text-green-800 hover:bg-green-50 disabled:opacity-40 md:min-h-10 ${FOCUS}`}
                  >
                    Tout ({maxBoites})
                  </button>
                </div>

                <p id="aide-qte" className="text-xs tabular-nums text-gray-600">
                  {parBoite} u. par boîte · disponible : {enBoites(ligne.quantite, parBoite)}
                </p>
                {nbValide && nb > maxBoites && (
                  <p className="text-xs font-medium text-red-700" role="alert">
                    Maximum {maxBoites} boîte(s) complète(s).
                  </p>
                )}

                {destination && nbValide && (
                  <div
                    className="rounded-[10px] border border-green-200 bg-green-50 p-3 text-[13px] text-green-900"
                    aria-live="polite"
                  >
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      {origine?.name ?? "Origine"}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      {destination.name}
                    </span>
                    <span className="block tabular-nums">
                      {nb} boîte{nb > 1 ? "s" : ""} · {nb * parBoite} u.
                    </span>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {/* Pied fixe : Retour / Continuer */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-3">
        <button type="button" className={BTN_SECONDAIRE} onClick={retour}>
          {etape === 1 ? "Annuler" : "Retour"}
        </button>
        <button type="button" className={BTN_PRIMAIRE} disabled={continuerDesactive} onClick={suivant}>
          {occupe && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {etape < 3 ? "Continuer" : occupe ? "Transfert…" : "Créer le transfert"}
        </button>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*  Panneau                                                                    */
/* -------------------------------------------------------------------------- */

export const PanneauStockTransferts: React.FC<{ mode: ModeAffichage; siteActifId?: number }> = ({
  mode,
  siteActifId,
}) => {
  const permissions = useStockPermissions();
  const { items, erreur, recharger } = useListe(stockApi.transferts);
  const [creation, setCreation] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"tous" | StatutTransfert>("tous");
  const [enCours, setEnCours] = useState<number | null>(null);

  const compteurs = useMemo(() => {
    const c: Record<string, number> = { tous: items.length };
    items.forEach((t) => {
      c[t.statut] = (c[t.statut] ?? 0) + 1;
    });
    return c;
  }, [items]);

  const visibles = useMemo(
    () => (filtre === "tous" ? items : items.filter((t) => t.statut === filtre)),
    [items, filtre],
  );

  if (!permissions.peutGererTransferts) {
    return (
      <GardeAccesStock message="Seul un Gestionnaire de stock est habilité à créer ou valider des transferts inter-sites." />
    );
  }

  const editable = mode === "edition";
  const enAttente = compteurs.en_attente ?? 0;

  const action = async (id: number, fn: () => Promise<unknown>, confirmation?: string) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setMessage(null);
    setEnCours(id);
    try {
      await fn();
      await recharger();
    } catch (e) {
      setMessage(messageErreur(e));
    } finally {
      setEnCours(null);
    }
  };

  const annuler = (id: number) =>
    action(
      id,
      () => stockApi.annulerTransfert(id),
      "Annuler ce transfert ? Le stock sera remis au site d’origine.",
    );

  const nouveauDesactive = !siteActifId;

  return (
    <div className="space-y-[14px] px-4 py-5 sm:px-6">
      {/* En-tête de page */}
      <div className={`${CARTE} flex flex-wrap items-center justify-between gap-3 px-5 py-4`}>
        <div>
          <h2 className="text-[22px] font-bold leading-tight text-gray-900">Transferts entre sites</h2>
          <p className="text-[13px] text-gray-600">
            Mouvements de boîtes d’un site hospitalier à un autre, avec suivi du statut.
          </p>
        </div>
        {editable && (
          <button
            type="button"
            className={`${BTN_PRIMAIRE} hidden md:inline-flex`}
            disabled={nouveauDesactive}
            onClick={() => setCreation(true)}
            title={nouveauDesactive ? "Sélectionnez le site d’origine" : undefined}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouveau transfert
          </button>
        )}
      </div>

      <Erreur message={erreur ?? message} />

      {/* Bandeau de stats : une seule ligne blanche */}
      <div className={`${CARTE} flex flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3`}>
        {[
          { t: "Total", v: compteurs.tous ?? 0, c: "text-gray-900" },
          { t: "En attente", v: compteurs.en_attente ?? 0, c: "text-amber-700" },
          { t: "Validés", v: compteurs.valide ?? 0, c: "text-green-700" },
          { t: "Annulés", v: compteurs.annule ?? 0, c: "text-red-700" },
        ].map((s) => (
          <div key={s.t} className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-gray-600">{s.t}</span>
            <span className={`text-xl font-bold tabular-nums ${s.c}`}>{s.v}</span>
          </div>
        ))}
      </div>

      {enAttente > 0 && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-medium text-amber-900"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {enAttente} transfert{enAttente > 1 ? "s" : ""} en attente de validation
        </div>
      )}

      {/* Filtres par statut */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
          {FILTRES.map((f) => {
            const actif = filtre === f.cle;
            return (
              <button
                key={f.cle}
                type="button"
                aria-pressed={actif}
                onClick={() => setFiltre(f.cle)}
                className={filtreCls(actif)}
              >
                {f.t}
                <span
                  className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                    actif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {compteurs[f.cle] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Liste */}
      {visibles.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-gray-300 bg-white p-10 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <ArrowLeftRight className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="font-bold text-gray-800">
            {items.length === 0 ? "Aucun transfert pour l’instant" : "Aucun transfert dans ce statut"}
          </p>
          {items.length === 0 && editable && (
            <p className="mt-1 text-[13px] text-gray-600">
              Créez un transfert pour déplacer des boîtes d’un site à un autre.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop : tableau, lignes de 54 px, en-tête sticky */}
          <div className={`${CARTE} hidden max-h-[65vh] overflow-auto md:block`}>
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th scope="col" className={`${TH} rounded-tl-[14px]`}>
                    Produit &amp; lot
                  </th>
                  <th scope="col" className={TH}>
                    Trajet
                  </th>
                  <th scope="col" className={`${TH} text-right`}>
                    Quantité
                  </th>
                  <th scope="col" className={TH}>
                    Statut
                  </th>
                  <th scope="col" className={`${TH} w-14 rounded-tr-[14px]`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((t) => {
                  const annulable = editable && t.statut === "valide";
                  const annule = t.statut === "annule";
                  const st = statuts[t.statut];
                  return (
                    <tr key={t.id} className={`h-[54px] hover:bg-gray-50 ${annule ? "bg-gray-50/70" : ""}`}>
                      <td className="border-b border-gray-100 px-4 py-2">
                        <p
                          className={`max-w-[280px] truncate font-bold ${
                            annule ? "text-gray-500 line-through" : "text-gray-900"
                          }`}
                          title={t.produitNom ?? undefined}
                        >
                          {t.produitNom ?? "—"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Lot {t.lotNumero ?? "—"} · {formatDate(t.dateTransfert)}
                        </p>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2">
                        <span className="inline-flex items-center gap-2 text-gray-700">
                          <span className="truncate">{t.siteOrigineNom}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-green-700" aria-label="vers" />
                          <span className="truncate font-bold text-gray-900">{t.siteDestinationNom}</span>
                        </span>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2 text-right tabular-nums">
                        <span className="font-bold text-gray-900">{t.quantite}</span>
                        <span className="ml-1 text-xs text-gray-600">u.</span>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-2">
                        <Pastille texte={st?.t ?? t.statut} cls={st?.cls ?? "bg-gray-100 text-gray-700"} />
                      </td>
                      <td className="border-b border-gray-100 px-2 py-2 text-right">
                        {annulable && (
                          <MenuLigne label={`Actions pour le transfert ${t.id}`}>
                            <ItemMenu danger disabled={enCours === t.id} onClick={() => annuler(t.id)}>
                              {enCours === t.id ? "Annulation…" : "Annuler le transfert"}
                            </ItemMenu>
                          </MenuLigne>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile : cartes à la place du tableau */}
          <ul className="space-y-[14px] md:hidden">
            {visibles.map((t) => {
              const annulable = editable && t.statut === "valide";
              const annule = t.statut === "annule";
              const st = statuts[t.statut];
              return (
                <li key={t.id} className={`${CARTE} p-3.5 ${annule ? "bg-gray-50" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`truncate font-bold ${
                          annule ? "text-gray-500 line-through" : "text-gray-900"
                        }`}
                      >
                        {t.produitNom ?? "—"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Lot {t.lotNumero ?? "—"} · {formatDate(t.dateTransfert)}
                      </p>
                    </div>
                    {annulable && (
                      <MenuLigne label={`Actions pour le transfert ${t.id}`}>
                        <ItemMenu danger disabled={enCours === t.id} onClick={() => annuler(t.id)}>
                          {enCours === t.id ? "Annulation…" : "Annuler le transfert"}
                        </ItemMenu>
                      </MenuLigne>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                    <span className="truncate">{t.siteOrigineNom}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-green-700" aria-label="vers" />
                    <span className="truncate font-bold text-gray-900">{t.siteDestinationNom}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Pastille texte={st?.t ?? t.statut} cls={st?.cls ?? "bg-gray-100 text-gray-700"} />
                    <span className="tabular-nums">
                      <span className="font-bold text-gray-900">{t.quantite}</span>
                      <span className="ml-1 text-xs text-gray-600">u.</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Bouton flottant mobile : 52 px, pilule, ombre verte légère */}
      {editable && !creation && (
        <button
          type="button"
          disabled={nouveauDesactive}
          onClick={() => setCreation(true)}
          className={`fixed bottom-20 right-4 z-30 inline-flex h-[52px] items-center gap-2 rounded-full bg-green-700 px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(21,128,61,0.35)] hover:bg-green-800 disabled:opacity-50 md:hidden ${FOCUS}`}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Nouveau transfert
        </button>
      )}

      {creation && siteActifId && (
        <Tiroir
          titre="Nouveau transfert"
          sousTitre="Déplacer des boîtes vers un autre site"
          onFermer={() => setCreation(false)}
        >
          <FormulaireTransfert
            origineId={siteActifId}
            onAnnuler={() => setCreation(false)}
            onTermine={() => {
              setCreation(false);
              recharger();
            }}
          />
        </Tiroir>
      )}
    </div>
  );
};
export default PanneauStockTransferts;
