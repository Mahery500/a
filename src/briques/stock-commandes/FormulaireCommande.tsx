// stock-commandes/FormulaireCommande.tsx
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { stockApi, refApi, messageErreur } from "../stock-commun/api";
import { useListe } from "../stock-commun/useListe";
import { Bouton, Erreur } from "../stock-commun/ui";
import { sansAccent } from "../stock-commun/commandes";
import type { Produit, UniteStock } from "../stock-commun/types";
import { EcranBonCommande } from "./Ecranboncommande";

/** Une commande se passe toujours en boîtes : le conditionnement est celui du produit. */
const UNITE_COMMANDE: UniteStock = "boite";

/* ---------- Styles (charte ASINA Médical) ---------- */
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40";
const CHAMP =
  "h-12 w-full rounded-[10px] border bg-white px-3 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 md:h-10";
const BORDURE_OK = "border-[#e5e7eb] focus:border-[#1f9d55]";
const BORDURE_ERR = "border-[#b42318] focus:border-[#b42318]";

/* ---------- Catalogue : noms d'unités et conditionnement ---------- */
const UNITES: Record<string, [string, string]> = {
  comprime: ["comprimé", "comprimés"],
  gelule: ["gélule", "gélules"],
  flacon: ["flacon", "flacons"],
  ampoule: ["ampoule", "ampoules"],
  sachet: ["sachet", "sachets"],
  tube: ["tube", "tubes"],
};

const nomUnite = (cle: string | undefined, n: number): string => {
  const u = cle ? UNITES[cle] : undefined;
  return u ? (n > 1 ? u[1] : u[0]) : n > 1 ? "unités" : "unité";
};

/** Ex. « 30 comprimés par boîte · 10 par plaquette ». */
const detailCond = (c: any, pres: any): string => {
  const b = Number(c?.nbUnitesParBoite);
  if (!(b > 0)) return "";
  const p = Number(c?.nbUnitesParPlaquette);
  return `${b} ${nomUnite(pres?.uniteBase, b)} par boîte${p > 0 ? ` · ${p} par plaquette` : ""}`;
};

const libelleMedicament = (m: any): string => String(m?.nomNormalise ?? "");
interface InfoProduit {
  id: number;
  nom: string;
  medicament: string;
  presentation: string;
  conditionnement: string;
  detail: string;
  unitesParBoite: number;
  uniteBase: string | undefined;
  recherche: string;
}

/* ---------- Petits composants ---------- */
const Etiquette: React.FC<{ texte: string; requis?: boolean; htmlFor?: string }> = ({
  texte,
  requis,
  htmlFor,
}) => (
  <label htmlFor={htmlFor} className="text-xs font-bold text-[#5b6472]">
    {texte}
    {requis && (
      <span className="ml-0.5 text-[#b42318]" aria-hidden="true">
        *
      </span>
    )}
  </label>
);

const MessageChamp: React.FC<{ id?: string; texte: string }> = ({ id, texte }) => (
  <p id={id} role="alert" className="mt-1 text-xs font-medium text-[#b42318]">
    {texte}
  </p>
);

/* ================================================================== *
 * Sélecteur de produit : recherche + détails + navigation clavier
 * ================================================================== */
