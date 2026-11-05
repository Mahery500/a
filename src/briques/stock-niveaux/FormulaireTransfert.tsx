// stock-niveaux/FormulaireTransfert.tsx
import React, { useMemo, useState } from "react";
import { stockApi, messageErreur } from "../stock-commun/api";
import { Bouton, Erreur, formatDate } from "../stock-commun/ui";
import type { Site, StockLigne } from "../stock-commun/types";

/**
 * Transfert d'un lot d'un site vers un autre.
 * - Les sites proposés sont TOUS les sites actifs (un site vide peut être destinataire).
 * - Les lots proposés sont ceux du site d'origine, les plus proches de la péremption en premier.
 * - La quantité est en comprimés, comme le stock (StockLigne.quantite).
 */
export const FormulaireTransfert: React.FC<{
  sites: Site[];
  stocks: StockLigne[];
  siteOrigineParDefaut?: number;
  onTermine: () => void;
}> = ({ sites, stocks, siteOrigineParDefaut, onTermine }) => {
  const [origineId, setOrigineId] = useState<number | "">(siteOrigineParDefaut ?? "");
  const [destinationId, setDestinationId] = useState<number | "">("");
  const [ligneId, setLigneId] = useState<number | "">("");
  const [quantite, setQuantite] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const lignesOrigine = useMemo(
    () =>
      stocks
        .filter(
          (s) => s.siteId === origineId && s.quantite > 0 && s.lotId != null && s.produitId != null,
        )
        .sort((a, b) =>
          (a.datePeremption ?? "9999-12-31").localeCompare(b.datePeremption ?? "9999-12-31"),
        ),
    [stocks, origineId],
  );

  const ligne = lignesOrigine.find((l) => l.id === ligneId);

  const valider = async () => {
    setErreur(null);
    if (!origineId || !destinationId)
      return setErreur("Choisissez le site d'origine et le site de destination.");
    if (origineId === destinationId)
      return setErreur("Le site de destination doit être différent du site d'origine.");
    if (!ligne || ligne.lotId == null || ligne.produitId == null)
      return setErreur("Choisissez le lot à transférer.");

    const q = Number(quantite);
    if (quantite.trim() === "" || !Number.isInteger(q) || q <= 0)
      return setErreur("La quantité doit être un entier positif.");
    if (q > ligne.quantite)
      return setErreur(
        `Stock insuffisant : ${ligne.quantite.toLocaleString("fr-FR")} disponible(s) dans ce lot.`,
      );

    setOccupe(true);
    try {
      await stockApi.creerTransfert({
        siteOrigineId: Number(origineId),
        siteDestinationId: Number(destinationId),
        produitId: ligne.produitId,
        lotId: ligne.lotId,
        quantite: q,
      });
      onTermine();
    } catch (e) {
      setErreur(messageErreur(e, "Le transfert n'a pas pu être créé."));
    } finally {
      setOccupe(false);
    }
  };

  const champ = "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white";

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-medium text-gray-700">Site d'origine</span>
          <select
            value={origineId}
            onChange={(e) => {
              setOrigineId(e.target.value ? Number(e.target.value) : "");
              setLigneId("");
              setQuantite("");
            }}
            className={champ}
          >
            <option value="">— Choisir —</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-medium text-gray-700">Site de destination</span>
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value ? Number(e.target.value) : "")}
            className={champ}
          >
            <option value="">— Choisir —</option>
            {sites
              .filter((s) => s.id !== origineId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="font-medium text-gray-700">Lot à transférer</span>
        <select
          value={ligneId}
          disabled={!origineId}
          onChange={(e) => {
            setLigneId(e.target.value ? Number(e.target.value) : "");
            setQuantite("");
          }}
          className={champ}
        >
          <option value="">
            {origineId ? "— Choisir un lot —" : "Choisissez d'abord le site d'origine"}
          </option>
          {lignesOrigine.map((l) => (
            <option key={l.id} value={l.id}>
              {l.produitLibelle ?? "Produit"} · lot {l.lotNumero ?? l.lotId} · exp.{" "}
              {formatDate(l.datePeremption)} · {l.quantite.toLocaleString("fr-FR")} en stock
            </option>
          ))}
        </select>
        {origineId !== "" && lignesOrigine.length === 0 && (
          <span className="mt-1 block text-xs text-amber-700">
            Ce site n'a aucun lot en stock à transférer.
          </span>
        )}
      </label>

      <label className="block">
        <span className="font-medium text-gray-700">Quantité (comprimés)</span>
        <input
          type="number"
          min={1}
          step={1}
          max={ligne?.quantite}
          value={quantite}
          disabled={!ligne}
          onChange={(e) => setQuantite(e.target.value)}
          className={champ}
        />
        {ligne && (
          <span className="mt-1 block text-xs text-gray-500">
            Disponible : {ligne.quantite.toLocaleString("fr-FR")}
            <button
              type="button"
              className="ml-2 text-teal-700 underline"
              onClick={() => setQuantite(String(ligne.quantite))}
            >
              Tout transférer
            </button>
          </span>
        )}
      </label>

      <Erreur message={erreur} />
      <div className="flex justify-end">
        <Bouton variante="primaire" disabled={occupe} onClick={valider}>
          {occupe ? "Création…" : "Créer le transfert"}
        </Bouton>
      </div>
    </div>
  );
};
