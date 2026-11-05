import { chargerPdf } from "@/noyau/http/pdf";

const nomFichierSur = (texte: string): string =>
  texte.replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || "commande";

/** Télécharge le PDF du bon de commande (sans ouvrir de nouvel onglet). */
export async function telechargerBonCommande(idCommande: number, numero: string): Promise<void> {
  const blob = await chargerPdf(`/commandes/${idCommande}/bon-commande`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bon_commande_${nomFichierSur(numero)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export interface ParamsGmail {
  email?: string | null;
  numero: string;
  fournisseur: string;
  contact?: string | null;
}

/** Fenêtre de rédaction Gmail pré-remplie (la pièce jointe est à ajouter à la main). */
export function lienGmail({ email, numero, fournisseur, contact }: ParamsGmail): string {
  const sujet = `Bon de commande ${numero}`;
  const corps =
    `Bonjour${contact ? ` ${contact}` : ""},\n\n` +
    `Veuillez trouver ci-joint notre bon de commande n° ${numero}.\n` +
    `Merci de nous confirmer la réception ainsi que le délai de livraison.\n\n` +
    `Cordialement,\nASINA Médical`;

  const params = new URLSearchParams({ view: "cm", fs: "1", su: sujet, body: corps });
  if (email) params.set("to", email);
  void fournisseur;
  return `https://mail.google.com/mail/?${params.toString()}`;
}