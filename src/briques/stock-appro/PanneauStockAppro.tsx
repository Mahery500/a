// stock-appro/PanneauStockAppro.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  PackageCheck,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions";
import { stockApi, refApi } from "../stock-commun/api";
import type { Appro } from "../stock-commun/api";
import { useListe } from "../stock-commun/useListe";
import { Erreur, formatDate } from "../stock-commun/ui";
import { sansAccent } from "../stock-commun/commandes";
import { useStockPermissions } from "@/assemblages/stock/useStockPermissions";
import { GardeAccesStock } from "@/assemblages/stock/GardeAccesStock";

/** Liste des lots si l'API la fournit ; sinon liste vide (référence stable pour useListe). */
const aucuneListe = async () => [] as any[];
const chargerLots: () => Promise<any[]> = (stockApi as any).lots ?? aucuneListe;

type Periode = "tout" | "7" | "30" | "90";

const PERIODES: { valeur: Periode; libelle: string }[] = [
  { valeur: "tout", libelle: "Tout" },
  { valeur: "7", libelle: "7 jours" },
  { valeur: "30", libelle: "30 jours" },
  { valeur: "90", libelle: "90 jours" },
];

/** Noms d'unités de base (même table que le catalogue). */
const UNITES: Record<string, [string, string]> = {
  comprime: ["comprimé", "comprimés"],
  gelule: ["gélule", "gélules"],
  flacon: ["flacon", "flacons"],
  ampoule: ["ampoule", "ampoules"],
  sachet: ["sachet", "sachets"],
  tube: ["tube", "tubes"],
};

/** Ex. « 30 comprimés par boîte · 10 par plaquette ». */
const detailCond = (c: any, pres: any): string => {
  const b = Number(c?.nbUnitesParBoite);
  if (!(b > 0)) return "";
  const p = Number(c?.nbUnitesParPlaquette);
  const u = UNITES[pres?.uniteBase];
  const nom = u ? (b > 1 ? u[1] : u[0]) : b > 1 ? "unités" : "unité";
  return `${b} ${nom} par boîte${p > 0 ? ` · ${p} par plaquette` : ""}`;
};

interface DetailResolu {
  numLot: string;
  produit: string;
  produitId: number | null;
}

interface InfoProduit {
  presentation: string;
  conditionnement: string;
  detail: string;
}

