import type { DonneesImpression } from "./imprimerOrdonnance";

type RGB = [number, number, number];
const BLEU: RGB = [0, 180, 240];
const BLEU_FONCE: RGB = [10, 127, 176];
const VERT: RGB = [37, 176, 79];
const ORANGE: RGB = [249, 181, 74];
const GRIS: RGB = [85, 85, 85];

const NOM_ASSOCIATION = "Association Sanitaire INterentreprises d'Antananarivo";
const LOGO_PATH = "/images/asina-logo.png";

async function chargerLogo(): Promise<{ data: string; w: number; h: number } | null> {
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

export async function genererPdfOrdonnance(d: DonneesImpression): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const H = 297;
  const M = 16; // marge
  const L = W - 2 * M; // largeur utile
  const logo = await chargerLogo();

  const date = (d.date ? new Date(d.date) : new Date()).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const couleurTexte = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
  const couleurFond = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
  const couleurTrait = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);

  let y = M;

  // ── En-tête ───────────────────────────────────────────────────────────
  let xTexte = M;
  if (logo) {
    const hLogo = 24;
    const wLogo = (logo.w / logo.h) * hLogo;
    pdf.addImage(logo.data, "PNG", M, y, wLogo, hLogo);
    xTexte = M + wLogo + 4;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  couleurTexte(BLEU);
  pdf.text("ASINA", xTexte, y + 10);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  couleurTexte(GRIS);
  pdf.text(pdf.splitTextToSize(NOM_ASSOCIATION, 62), xTexte, y + 15);

  // Bloc méta (aligné à droite)
  const meta: string[] = [
    `Le ${date}`,
    ...(d.site ? [d.site] : []),
    `Dossier #${d.encounterId}${d.ticketNumero ? ` · Ticket ${d.ticketNumero}` : ""}`,
  ];
  pdf.setFontSize(10);
  couleurTexte(BLEU_FONCE);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Ordonnance n° ${d.numero}`, W - M, y + 6, { align: "right" });
  pdf.setFont("helvetica", "normal");
  couleurTexte([51, 51, 51]);
  meta.forEach((ligne, i) => pdf.text(ligne, W - M, y + 11.5 + i * 5, { align: "right" }));

  y += 29;

  // ── Bandeau tricolore ─────────────────────────────────────────────────
  couleurFond(BLEU);
  pdf.rect(M, y, L * 0.45, 1.6, "F");
  couleurFond(VERT);
  pdf.rect(M + L * 0.45, y, L * 0.35, 1.6, "F");
  couleurFond(ORANGE);
  pdf.rect(M + L * 0.8, y, L * 0.2, 1.6, "F");
  y += 11;

  // ── Titre ─────────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  couleurTexte(BLEU_FONCE);
  const titre = "ORDONNANCE MÉDICALE";
  pdf.text(titre, W / 2, y, { align: "center" });
  const wTitre = pdf.getTextWidth(titre);
  couleurTrait(VERT);
  pdf.setLineWidth(0.6);
  pdf.line(W / 2 - wTitre / 2, y + 1.8, W / 2 + wTitre / 2, y + 1.8);
  y += 9;

  // ── Encadré patient ───────────────────────────────────────────────────
  const hPatient = 15;
  couleurFond([244, 251, 254]);
  couleurTrait([207, 233, 245]);
  pdf.setLineWidth(0.25);
  pdf.rect(M, y, L, hPatient, "FD");
  couleurFond(BLEU);
  pdf.rect(M, y, 1.2, hPatient, "F");

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  couleurTexte(GRIS);
  pdf.text("PATIENT", M + 5, y + 5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  couleurTexte([26, 26, 26]);
  pdf.text(d.patientNom, M + 5, y + 11);

  if (d.praticien) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    couleurTexte(GRIS);
    pdf.text("MÉDECIN PRESCRIPTEUR", W - M - 4, y + 5, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    couleurTexte([26, 26, 26]);
    pdf.text(d.praticien, W - M - 4, y + 11, { align: "right" });
  }
  y += hPatient + 9;

  // ── Rx ────────────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "bolditalic");
  pdf.setFontSize(24);
  couleurTexte(VERT);
  pdf.text("Rx", M, y);
  y += 4;

  // ── Tableau ───────────────────────────────────────────────────────────
  const colNum = M + 3;
  const colNom = M + 12;
  const colQte = W - M - 3;
  const largeurPoso = L - 12 - 32;

  const enTeteTableau = () => {
    couleurFond(BLEU);
    pdf.rect(M, y, L, 7, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("#", colNum, y + 4.8);
    pdf.text("MÉDICAMENT ET POSOLOGIE", colNom, y + 4.8);
    pdf.text("QUANTITÉ", colQte, y + 4.8, { align: "right" });
    y += 7;
  };
  enTeteTableau();

  d.lignes.forEach((l, i) => {
    const poso =
      l.posologie +
      (l.dureeJours ? ` · pendant ${l.dureeJours} jour${l.dureeJours > 1 ? "s" : ""}` : "");
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    const lignesPoso = pdf.splitTextToSize(poso, largeurPoso) as string[];
    const hLigne = 6 + lignesPoso.length * 4.6 + 3;

    if (y + hLigne > H - 28) {
      pdf.addPage();
      y = M;
      enTeteTableau();
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    couleurTexte(VERT);
    pdf.text(String(i + 1), colNum, y + 6);

    couleurTexte([26, 26, 26]);
    pdf.setFontSize(11);
    pdf.text(l.nom, colNom, y + 6);
    if (l.forme) {
      const xForme = colNom + pdf.getTextWidth(l.nom) + 2;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      couleurTexte(BLEU_FONCE);
      pdf.text(l.forme, xForme, y + 6);
    }

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    couleurTexte([51, 51, 51]);
    pdf.text(lignesPoso, colNom, y + 11);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    couleurTexte([26, 26, 26]);
    pdf.text(`${l.quantite} u.`, colQte, y + 6, { align: "right" });

    couleurTrait([227, 227, 227]);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + hLigne, W - M, y + hLigne);
    y += hLigne;
  });

  // ── Signature (en bas de la dernière page) ────────────────────────────
  if (y > H - 75) {
    pdf.addPage();
    y = M;
  }
  const xSig = W - M - 60;
  const ySig = H - 48;
  couleurTrait([51, 51, 51]);
  pdf.setLineWidth(0.3);
  pdf.line(xSig, ySig, W - M, ySig);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  couleurTexte(GRIS);
  pdf.text("Signature et cachet du médecin", xSig + 30, ySig + 4.5, { align: "center" });
  if (d.praticien) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    couleurTexte([26, 26, 26]);
    pdf.text(d.praticien, xSig + 30, ySig + 9.5, { align: "center" });
  }

  // ── Pied de page sur chaque page ──────────────────────────────────────
  const nbPages = pdf.getNumberOfPages();
  for (let p = 1; p <= nbPages; p++) {
    pdf.setPage(p);
    couleurTrait(VERT);
    pdf.setLineWidth(0.9);
    pdf.line(M, H - 20, W - M, H - 20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    couleurTexte(BLEU_FONCE);
    pdf.text(`ASINA · ${NOM_ASSOCIATION}`, W / 2, H - 15, { align: "center" });
    pdf.setFont("helvetica", "normal");
    couleurTexte(GRIS);
    pdf.text("Ordonnance valable à la présentation du patient. À conserver.", W / 2, H - 11, {
      align: "center",
    });
    if (nbPages > 1) pdf.text(`${p} / ${nbPages}`, W - M, H - 11, { align: "right" });
  }

  return pdf.output("blob");
}