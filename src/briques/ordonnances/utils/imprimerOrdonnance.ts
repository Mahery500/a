export interface LigneImpression {
  nom: string;
  forme?: string | null;
  quantite: number;
  posologie: string;
  dureeJours?: number | null;
}

export interface DonneesImpression {
  numero: number;
  date?: string | null;
  patientNom: string;
  ticketNumero?: string;
  encounterId: number;
  lignes: LigneImpression[];
  praticien?: string;
  site?: string;
}

const NOM_ASSOCIATION = "Association Sanitaire INterentreprises d'Antananarivo";
const LOGO_PATH = "/images/asina-logo.png";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const attendreImages = (doc: Document, delaiMax = 3000) =>
  Promise.race([
    Promise.all(
      Array.from(doc.images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.addEventListener("load", () => resolve());
            img.addEventListener("error", () => resolve()); // continue même sans logo
          }),
      ),
    ),
    new Promise<void>((resolve) => setTimeout(resolve, delaiMax)),
  ]);

/** Construit le document HTML complet de l'ordonnance (impression + aperçu). */
export function construireHtmlOrdonnance(d: DonneesImpression): string {
  const date = d.date ? new Date(d.date) : new Date();
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const logoUrl = `${window.location.origin}${LOGO_PATH}`;

  const lignes = d.lignes
    .map(
      (l, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>
          <div class="nom">${esc(l.nom)}${l.forme ? ` <span class="forme">${esc(l.forme)}</span>` : ""}</div>
          <div class="poso">${esc(l.posologie)}${
            l.dureeJours
              ? ` &middot; pendant ${l.dureeJours} jour${l.dureeJours > 1 ? "s" : ""}`
              : ""
          }</div>
        </td>
        <td class="qte">${l.quantite}<span> u.</span></td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Ordonnance n° ${d.numero}</title>
<style>
  :root { --bleu: #00b4f0; --bleu-fonce: #0a7fb0; --vert: #25b04f; --orange: #f9b54a; --gris: #555; }
  @page { size: A4; margin: 14mm 16mm 16mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 13px; margin: 0; }
  /* Marges visibles uniquement à l'écran (aperçu) ; à l'impression c'est @page qui s'applique */
  @media screen { body { padding: 14mm 16mm; background: #fff; } .page { min-height: 255mm; } }

  .page { min-height: 255mm; display: flex; flex-direction: column; }

  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 12px; }
  .marque { display: flex; align-items: center; gap: 14px; }
  .marque img { height: 84px; width: auto; display: block; }
  .marque h1 { margin: 0; font-size: 26px; letter-spacing: 3px; color: var(--bleu); line-height: 1; }
  .marque p { margin: 4px 0 0; font-size: 10.5px; color: var(--gris); max-width: 230px; line-height: 1.35; }
  .meta { text-align: right; font-size: 12px; line-height: 1.6; color: #333; }
  .meta strong { color: var(--bleu-fonce); }

  .bandeau { height: 5px; border-radius: 3px; margin-bottom: 18px;
    background: linear-gradient(90deg, var(--bleu) 0 45%, var(--vert) 45% 80%, var(--orange) 80% 100%); }

  .titre { text-align: center; margin: 4px 0 16px; }
  .titre span { display: inline-block; font-size: 15px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase;
    color: var(--bleu-fonce); border-bottom: 2px solid var(--vert); padding-bottom: 4px; }

  .patient { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; margin-bottom: 18px;
    border: 1px solid #cfe9f5; border-left: 4px solid var(--bleu); border-radius: 4px; background: #f4fbfe; }
  .patient .lib { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--gris); }
  .patient .val { font-size: 15px; font-weight: 700; }

  .rx { font-size: 30px; font-weight: 700; font-style: italic; color: var(--vert); margin: 0 0 4px; line-height: 1; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #fff;
    background: var(--bleu); padding: 7px 8px; }
  th:first-child { border-radius: 4px 0 0 0; } th:last-child { border-radius: 0 4px 0 0; text-align: right; }
  td { padding: 10px 8px; border-bottom: 1px solid #e3e3e3; vertical-align: top; }
  tr { page-break-inside: avoid; }
  .num { width: 26px; color: var(--vert); font-weight: 700; }
  .nom { font-size: 14px; font-weight: 700; }
  .forme { font-size: 10.5px; font-weight: 600; color: var(--bleu-fonce); background: #e4f6fd; border-radius: 3px; padding: 1px 6px; margin-left: 4px; }
  .poso { margin-top: 3px; font-style: italic; color: #333; }
  .qte { width: 80px; text-align: right; white-space: nowrap; font-size: 15px; font-weight: 700; }
  .qte span { font-size: 11px; font-weight: 400; color: var(--gris); }

  .espace { flex: 1; }
  .signature { display: flex; justify-content: flex-end; margin: 40px 0 18px; }
  .signature div { width: 230px; text-align: center; font-size: 11.5px; color: var(--gris); }
  .signature .ligne { border-top: 1px solid #333; margin-top: 56px; padding-top: 5px; }
  .signature .nom-medecin { margin-top: 2px; font-size: 12px; font-weight: 700; color: #1a1a1a; }

  footer { border-top: 3px solid var(--vert); padding-top: 8px; text-align: center; font-size: 10px; color: var(--gris); line-height: 1.5; }
  footer strong { color: var(--bleu-fonce); }
</style>
</head>
<body>
<div class="page">
  <header>
    <div class="marque">
      <img src="${logoUrl}" alt="ASINA">
      <div>
        <h1>ASINA</h1>
        <p>${esc(NOM_ASSOCIATION)}</p>
      </div>
    </div>
    <div class="meta">
      <div>Ordonnance n° <strong>${d.numero}</strong></div>
      <div>Le ${esc(dateStr)}</div>
      ${d.site ? `<div>${esc(d.site)}</div>` : ""}
      <div>Dossier #${d.encounterId}${d.ticketNumero ? ` &middot; Ticket ${esc(d.ticketNumero)}` : ""}</div>
    </div>
  </header>
  <div class="bandeau"></div>

  <div class="titre"><span>Ordonnance médicale</span></div>

  <div class="patient">
    <div><div class="lib">Patient</div><div class="val">${esc(d.patientNom)}</div></div>
    ${d.praticien ? `<div style="text-align:right"><div class="lib">Médecin prescripteur</div><div class="val">${esc(d.praticien)}</div></div>` : ""}
  </div>

  <div class="rx">&#8478;</div>
  <table>
    <thead><tr><th>#</th><th>Médicament et posologie</th><th>Quantité</th></tr></thead>
    <tbody>${lignes}</tbody>
  </table>

  <div class="espace"></div>

  <div class="signature">
    <div>
      <div class="ligne">Signature et cachet du médecin</div>
      ${d.praticien ? `<div class="nom-medecin">${esc(d.praticien)}</div>` : ""}
    </div>
  </div>

  <footer>
    <strong>ASINA</strong> &middot; ${esc(NOM_ASSOCIATION)}<br>
    Ordonnance valable à la présentation du patient. À conserver.
  </footer>
</div>
</body>
</html>`;
}

export async function imprimerOrdonnance(d: DonneesImpression): Promise<void> {
  const html = construireHtmlOrdonnance(d);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    throw new Error("Impossible d'ouvrir l'aperçu d'impression.");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await attendreImages(doc); // le logo doit être chargé avant d'imprimer

  const nettoyer = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", nettoyer);
  win.focus();
  win.print();
  setTimeout(nettoyer, 60_000); // filet de sécurité
}