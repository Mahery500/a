// stock-commun/commandes.ts
import type { Commande, StatutCommande } from "./types";

export const sansAccent = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Il n'y a pas de brouillon : une commande enregistrée est « en attente » de livraison.
 * Le serveur peut renvoyer le statut sous plusieurs formes ("Commandée", "Livrée", vide…).
 * Un statut ABSENT ou « brouillon » (anciennes commandes) est traité comme « en attente »
 * (valeur 'envoyee'), pour que ces commandes restent réceptionnables.
 */
export function statutDe(c: Commande): StatutCommande {
  const brut = c as unknown as Record<string, unknown>;
  const s = sansAccent(brut.statut ?? brut.status ?? brut.statutLibelle ?? brut.etat);
  if (!s || s === "brouillon" || s === "draft") return "envoyee";
  if (s.includes("annul")) return "annulee";
  if (s.includes("partiel")) return "partielle";
  if (s.includes("livr") || s.includes("recue") || s === "recu") return "recue";
  return "envoyee"; // « commandée », « envoyée », « en attente », « en cours »…
}

/** Une commande peut encore recevoir de la marchandise. */
export const estEnAttente = (c: Commande) => {
  const s = statutDe(c);
  return s === "envoyee" || s === "partielle";
};
