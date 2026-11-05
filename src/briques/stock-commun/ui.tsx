// stock-commun/ui.tsx
import React from "react";
import { X } from "lucide-react";
import type { StockLigne } from "./types";

/** Logo servi par Symfony (public/images/asina-logo.png). */
export const LOGO_URL = "/images/asina-logo.png";

export const echapper = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

const dateFr = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "—";
};

const CSS_IMPRESSION = `
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; margin: 0; }
  header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1f9d55; padding-bottom: 8px; margin-bottom: 10px; }
  header img { height: 56px; }
  header h1 { font-size: 17px; margin: 0 0 2px; }
  header p { margin: 0; color: #444; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 24px; margin-bottom: 10px; }
  .meta span b { display: inline-block; min-width: 70px; }
  .ligne-vide { display: inline-block; min-width: 180px; border-bottom: 1px solid #111; height: 14px; vertical-align: bottom; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; vertical-align: middle; }
  th { background: #eef1ef; font-size: 10px; text-transform: uppercase; }
  tr { page-break-inside: avoid; }
  .r { text-align: right; }
  .saisie { height: 26px; }
  .produit td { background: #f6f8f7; font-weight: bold; }
  .signatures { display: flex; justify-content: space-between; margin-top: 28px; page-break-inside: avoid; }
  .signatures div { width: 45%; border-top: 1px solid #111; padding-top: 4px; text-align: center; }
  .note { margin-top: 8px; color: #555; font-size: 10px; }
`;

/** Ouvre une fenêtre d'impression avec en-tête (logo, titre, date) et le corps HTML fourni. */
export function imprimerDocument(titre: string, sousTitre: string, corps: string) {
  const w = window.open("", "_blank", "width=1000,height=800");
  if (!w) {
    window.alert("Autorisez les fenêtres pop-up pour imprimer.");
    return;
  }
  const logo = new URL(LOGO_URL, window.location.origin).href;
  const maintenant = new Date().toLocaleString("fr-FR");
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>${echapper(titre)}</title><style>${CSS_IMPRESSION}</style></head><body>
<header>
  <img src="${logo}" alt="ASINA" />
  <div>
    <h1>${echapper(titre)}</h1>
    <p>${echapper(sousTitre)} · Édité le ${maintenant}</p>
  </div>
</header>
${corps}
<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};</script>
</body></html>`);
  w.document.close();
}

/** Fiche d'inventaire physique : une fiche par site, quantités en unités de base. */
export function imprimerFicheInventaire(opts: {
  site: string;
  lignes: StockLigne[];
  aveugle: boolean;
}) {
  const { site, lignes, aveugle } = opts;

  // On garde les périmés (à compter puis sortir), on retire les lots à 0
  const lots = lignes
    .filter((l) => (Number(l.quantite) || 0) > 0)
    .sort(
      (a, b) =>
        (a.produitLibelle ?? "").localeCompare(b.produitLibelle ?? "") ||
        (a.datePeremption ?? "").localeCompare(b.datePeremption ?? ""),
    );

  const groupes = new Map<string, StockLigne[]>();
  lots.forEach((l) => {
    const k = l.produitLibelle ?? "—";
    groupes.set(k, [...(groupes.get(k) ?? []), l]);
  });

  const lignesHtml = Array.from(groupes.entries())
    .map(
      ([produit, ls]) =>
        `<tr class="produit"><td colspan="${aveugle ? 5 : 6}">${echapper(produit)}</td></tr>` +
        ls
          .map(
            (l) => `<tr>
  <td>${echapper(l.lotNumero ?? l.numLot ?? "Sans n° de lot")}</td>
  <td>${dateFr(l.datePeremption)}</td>
  ${aveugle ? "" : `<td class="r">${Number(l.quantite).toLocaleString("fr-FR")}</td>`}
  <td class="saisie"></td>
  <td class="saisie"></td>
  <td class="saisie"></td>
</tr>`,
          )
          .join(""),
    )
    .join("");

  const corps = `
<div class="meta">
  <span><b>Site :</b> ${echapper(site)}</span>
  <span><b>Date :</b> ____ / ____ / ________</span>
  <span><b>Inventoriste :</b> <span class="ligne-vide"></span></span>
  <span><b>Vérificateur :</b> <span class="ligne-vide"></span></span>
</div>
<table>
  <thead><tr>
    <th>N° de lot</th>
    <th>Péremption</th>
    ${aveugle ? "" : `<th class="r">Qté théorique</th>`}
    <th>Qté comptée</th>
    <th>Écart</th>
    <th>Observations</th>
  </tr></thead>
  <tbody>${lignesHtml || `<tr><td colspan="6">Aucun lot en stock sur ce site.</td></tr>`}</tbody>
</table>
<p class="note">Quantités en unités de base (comprimés, gélules, flacons, ampoules). ${
    aveugle ? "Inventaire à l'aveugle : quantités théoriques masquées." : ""
  }</p>
<div class="signatures"><div>Inventoriste</div><div>Pharmacien responsable</div></div>`;

  imprimerDocument(
    "Fiche d'inventaire physique",
    `${site} · ${aveugle ? "à l'aveugle" : "avec quantités théoriques"}`,
    corps,
  );
}
const tons = {
  gris: "bg-gray-100 text-gray-700",
  bleu: "bg-blue-50 text-blue-700",
  vert: "bg-green-50 text-green-700",
  orange: "bg-amber-50 text-amber-700",
  rouge: "bg-red-50 text-red-700",
};

export const Badge: React.FC<{ texte: string; ton?: keyof typeof tons }> = ({
  texte,
  ton = "gris",
}) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${tons[ton]}`}>
    {texte}
  </span>
);

export const Modal: React.FC<{
  titre: string;
  onFermer: () => void;
  large?: boolean;
  children: React.ReactNode;
}> = ({ titre, onFermer, large, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div
      className={`bg-white rounded-xl shadow-xl w-full ${large ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">{titre}</h3>
        <button onClick={onFermer} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

export const Erreur: React.FC<{ message?: string | null }> = ({ message }) =>
  message ? <p className="text-sm text-red-600">{message}</p> : null;

export const Bouton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primaire" | "neutre" | "danger" }
> = ({ variante = "neutre", className = "", ...p }) => {
  const v = {
    primaire: "bg-blue-600 text-white hover:bg-blue-700",
    neutre: "border hover:bg-gray-50",
    danger: "border border-red-300 text-red-700 hover:bg-red-50",
  }[variante];
  return (
    <button
      {...p}
      className={`px-3 py-2 rounded-lg text-sm disabled:opacity-50 ${v} ${className}`}
    />
  );
};

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
