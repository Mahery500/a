// stock-commun/FormulaireAppro.tsx
import React, { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Check, Loader2, Minus, Plus, Receipt } from "lucide-react";
import { stockApi, messageErreur } from "../stock-commun/api";
import { Bouton, Erreur } from "../stock-commun/ui";
import type { Commande, UniteStock } from "../stock-commun/types";

/**
 * Réception d'une commande (entrée en stock). Une réception est toujours liée à une commande :
 * fournisseur et produits sont ceux de la commande, la quantité préremplie est le RESTE à recevoir.
 * N° de facture obligatoire (saisi à la main), péremption obligatoire pour toute ligne reçue,
 * prix facultatif.
 * Le serveur génère les numéros de lot et met à jour le stock du site.
 */

interface Ligne {
  cle: string;
  produitId: number;
  nom: string;
  unite: UniteStock;
  commandee: number;
  /** Déjà reçu, éventuellement fractionnaire (ex. 0,4 boîte). Affichage uniquement. */
  dejaRecu: number;
  /** Reste à recevoir, arrondi à l'entier supérieur : on réceptionne en boîtes entières. */
  restant: number;
  recu: string;
  peremption: string;
  prix: string;
}

type Etat = "deja" | "rien" | "partiel" | "complet" | "trop";
type Champ = "qte" | "date" | "prix";
interface Probleme {
  champ: Champ;
  message: string;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40";
const CHAMP =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40";

const ETATS: Record<Etat, { texte: string; classe: string }> = {
  deja: { texte: "Déjà reçu", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rien: { texte: "Rien reçu", classe: "bg-gray-100 text-gray-600 ring-gray-200" },
  partiel: { texte: "Partiel", classe: "bg-amber-50 text-amber-800 ring-amber-200" },
  complet: { texte: "Complet", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  trop: { texte: "Excédent", classe: "bg-amber-50 text-amber-800 ring-amber-200" },
};

const LIBELLE_UNITE: Record<string, string> = {
  boite: "boîte(s)",
  plaquette: "plaquette(s)",
  unite: "comprimé(s)",
  comprime: "comprimé(s)",
};
const libelle = (u: string) => LIBELLE_UNITE[u] ?? u;

/** Nombre affiché à la française, 2 décimales au maximum (0,4 — 3 — 2,5). */
const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const iso = (t: Date) =>
  `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;

/** Une péremption doit être strictement après aujourd'hui. */
const demainIso = () => {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return iso(t);
};

const entier = (txt: string) => {
  const n = Number(txt);
  return txt.trim() !== "" && Number.isInteger(n) && n >= 0 ? n : null;
};

const etatDe = (l: Ligne): Etat => {
  if (l.restant === 0) return "deja";
  const q = entier(l.recu) ?? 0;
  if (q <= 0) return "rien";
  if (q > l.restant) return "trop";
  return q === l.restant ? "complet" : "partiel";
};

const problemeDe = (l: Ligne, demain: string): Probleme | null => {
  if (l.restant === 0) return null;
  const q = entier(l.recu);
  if (q === null) return { champ: "qte", message: "Entrez un nombre entier (0 si rien reçu)." };
  if (q === 0) return null;
  if (!l.peremption) return { champ: "date", message: "Indiquez la date de péremption." };
  if (l.peremption < demain)
    return { champ: "date", message: "La péremption doit être postérieure à aujourd'hui." };
  if (l.prix.trim() !== "" && !(Number(l.prix.replace(",", ".")) >= 0))
    return { champ: "prix", message: "Prix invalide." };
  return null;
};

export const FormulaireAppro: React.FC<{
  siteId: number;
  commande: Commande;
  onTermine: () => void;
}> = ({ siteId, commande, onTermine }) => {
  const [numFac, setNumFac] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    commande.details.map((d) => {
      const dejaRecu = Number(d.qteRecue ?? 0) || 0;
      // 1e-9 : évite qu'un flottant du type 2,0000000001 ne réclame une boîte de plus.
      const restant = Math.max(0, Math.ceil(d.qte - dejaRecu - 1e-9));
      return {
        cle: `d${d.id}`,
        produitId: Number(d.produitId),
        nom: d.produitNom ?? `Produit #${d.produitId}`,
        // Anciennes commandes : unité absente côté serveur → on reçoit en boîtes.
        unite: (d.unite ?? "boite") as UniteStock,
        commandee: d.qte,
        dejaRecu,
        restant,
        recu: String(restant),
        peremption: "",
        prix: "",
      };
    }),
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [tente, setTente] = useState(false);

  const demain = demainIso();
  const factureManquante = tente && numFac.trim() === "";

  const maj = (cle: string, c: Partial<Ligne>) =>
    setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, ...c } : l)));

  const resume = useMemo(() => {
    const etats = lignes.map(etatDe);
    const actives = etats.filter((e) => e !== "deja" && e !== "rien").length;
    return {
      actives,
      incomplet: etats.some((e) => e === "rien" || e === "partiel"),
      excedent: etats.includes("trop"),
      totalRecu: lignes.reduce((s, l) => s + (l.restant > 0 ? (entier(l.recu) ?? 0) : 0), 0),
      totalRestant: lignes.reduce((s, l) => s + l.restant, 0),
    };
  }, [lignes]);

  const valider = async () => {
    setErreur(null);
    setTente(true);

    // Le numéro de facture est obligatoire.
    if (numFac.trim() === "") {
      document.getElementById("appro-numfac")?.focus();
      return;
    }

    for (const l of lignes) {
      const p = problemeDe(l, demain);
      if (p) {
        document.getElementById(`appro-${l.cle}-${p.champ}`)?.focus();
        return;
      }
    }

    const retenues = lignes.filter((l) => l.restant > 0 && (entier(l.recu) ?? 0) > 0);
    if (retenues.length === 0) return setErreur("Saisissez au moins une quantité reçue.");

    setOccupe(true);
    try {
      await stockApi.creerAppro({
        numFac: numFac.trim(),
        commandeId: commande.id,
        fournisseurId: Number(commande.fournisseurId),
        siteId,
        details: retenues.map((l) => ({
          produitId: l.produitId,
          datePeremption: l.peremption,
          qte: Number(l.recu),
          unite: l.unite,
          prix: l.prix.trim() === "" ? null : Number(l.prix.replace(",", ".")),
        })),
      });
      onTermine();
    } catch (e) {
      setErreur(messageErreur(e, "La réception n'a pas pu être enregistrée."));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <p className="text-gray-600">
        Indiquez ce qui est réellement arrivé. Les numéros de lot sont générés automatiquement et le
        stock du site est mis à jour à la validation.
      </p>

      {/* Facture : obligatoire */}
      <label className="block">
        <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Receipt className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
          N° de facture <span className="text-red-600">*</span>
        </span>
        <input
          id="appro-numfac"
          value={numFac}
          maxLength={50}
          required
          aria-required="true"
          aria-invalid={factureManquante}
          placeholder="Numéro inscrit sur la facture du fournisseur"
          onChange={(e) => setNumFac(e.target.value)}
          className={`${CHAMP} ${factureManquante ? "border-red-400" : "border-gray-300"}`}
        />
        {factureManquante && (
          <span className="mt-1 block text-xs text-red-600" role="alert">
            Le numéro de facture est obligatoire.
          </span>
        )}
      </label>

      <Erreur message={erreur} />

      <ul className="space-y-3">
        {lignes.map((l) => {
          const etat = etatDe(l);
          const ferme = l.restant === 0;
          const q = entier(l.recu) ?? 0;
          const probleme = tente ? problemeDe(l, demain) : null;
          const pctRecu = l.commandee > 0 ? Math.min(100, (l.dejaRecu / l.commandee) * 100) : 0;
          const pctSaisi =
            l.commandee > 0
              ? Math.max(0, Math.min(100 - pctRecu, (Math.min(q, l.restant) / l.commandee) * 100))
              : 0;
          const unite = libelle(l.unite);

          return (
            <li
              key={l.cle}
              className={`rounded-xl border p-3 ${
                ferme ? "border-gray-200 bg-gray-50/60" : "border-gray-200 bg-white shadow-sm"
              }`}
            >
              {/* En-tête */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900" title={l.nom}>
                    {l.nom}
                  </p>
                  <p className="text-xs tabular-nums text-gray-500">
                    {fmt(l.dejaRecu)} / {fmt(l.commandee)} {unite}
                    {!ferme && ` · reste ${l.restant}`}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${ETATS[etat].classe}`}
                >
                  {(etat === "complet" || etat === "deja") && (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  )}
                  {etat === "trop" && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                  {ETATS[etat].texte}
                </span>
              </div>

              {/* Avancement : déjà reçu (vert) + ce qui est saisi maintenant (teal) */}
              <div
                className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-gray-100"
                role="img"
                aria-label={`${fmt(l.dejaRecu)} déjà reçu sur ${fmt(l.commandee)}`}
              >
                <div className="h-full bg-emerald-500" style={{ width: `${pctRecu}%` }} />
                <div className="h-full bg-teal-400 transition-all" style={{ width: `${pctSaisi}%` }} />
              </div>

              {!ferme && (
                <>
                  {/* Quantité */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div
                      className={`flex items-center overflow-hidden rounded-lg border bg-white ${
                        probleme?.champ === "qte" ? "border-red-400" : "border-gray-300"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Moins — ${l.nom}`}
                        disabled={q <= 0}
                        onClick={() => maj(l.cle, { recu: String(Math.max(0, q - 1)) })}
                        className={`p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-30 ${FOCUS}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        id={`appro-${l.cle}-qte`}
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        aria-label={`Quantité reçue — ${l.nom}`}
                        value={l.recu}
                        onChange={(e) => maj(l.cle, { recu: e.target.value })}
                        className="w-14 border-x border-gray-200 py-2 text-center text-sm tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        aria-label={`Plus — ${l.nom}`}
                        onClick={() => maj(l.cle, { recu: String(q + 1) })}
                        className={`p-2 text-gray-600 hover:bg-gray-50 ${FOCUS}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <span className="text-xs text-gray-500">{unite} reçue(s)</span>

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => maj(l.cle, { recu: String(l.restant) })}
                        disabled={l.recu === String(l.restant)}
                        className={`rounded-lg px-2.5 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-40 ${FOCUS}`}
                      >
                        Tout ({l.restant})
                      </button>
                      <button
                        type="button"
                        onClick={() => maj(l.cle, { recu: "0" })}
                        disabled={q === 0}
                        className={`rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 ${FOCUS}`}
                      >
                        Rien
                      </button>
                    </div>
                  </div>

                  {/* Péremption + prix : uniquement si quelque chose est reçu */}
                  {q > 0 ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-600">
                          Date de péremption
                        </span>
                        <div className="relative">
                          <CalendarDays
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-700"
                            aria-hidden="true"
                          />
                          <input
                            id={`appro-${l.cle}-date`}
                            type="date"
                            min={demain}
                            value={l.peremption}
                            aria-label={`Date de péremption — ${l.nom}`}
                            aria-invalid={probleme?.champ === "date"}
                            onChange={(e) => maj(l.cle, { peremption: e.target.value })}
                            className={`${CHAMP} pl-9 ${
                              probleme?.champ === "date" ? "border-red-400" : "border-gray-300"
                            }`}
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-600">
                          Prix par {l.unite === "boite" ? "boîte" : "unité"} (facultatif)
                        </span>
                        <input
                          id={`appro-${l.cle}-prix`}
                          inputMode="decimal"
                          value={l.prix}
                          placeholder="0"
                          aria-label={`Prix — ${l.nom}`}
                          aria-invalid={probleme?.champ === "prix"}
                          onChange={(e) => maj(l.cle, { prix: e.target.value })}
                          className={`${CHAMP} ${
                            probleme?.champ === "prix" ? "border-red-400" : "border-gray-300"
                          }`}
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      Rien reçu : cette ligne sera ignorée et restera à recevoir.
                    </p>
                  )}

                  {etat === "trop" && !probleme && (
                    <p className="mt-2 text-xs text-amber-700">
                      {q - l.restant} de plus que le reste à recevoir ({l.restant}).
                    </p>
                  )}
                  {probleme && (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {probleme.message}
                    </p>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {/* Pied collant */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-white/95 py-3 backdrop-blur">
        <div aria-live="polite">
          <p className="text-sm font-medium tabular-nums text-gray-900">
            {resume.totalRecu} / {resume.totalRestant} à recevoir
          </p>
          <p className={`text-xs ${resume.excedent ? "text-amber-700" : "text-gray-500"}`}>
            {resume.actives === 0
              ? "Aucune quantité saisie."
              : resume.excedent
                ? "Une quantité dépasse le reste à recevoir."
                : resume.incomplet
                  ? "Réception partielle : le reste pourra être reçu plus tard."
                  : "La commande sera soldée."}
          </p>
        </div>
        <Bouton
          type="button"
          variante="primaire"
          disabled={occupe || resume.actives === 0}
          onClick={valider}
        >
          {occupe && <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" aria-hidden="true" />}
          {occupe
            ? "Enregistrement…"
            : resume.incomplet
              ? "Valider la réception partielle"
              : "Valider la réception"}
        </Bouton>
      </div>
    </div>
  );
};
export default FormulaireAppro;
