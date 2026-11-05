// stock-commandes/FormulaireReception.tsx
import React, { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Check, Loader2, Minus, Plus } from "lucide-react";
import { stockApi, messageErreur } from "../stock-commun/api";
import { Bouton, Erreur } from "../stock-commun/ui";
import type { Commande, UniteStock } from "../stock-commun/types";

interface Saisie {
  qte: string;
  unite: UniteStock;
  datePeremption: string;
}

type Etat = "deja" | "non" | "partiel" | "complet" | "trop";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40";
const CHAMP =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40";

const ETATS: Record<Etat, { texte: string; classe: string }> = {
  deja: { texte: "Déjà reçu", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  non: { texte: "Non reçu", classe: "bg-gray-100 text-gray-600 ring-gray-200" },
  partiel: { texte: "Partiel", classe: "bg-amber-50 text-amber-800 ring-amber-200" },
  complet: { texte: "Complet", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  trop: { texte: "Excédent", classe: "bg-red-50 text-red-700 ring-red-200" },
};

export const FormulaireReception: React.FC<{ commande: Commande; onTermine: () => void }> = ({
  commande,
  onTermine,
}) => {
  const reste = (d: Commande["details"][number]) => Math.max(d.qte - (d.qteRecue ?? 0), 0);

  // Pré-remplit avec le reste à recevoir
  const [saisies, setSaisies] = useState<Record<number, Saisie>>(() =>
    Object.fromEntries(
      commande.details.map((d) => [
        d.id,
        { qte: String(reste(d)), unite: d.unite, datePeremption: "" },
      ]),
    ),
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const maj = (id: number, patch: Partial<Saisie>) =>
    setSaisies((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const etatDe = (d: Commande["details"][number]): Etat => {
    const r = reste(d);
    if (r === 0) return "deja";
    const s = saisies[d.id];
    const q = Number(s.qte) || 0;
    if (q <= 0) return "non";
    if (s.unite !== d.unite) return "complet"; // unités différentes : pas de comparaison possible
    if (q > r) return "trop";
    return q === r ? "complet" : "partiel";
  };

  const resume = useMemo(() => {
    const etats = commande.details.map((d) => etatDe(d));
    const actives = etats.filter((e) => e !== "deja" && e !== "non").length;
    const incomplet = etats.some((e) => e === "non" || e === "partiel");
    const excedent = etats.includes("trop");
    return { actives, incomplet, excedent };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisies, commande]);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    const actives = commande.details.filter(
      (d) => reste(d) > 0 && Number(saisies[d.id]?.qte) > 0,
    );
    if (actives.length === 0) return setErreur("Saisissez au moins une quantité reçue.");

    setEnvoi(true);
    setErreur(null);
    try {
      await stockApi.recevoirCommande(
        commande.id,
        actives.map((d) => {
          const s = saisies[d.id];
          return {
            detailId: d.id,
            qte: Number(s.qte),
            unite: s.unite,
            datePeremption: s.datePeremption || null,
          };
        }),
      );
      onTermine();
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <Erreur message={erreur} />

      <ul className="space-y-3">
        {commande.details.map((d) => {
          const s = saisies[d.id];
          const r = reste(d);
          const etat = etatDe(d);
          const recu = d.qteRecue ?? 0;
          const pct = d.qte > 0 ? Math.min(100, Math.round((recu / d.qte) * 100)) : 0;
          const nom = d.produitNom ?? `Produit #${d.produitId}`;
          const q = Number(s.qte) || 0;
          const ferme = r === 0;

          return (
            <li
              key={d.id}
              className={`rounded-xl border p-3 ${
                ferme ? "border-gray-200 bg-gray-50/60" : "border-gray-200 bg-white shadow-sm"
              }`}
            >
              {/* En-tête de ligne */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900" title={nom}>
                    {nom}
                  </p>
                  <p className="text-xs tabular-nums text-gray-500">
                    {recu} / {d.qte} {d.unite}
                    {!ferme && ` · reste ${r}`}
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

              {/* Avancement déjà reçu */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full ${pct >= 100 ? "bg-emerald-500" : "bg-teal-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Saisie */}
              {!ferme && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white">
                    <button
                      type="button"
                      aria-label={`Moins — ${nom}`}
                      disabled={q <= 0}
                      onClick={() => maj(d.id, { qte: String(Math.max(0, q - 1)) })}
                      className={`p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-30 ${FOCUS}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`Quantité reçue — ${nom}`}
                      value={s.qte}
                      onChange={(e) => maj(d.id, { qte: e.target.value })}
                      className="w-14 border-x border-gray-200 py-2 text-center text-sm tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label={`Plus — ${nom}`}
                      onClick={() => maj(d.id, { qte: String(q + 1) })}
                      className={`p-2 text-gray-600 hover:bg-gray-50 ${FOCUS}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => maj(d.id, { qte: String(r), unite: d.unite })}
                    disabled={s.qte === String(r) && s.unite === d.unite}
                    className={`rounded-lg px-2.5 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-40 ${FOCUS}`}
                  >
                    Tout ({r})
                  </button>
                  <button
                    type="button"
                    onClick={() => maj(d.id, { qte: "0" })}
                    disabled={q === 0}
                    className={`rounded-lg px-2.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 ${FOCUS}`}
                  >
                    Rien
                  </button>

                  <select
                    aria-label={`Unité — ${nom}`}
                    value={s.unite}
                    onChange={(e) => maj(d.id, { unite: e.target.value as UniteStock })}
                    className={`${CHAMP} !w-auto`}
                  >
                    <option value="boite">Boîte</option>
                    <option value="plaquette">Plaquette</option>
                    <option value="comprime">Comprimé</option>
                  </select>

                  <div className="relative ml-auto w-full sm:w-44">
                    <CalendarDays
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-700"
                      aria-hidden="true"
                    />
                    <input
                      type="date"
                      min={aujourdhui}
                      aria-label={`Date de péremption — ${nom}`}
                      title="Date de péremption"
                      value={s.datePeremption}
                      onChange={(e) => maj(d.id, { datePeremption: e.target.value })}
                      className={`${CHAMP} pl-9`}
                    />
                  </div>
                </div>
              )}

              {etat === "trop" && (
                <p className="mt-2 text-xs text-red-600">
                  Quantité supérieure au reste à recevoir ({r}).
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Pied */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p
          className={`text-sm ${resume.excedent ? "text-red-600" : "text-gray-600"}`}
          aria-live="polite"
        >
          {resume.excedent
            ? "Une quantité dépasse le reste à recevoir."
            : resume.actives === 0
              ? "Aucune quantité saisie."
              : resume.incomplet
                ? "Réception partielle : le reste pourra être reçu plus tard."
                : "La commande sera complète."}
        </p>
        <Bouton type="submit" variante="primaire" disabled={envoi || resume.actives === 0}>
          {envoi && <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" aria-hidden="true" />}
          {envoi
            ? "Enregistrement…"
            : resume.incomplet
              ? "Valider la réception partielle"
              : "Valider la réception"}
        </Bouton>
      </div>
    </form>
  );
};
export default FormulaireReception;
