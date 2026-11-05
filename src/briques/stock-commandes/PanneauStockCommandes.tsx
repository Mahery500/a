// stock-commandes/PanneauStockCommandes.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions";
import { stockApi, refApi, messageErreur } from "../stock-commun/api";
import { useListe } from "../stock-commun/useListe";
import { Erreur, Modal, formatDate } from "../stock-commun/ui";
import type { Commande, StatutCommande } from "../stock-commun/types";
import { FormulaireCommande } from "./FormulaireCommande";
import { FormulaireAppro } from "../stock-appro/FormulaireAppro";
import { PanneauFournisseurs, MenuActions, Pagination } from "./PanneauFournisseurs";

type Vue = "commandes" | "fournisseurs";
type Periode = "tout" | "7" | "30" | "90";

/* ---------- Styles (charte ASINA Médical) ---------- */
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40";

const BTN_PRIMAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-[#1f9d55] px-4 text-sm font-bold text-white transition hover:bg-[#14703c] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_SECONDAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_DANGER = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-[#b42318] px-4 text-sm font-bold text-white transition hover:bg-[#912018] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;

const CHAMP =
  "h-12 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 md:h-10";

const TH =
  "sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] p-3 text-left text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]";

/** Au-delà de ce délai, une commande non reçue déclenche l'alerte ambre. */
const JOURS_ALERTE = 14;

const PERIODES: { valeur: Periode; libelle: string }[] = [
  { valeur: "tout", libelle: "Tout" },
  { valeur: "7", libelle: "7 jours" },
  { valeur: "30", libelle: "30 jours" },
  { valeur: "90", libelle: "90 jours" },
];

const TAILLES_PAGE = [10, 25, 50];

/* ---------- Statuts ---------- */
/**
 * Chaque statut a une couleur, un libellé ET une icône : la couleur aide à
 * repérer d'un coup d'œil, elle ne porte jamais le sens seule (charte).
 *  - En attente : bleu (à traiter)
 *  - Partielle  : ambre (attention, reste à recevoir)
 *  - Reçue      : vert (terminé)
 *  - Annulée    : rouge (écartée)
 */
const COULEUR_ATTENTE = "#3b82c4";
const COULEUR_PARTIELLE = "#e8a317";
const COULEUR_RECUE = "#1f9d55";
const COULEUR_ANNULEE = "#b42318";

type InfoStatut = { t: string; classe: string; icone: React.ReactNode; couleur: string };

const S_ATTENTE: InfoStatut = {
  t: "En attente",
  classe: "border-transparent bg-[#e8f1fd] text-[#1e56a0]",
  icone: <Clock className="h-3 w-3" />,
  couleur: COULEUR_ATTENTE,
};

const STATUTS: Record<StatutCommande, InfoStatut> = {
  brouillon: S_ATTENTE,
  envoyee: S_ATTENTE,
  partielle: {
    t: "Partielle",
    classe: "border-transparent bg-[#fff4e0] text-[#8a5300]",
    icone: <PackageCheck className="h-3 w-3" />,
    couleur: COULEUR_PARTIELLE,
  },
  recue: {
    t: "Reçue",
    classe: "border-transparent bg-[#e7f6ed] text-[#14703c]",
    icone: <Check className="h-3 w-3" />,
    couleur: COULEUR_RECUE,
  },
  annulee: {
    t: "Annulée",
    classe: "border-transparent bg-[#fdecea] text-[#b42318]",
    icone: <Ban className="h-3 w-3" />,
    couleur: COULEUR_ANNULEE,
  },
};

const sansAccent = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function statutDe(c: Commande): StatutCommande {
  const brut = c as unknown as Record<string, unknown>;
  const s = sansAccent(brut.statut ?? brut.status ?? brut.statutLibelle ?? brut.etat);
  if (!s || s === "brouillon" || s === "draft") return "envoyee";
  if (s.includes("annul")) return "annulee";
  if (s.includes("partiel")) return "partielle";
  if (s.includes("livr") || s.includes("recue") || s === "recu") return "recue";
  return "envoyee";
}

const facturesDe = (c: Commande): string[] => {
  const f = (c as unknown as { factures?: unknown }).factures;
  return Array.isArray(f) ? f.map(String).filter(Boolean) : [];
};

const nombre = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const initiales = (nom: string) =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]!.toUpperCase())
    .join("") || "?";

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

