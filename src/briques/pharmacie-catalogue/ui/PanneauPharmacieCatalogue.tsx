// ui/PanneauPharmacieCatalogue.tsx
import React, { useState } from "react";
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { stockApi, refApi, messageErreur } from "@/briques/stock-commun/api";
import { useListe } from "@/briques/stock-commun/useListe";
import { Bouton, Erreur } from "@/briques/stock-commun/ui";
import type { Option, Produit } from "@/briques/stock-commun/types";
import {
  IC,
  Info,
  UNITES_BASE,
  compositionDe,
  detailCond,
  exemplesCodes,
  exemplesLibelles,
  famillesDe,
  libelleDe,
  listeFamilles,
  listeFormes,
  norm,
  trier,
  useInfo,
  type ChampDef,
  type ConfigRef,
} from "./Commun";
import { FormulaireConditionnement } from "./FormulaireConditionnement";
import { FormulaireUnite } from "./FormulaireUnite";
import { FormulaireReference } from "./FormulaireReference";
import { FormulaireMedicament } from "./FormulaireMedicament";
import { FormulaireProduitModale } from "./FormulaireProduitModale";

/* ================================================================== *
 * Liste : barre d'outils + tableau + état vide (une seule fois)
 * ================================================================== */
const Th: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <th
    className={`border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}
  >
    {children}
  </th>
);

const Td: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <td className={`px-4 py-3 align-middle text-gray-700 ${className}`}>{children}</td>
);

type CouleurBadge = "teal" | "gray" | "sky";

const Badge: React.FC<{ children: React.ReactNode; couleur?: CouleurBadge }> = ({
  children,
  couleur = "teal",
}) => {
  const couleurs: Record<CouleurBadge, string> = {
    teal: "bg-teal-50 text-teal-800 ring-teal-200",
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    sky: "bg-sky-50 text-sky-800 ring-sky-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${couleurs[couleur]}`}
    >
      {children}
    </span>
  );
};

const Recherche: React.FC<{ valeur: string; onChange: (v: string) => void }> = ({ valeur, onChange }) => (
  <div className="relative w-full sm:w-60">
    <Search
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      aria-hidden="true"
    />
    <input
      type="search"
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Rechercher…"
      aria-label="Rechercher"
      className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40 [&::-webkit-search-cancel-button]:hidden"
    />
    {valeur && (
      <button
        type="button"
        aria-label="Effacer la recherche"
        onClick={() => onChange("")}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    )}
  </div>
);