const SelecteurProduit: React.FC<{
  produits: InfoProduit[];
  valeur: number | "";
  indisponibles: Set<number>;
  erreur: boolean;
  autoOuvrir: boolean;
  describedBy?: string;
  onChange: (id: number) => void;
}> = ({ produits, valeur, indisponibles, erreur, autoOuvrir, describedBy, onChange }) => {
  const [ouvert, setOuvert] = useState(autoOuvrir);
  const [requete, setRequete] = useState("");
  const [actif, setActif] = useState(0);
  const listeRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const choisi = produits.find((p) => p.id === valeur);
  const q = sansAccent(requete.trim());
  const filtres = useMemo(
    () => (q ? produits.filter((p) => p.recherche.includes(q)) : produits),
    [produits, q],
  );

  useEffect(() => setActif(0), [requete, ouvert]);
  useEffect(() => {
    listeRef.current
      ?.querySelector<HTMLElement>(`[data-i="${actif}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [actif]);

  const fermer = () => {
    setOuvert(false);
    setRequete("");
  };

  const choisir = (p: InfoProduit | undefined) => {
    if (!p) return;
    if (indisponibles.has(p.id) && p.id !== valeur) return;
    onChange(p.id);
    fermer();
  };

  const surTouche = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((i) => Math.min(i + 1, Math.max(filtres.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choisir(filtres[actif]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      fermer();
    }
  };

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-describedby={describedBy}
        className={`${CHAMP} ${erreur ? BORDURE_ERR : BORDURE_OK} flex items-center gap-2 text-left`}
      >
        <Package className="h-4 w-4 shrink-0 text-[#14703c]" aria-hidden="true" />
        <span
          className={`flex-1 truncate ${choisi ? "font-bold text-[#1f2937]" : "text-[#5b6472]"}`}
        >
          {choisi ? choisi.nom : "Rechercher et choisir un produit"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#5b6472] transition-transform ${ouvert ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-10" onClick={fermer} />
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-lg">
            <div className="border-b border-[#f0f2f1] p-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
                  aria-hidden="true"
                />
                <input
                  autoFocus
                  type="search"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-activedescendant={filtres.length ? `${listId}-${actif}` : undefined}
                  aria-label="Rechercher un produit"
                  value={requete}
                  onChange={(e) => setRequete(e.target.value)}
                  onKeyDown={surTouche}
                  placeholder="Produit, médicament, présentation…"
                  className={`${CHAMP} ${BORDURE_OK} pl-9 [&::-webkit-search-cancel-button]:hidden`}
                />
              </div>
            </div>

            <ul id={listId} ref={listeRef} role="listbox" className="max-h-72 overflow-y-auto py-1">
              {filtres.map((p, i) => {
                const pris = indisponibles.has(p.id) && p.id !== valeur;
                const selectionne = p.id === valeur;
                return (
                  <li key={p.id} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-${i}`}
                      data-i={i}
                      role="option"
                      aria-selected={selectionne}
                      disabled={pris}
                      onClick={() => choisir(p)}
                      onMouseEnter={() => setActif(i)}
                      className={`flex w-full flex-col gap-1 px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex-row sm:items-center sm:gap-3 ${
                        i === actif && !pris ? "bg-[#e7f6ed]" : "bg-white"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-[#1f2937]">{p.nom}</span>
                          {selectionne && (
                            <Check className="h-4 w-4 shrink-0 text-[#14703c]" aria-hidden="true" />
                          )}
                          {pris && (
                            <span className="shrink-0 rounded-full border border-[#e5e7eb] bg-[#f6f8f7] px-2 py-0.5 text-[11px] font-bold text-[#5b6472]">
                              Déjà ajouté
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-[#5b6472]">
                          {[p.medicament, p.presentation].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs sm:text-right">
                        {p.conditionnement ? (
                          <>
                            <div className="font-medium text-[#1f2937]">{p.conditionnement}</div>
                            {p.detail && <div className="text-[#5b6472]">{p.detail}</div>}
                          </>
                        ) : (
                          <span className="text-[#8a5300]">Conditionnement non défini</span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
              {filtres.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[#5b6472]">
                  Aucun produit ne correspond à « {requete} ».
                </li>
              )}
            </ul>

            <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-3 py-1.5 text-xs text-[#5b6472]">
              {filtres.length} produit{filtres.length > 1 ? "s" : ""} · ↑ ↓ pour naviguer, Entrée pour choisir
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ================================================================== *
 * Quantité en boîtes : − / + / saisie directe / ajouts rapides
 * ================================================================== */
const Quantite: React.FC<{
  valeur: number;
  onChange: (n: number) => void;
  libelle: string;
  erreur: boolean;
  describedBy?: string;
}> = ({ valeur, onChange, libelle, erreur, describedBy }) => (
  <div className="flex flex-wrap items-center gap-2">
    <div
      className={`flex h-12 items-center overflow-hidden rounded-[10px] border bg-white md:h-10 ${
        erreur ? "border-[#b42318]" : "border-[#e5e7eb]"
      }`}
    >
      <button
        type="button"
        aria-label={`Une boîte de moins — ${libelle}`}
        disabled={valeur <= 1}
        onClick={() => onChange(Math.max(1, valeur - 1))}
        className={`flex h-full w-12 items-center justify-center text-[#5b6472] hover:bg-[#fafbfa] disabled:opacity-30 md:w-10 ${FOCUS}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        value={valeur || ""}
        aria-label={`Nombre de boîtes — ${libelle}`}
        aria-invalid={erreur}
        aria-describedby={describedBy}
        onChange={(e) => onChange(Math.floor(Number(e.target.value)))}
        onBlur={() => valeur < 1 && onChange(1)}
        className="h-full w-16 border-x border-[#e5e7eb] text-center text-sm font-bold tabular-nums text-[#1f2937] focus:bg-[#e7f6ed] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`Une boîte de plus — ${libelle}`}
        onClick={() => onChange((valeur || 0) + 1)}
        className={`flex h-full w-12 items-center justify-center text-[#5b6472] hover:bg-[#fafbfa] md:w-10 ${FOCUS}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>

    <div className="flex gap-1.5" role="group" aria-label="Ajouts rapides">
      {[5, 10, 20].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange((valeur || 0) + n)}
          aria-label={`Ajouter ${n} boîtes — ${libelle}`}
          className={`rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-[13px] text-[#5b6472] transition hover:bg-[#fafbfa] ${FOCUS}`}
        >
          +{n}
        </button>
      ))}
    </div>
  </div>
);

/* ================================================================== *
 * Fiche de détail du produit choisi
 * ================================================================== */
const DetailProduit: React.FC<{ info: InfoProduit }> = ({ info }) => (
  <div className="rounded-[10px] border border-[#f0f2f1] bg-[#fafbfa] p-3">
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">Médicament</dt>
        <dd className="mt-0.5 truncate text-sm text-[#1f2937]">{info.medicament || "—"}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">Présentation</dt>
        <dd className="mt-0.5 truncate text-sm text-[#1f2937]">{info.presentation || "—"}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">Conditionnement</dt>
        <dd className="mt-0.5 text-sm text-[#1f2937]">
          {info.conditionnement || "—"}
          {info.detail && <div className="text-xs text-[#5b6472]">{info.detail}</div>}
        </dd>
      </div>
    </dl>

    {!info.conditionnement && (
      <div
        role="note"
        className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#fff4e0] px-3 py-2 text-xs font-medium text-[#8a5300]"
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Conditionnement non défini pour ce produit : le nombre d’unités ne peut pas être calculé.
        </span>
      </div>
    )}
  </div>
);

/* ================================================================== *
 * Formulaire
 * ================================================================== */
interface Ligne {
  cle: string;
  produitId: number | "";
  qte: number;
  auto?: boolean; // ouvre le sélecteur dès l'ajout de la ligne
}

let compteur = 0;
const vide = (auto = false): Ligne => ({ cle: `l${++compteur}`, produitId: "", qte: 1, auto });

export const FormulaireCommande: React.FC<{
  siteId: number;
  onTermine: () => void;
  onAllerFournisseurs?: () => void;
}> = ({ siteId, onTermine, onAllerFournisseurs }) => {
  const fournisseurs = useListe(stockApi.fournisseurs);
  const produits = useListe(stockApi.produits);
  const medicaments = useListe<any>(refApi.medicaments.liste);
  const conds = useListe<any>(refApi.conditionnements.liste);
  const press = useListe<any>(refApi.presentations.liste);

  const [fournisseurId, setFournisseurId] = useState<number | "">("");
  const [lignes, setLignes] = useState<Ligne[]>([vide()]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentative, setTentative] = useState(false);
  const [occupe, setOccupe] = useState(false);
  /** Commande enregistrée : bascule sur l'écran « bon de commande ». */
  const [creee, setCreee] = useState<{ id: number; num: string } | null>(null);
  const finListe = useRef<HTMLDivElement>(null);
  const idFournisseur = useId();

  /* ---------- Jointure produit ↔ catalogue ---------- */
  const catalogue = useMemo<InfoProduit[]>(() => {
    const mParId = new Map<number, any>(medicaments.items.map((m: any) => [Number(m.id), m]));
    const cParId = new Map<number, any>(conds.items.map((c: any) => [Number(c.id), c]));
    const pParId = new Map<number, any>(press.items.map((p: any) => [Number(p.id), p]));

    return (produits.items as Produit[])
      .map((p: any): InfoProduit => {
        const med = p.medicamentId ? mParId.get(Number(p.medicamentId)) : undefined;
        const cond = p.conditionnementId ? cParId.get(Number(p.conditionnementId)) : undefined;
        const pres = p.presentationId ? pParId.get(Number(p.presentationId)) : undefined;
        const medicament = med ? libelleMedicament(med) : "";
        const presentation = pres ? String(pres.libelle ?? pres.nom ?? "") : "";
        const conditionnement = cond ? String(cond.libelle ?? cond.nom ?? "") : "";
        const nom = String(p.nomCommercial ?? "");
        const b = Number(cond?.nbUnitesParBoite);
        return {
          id: Number(p.id),
          nom,
          medicament,
          presentation,
          conditionnement,
          detail: cond ? detailCond(cond, pres) : "",
          unitesParBoite: b > 0 ? b : 0,
          uniteBase: pres?.uniteBase,
          recherche: sansAccent([nom, medicament, presentation, conditionnement].join(" ")),
        };
      })
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [produits.items, medicaments.items, conds.items, press.items]);

  const infoParId = useMemo(() => new Map(catalogue.map((i) => [i.id, i])), [catalogue]);

  /* ---------- État dérivé ---------- */
  const maj = (cle: string, c: Partial<Ligne>) =>
    setLignes((p) => p.map((l) => (l.cle === cle ? { ...l, ...c, auto: false } : l)));

  const valides = lignes.filter((l) => l.produitId && l.qte > 0);
  const totalBoites = valides.reduce((s, l) => s + l.qte, 0);
  const lignesVides = lignes.filter((l) => !l.produitId).length;
  const pris = useMemo(
    () => new Set(lignes.map((l) => l.produitId).filter((x): x is number => x !== "")),
    [lignes],
  );
  const nomFournisseur = fournisseurs.items.find((f) => f.id === fournisseurId)?.nom;

  const ajouterLigne = () => {
    setLignes((p) => [...p, vide(true)]);
    setTimeout(() => finListe.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  };

  const controler = (): string | null => {
    if (!fournisseurId) return "Choisissez un fournisseur.";
    if (valides.length === 0) return "Ajoutez au moins un produit avec une quantité.";
    if (valides.some((l) => !Number.isInteger(l.qte)))
      return "Le nombre de boîtes doit être un entier.";
    if (new Set(valides.map((l) => l.produitId)).size !== valides.length)
      return "Un produit ne peut apparaître qu’une seule fois.";
    return null;
  };

  const enregistrer = async () => {
    setTentative(true);
    const e = controler();
    if (e) return setErreur(e);
    setOccupe(true);
    setErreur(null);
    try {
      const cree: any = await stockApi.creerCommande({
        fournisseurId: Number(fournisseurId),
        siteId,
        details: valides.map((l) => ({
          produitId: Number(l.produitId),
          qte: l.qte,
          unite: UNITE_COMMANDE,
        })),
      });
      if (cree?.id) {
        setCreee({ id: Number(cree.id), num: String(cree.num ?? `#${cree.id}`) });
      } else {
        onTermine(); // repli si l'API ne renvoie pas l'identifiant
      }
    } catch (err) {
      setErreur(messageErreur(err, "La commande n'a pas pu être enregistrée."));
    } finally {
      setOccupe(false);
    }
  };

  const erreurFournisseur = tentative && !fournisseurId;

  /* ---------- Après enregistrement : bon de commande + envoi Gmail ---------- */
  if (creee) {
    const f: any = fournisseurs.items.find((x) => x.id === Number(fournisseurId));
    return (
      <EcranBonCommande
        commandeId={creee.id}
        numero={creee.num}
        fournisseurNom={f?.nom ?? ""}
        fournisseurEmail={f?.email}
        fournisseurContact={f?.contact}
        onTerminer={onTermine}
      />
    );
  }

  return (
    <div className="space-y-4 text-sm text-[#1f2937]">
      {/* ---------- Fournisseur ---------- */}
      <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
        <div className="flex flex-col gap-1">
          <Etiquette texte="Fournisseur" requis htmlFor={idFournisseur} />
          <div className="relative">
            <Truck
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14703c]"
              aria-hidden="true"
            />
            <select
              id={idFournisseur}
              value={fournisseurId}
              aria-invalid={erreurFournisseur}
              aria-describedby={erreurFournisseur ? `${idFournisseur}-err` : undefined}
              onChange={(e) => setFournisseurId(e.target.value ? Number(e.target.value) : "")}
              className={`${CHAMP} ${erreurFournisseur ? BORDURE_ERR : BORDURE_OK} appearance-none pl-9 pr-9`}
            >
              <option value="">Choisir un fournisseur</option>
              {fournisseurs.items.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
              aria-hidden="true"
            />
          </div>
          {erreurFournisseur && (
            <MessageChamp id={`${idFournisseur}-err`} texte="Le fournisseur est obligatoire." />
          )}
          {fournisseurs.erreur && <MessageChamp texte={fournisseurs.erreur} />}
          {onAllerFournisseurs && (
            <button
              type="button"
              onClick={onAllerFournisseurs}
              className={`mt-1 self-start rounded text-xs font-semibold text-[#14703c] hover:underline ${FOCUS}`}
            >
              + Nouveau fournisseur
            </button>
          )}
        </div>
      </section>

      {/* ---------- Produits ---------- */}
      <section aria-label="Produits commandés" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-[#1f2937]">Produits commandés</h3>
          <span className="text-xs text-[#5b6472]">
            Quantités en <strong className="text-[#1f2937]">boîtes</strong>
          </span>
        </div>

        <ul className="space-y-2">
          {lignes.map((l, index) => {
            const info = l.produitId ? infoParId.get(l.produitId) : undefined;
            const nom = info?.nom ?? "produit";
            const erreurProduit = tentative && !l.produitId && valides.length === 0;
            const erreurQte = tentative && !!l.produitId && (!Number.isInteger(l.qte) || l.qte < 1);
            const idErrProduit = `${l.cle}-err-produit`;
            const idErrQte = `${l.cle}-err-qte`;
            return (
              <li key={l.cle} className="rounded-[14px] border border-[#e5e7eb] bg-white p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Etiquette texte={`Produit ${index + 1}`} requis />
                  <button
                    type="button"
                    aria-label={`Retirer la ligne ${nom}`}
                    onClick={() => setLignes((p) => p.filter((x) => x.cle !== l.cle))}
                    disabled={lignes.length === 1}
                    className={`rounded-[10px] p-2 text-[#5b6472] transition hover:bg-[#fef3f2] hover:text-[#b42318] disabled:opacity-30 disabled:hover:bg-transparent ${FOCUS}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <SelecteurProduit
                  produits={catalogue}
                  valeur={l.produitId}
                  indisponibles={pris}
                  erreur={erreurProduit}
                  autoOuvrir={!!l.auto}
                  describedBy={erreurProduit ? idErrProduit : undefined}
                  onChange={(id) => maj(l.cle, { produitId: id })}
                />
                {erreurProduit && <MessageChamp id={idErrProduit} texte="Choisissez un produit." />}

                {info && (
                  <div className="mt-3">
                    <DetailProduit info={info} />
                  </div>
                )}

                {l.produitId && (
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <Etiquette texte="Quantité (boîtes)" requis />
                      <Quantite
                        valeur={l.qte}
                        libelle={nom}
                        erreur={erreurQte}
                        describedBy={erreurQte ? idErrQte : undefined}
                        onChange={(n) => maj(l.cle, { qte: n })}
                      />
                      {erreurQte && (
                        <MessageChamp id={idErrQte} texte="Indiquez un nombre entier de boîtes (1 minimum)." />
                      )}
                    </div>

                    {info && info.unitesParBoite > 0 && l.qte > 0 && (
                      <p
                        className="rounded-[10px] bg-[#e7f6ed] px-3 py-2 text-sm text-[#14703c]"
                        aria-live="polite"
                      >
                        {l.qte} boîte{l.qte > 1 ? "s" : ""} ={" "}
                        <strong className="tabular-nums">{l.qte * info.unitesParBoite}</strong>{" "}
                        {nomUnite(info.uniteBase, l.qte * info.unitesParBoite)}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div ref={finListe} />

        <button
          type="button"
          onClick={ajouterLigne}
          className={`flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-[#e5e7eb] bg-white text-sm font-semibold text-[#5b6472] transition hover:border-[#1f9d55] hover:bg-[#e7f6ed] hover:text-[#14703c] md:h-10 ${FOCUS}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un produit
        </button>
      </section>

      <Erreur message={erreur} />

      {/* ---------- Pied : récapitulatif + action ---------- */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-3">
        <div className="text-sm text-[#5b6472]" aria-live="polite">
          <p>
            <span className="font-bold tabular-nums text-[#1f2937]">{valides.length}</span> produit
            {valides.length > 1 ? "s" : ""}
            {" · "}
            <span className="font-bold tabular-nums text-[#1f2937]">{totalBoites}</span> boîte
            {totalBoites > 1 ? "s" : ""}
            {nomFournisseur && (
              <>
                {" · "}
                <span className="font-bold text-[#1f2937]">{nomFournisseur}</span>
              </>
            )}
          </p>
          {lignesVides > 0 && valides.length > 0 && (
            <p className="text-xs">
              {lignesVides} ligne{lignesVides > 1 ? "s" : ""} sans produit ignorée
              {lignesVides > 1 ? "s" : ""}.
            </p>
          )}
        </div>
        <Bouton variante="primaire" disabled={occupe} onClick={enregistrer}>
          {occupe ? "Enregistrement…" : "Enregistrer la commande"}
        </Bouton>
      </div>
    </div>
  );
};