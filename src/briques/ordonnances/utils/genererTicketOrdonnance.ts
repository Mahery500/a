import type { DonneesImpression } from "./imprimerOrdonnance";

export type LargeurTicket = 58 | 80;

const NOM_ASSOCIATION = "Association Sanitaire INterentreprises d'Antananarivo";
const LOGO_PATH = "/images/asina-logo.png";

type Logo = { data: string; w: number; h: number } | null;

async function chargerLogo(): Promise<Logo> {
  try {
    const rep = await fetch(`${window.location.origin}${LOGO_PATH}`);
    if (!rep.ok) return null;
    const blob = await rep.blob();
    const data = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((res, rej) => {
      const img = new Image();
      img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => rej(new Error("logo"));
      img.src = data;
    });
    return { data, ...dims };
  } catch {
    return null; // on continue sans logo
  }
}

/** Dessine le ticket et renvoie la hauteur utilisée (mm). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dessiner(pdf: any, d: DonneesImpression, logo: Logo, W: number): number {
  const M = W === 58 ? 3 : 4;
  const L = W - 2 * M;
  const cx = W / 2;
  const k = W === 58 ? 0.9 : 1; // échelle des polices
  let y = M;

  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);

  const police = (style: "normal" | "bold" | "italic" | "bolditalic", taille: number) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(taille * k);
  };

  const centre = (txt: string, style: "normal" | "bold", taille: number, interligne = 1) => {
    police(style, taille);
    const lignes = pdf.splitTextToSize(txt, L) as string[];
    const pas = taille * k * 0.3528 * 1.25 * interligne; // pt -> mm
    lignes.forEach((l) => {
      pdf.text(l, cx, y + pas * 0.8, { align: "center" });
      y += pas;
    });
  };

  const gauche = (
    txt: string,
    style: "normal" | "bold" | "italic" | "bolditalic",
    taille: number,
    retrait = 0,
  ) => {
    police(style, taille);
    const lignes = pdf.splitTextToSize(txt, L - retrait) as string[];
    const pas = taille * k * 0.3528 * 1.25;
    lignes.forEach((l) => {
      pdf.text(l, M + retrait, y + pas * 0.8);
      y += pas;
    });
  };

  const pointille = () => {
    y += 1.5;
    pdf.setLineWidth(0.25);
    pdf.setLineDashPattern([0.8, 0.8], 0);
    pdf.line(M, y, W - M, y);
    pdf.setLineDashPattern([], 0);
    y += 2.5;
  };

  // ── En-tête ───────────────────────────────────────────────────────────
  if (logo) {
    const hLogo = W === 58 ? 12 : 15;
    const wLogo = Math.min((logo.w / logo.h) * hLogo, L);
    pdf.addImage(logo.data, "PNG", cx - wLogo / 2, y, wLogo, hLogo);
    y += hLogo + 1.5;
  }
  centre("ASINA", "bold", 14);
  centre(NOM_ASSOCIATION, "normal", 6.5);
  pointille();

  centre(`ORDONNANCE N° ${d.numero}`, "bold", 10);
  const date = (d.date ? new Date(d.date) : new Date()).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  centre(date, "normal", 8);
  if (d.site) centre(d.site, "normal", 8);
  centre(
    `Dossier #${d.encounterId}${d.ticketNumero ? ` · Ticket ${d.ticketNumero}` : ""}`,
    "normal",
    8,
  );
  pointille();

  // ── Patient / médecin ─────────────────────────────────────────────────
  gauche("PATIENT", "normal", 6.5);
  gauche(d.patientNom, "bold", 10);
  if (d.praticien) {
    y += 1;
    gauche("MÉDECIN PRESCRIPTEUR", "normal", 6.5);
    gauche(d.praticien, "bold", 9);
  }
  pointille();

  // ── Prescription ──────────────────────────────────────────────────────
  gauche("Rx", "bolditalic", 14);
  y += 1;

  d.lignes.forEach((l, i) => {
    gauche(`${i + 1}. ${l.nom}${l.forme ? ` (${l.forme})` : ""}`, "bold", 9.5);
    const poso =
      l.posologie +
      (l.dureeJours ? ` - pendant ${l.dureeJours} jour${l.dureeJours > 1 ? "s" : ""}` : "");
    gauche(poso, "italic", 8.5, 3);
    gauche(`Qté : ${l.quantite} u.`, "bold", 9, 3);
    y += 2;
  });
  pointille();

  // ── Signature ─────────────────────────────────────────────────────────
  gauche("Signature et cachet du médecin", "normal", 7.5);
  y += 14;
  pdf.setLineWidth(0.25);
  pdf.line(M, y, W - M, y);
  y += 1;
  if (d.praticien) {
    centre(d.praticien, "bold", 8);
  }
  y += 2;
  centre("Ordonnance valable à la présentation du patient. À conserver.", "normal", 6.5);

  return y + M + 6; // marge basse pour la coupe
}

export async function genererTicketOrdonnance(
  d: DonneesImpression,
  largeur: LargeurTicket = 80,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const logo = await chargerLogo();

  // Passe 1 : mesurer la hauteur nécessaire
  const mesure = new jsPDF({ unit: "mm", format: [largeur, 2000] });
  const hauteur = Math.max(Math.ceil(dessiner(mesure, d, logo, largeur)), largeur + 10);

  // Passe 2 : page de la hauteur exacte
  const pdf = new jsPDF({ unit: "mm", format: [largeur, hauteur], orientation: "portrait" });
  dessiner(pdf, d, logo, largeur);
  return pdf.output("blob");
}