const ActionsLigne: React.FC<{ nom: string; onModifier: () => void; onSupprimer: () => void }> = ({
  nom,
  onModifier,
  onSupprimer,
}) => (
  <div className="flex justify-end gap-1 transition sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
    <button
      type="button"
      onClick={onModifier}
      aria-label={`Modifier ${nom}`}
      title="Modifier"
      className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-teal-700"
    >
      <Pencil className="h-4 w-4" />
    </button>
    <button
      type="button"
      onClick={onSupprimer}
      aria-label={`Supprimer ${nom}`}
      title="Supprimer"
      className="rounded p-2 text-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

const Section: React.FC<{
  titre: string;
  total: number;
  visibles: number;
  recherche: string;
  onRecherche: (v: string) => void;
  onNouveau?: () => void;
  erreur?: string | null;
  info?: string | null;
  colonnes: string[];
  vide: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}> = ({ titre, total, visibles, recherche, onRecherche, onNouveau, erreur, info, colonnes, vide, icone, children }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      {/* Sur mobile, le titre est déjà dans le menu déroulant */}
      <h3 className="hidden text-base font-semibold text-gray-900 lg:block">{titre}</h3>
      <span
        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600"
        aria-live="polite"
      >
        {visibles === total ? total : `${visibles}/${total}`}
      </span>
      <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
        <Recherche valeur={recherche} onChange={onRecherche} />
        {onNouveau && (
          <Bouton variante="primaire" onClick={onNouveau}>
            <Plus className="mr-1 inline h-4 w-4" />
            Nouveau
          </Bouton>
        )}
      </div>
    </div>

    <Erreur message={erreur ?? null} />
    <Info message={info ?? null} />

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {colonnes.map((c) => (
                <Th key={c}>{c}</Th>
              ))}
              <Th className="w-24">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {children}
            {visibles === 0 && (
              <tr>
                <td colSpan={colonnes.length + 1} className="px-4 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    {icone}
                  </div>
                  <p className="text-sm text-gray-500">{recherche ? "Aucun résultat." : vide}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* ================================================================== *
 * Référentiels (configurations)
 * ================================================================== */
const REFERENCES: Record<string, ConfigRef> = {
  familles: {
    titre: "Familles",
    nouveau: "Nouvelle famille",
    modifier: "Modifier la famille",
    vide: "Aucune famille.",
    icone: IC.familles,
    api: refApi.familles,
    champs: [{ cle: "libelle", libelle: "Libellé", type: "texte", requis: true, placeholder: "Antalgiques" }],
    exemples: exemplesLibelles([
      "Antalgiques",
      "Antibiotiques",
      "Anti-inflammatoires",
      "Antipaludiques",
      "Antihypertenseurs",
      "Antidiabétiques",
      "Antihistaminiques",
      "Antispasmodiques",
      "Antiparasitaires",
      "Antifongiques",
      "Antiseptiques",
      "Vitamines et minéraux",
    ]),
  },
  principes: {
    titre: "Principes actifs",
    nouveau: "Nouveau principe actif",
    modifier: "Modifier le principe actif",
    vide: "Aucun principe actif.",
    icone: IC.principes,
    api: refApi.principesActifs,
    champs: [{ cle: "libelle", libelle: "Libellé", type: "texte", requis: true, placeholder: "Paracétamol" }],
    exemples: exemplesLibelles([
      "Paracétamol",
      "Ibuprofène",
      "Diclofénac",
      "Amoxicilline",
      "Ciprofloxacine",
      "Métronidazole",
      "Artéméther",
      "Luméfantrine",
      "Chloroquine",
      "Albendazole",
      "Oméprazole",
      "Metformine",
      "Amlodipine",
      "Acide folique",
      "Sulfate ferreux",
    ]),
  },
  presentations: {
    titre: "Présentations",
    nouveau: "Nouvelle présentation",
    modifier: "Modifier la présentation",
    vide: "Aucune présentation.",
    icone: IC.presentations,
    api: refApi.presentations,
    champs: [
      { cle: "libelle", libelle: "Libellé", type: "texte", requis: true, placeholder: "Comprimé 500 mg" },
      { cle: "code", libelle: "Code", type: "texte", placeholder: "CP500" },
      {
        cle: "uniteBase",
        libelle: "Unité de base",
        type: "pastilles",
        requis: true,
        defaut: "comprime",
        aide: "Ce qu’on compte en stock : flacons pour un sirop, ampoules pour un injectable.",
        choix: UNITES_BASE.map(({ valeur, libelle }) => ({ valeur, libelle })),
      },
    ],
    exemples: [
      { titre: "Comprimé 500 mg", valeurs: { libelle: "Comprimé 500 mg", code: "CP500", uniteBase: "comprime" } },
      { titre: "Comprimé 1 g", valeurs: { libelle: "Comprimé 1 g", code: "CP1000", uniteBase: "comprime" } },
      { titre: "Gélule 250 mg", valeurs: { libelle: "Gélule 250 mg", code: "GEL250", uniteBase: "gelule" } },
      { titre: "Sirop 125 mg/5 mL", valeurs: { libelle: "Sirop 125 mg/5 mL", code: "SIR125", uniteBase: "flacon" } },
      {
        titre: "Injectable 500 mg/2 mL",
        valeurs: { libelle: "Injectable 500 mg/2 mL", code: "INJ500", uniteBase: "ampoule" },
      },
      { titre: "Sachet 1 g", valeurs: { libelle: "Sachet 1 g", code: "SACH1G", uniteBase: "sachet" } },
      { titre: "Crème 30 g", valeurs: { libelle: "Crème 30 g", code: "CR30", uniteBase: "tube" } },
    ],
  },
  conditionnements: {
    titre: "Conditionnements",
    nouveau: "Nouveau conditionnement",
    modifier: "Modifier le conditionnement",
    vide: "Aucun conditionnement.",
    icone: IC.conditionnements,
    api: refApi.conditionnements,
    formulaire: FormulaireConditionnement,
    // Les quantités sont dans « Résumé » : pas de colonnes numériques en double
    champs: [
      { cle: "libelle", libelle: "Libellé", type: "texte" },
      { cle: "code", libelle: "Code", type: "texte" },
    ],
    resume: (x) => {
      const b = Number(x.nbUnitesParBoite);
      const p = Number(x.nbUnitesParPlaquette);
      if (!(b > 0)) return "";
      if (p > 0) return b % p === 0 ? `${b / p} plaquettes × ${p} = ${b} unités` : `${b} unités, ${p} par plaquette`;
      return `${b} unité${b > 1 ? "s" : ""} par boîte`;
    },
  },
  formes: {
    titre: "Formes",
    nouveau: "Nouvelle forme",
    modifier: "Modifier la forme",
    vide: "Aucune forme.",
    icone: IC.formes,
    api: refApi.formes,
    champs: [
      { cle: "libelle", libelle: "Libellé", type: "texte", requis: true, placeholder: "Comprimé" },
      { cle: "code", libelle: "Code", type: "texte", requis: true, placeholder: "COMPRIME" },
    ],
    exemples: exemplesCodes([
      ["Comprimé", "COMPRIME"],
      ["Gélule", "GELULE"],
      ["Sirop", "SIROP"],
      ["Solution injectable", "INJECTABLE"],
      ["Suspension buvable", "SUSPENSION"],
      ["Poudre pour solution buvable", "POUDRE"],
      ["Crème", "CREME"],
      ["Pommade", "POMMADE"],
      ["Collyre", "COLLYRE"],
      ["Suppositoire", "SUPPOSITOIRE"],
    ]),
  },
  voies: {
    titre: "Voies",
    nouveau: "Nouvelle voie",
    modifier: "Modifier la voie",
    vide: "Aucune voie.",
    icone: IC.voies,
    api: refApi.voies,
    champs: [
      { cle: "libelle", libelle: "Libellé", type: "texte", requis: true, placeholder: "Voie orale" },
      { cle: "code", libelle: "Code", type: "texte", requis: true, placeholder: "ORALE" },
    ],
    exemples: exemplesCodes([
      ["Voie orale", "ORALE"],
      ["Intraveineuse", "IV"],
      ["Intramusculaire", "IM"],
      ["Sous-cutanée", "SC"],
      ["Cutanée", "CUTANEE"],
      ["Rectale", "RECTALE"],
      ["Ophtalmique", "OPHTALMIQUE"],
      ["Nasale", "NASALE"],
      ["Sublinguale", "SUBLINGUALE"],
      ["Inhalée", "INHALEE"],
    ]),
  },
  unites: {
    titre: "Unités de mesure",
    nouveau: "Nouvelle unité",
    modifier: "Modifier l’unité",
    vide: "Aucune unité.",
    icone: IC.unites,
    api: refApi.unitesMesure,
    formulaire: FormulaireUnite,
    champs: [
      { cle: "libelle", libelle: "Libellé", type: "texte" },
      { cle: "code", libelle: "Code", type: "texte" },
    ],
  },
};

/* ================================================================== *
 * Panneau de référence générique
 * ================================================================== */
const PanneauReference: React.FC<{ config: ConfigRef; editable: boolean }> = ({ config, editable }) => {
  const { items, erreur, recharger } = useListe(config.api.liste);
  const [edition, setEdition] = useState<any | "nouveau" | null>(null);
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { info, setInfo } = useInfo();

  const cellule = (x: any, c: ChampDef) => {
    const val = x[c.cle] ?? "";
    if (val === "") return <span className="text-gray-400">—</span>;
    if (c.type === "pastilles") return c.choix?.find((f) => f.valeur === val)?.libelle ?? val;
    if (c.cle === "code")
      return (
        <Badge couleur="gray">
          <span className="font-mono">{val}</span>
        </Badge>
      );
    return val;
  };

  const visibles = trier(
    items.filter((x: any) => norm(libelleDe(x)).includes(norm(recherche))),
    libelleDe,
  );

  const supprimer = async (x: any) => {
    if (!window.confirm(`Supprimer « ${libelleDe(x)} » ?`)) return;
    setMessage(null);
    try {
      await config.api.supprimer(x.id);
      await recharger();
      setInfo("Supprimé.");
    } catch (e) {
      setMessage(messageErreur(e, "Suppression impossible (élément utilisé ailleurs ?)."));
    }
  };

  const Formulaire = config.formulaire ?? FormulaireReference;

  return (
    <>
      <Section
        titre={config.titre}
        total={items.length}
        visibles={visibles.length}
        recherche={recherche}
        onRecherche={setRecherche}
        onNouveau={editable ? () => setEdition("nouveau") : undefined}
        erreur={erreur ?? message}
        info={info}
        colonnes={[...config.champs.map((c) => c.libelle), ...(config.resume ? ["Résumé"] : [])]}
        vide={config.vide}
        icone={config.icone}
      >
        {visibles.map((x: any) => (
          <tr key={x.id} className="group transition-colors hover:bg-teal-50/40">
            {config.champs.map((c, i) => (
              <Td key={c.cle} className={i === 0 ? "font-medium text-gray-900" : ""}>
                {cellule(x, c)}
              </Td>
            ))}
            {config.resume && <Td className="text-gray-500">{config.resume(x)}</Td>}
            <Td>
              {editable && (
                <ActionsLigne nom={libelleDe(x)} onModifier={() => setEdition(x)} onSupprimer={() => supprimer(x)} />
              )}
            </Td>
          </tr>
        ))}
      </Section>
      {edition && (
        <Formulaire
          config={config}
          item={edition === "nouveau" ? null : edition}
          onFermer={() => setEdition(null)}
          onTermine={() => {
            setEdition(null);
            recharger();
            setInfo("Enregistré.");
          }}
        />
      )}
    </>
  );
};

/* ================================================================== *
 * Médicaments
 * ================================================================== */
const PanneauMedicaments: React.FC<{ editable: boolean; onAller: (o: string) => void }> = ({
  editable,
  onAller,
}) => {
  const meds = useListe(refApi.medicaments.liste);
  const familles = useListe(listeFamilles);
  const formes = useListe(listeFormes);
  const [edition, setEdition] = useState<any | "nouveau" | null>(null);
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const { info, setInfo } = useInfo();

  const nomsFam = new Map(familles.items.map((o) => [o.id, o.libelle]));
  const nomsForme = new Map(formes.items.map((o) => [o.id, o.libelle]));
  const visibles = trier(
    meds.items.filter((x: any) => norm(compositionDe(x)).includes(norm(recherche))),
    (x: any) => compositionDe(x),
  );

  const supprimer = async (x: any) => {
    if (!window.confirm(`Supprimer « ${compositionDe(x)} » ?`)) return;
    setMessage(null);
    try {
      await refApi.medicaments.supprimer(x.id);
      await meds.recharger();
      setInfo("Supprimé.");
    } catch (e) {
      setMessage(messageErreur(e, "Suppression impossible (produits ou ordonnances rattachés ?)."));
    }
  };

  return (
    <>
      <Section
        titre="Médicaments"
        total={meds.items.length}
        visibles={visibles.length}
        recherche={recherche}
        onRecherche={setRecherche}
        onNouveau={editable ? () => setEdition("nouveau") : undefined}
        erreur={meds.erreur ?? message}
        info={info}
        colonnes={["Médicament", "Forme", "Familles"]}
        vide="Aucun médicament."
        icone={IC.medicaments}
      >
        {visibles.map((x: any) => (
          <tr key={x.id} className="group transition-colors hover:bg-teal-50/40">
            <Td className="font-medium text-gray-900">{compositionDe(x)}</Td>
            <Td>
              {x.formeId ? (
                <Badge couleur="sky">{nomsForme.get(x.formeId) ?? `#${x.formeId}`}</Badge>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {famillesDe(x).map((id) => (
                  <Badge key={id}>{nomsFam.get(id) ?? `#${id}`}</Badge>
                ))}
                {famillesDe(x).length === 0 && <span className="text-gray-400">—</span>}
              </div>
            </Td>
            <Td>
              {editable && (
                <ActionsLigne
                  nom={compositionDe(x)}
                  onModifier={() => setEdition(x)}
                  onSupprimer={() => supprimer(x)}
                />
              )}
            </Td>
          </tr>
        ))}
      </Section>
      {edition && (
        <FormulaireMedicament
          item={edition === "nouveau" ? null : edition}
          onAller={onAller}
          onFermer={() => setEdition(null)}
          onTermine={() => {
            setEdition(null);
            meds.recharger();
            setInfo("Enregistré.");
          }}
        />
      )}
    </>
  );
};

/* ================================================================== *
 * Produits
 * ================================================================== */
const PanneauProduits: React.FC<{ editable: boolean; onAller: (o: string) => void }> = ({ editable, onAller }) => {
  const produits = useListe(stockApi.produits);
  const medsBrut = useListe(refApi.medicaments.liste);
  const condsBrut = useListe(refApi.conditionnements.liste);
  const presBrut = useListe(refApi.presentations.liste);
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<Produit | "nouveau" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { info, setInfo } = useInfo();

  const nomMed = new Map<number, string>(
    medsBrut.items.map((x: any): [number, string] => [x.id, compositionDe(x)]),
  );
  const condParId = new Map<number, any>(condsBrut.items.map((c: any) => [c.id, c]));
  const presParId = new Map<number, any>(presBrut.items.map((p: any) => [p.id, p]));
  const visibles = trier(
    produits.items.filter((p) => norm(p.nomCommercial).includes(norm(recherche))),
    (p) => p.nomCommercial,
  );

  const supprimer = async (p: Produit) => {
    if (!window.confirm(`Supprimer « ${p.nomCommercial} » ?`)) return;
    setMessage(null);
    try {
      await stockApi.supprimerProduit(p.id);
      await produits.recharger();
      setInfo("Supprimé.");
    } catch (e) {
      setMessage(messageErreur(e, "Suppression impossible (produit utilisé ?)."));
    }
  };

  return (
    <>
      <Section
        titre="Produits"
        total={produits.items.length}
        visibles={visibles.length}
        recherche={recherche}
        onRecherche={setRecherche}
        onNouveau={editable ? () => setEdition("nouveau") : undefined}
        erreur={produits.erreur ?? message}
        info={info}
        colonnes={["Médicament", "Produit", "Conditionnement"]}
        vide="Aucun produit."
        icone={IC.produits}
      >
        {visibles.map((p) => {
          const cond = p.conditionnementId ? condParId.get(p.conditionnementId) : undefined;
          const pres = p.presentationId ? presParId.get(p.presentationId) : undefined;
          return (
            <tr key={p.id} className="group transition-colors hover:bg-teal-50/40">
              <Td>
                {p.medicamentId ? (
                  (nomMed.get(p.medicamentId) ?? `#${p.medicamentId}`)
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </Td>
              <Td>
                <div className="font-medium text-gray-900">{p.nomCommercial}</div>
                {pres && <div className="text-xs text-gray-500">{libelleDe(pres)}</div>}
              </Td>
              <Td>
                {p.conditionnementId ? (
                  <>
                    <div className="text-gray-900">{cond ? libelleDe(cond) : `#${p.conditionnementId}`}</div>
                    {cond && <div className="text-xs text-gray-500">{detailCond(cond, pres)}</div>}
                  </>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </Td>
              <Td>
                {editable && (
                  <ActionsLigne
                    nom={p.nomCommercial}
                    onModifier={() => setEdition(p)}
                    onSupprimer={() => supprimer(p)}
                  />
                )}
              </Td>
            </tr>
          );
        })}
      </Section>
      {edition && (
        <FormulaireProduitModale
          produit={edition === "nouveau" ? null : edition}
          onAller={onAller}
          onFermer={() => setEdition(null)}
          onTermine={() => {
            setEdition(null);
            produits.recharger();
            setInfo("Enregistré.");
          }}
        />
      )}
    </>
  );
};

/* ================================================================== *
 * Navigation : sidebar groupée (desktop) + menu déroulant (mobile)
 * ================================================================== */
interface OngletDef {
  id: string;
  libelle: string;
}

const GROUPES: { titre: string; items: OngletDef[] }[] = [
  {
    titre: "Produits",
    items: [
      { id: "produits", libelle: "Produits" },
      { id: "medicaments", libelle: "Médicaments" },
    ],
  },
  {
    titre: "Composition",
    items: [
      { id: "principes", libelle: "Principes actifs" },
      { id: "familles", libelle: "Familles" },
    ],
  },
  {
    titre: "Présentation",
    items: [
      { id: "presentations", libelle: "Présentations" },
      { id: "conditionnements", libelle: "Conditionnements" },
      { id: "formes", libelle: "Formes" },
      { id: "voies", libelle: "Voies" },
      { id: "unites", libelle: "Unités de mesure" },
    ],
  },
];

const TOUS_ONGLETS: OngletDef[] = GROUPES.flatMap((g) => g.items);
const titreOnglet = (id: string) => TOUS_ONGLETS.find((o) => o.id === id)?.libelle ?? "";

const ItemNav: React.FC<{ o: OngletDef; actif: boolean; onClick: () => void }> = ({ o, actif, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={actif ? "page" : undefined}
    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
      actif ? "bg-teal-50 font-medium text-teal-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <span className={actif ? "text-teal-700" : "text-gray-400"}>{IC[o.id]}</span>
    <span className="truncate">{o.libelle}</span>
  </button>
);

const NavigationCatalogue: React.FC<{ onglet: string; setOnglet: (id: string) => void }> = ({
  onglet,
  setOnglet,
}) => {
  const [menuMobile, setMenuMobile] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-4 space-y-5" aria-label="Catalogue">
          {GROUPES.map((g) => (
            <div key={g.titre} className="space-y-0.5">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {g.titre}
              </div>
              {g.items.map((o) => (
                <ItemNav key={o.id} o={o} actif={onglet === o.id} onClick={() => setOnglet(o.id)} />
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile */}
      <div className="relative lg:hidden">
        <button
          type="button"
          onClick={() => setMenuMobile((v) => !v)}
          aria-expanded={menuMobile}
          className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm transition hover:bg-gray-50"
        >
          <span className="text-teal-700">{IC[onglet]}</span>
          <span className="flex-1 text-left font-medium text-gray-900">{titreOnglet(onglet)}</span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${menuMobile ? "rotate-180" : ""}`} />
        </button>
        {menuMobile && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuMobile(false)} />
            <div className="absolute z-20 mt-1 max-h-[70vh] w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
              {GROUPES.map((g, idx) => (
                <div key={g.titre} className={`pb-1 ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                  <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {g.titre}
                  </div>
                  {g.items.map((o) => (
                    <ItemNav
                      key={o.id}
                      o={o}
                      actif={onglet === o.id}
                      onClick={() => {
                        setOnglet(o.id);
                        setMenuMobile(false);
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

/* ================================================================== *
 * Panneau principal
 * ================================================================== */
export const PanneauPharmacieCatalogue: React.FC<{ mode: ModeAffichage }> = ({ mode }) => {
  const [onglet, setOnglet] = useState("produits");
  const editable = mode === "edition";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
      <NavigationCatalogue onglet={onglet} setOnglet={setOnglet} />

      <div className="min-w-0 flex-1">
        {onglet === "produits" && <PanneauProduits editable={editable} onAller={setOnglet} />}
        {onglet === "medicaments" && <PanneauMedicaments editable={editable} onAller={setOnglet} />}
        {onglet !== "produits" && onglet !== "medicaments" && (
          <PanneauReference key={onglet} config={REFERENCES[onglet]} editable={editable} />
        )}
      </div>
    </div>
  );
};

export default PanneauPharmacieCatalogue;