type Filtre = "toutes" | "attente" | "recue" | "annulee";
const FILTRES: {
  id: Filtre;
  libelle: string;
  couleur?: string;
  ok: (s: StatutCommande) => boolean;
}[] = [
  { id: "toutes", libelle: "Toutes", ok: () => true },
  {
    id: "attente",
    libelle: "En attente",
    couleur: COULEUR_ATTENTE,
    ok: (s) => s === "envoyee" || s === "partielle",
  },
  { id: "recue", libelle: "Reçues", couleur: COULEUR_RECUE, ok: (s) => s === "recue" },
  { id: "annulee", libelle: "Annulées", couleur: COULEUR_ANNULEE, ok: (s) => s === "annulee" },
];

interface Ligne {
  c: Commande;
  statut: StatutCommande;
  commande: number;
  recu: number;
  produits: string[];
  medicaments: string[];
  factures: string[];
  fournisseur: string;
}

interface InfoProduit {
  libelle: string;
  detail: string;
  medicament: string;
}

/* ================================================================== *
 * Petits composants
 * ================================================================== */
const Chip: React.FC<{ statut: StatutCommande }> = ({ statut }) => {
  const m = STATUTS[statut];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${m.classe}`}
    >
      {m.icone}
      {m.t}
    </span>
  );
};

const Avatar: React.FC<{ nom: string }> = ({ nom }) => (
  <span
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e7f6ed] text-xs font-bold text-[#14703c]"
    aria-hidden="true"
  >
    {initiales(nom)}
  </span>
);

const Progression: React.FC<{ recu: number; commande: number; couleur?: string }> = ({
  recu,
  commande,
  couleur = COULEUR_RECUE,
}) => {
  const pctBrut = commande > 0 ? (recu / commande) * 100 : 0;
  const pct = recu > 0 ? Math.min(100, Math.max(4, pctBrut)) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div
        role="progressbar"
        aria-label="Quantité reçue"
        aria-valuemin={0}
        aria-valuemax={commande}
        aria-valuenow={recu}
        className="h-1.5 w-24 flex-1 overflow-hidden rounded-full bg-[#f0f2f1]"
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: couleur }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-[#5b6472]">
        {fmt(recu)}/{fmt(commande)}
      </span>
    </div>
  );
};

/** Pastilles de filtre à choix unique (charte). */
function Pastilles<T extends string>({
  label,
  options,
  valeur,
  onChange,
}: {
  label: string;
  options: { valeur: T; libelle: string; compte?: number; couleur?: string }[];
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
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-[14px] py-1.5 text-[13px] transition md:min-h-[32px] ${FOCUS} ${
                actif
                  ? "border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]"
                  : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
              }`}
            >
              {o.couleur && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: o.couleur }}
                  aria-hidden="true"
                />
              )}
              {o.libelle}
              {o.compte !== undefined && (
                <span className="text-xs tabular-nums opacity-80">{o.compte}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Détail des lignes d'une commande : tableau (desktop) ou liste (mobile). */
const DetailCommande: React.FC<{
  c: Commande;
  statut: StatutCommande;
  factures: string[];
  infoProduit: Map<number, InfoProduit>;
}> = ({ c, statut, factures, infoProduit }) => {
  const lignes = c.details.map((d) => {
    const qte = nombre(d.qte);
    const brut = nombre(d.qteRecue);
    const recu = Math.min(statut === "recue" && brut === 0 ? qte : brut, qte);
    return {
      d,
      qte,
      recu,
      reste: Math.max(0, qte - recu),
      info: infoProduit.get(Number(d.produitId)),
    };
  });

  return (
    <>
      <div className="hidden max-w-4xl overflow-x-auto rounded-[10px] border border-[#e5e7eb] bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-[#fafbfa] text-left text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]">
            <tr>
              <th scope="col" className="px-3 py-2">Produit</th>
              <th scope="col" className="px-3 py-2">Médicament</th>
              <th scope="col" className="px-3 py-2">Conditionnement</th>
              <th scope="col" className="px-3 py-2 text-right">Commandé</th>
              <th scope="col" className="px-3 py-2 text-right">Reçu</th>
              <th scope="col" className="px-3 py-2 text-right">Reste</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f1]">
            {lignes.map(({ d, qte, recu, reste, info }) => (
              <tr key={d.id}>
                <td className="px-3 py-2 font-bold text-[#1f2937]">
                  {d.produitNom ?? `Produit #${d.produitId}`}
                </td>
                <td className="px-3 py-2">
                  {info?.medicament ? (
                    <span className="inline-flex rounded-md bg-[#e7f6ed] px-1.5 py-0.5 text-xs font-bold text-[#14703c]">
                      {info.medicament}
                    </span>
                  ) : (
                    <span className="text-[#5b6472]">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {info?.libelle ? (
                    <>
                      <div className="text-[#1f2937]">{info.libelle}</div>
                      {info.detail && <div className="text-xs text-[#5b6472]">{info.detail}</div>}
                    </>
                  ) : (
                    <span className="text-[#5b6472]">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(qte)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[#14703c]">{fmt(recu)}</td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    reste > 0 ? "font-bold text-[#8a5300]" : "text-[#5b6472]"
                  }`}
                >
                  {fmt(reste)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 md:hidden">
        {lignes.map(({ d, qte, recu, reste, info }) => (
          <li key={d.id} className="rounded-[10px] border border-[#e5e7eb] bg-white p-3">
            <div className="font-bold text-[#1f2937]">{d.produitNom ?? `Produit #${d.produitId}`}</div>
            {info?.medicament && (
              <div className="mt-0.5 text-xs font-bold text-[#14703c]">Médicament : {info.medicament}</div>
            )}
            {info?.libelle && (
              <div className="text-xs text-[#5b6472]">
                {info.libelle}
                {info.detail && ` · ${info.detail}`}
              </div>
            )}
            <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[10px] bg-[#fafbfa] py-1.5">
                <dt className="text-[11px] font-bold uppercase text-[#5b6472]">Commandé</dt>
                <dd className="text-sm font-bold tabular-nums text-[#1f2937]">{fmt(qte)}</dd>
              </div>
              <div className="rounded-[10px] bg-[#fafbfa] py-1.5">
                <dt className="text-[11px] font-bold uppercase text-[#5b6472]">Reçu</dt>
                <dd className="text-sm font-bold tabular-nums text-[#14703c]">{fmt(recu)}</dd>
              </div>
              <div className={`rounded-[10px] py-1.5 ${reste > 0 ? "bg-[#fff4e0]" : "bg-[#fafbfa]"}`}>
                <dt className="text-[11px] font-bold uppercase text-[#5b6472]">Reste</dt>
                <dd
                  className={`text-sm font-bold tabular-nums ${
                    reste > 0 ? "text-[#8a5300]" : "text-[#5b6472]"
                  }`}
                >
                  {fmt(reste)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {factures.length > 1 && (
        <p className="mt-2 text-xs text-[#5b6472]">Factures : {factures.join(", ")}</p>
      )}
    </>
  );
};

/* ================================================================== *
 * Panneau principal
 * ================================================================== */
export const PanneauStockCommandes: React.FC<{ mode: ModeAffichage; siteActifId?: number }> = ({
  mode,
  siteActifId,
}) => {
  const [vue, setVue] = useState<Vue>("commandes");
  const { items, chargement, erreur, recharger } = useListe<Commande>(stockApi.commandes);
  const produits = useListe(stockApi.produits);
  const conds = useListe(refApi.conditionnements.liste);
  const press = useListe(refApi.presentations.liste);

  const [creation, setCreation] = useState(false);
  const [aRecevoir, setARecevoir] = useState<Commande | null>(null);
  const [aAnnuler, setAAnnuler] = useState<Commande | null>(null);
  const [occupeAnnulation, setOccupeAnnulation] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Filtres
  const [filtre, setFiltre] = useState<Filtre>("toutes");
  const [periode, setPeriode] = useState<Periode>("tout");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [produitRecherche, setProduitRecherche] = useState("");
  const [recherche, setRecherche] = useState("");
  const [ouvertes, setOuvertes] = useState<Set<number>>(new Set());

  // Pagination
  const [pageCourante, setPageCourante] = useState(1);
  const [elementsParPage, setElementsParPage] = useState(10);

  const editable = mode === "edition";
  const nbCol = editable ? 7 : 6;

  useEffect(
    () => setPageCourante(1),
    [filtre, periode, dateDebut, dateFin, fournisseur, recherche, produitRecherche, elementsParPage],
  );

  /** produitId → conditionnement + médicament, par jointure avec le catalogue. */
  const infoProduit = useMemo(() => {
    const cParId = new Map<number, any>(conds.items.map((c: any) => [Number(c.id), c]));
    const pParId = new Map<number, any>(press.items.map((p: any) => [Number(p.id), p]));
    const m = new Map<number, InfoProduit>();
    for (const p of produits.items as any[]) {
      const cond = p.conditionnementId ? cParId.get(Number(p.conditionnementId)) : undefined;
      const pres = p.presentationId ? pParId.get(Number(p.presentationId)) : undefined;

      // medicamentNom est fourni par ProduitResponse (Medicament::getNomNormalise)
      const medicament = String(p.medicamentNom ?? "");

      m.set(Number(p.id), {
        libelle: cond ? String(cond.libelle ?? cond.nom ?? "") : "",
        detail: cond ? detailCond(cond, pres) : "",
        medicament,
      });
    }
    return m;
  }, [produits.items, conds.items, press.items]);

  const lignes = useMemo<Ligne[]>(() => {
    const base = siteActifId ? items.filter((c) => c.siteId === siteActifId) : items;
    return base
      .map((c) => {
        const statut = statutDe(c);
        const commande = c.details.reduce((s, d) => s + nombre(d.qte), 0);
        const recuBrut = c.details.reduce(
          (s, d) => s + Math.min(nombre(d.qteRecue), nombre(d.qte)),
          0,
        );
        const recu = statut === "recue" && recuBrut === 0 ? commande : Math.min(recuBrut, commande);
        return {
          c,
          statut,
          commande,
          recu,
          produits: c.details.map((d) => d.produitNom ?? `Produit #${d.produitId}`),
          medicaments: Array.from(
            new Set(
              c.details
                .map((d) => infoProduit.get(Number(d.produitId))?.medicament ?? "")
                .filter(Boolean),
            ),
          ),
          factures: facturesDe(c),
          fournisseur: c.fournisseurNom ?? `Fournisseur #${c.fournisseurId}`,
        };
      })
      .sort((a, b) => (b.c.dateC ?? "").localeCompare(a.c.dateC ?? "") || b.c.id - a.c.id);
  }, [items, siteActifId, infoProduit]);

  const compteurs = useMemo(
    () =>
      Object.fromEntries(
        FILTRES.map((f) => [f.id, lignes.filter((l) => f.ok(l.statut)).length]),
      ) as Record<Filtre, number>,
    [lignes],
  );

  const fournisseurs = useMemo(
    () => Array.from(new Set(lignes.map((l) => l.fournisseur))).sort((a, b) => a.localeCompare(b, "fr")),
    [lignes],
  );

  /** Commandes en attente de réception depuis plus de JOURS_ALERTE jours. */
  const enRetard = useMemo(() => {
    const limite = Date.now() - JOURS_ALERTE * 86_400_000;
    return lignes.filter(
      (l) =>
        (l.statut === "envoyee" || l.statut === "partielle") &&
        l.c.dateC &&
        Date.parse(l.c.dateC) < limite,
    ).length;
  }, [lignes]);

  const nbFiltresActifs =
    (filtre !== "toutes" ? 1 : 0) +
    (periode !== "tout" ? 1 : 0) +
    (dateDebut || dateFin ? 1 : 0) +
    (fournisseur ? 1 : 0) +
    (produitRecherche ? 1 : 0) +
    (recherche ? 1 : 0);

  const reinitialiser = () => {
    setFiltre("toutes");
    setPeriode("tout");
    setDateDebut("");
    setDateFin("");
    setFournisseur("");
    setProduitRecherche("");
    setRecherche("");
  };

  const visibles = useMemo(() => {
    const f = FILTRES.find((x) => x.id === filtre)!;
    const q = sansAccent(recherche);
    const qp = sansAccent(produitRecherche);

    // Dates personnalisées prioritaires, sinon période prédéfinie
    const debut =
      dateDebut ||
      (periode === "tout"
        ? ""
        : new Date(Date.now() - Number(periode) * 86_400_000).toISOString().slice(0, 10));
    const fin = dateFin;

    return lignes.filter((l) => {
      if (!f.ok(l.statut)) return false;
      if (fournisseur && l.fournisseur !== fournisseur) return false;

      const d = (l.c.dateC ?? "").slice(0, 10);
      if (debut && d < debut) return false;
      if (fin && d > fin) return false;

      if (qp && !sansAccent([...l.produits, ...l.medicaments].join(" ")).includes(qp)) return false;

      if (!q) return true;
      return sansAccent(
        [
          l.c.num ?? `#${l.c.id}`,
          l.fournisseur,
          ...l.factures,
          ...l.produits,
          ...l.medicaments,
        ].join(" "),
      ).includes(q);
    });
  }, [lignes, filtre, periode, dateDebut, dateFin, fournisseur, recherche, produitRecherche]);

  const totalPages = Math.ceil(visibles.length / elementsParPage) || 1;
  const pageActuelleSecurisee = Math.min(pageCourante, totalPages);
  const elementsPagines = useMemo(() => {
    const debut = (pageActuelleSecurisee - 1) * elementsParPage;
    return visibles.slice(debut, debut + elementsParPage);
  }, [visibles, pageActuelleSecurisee, elementsParPage]);

  const confirmerAnnulation = async () => {
    if (!aAnnuler) return;
    setOccupeAnnulation(true);
    setMessage(null);
    try {
      await stockApi.annulerCommande(aAnnuler.id);
      await recharger();
    } catch (e) {
      setMessage(messageErreur(e));
    } finally {
      setOccupeAnnulation(false);
      setAAnnuler(null);
    }
  };

  const basculer = (id: number) =>
    setOuvertes((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const onglets: { id: Vue; libelle: string; icone: React.ReactNode }[] = [
    { id: "commandes", libelle: "Commandes", icone: <ClipboardList className="h-4 w-4" /> },
    { id: "fournisseurs", libelle: "Fournisseurs", icone: <Truck className="h-4 w-4" /> },
  ];

  const peutCreer = editable && !!siteActifId;

  return (
    <div className="space-y-[14px] text-sm text-[#1f2937]">
      {/* Onglets */}
      <nav className="flex gap-1 border-b border-[#e5e7eb]" aria-label="Sections des commandes">
        {onglets.map((o) => {
          const actif = vue === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setVue(o.id)}
              aria-current={actif ? "page" : undefined}
              className={`-mb-px inline-flex min-h-[44px] items-center gap-2 border-b-2 px-4 text-sm transition ${FOCUS} ${
                actif
                  ? "border-[#1f9d55] font-bold text-[#14703c]"
                  : "border-transparent text-[#5b6472] hover:text-[#1f2937]"
              }`}
            >
              {o.icone}
              {o.libelle}
            </button>
          );
        })}
      </nav>

      {vue === "fournisseurs" && <PanneauFournisseurs editable={editable} />}

      {vue === "commandes" && (
        <>
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
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Commande, facture, fournisseur, produit…"
                  aria-label="Rechercher une commande"
                  className={`${CHAMP} w-full pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden`}
                />
                {recherche && (
                  <button
                    type="button"
                    onClick={() => setRecherche("")}
                    aria-label="Effacer la recherche"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] ${FOCUS}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex w-full flex-col gap-1 sm:w-56">
                <label htmlFor="cmd-fournisseur" className="text-xs font-bold text-[#5b6472]">
                  Fournisseur
                </label>
                <select
                  id="cmd-fournisseur"
                  value={fournisseur}
                  onChange={(e) => setFournisseur(e.target.value)}
                  className={CHAMP}
                >
                  <option value="">Tous les fournisseurs</option>
                  {fournisseurs.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full flex-col gap-1 sm:w-56">
                <label htmlFor="cmd-produit" className="text-xs font-bold text-[#5b6472]">
                  Produit ou médicament
                </label>
                <div className="relative">
                  <input
                    id="cmd-produit"
                    type="search"
                    value={produitRecherche}
                    onChange={(e) => setProduitRecherche(e.target.value)}
                    placeholder="Ex. Brufen, ibuprofène…"
                    className={`${CHAMP} w-full pr-9 [&::-webkit-search-cancel-button]:hidden`}
                  />
                  {produitRecherche && (
                    <button
                      type="button"
                      onClick={() => setProduitRecherche("")}
                      aria-label="Effacer le filtre produit"
                      className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] ${FOCUS}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {editable && (
                <button
                  type="button"
                  onClick={() => setCreation(true)}
                  disabled={!peutCreer}
                  className={`${BTN_PRIMAIRE} w-full sm:w-auto`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nouvelle commande
                </button>
              )}
            </div>

            {editable && !siteActifId && (
              <p className="mt-2 text-xs font-medium text-[#8a5300]">
                Sélectionnez un site pour créer une commande.
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3 border-t border-[#f0f2f1] pt-3">
              <Pastilles
                label="Statut"
                valeur={filtre}
                onChange={setFiltre}
                options={FILTRES.map((f) => ({
                  valeur: f.id,
                  libelle: f.libelle,
                  couleur: f.couleur,
                  compte: compteurs[f.id],
                }))}
              />
              <Pastilles
                label="Période"
                valeur={periode}
                onChange={(v) => {
                  setPeriode(v);
                  setDateDebut("");
                  setDateFin("");
                }}
                options={PERIODES}
              />

              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="cmd-du" className="text-xs font-bold text-[#5b6472]">
                    Du
                  </label>
                  <input
                    id="cmd-du"
                    type="date"
                    value={dateDebut}
                    max={dateFin || undefined}
                    onChange={(e) => {
                      setDateDebut(e.target.value);
                      setPeriode("tout");
                    }}
                    className={CHAMP}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="cmd-au" className="text-xs font-bold text-[#5b6472]">
                    Au
                  </label>
                  <input
                    id="cmd-au"
                    type="date"
                    value={dateFin}
                    min={dateDebut || undefined}
                    onChange={(e) => {
                      setDateFin(e.target.value);
                      setPeriode("tout");
                    }}
                    className={CHAMP}
                  />
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3 self-end">
                <span className="text-xs text-[#5b6472]" aria-live="polite">
                  {chargement
                    ? "Chargement…"
                    : nbFiltresActifs > 0
                      ? `${visibles.length} sur ${lignes.length} commande(s)`
                      : `${lignes.length} commande(s)`}
                </span>
                {nbFiltresActifs > 0 && (
                  <button type="button" onClick={reinitialiser} className={BTN_SECONDAIRE}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Réinitialiser ({nbFiltresActifs})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Alerte : commandes en attente depuis longtemps */}
          {enRetard > 0 && (
            <div
              role="note"
              className="flex flex-wrap items-center gap-2 rounded-[14px] bg-[#fff4e0] px-3.5 py-3 text-sm font-medium text-[#8a5300]"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {enRetard} commande{enRetard > 1 ? "s" : ""} en attente de réception depuis plus de{" "}
                {JOURS_ALERTE} jours.
              </span>
              {filtre !== "attente" && (
                <button
                  type="button"
                  onClick={() => setFiltre("attente")}
                  className={`ml-auto rounded font-bold underline underline-offset-2 ${FOCUS}`}
                >
                  Afficher les commandes en attente
                </button>
              )}
            </div>
          )}

          <Erreur message={erreur ?? message} />

          {/* État vide */}
          {!chargement && visibles.length === 0 && (
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6f8f7]">
                <ClipboardList className="h-6 w-6 text-[#5b6472]" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-[#1f2937]">
                {lignes.length === 0
                  ? "Aucune commande pour le moment."
                  : "Aucune commande ne correspond à ces filtres."}
              </p>
              {lignes.length > 0 ? (
                <button type="button" onClick={reinitialiser} className={`${BTN_SECONDAIRE} mt-3`}>
                  Réinitialiser les filtres
                </button>
              ) : (
                peutCreer && (
                  <button type="button" onClick={() => setCreation(true)} className={`${BTN_PRIMAIRE} mt-3`}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Créer la première commande
                  </button>
                )
              )}
            </div>
          )}

          {/* Tableau (desktop) */}
          {(chargement || visibles.length > 0) && (
            <div className="hidden overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white md:block">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={`${TH} w-12`}>
                        <span className="sr-only">Détail</span>
                      </th>
                      <th scope="col" className={TH}>Commande</th>
                      <th scope="col" className={TH}>Fournisseur</th>
                      <th scope="col" className={TH}>Produits</th>
                      <th scope="col" className={TH}>Reçu</th>
                      <th scope="col" className={TH}>Statut</th>
                      {editable && (
                        <th scope="col" className={`${TH} text-right`}>
                          <span className="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f0f2f1]">
                    {chargement &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={`sk-${i}`} aria-hidden="true" className="h-[54px]">
                          <td className="p-3" />
                          <td className="p-3">
                            <div className="h-4 w-28 animate-pulse rounded bg-[#f0f2f1]" />
                            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-[#f0f2f1]" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-28 animate-pulse rounded bg-[#f0f2f1]" />
                          </td>
                          <td className="p-3">
                            <div className="h-4 w-28 animate-pulse rounded bg-[#f0f2f1]" />
                          </td>
                          <td className="p-3">
                            <div className="h-2 w-28 animate-pulse rounded bg-[#f0f2f1]" />
                          </td>
                          <td className="p-3">
                            <div className="h-5 w-20 animate-pulse rounded-full bg-[#f0f2f1]" />
                          </td>
                          {editable && <td />}
                        </tr>
                      ))}

                    {!chargement &&
                      elementsPagines.map(
                        ({ c, statut, commande, recu, produits: noms, factures, fournisseur: nomF }) => {
                          const ouvert = ouvertes.has(c.id);
                          const annulee = statut === "annulee";
                          const numCommande = c.num ?? `Commande #${c.id}`;
                          const titre = factures.length > 0 ? factures[0] : numCommande;
                          const peutRecevoir = statut === "envoyee" || statut === "partielle";
                          const peutAnnuler = statut === "envoyee";
                          const detailId = `commande-detail-${c.id}`;

                          return (
                            <React.Fragment key={c.id}>
                              <tr
                                className={`h-[54px] transition-colors ${
                                  ouvert ? "bg-[#fafbfa]" : "hover:bg-[#fafbfa]"
                                } ${annulee ? "opacity-75" : ""}`}
                              >
                                <td
                                  className="p-3"
                                  style={{ boxShadow: `inset 4px 0 0 0 ${STATUTS[statut].couleur}` }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => basculer(c.id)}
                                    aria-expanded={ouvert}
                                    aria-controls={detailId}
                                    aria-label={ouvert ? "Masquer le détail" : "Voir le détail"}
                                    className={`rounded-[10px] p-1.5 text-[#5b6472] transition hover:bg-[#f0f2f1] hover:text-[#1f2937] ${FOCUS}`}
                                  >
                                    <ChevronRight
                                      className={`h-4 w-4 transition-transform ${ouvert ? "rotate-90" : ""}`}
                                    />
                                  </button>
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="whitespace-nowrap font-bold text-[#1f2937]">{titre}</span>
                                    {factures.length > 1 && (
                                      <span
                                        className="rounded-md bg-[#f6f8f7] px-1.5 py-0.5 text-[11px] font-bold text-[#5b6472]"
                                        title={factures.join(", ")}
                                      >
                                        +{factures.length - 1}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-[#5b6472]">
                                    {formatDate(c.dateC)}
                                    {factures.length > 0 && ` · ${numCommande}`}
                                  </div>
                                </td>

                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar nom={nomF} />
                                    <span className="truncate text-[#1f2937]">{nomF}</span>
                                  </div>
                                </td>

                                <td className="max-w-[240px] p-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-[#1f2937]" title={noms.join(", ")}>
                                      {noms[0] ?? "—"}
                                    </span>
                                    {noms.length > 1 && (
                                      <span className="shrink-0 rounded-md bg-[#f6f8f7] px-1.5 py-0.5 text-[11px] font-bold text-[#5b6472]">
                                        +{noms.length - 1}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="p-3">
                                  <div className="w-36">
                                    <Progression recu={recu} commande={commande} couleur={STATUTS[statut].couleur} />
                                  </div>
                                </td>

                                <td className="p-3">
                                  <Chip statut={statut} />
                                </td>

                                {editable && (
                                  <td className="p-3">
                                    <div className="flex items-center justify-end gap-2">
                                      {peutRecevoir && (
                                        <button
                                          type="button"
                                          onClick={() => setARecevoir(c)}
                                          className={BTN_PRIMAIRE}
                                        >
                                          <PackageCheck className="h-4 w-4" aria-hidden="true" />
                                          Réceptionner
                                        </button>
                                      )}
                                      {peutAnnuler && (
                                        <MenuActions
                                          label={`Autres actions pour la commande ${numCommande}`}
                                          actions={[
                                            {
                                              libelle: "Annuler la commande",
                                              icone: <Ban className="h-4 w-4" />,
                                              danger: true,
                                              onClick: () => setAAnnuler(c),
                                            },
                                          ]}
                                        />
                                      )}
                                    </div>
                                  </td>
                                )}
                              </tr>

                              {ouvert && (
                                <tr id={detailId} className="bg-[#fafbfa]">
                                  <td />
                                  <td colSpan={nbCol - 1} className="px-3 pb-4 pt-1">
                                    <DetailCommande
                                      c={c}
                                      statut={statut}
                                      factures={factures}
                                      infoProduit={infoProduit}
                                    />
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        },
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cartes (mobile) */}
          {(chargement || visibles.length > 0) && (
            <ul className="space-y-3 md:hidden">
              {chargement &&
                Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={`skm-${i}`}
                    aria-hidden="true"
                    className="rounded-[14px] border border-[#e5e7eb] bg-white p-4"
                  >
                    <div className="h-4 w-32 animate-pulse rounded bg-[#f0f2f1]" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[#f0f2f1]" />
                    <div className="mt-4 h-2 w-full animate-pulse rounded bg-[#f0f2f1]" />
                  </li>
                ))}

              {!chargement &&
                elementsPagines.map(
                  ({ c, statut, commande, recu, produits: noms, factures, fournisseur: nomF }) => {
                    const ouvert = ouvertes.has(c.id);
                    const annulee = statut === "annulee";
                    const numCommande = c.num ?? `Commande #${c.id}`;
                    const titre = factures.length > 0 ? factures[0] : numCommande;
                    const peutRecevoir = statut === "envoyee" || statut === "partielle";
                    const peutAnnuler = statut === "envoyee";

                    return (
                      <li
                        key={c.id}
                        style={{ borderLeft: `4px solid ${STATUTS[statut].couleur}` }}
                        className={`rounded-[14px] border border-[#e5e7eb] bg-white p-4 ${
                          annulee ? "opacity-75" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-bold text-[#1f2937]">{titre}</div>
                            <div className="text-xs text-[#5b6472]">
                              {formatDate(c.dateC)}
                              {factures.length > 0 && ` · ${numCommande}`}
                            </div>
                          </div>
                          <Chip statut={statut} />
                        </div>

                        <div className="mt-3 flex items-center gap-2.5">
                          <Avatar nom={nomF} />
                          <span className="truncate text-[#1f2937]">{nomF}</span>
                        </div>

                        <p className="mt-2 truncate text-xs text-[#5b6472]" title={noms.join(", ")}>
                          {noms[0] ?? "—"}
                          {noms.length > 1 && ` +${noms.length - 1} autre${noms.length > 2 ? "s" : ""}`}
                        </p>

                        <div className="mt-3">
                          <Progression recu={recu} commande={commande} couleur={STATUTS[statut].couleur} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => basculer(c.id)}
                            aria-expanded={ouvert}
                            className={`${BTN_SECONDAIRE} flex-1`}
                          >
                            <ChevronRight
                              className={`h-4 w-4 transition-transform ${ouvert ? "rotate-90" : ""}`}
                              aria-hidden="true"
                            />
                            {ouvert ? "Masquer le détail" : "Voir le détail"}
                          </button>
                          {editable && peutRecevoir && (
                            <button type="button" onClick={() => setARecevoir(c)} className={`${BTN_PRIMAIRE} flex-1`}>
                              <PackageCheck className="h-4 w-4" aria-hidden="true" />
                              Réceptionner
                            </button>
                          )}
                          {editable && peutAnnuler && (
                            <MenuActions
                              label={`Autres actions pour la commande ${numCommande}`}
                              actions={[
                                {
                                  libelle: "Annuler la commande",
                                  icone: <Ban className="h-4 w-4" />,
                                  danger: true,
                                  onClick: () => setAAnnuler(c),
                                },
                              ]}
                            />
                          )}
                        </div>

                        {ouvert && (
                          <div className="mt-3">
                            <DetailCommande
                              c={c}
                              statut={statut}
                              factures={factures}
                              infoProduit={infoProduit}
                            />
                          </div>
                        )}
                      </li>
                    );
                  },
                )}
            </ul>
          )}

          {/* Pagination */}
          {!chargement && visibles.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-[#5b6472]">
                Lignes par page
                <select
                  value={elementsParPage}
                  onChange={(e) => setElementsParPage(Number(e.target.value))}
                  className="h-10 rounded-[10px] border border-[#e5e7eb] bg-white px-2 text-sm text-[#1f2937] focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30"
                >
                  {TAILLES_PAGE.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <Pagination
                page={pageActuelleSecurisee}
                parPage={elementsParPage}
                total={visibles.length}
                onChange={setPageCourante}
              />
            </div>
          )}
        </>
      )}

      {/* Nouvelle commande */}
      {creation && siteActifId && (
        <Modal titre="Nouvelle commande" onFermer={() => setCreation(false)} large>
          <FormulaireCommande
            siteId={siteActifId}
            onAllerFournisseurs={() => {
              setCreation(false);
              setVue("fournisseurs");
            }}
            onTermine={() => {
              setCreation(false);
              recharger();
            }}
          />
        </Modal>
      )}

      {/* Réception */}
      {aRecevoir && (
        <Modal
          titre={`Réception de la commande ${aRecevoir.num ?? `#${aRecevoir.id}`}`}
          onFermer={() => setARecevoir(null)}
          large
        >
          <FormulaireAppro
            siteId={aRecevoir.siteId}
            commande={aRecevoir}
            onTermine={() => {
              setARecevoir(null);
              recharger();
            }}
          />
        </Modal>
      )}

      {/* Confirmation d'annulation */}
      {aAnnuler && (
        <Modal
          titre="Annuler la commande"
          onFermer={() => !occupeAnnulation && setAAnnuler(null)}
        >
          <div className="space-y-4 text-sm text-[#1f2937]">
            <p>
              Annuler la commande <strong>{aAnnuler.num ?? `#${aAnnuler.id}`}</strong> de{" "}
              <strong>{aAnnuler.fournisseurNom ?? `Fournisseur #${aAnnuler.fournisseurId}`}</strong> ?
              Elle ne pourra plus être réceptionnée.
            </p>
            <div className="flex flex-col-reverse gap-2 border-t border-[#f0f2f1] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAAnnuler(null)}
                disabled={occupeAnnulation}
                className={BTN_SECONDAIRE}
              >
                Garder la commande
              </button>
              <button
                type="button"
                onClick={confirmerAnnulation}
                disabled={occupeAnnulation}
                className={BTN_DANGER}
              >
                {occupeAnnulation && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Annuler la commande
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default PanneauStockCommandes;