/** Groupe de boutons à choix unique (pastilles de filtre). */
function Segmente<T extends string>({
  label,
  options,
  valeur,
  onChange,
}: {
  label: string;
  options: { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-[#5b6472]">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-2">
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={o.valeur}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => onChange(o.valeur)}
              className={`rounded-full border px-[14px] py-1.5 text-[13px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40 ${
                actif
                  ? "border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]"
                  : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
              }`}
            >
              {o.libelle}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Historique des réceptions (lecture seule).
 * Une réception est toujours liée à une commande et se crée uniquement depuis l'onglet
 * Commandes (« Réceptionner »). Ici on consulte les réceptions passées et leurs lots.
 */
export const PanneauStockAppro: React.FC<{ mode: ModeAffichage; siteActifId?: number }> = () => {
  const permissions = useStockPermissions();
  const { items, chargement, erreur } = useListe<Appro>(stockApi.appros);
  const commandes = useListe<any>(stockApi.commandes);
  const produits = useListe<any>(stockApi.produits);
  const conds = useListe<any>(refApi.conditionnements.liste);
  const press = useListe<any>(refApi.presentations.liste);
  const lots = useListe<any>(chargerLots);
  const [ouverts, setOuverts] = useState<number[]>([]);

  // Filtres
  const [recherche, setRecherche] = useState("");
  const [periode, setPeriode] = useState<Periode>("tout");
  const [fournisseur, setFournisseur] = useState("");

  // Pagination
  const [pageCourante, setPageCourante] = useState(1);
  const elementsParPage = 10;

  const nbColonnes = 5;

  /* ---------- Jointures côté écran ---------- */
  const commandeParId = useMemo(
    () => new Map<number, any>(commandes.items.map((c: any) => [Number(c.id), c])),
    [commandes.items],
  );
  const nomProduit = useMemo(
    () =>
      new Map<number, string>(
        produits.items.map((p: any) => [Number(p.id), String(p.nomCommercial ?? "")]),
      ),
    [produits.items],
  );
  const lotParId = useMemo(
    () => new Map<number, any>(lots.items.map((l: any) => [Number(l.id), l])),
    [lots.items],
  );

  /** produitId → présentation, conditionnement et contenu (jointure avec le catalogue). */
  const infoProduit = useMemo(() => {
    const cParId = new Map<number, any>(conds.items.map((c: any) => [Number(c.id), c]));
    const pParId = new Map<number, any>(press.items.map((p: any) => [Number(p.id), p]));
    const m = new Map<number, InfoProduit>();
    for (const p of produits.items as any[]) {
      const cond = p.conditionnementId ? cParId.get(Number(p.conditionnementId)) : undefined;
      const pres = p.presentationId ? pParId.get(Number(p.presentationId)) : undefined;
      m.set(Number(p.id), {
        presentation: pres ? String(pres.libelle ?? pres.nom ?? "") : "",
        conditionnement: cond ? String(cond.libelle ?? cond.nom ?? "") : "",
        detail: cond ? detailCond(cond, pres) : "",
      });
    }
    return m;
  }, [produits.items, conds.items, press.items]);

  /** Retrouve numéro de lot et produit d'une ligne de réception. */
  const resoudre = useCallback(
    (a: Appro, d: any): DetailResolu => {
      const lotId = Number(d.lotId ?? d.lot?.id);
      const lot = d.lot && typeof d.lot === "object" ? d.lot : lotParId.get(lotId);

      const numLot = d.numLot ?? lot?.numLot ?? lot?.numero ?? `Lot #${d.lotId ?? lot?.id ?? "?"}`;

      let produitId = Number(d.produitId ?? lot?.produitId ?? lot?.produit?.id);
      if (!Number.isFinite(produitId) || produitId <= 0) {
        const details = commandeParId.get(Number(a.commandeId))?.details ?? [];
        produitId = details.length === 1 ? Number(details[0].produitId) : NaN;
      }
      const produit =
        d.produitNom ||
        lot?.produitNom ||
        lot?.produit?.nomCommercial ||
        (Number.isFinite(produitId) ? nomProduit.get(produitId) : "") ||
        "—";

      return {
        numLot: String(numLot),
        produit,
        produitId: Number.isFinite(produitId) ? produitId : null,
      };
    },
    [lotParId, nomProduit, commandeParId],
  );

  const libelleFournisseur = (a: Appro) =>
    a.fournisseurNom ?? (a.fournisseurId ? `Fournisseur #${a.fournisseurId}` : "");

  const libelleCommande = (a: Appro) => {
    if (a.commandeNum) return String(a.commandeNum);
    if (!a.commandeId) return null;
    return commandeParId.get(Number(a.commandeId))?.num || `#${a.commandeId}`;
  };

  const fournisseurs = useMemo(
    () =>
      Array.from(new Set(items.map(libelleFournisseur).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [items],
  );

  const nbFiltresActifs = (recherche ? 1 : 0) + (periode !== "tout" ? 1 : 0) + (fournisseur ? 1 : 0);

  const reinitialiser = () => {
    setRecherche("");
    setPeriode("tout");
    setFournisseur("");
    setPageCourante(1);
  };

  const visibles = useMemo(() => {
    const q = sansAccent(recherche);
    const limite =
      periode === "tout"
        ? null
        : new Date(Date.now() - Number(periode) * 86_400_000).toISOString().slice(0, 10);

    return items
      .filter((a) => {
        if (q) {
          const resolus = a.details.map((d) => resoudre(a, d));
          const texte = [
            a.numFac,
            a.fournisseurNom,
            libelleCommande(a),
            a.commandeId ? `commande ${a.commandeId}` : "",
            ...resolus.flatMap((r) => {
              const info = r.produitId ? infoProduit.get(r.produitId) : undefined;
              return [r.numLot, r.produit, info?.presentation, info?.conditionnement];
            }),
          ].join(" ");
          if (!sansAccent(texte).includes(q)) return false;
        }

        if (limite && (a.dateAppro ?? "").slice(0, 10) < limite) return false;

        if (fournisseur && libelleFournisseur(a) !== fournisseur) return false;

        return true;
      })
      .sort((a, b) => (b.dateAppro ?? "").localeCompare(a.dateAppro ?? "") || b.id - a.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, recherche, periode, fournisseur, resoudre, commandeParId, infoProduit]);

  // Calculs pour la pagination
  const totalPages = Math.ceil(visibles.length / elementsParPage) || 1;
  const pageActuelleSecurisee = Math.min(pageCourante, totalPages);

  const elementsPagines = useMemo(() => {
    const debut = (pageActuelleSecurisee - 1) * elementsParPage;
    return visibles.slice(debut, debut + elementsParPage);
  }, [visibles, pageActuelleSecurisee, elementsParPage]);

  // Garde d'accès : toujours APRÈS tous les hooks
  if (!permissions.peutGererAppro) {
    return (
      <GardeAccesStock message="Seul un Gestionnaire de stock peut consulter et enregistrer les approvisionnements." />
    );
  }

  const basculer = (id: number) =>
    setOuverts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="space-y-[14px] text-sm text-[#1f2937]">
      {/* Barre de filtres */}
      <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPageCourante(1);
              }}
              placeholder="Commande, facture, fournisseur, lot, produit…"
              aria-label="Rechercher une réception"
              className="h-12 w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-9 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 md:h-10 [&::-webkit-search-cancel-button]:hidden"
            />
            {recherche && (
              <button
                type="button"
                onClick={() => {
                  setRecherche("");
                  setPageCourante(1);
                }}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex w-full flex-col gap-1 sm:w-56">
            <label htmlFor="filtre-fournisseur" className="text-xs font-bold text-[#5b6472]">
              Fournisseur
            </label>
            <select
              id="filtre-fournisseur"
              value={fournisseur}
              onChange={(e) => {
                setFournisseur(e.target.value);
                setPageCourante(1);
              }}
              className="h-12 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 md:h-10"
            >
              <option value="">Tous les fournisseurs</option>
              {fournisseurs.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3 border-t border-[#f0f2f1] pt-3">
          <Segmente
            label="Période"
            options={PERIODES}
            valeur={periode}
            onChange={(v) => {
              setPeriode(v as Periode);
              setPageCourante(1);
            }}
          />

          <div className="ml-auto flex items-center gap-3 self-end">
            <span className="text-xs text-[#5b6472]" aria-live="polite">
              {chargement
                ? "Chargement…"
                : nbFiltresActifs > 0
                  ? `${visibles.length} sur ${items.length} réception(s)`
                  : `${items.length} réception(s)`}
            </span>
            {nbFiltresActifs > 0 && (
              <button
                type="button"
                onClick={reinitialiser}
                className="inline-flex h-12 items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40 md:h-10"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Réinitialiser ({nbFiltresActifs})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-[14px] border border-[#e5e7eb] bg-[#fafbfa] px-3.5 py-3 text-sm text-[#5b6472]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Chaque réception est liée à une commande. Pour en enregistrer une, utilisez{" "}
          <strong className="text-[#1f2937]">« Réceptionner »</strong> dans l'onglet Commandes.
        </p>
      </div>

      <Erreur message={erreur} />

      {/* Tableau */}
      <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">
              <tr>
                <th className="sticky top-0 z-10 w-12 border-b border-[#e5e7eb] bg-[#fafbfa] p-3" />
                <th scope="col" className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] p-3">
                  Commande
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] p-3">
                  Réception
                </th>
                <th scope="col" className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] p-3">
                  Fournisseur
                </th>
                <th
                  scope="col"
                  className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] p-3 text-center"
                >
                  Lots
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f0f2f1]">
              {chargement &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`sk-${i}`} aria-hidden="true" className="h-[54px]">
                    <td className="p-3">
                      <div className="h-6 w-6 animate-pulse rounded bg-[#f0f2f1]" />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-[#f0f2f1]" />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-[#f0f2f1]" />
                      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-[#f0f2f1]" />
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-36 animate-pulse rounded bg-[#f0f2f1]" />
                    </td>
                    <td className="p-3">
                      <div className="mx-auto h-5 w-8 animate-pulse rounded-full bg-[#f0f2f1]" />
                    </td>
                  </tr>
                ))}

              {!chargement &&
                elementsPagines.map((a) => {
                  const ouvert = ouverts.includes(a.id);
                  const qteTotale = a.details.reduce((s, d) => s + (Number(d.qte) || 0), 0);
                  const detailId = `appro-detail-${a.id}`;
                  const cmd = libelleCommande(a);
                  return (
                    <React.Fragment key={a.id}>
                      <tr
                        className={`h-[54px] transition-colors ${
                          ouvert ? "bg-[#fafbfa]" : "hover:bg-[#fafbfa]"
                        }`}
                      >
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => basculer(a.id)}
                            aria-expanded={ouvert}
                            aria-controls={detailId}
                            aria-label={ouvert ? "Masquer le détail" : "Voir le détail"}
                            className="rounded-[10px] p-1.5 text-[#5b6472] transition hover:bg-[#f0f2f1] hover:text-[#1f2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40"
                          >
                            {ouvert ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>

                        <td className="p-3">
                          {cmd ? (
                            <span className="rounded-md bg-[#e7f6ed] px-[7px] py-[3px] font-mono text-xs font-bold text-[#14703c]">
                              {cmd}
                            </span>
                          ) : (
                            <span className="text-[#5b6472]">—</span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-[#1f2937]">
                            {a.numFac ? `Facture ${a.numFac}` : `Réception #${a.id}`}
                          </div>
                          <div className="text-xs text-[#5b6472]">
                            {a.dateAppro ? formatDate(a.dateAppro) : "—"}
                          </div>
                        </td>

                        <td className="p-3 text-[#1f2937]">{libelleFournisseur(a) || "—"}</td>

                        <td className="p-3 text-center">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full border border-[#e5e7eb] bg-[#f6f8f7] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#5b6472]">
                            {a.details.length}
                          </span>
                        </td>
                      </tr>

                      {ouvert && (
                        <tr id={detailId} className="bg-[#fafbfa]">
                          <td />
                          <td colSpan={nbColonnes - 1} className="px-3 pb-4 pt-1">
                            {a.details.length === 0 ? (
                              <p className="py-2 text-[#5b6472]">Aucun lot enregistré.</p>
                            ) : (
                              <div className="overflow-x-auto rounded-[10px] border border-[#e5e7eb] bg-white">
                                <table className="w-full text-sm">
                                  <thead className="bg-[#fafbfa] text-left text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">
                                    <tr>
                                      <th scope="col" className="px-3 py-2">Lot</th>
                                      <th scope="col" className="px-3 py-2">Produit</th>
                                      <th scope="col" className="px-3 py-2">Conditionnement</th>
                                      <th scope="col" className="px-3 py-2 text-right">Quantité</th>
                                      <th scope="col" className="px-3 py-2 text-right">Prix</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#f0f2f1]">
                                    {a.details.map((d) => {
                                      const r = resoudre(a, d);
                                      const info = r.produitId
                                        ? infoProduit.get(r.produitId)
                                        : undefined;
                                      return (
                                        <tr key={d.id} className="hover:bg-[#fafbfa]">
                                          <td className="px-3 py-2 font-mono text-xs font-bold text-[#1f2937]">
                                            {r.numLot}
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="font-bold text-[#1f2937]">
                                              {r.produit}
                                            </div>
                                            {info?.presentation && (
                                              <div className="text-xs text-[#5b6472]">
                                                {info.presentation}
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-3 py-2">
                                            {info?.conditionnement ? (
                                              <>
                                                <div className="text-[#1f2937]">
                                                  {info.conditionnement}
                                                </div>
                                                {info.detail && (
                                                  <div className="text-xs text-[#5b6472]">
                                                    {info.detail}
                                                  </div>
                                                )}
                                              </>
                                            ) : (
                                              <span className="text-[#5b6472]">—</span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
                                            {d.qte}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
                                            {d.prix !== null && d.prix !== undefined ? (
                                              d.prix
                                            ) : (
                                              <span className="text-[#5b6472]">—</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="border-t border-[#e5e7eb] bg-[#fafbfa] text-xs font-bold text-[#1f2937]">
                                    <tr>
                                      <td className="px-3 py-2" colSpan={3}>
                                        Total
                                      </td>
                                      <td className="px-3 py-2 text-right tabular-nums">
                                        {qteTotale}
                                      </td>
                                      <td />
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

              {!chargement && visibles.length === 0 && (
                <tr>
                  <td colSpan={nbColonnes} className="px-4 py-14 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6f8f7]">
                      <PackageCheck className="h-6 w-6 text-[#5b6472]" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-bold text-[#1f2937]">
                      {nbFiltresActifs > 0
                        ? "Aucune réception ne correspond à ces filtres."
                        : "Aucune réception enregistrée."}
                    </p>
                    {nbFiltresActifs > 0 ? (
                      <button
                        type="button"
                        onClick={reinitialiser}
                        className="mt-2 inline-flex h-12 items-center rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] hover:bg-[#fafbfa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40 md:h-10"
                      >
                        Réinitialiser les filtres
                      </button>
                    ) : (
                      <p className="mt-1 text-xs text-[#5b6472]">
                        Les réceptions apparaissent ici une fois une commande réceptionnée.
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barre de pagination épurée */}
        {!chargement && visibles.length > 0 && (
          <div className="flex items-center justify-center border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-3">
            <div className="inline-flex gap-1">
              <button
                type="button"
                onClick={() => setPageCourante((p) => Math.max(p - 1, 1))}
                disabled={pageActuelleSecurisee === 1}
                aria-label="Page précédente"
                className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] transition hover:bg-[#fafbfa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40 disabled:cursor-not-allowed disabled:opacity-40 md:h-10 md:w-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPageCourante((p) => Math.min(p + 1, totalPages))}
                disabled={pageActuelleSecurisee === totalPages}
                aria-label="Page suivante"
                className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] transition hover:bg-[#fafbfa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40 disabled:cursor-not-allowed disabled:opacity-40 md:h-10 md:w-10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default PanneauStockAppro;