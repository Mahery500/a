// stock-ajustements/PanneauStockAjustements.tsx
import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Minus,
  Plus,
  Printer,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions";
import { stockApi, messageErreur } from "@/briques/stock-commun/api";
import { useListe } from "@/briques/stock-commun/useListe";
import {
  Bouton,
  Erreur,
  formatDate,
  imprimerFicheInventaire,
} from "@/briques/stock-commun/ui";

/* Charte : focus visible en vert, champs 40 px (48 px mobile), rayon 10 px, texte 14 px */
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55] focus-visible:ring-offset-1";
const CHAMP = `h-12 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937] transition md:h-10 ${FOCUS}`;
const BOUTON_SECONDAIRE = `inline-flex h-12 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] md:h-10 ${FOCUS}`;

/** Délai (en jours) au-delà duquel un nouvel inventaire est demandé. */
const INTERVALLE_INVENTAIRE_JOURS = 30;

type Filtre = "tous" | "entrees" | "sorties" | "conformes";

/* ------------------------------------------------------------------ *
 * Composants de tableau unifiés (mêmes que les autres panneaux)
 * ------------------------------------------------------------------ */
const Th: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <th
    scope="col"
    className={`sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472] ${className}`}
  >
    {children}
  </th>
);

const Td: React.FC<{ children?: React.ReactNode; className?: string; title?: string }> = ({
  children,
  className = "",
  title,
}) => (
  <td title={title} className={`px-4 py-3 align-middle text-sm text-[#1f2937] ${className}`}>
    {children}
  </td>
);

const Tableau: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white">
    <div className="max-h-[70vh] overflow-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  </div>
);

const EtatVide: React.FC<{ colSpan: number; message: string; icone: React.ReactNode }> = ({
  colSpan,
  message,
  icone,
}) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-14 text-center">
      <div className="flex flex-col items-center gap-3 text-[#5b6472]">
        <div className="rounded-full bg-[#f6f8f7] p-4 text-[#5b6472]">{icone}</div>
        <p className="max-w-sm text-sm">{message}</p>
      </div>
    </td>
  </tr>
);

/* ------------------------------------------------------------------ *
 * Pastille d'écart (le sens est porté par l'icône ET le signe, pas par la couleur seule)
 * ------------------------------------------------------------------ */
const EcartBadge: React.FC<{ valeur: number; compact?: boolean }> = ({
  valeur,
  compact = false,
}) => {
  const zero = valeur === 0;
  const positif = valeur > 0;
  const couleur = zero
    ? "bg-[#f6f8f7] text-[#5b6472] ring-[#e5e7eb]"
    : positif
      ? "bg-[#e7f6ed] text-[#14703c] ring-[#1f9d55]/30"
      : "bg-[#b42318]/10 text-[#b42318] ring-[#b42318]/30";
  const Icone = zero ? Minus : positif ? TrendingUp : TrendingDown;
  const texte = zero ? "0" : `${positif ? "+" : ""}${valeur.toLocaleString("fr-FR")}`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ring-1 ring-inset ${couleur}`}
    >
      <Icone className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
      {texte}
    </span>
  );
};

/* ------------------------------------------------------------------ *
 * Pastille de filtre avec compteur (6 px 14 px, 13 px, bordure verte si active)
 * ------------------------------------------------------------------ */
const PuceFiltre: React.FC<{
  actif: boolean;
  onClick: () => void;
  nombre: number;
  ton?: "gris" | "vert" | "rouge";
  point?: boolean;
  children: React.ReactNode;
}> = ({ actif, onClick, nombre, ton = "gris", point = true, children }) => {
  const couleurPoint =
    ton === "vert" ? "bg-[#1f9d55]" : ton === "rouge" ? "bg-[#b42318]" : "bg-[#5b6472]";
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-[14px] py-1.5 text-[13px] transition ${FOCUS} ${
        actif
          ? "border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]"
          : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
      }`}
    >
      {point && <span className={`h-1.5 w-1.5 rounded-full ${couleurPoint}`} aria-hidden="true" />}
      {children}
      <span
        className={`rounded-full px-1.5 text-xs tabular-nums ${
          actif ? "bg-white text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"
        }`}
      >
        {nombre}
      </span>
    </button>
  );
};

export const PanneauStockAjustements: React.FC<{ mode: ModeAffichage; siteActifId?: number }> = ({
  mode,
  siteActifId,
}) => {
  const historique = useListe(() => stockApi.ajustements(siteActifId), [siteActifId]);
  const stocks = useListe(
    () => (siteActifId ? stockApi.niveaux(siteActifId) : Promise.resolve([])),
    [siteActifId],
  );
  const types = useListe(stockApi.ajustementTypes);

  const [ouvert, setOuvert] = useState(false);
  const [stockId, setStockId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number | "">("");
  const [comptee, setComptee] = useState<number | "">("");
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [aveugle, setAveugle] = useState(false);

  const editable = mode === "edition";
  const ligne = stocks.items.find((s) => s.id === stockId);
  const ecart = ligne && comptee !== "" ? comptee - ligne.quantite : null;

  /* ---------- Impression de la fiche d'inventaire ---------- */
  const imprimerFiche = () =>
    imprimerFicheInventaire({
      site: stocks.items[0]?.siteNom ?? `Site #${siteActifId}`,
      lignes: stocks.items,
      aveugle,
    });

  /* ---------- Compteurs ---------- */
  const compteurs = useMemo(() => {
    const c = { total: 0, entrees: 0, sorties: 0, conformes: 0 };
    historique.items.forEach((a) => {
      c.total += 1;
      if (a.ecart > 0) c.entrees += 1;
      else if (a.ecart < 0) c.sorties += 1;
      else c.conformes += 1;
    });
    return c;
  }, [historique.items]);

  /* ---------- Alerte inventaire mensuel ---------- */
  const inventaire = useMemo(() => {
    const temps = historique.items
      .map((a) => new Date(a.date).getTime())
      .filter((t) => !Number.isNaN(t));
    if (temps.length === 0)
      return { du: true, jours: null as number | null, dernier: null as string | null };
    const dernier = Math.max(...temps);
    const jours = Math.floor((Date.now() - dernier) / 86_400_000);
    return {
      du: jours >= INTERVALLE_INVENTAIRE_JOURS,
      jours,
      dernier: new Date(dernier).toISOString(),
    };
  }, [historique.items]);

  /* ---------- Historique filtré ---------- */
  const historiqueFiltre = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return historique.items.filter((a) => {
      if (filtre === "entrees" && !(a.ecart > 0)) return false;
      if (filtre === "sorties" && !(a.ecart < 0)) return false;
      if (filtre === "conformes" && a.ecart !== 0) return false;
      if (!q) return true;
      return [a.produitNom ?? "", a.lotNumero ?? "", a.typeLibelle ?? "", a.motif ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [historique.items, recherche, filtre]);

  const reinitialiser = () => {
    setStockId("");
    setTypeId("");
    setComptee("");
    setMotif("");
    setErreur(null);
  };

  const fermer = () => {
    setOuvert(false);
    reinitialiser();
  };

  /* ---------- Validation ---------- */
  const valider = async () => {
    if (!siteActifId) return setErreur("Sélectionnez un site.");
    if (!ligne?.lotId) return setErreur("Choisissez un lot.");
    if (!typeId) return setErreur("Choisissez un type d'ajustement.");
    if (comptee === "" || comptee < 0) return setErreur("Quantité comptée invalide.");
    if (!motif.trim()) return setErreur("Le motif est obligatoire.");
    const e = ecart ?? 0;
    if (e !== 0 && !window.confirm(`Écart de ${e > 0 ? "+" : ""}${e} cp. Confirmer ?`)) return;
    setOccupe(true);
    setErreur(null);
    try {
      await stockApi.creerAjustement({
        siteId: siteActifId,
        lotId: ligne.lotId,
        typeId: Number(typeId),
        quantiteComptee: comptee,
        motif: motif.trim(),
      });
      fermer();
      setFeedback("Ajustement enregistré.");
      setTimeout(() => setFeedback(null), 3500);
      await Promise.all([historique.recharger(), stocks.recharger()]);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setOccupe(false);
    }
  };

  /* Libellé de champ : 12 px, gras, gris */
  const etiquette = "mb-1 block text-xs font-bold text-[#5b6472]";
  const q = comptee === "" ? 0 : comptee;

  return (
    <div className="space-y-[14px] text-sm text-[#1f2937]">
      {/* Alerte inventaire mensuel (par site) */}
      {siteActifId && !historique.chargement && inventaire.du && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-[14px] border border-[#8a5300]/25 bg-[#fff4e0] px-4 py-3 text-sm font-semibold text-[#8a5300]"
        >
          <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1">
            {inventaire.jours === null
              ? "Aucun inventaire enregistré pour ce site."
              : `Dernier inventaire il y a ${inventaire.jours} jours.`}{" "}
            Un inventaire mensuel est recommandé.
          </p>
          {editable && !ouvert && (
            <button
              type="button"
              onClick={() => setOuvert(true)}
              className={`${BOUTON_SECONDAIRE} shrink-0 text-xs`}
            >
              Saisir un ajustement
            </button>
          )}
        </div>
      )}

      {/* Barre d'outils : filtres, recherche, impression, action */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par type d'écart">
          <PuceFiltre
            actif={filtre === "tous"}
            onClick={() => setFiltre("tous")}
            nombre={compteurs.total}
            point={false}
          >
            Tous
          </PuceFiltre>
          <PuceFiltre
            actif={filtre === "entrees"}
            onClick={() => setFiltre("entrees")}
            nombre={compteurs.entrees}
            ton="vert"
          >
            Entrées
          </PuceFiltre>
          <PuceFiltre
            actif={filtre === "sorties"}
            onClick={() => setFiltre("sorties")}
            nombre={compteurs.sorties}
            ton="rouge"
          >
            Sorties
          </PuceFiltre>
          <PuceFiltre
            actif={filtre === "conformes"}
            onClick={() => setFiltre("conformes")}
            nombre={compteurs.conformes}
          >
            Conformes
          </PuceFiltre>
        </div>

        <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Produit, lot, motif…"
              aria-label="Rechercher dans l'historique"
              className={`${CHAMP} pl-9 pr-8 placeholder:text-[#5b6472] [&::-webkit-search-cancel-button]:hidden`}
            />
            {recherche && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setRecherche("")}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#5b6472] hover:text-[#1f2937] ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Fiche d'inventaire physique (lecture seule : visible quel que soit le mode) */}
          <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[#5b6472]">
            <input
              type="checkbox"
              checked={aveugle}
              onChange={(e) => setAveugle(e.target.checked)}
              className="h-4 w-4 accent-[#1f9d55]"
            />
            À l'aveugle
          </label>

          <button
            type="button"
            onClick={imprimerFiche}
            disabled={!siteActifId || stocks.items.length === 0}
            title={!siteActifId ? "Sélectionnez un site" : "Imprimer la fiche d'inventaire"}
            className={`${BOUTON_SECONDAIRE} gap-1.5 disabled:opacity-50`}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Fiche d'inventaire
          </button>

          {editable && (
            <Bouton
              variante="primaire"
              disabled={!siteActifId}
              onClick={() => (ouvert ? fermer() : setOuvert(true))}
              title={!siteActifId ? "Sélectionnez un site pour saisir un inventaire" : undefined}
            >
              {ouvert ? (
                <X className="mr-1 inline h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="mr-1 inline h-4 w-4" aria-hidden="true" />
              )}
              {ouvert ? "Fermer" : "Nouvel ajustement"}
            </Bouton>
          )}
        </div>
      </div>

      {/* Bandeau feedback */}
      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[14px] border border-[#1f9d55]/30 bg-[#e7f6ed] px-4 py-3 text-sm font-semibold text-[#14703c]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {feedback}
        </div>
      )}

      {/* Formulaire nouvel ajustement */}
      {editable && ouvert && (
        <section
          aria-label="Nouvel ajustement"
          className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white"
        >
          <div className="space-y-4 p-5">
            {!siteActifId && (
              <div className="flex items-start gap-2 rounded-[10px] border border-[#8a5300]/25 bg-[#fff4e0] px-3 py-2 text-sm text-[#8a5300]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Sélectionnez un site pour saisir un inventaire.</span>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="aj-lot" className={etiquette}>
                  Lot à ajuster
                </label>
                <select
                  id="aj-lot"
                  value={stockId}
                  onChange={(e) => {
                    setStockId(e.target.value ? Number(e.target.value) : "");
                    setComptee("");
                    setErreur(null);
                  }}
                  disabled={!siteActifId}
                  className={`${CHAMP} disabled:bg-[#fafbfa] disabled:text-[#5b6472]`}
                >
                  <option value="">— Choisir un lot —</option>
                  {stocks.items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.produitLibelle} · lot {s.lotNumero} · théorique {s.quantite}
                    </option>
                  ))}
                </select>
                {stocks.items.length === 0 && siteActifId && (
                  <p className="mt-1 text-xs text-[#5b6472]">Aucun lot disponible sur ce site.</p>
                )}
              </div>

              <div>
                <label htmlFor="aj-type" className={etiquette}>
                  Type d'ajustement
                </label>
                <select
                  id="aj-type"
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : "")}
                  className={CHAMP}
                >
                  <option value="">— Choisir un type —</option>
                  {types.items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span id="aj-qte-label" className={etiquette}>
                  Quantité comptée
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
                    <button
                      type="button"
                      aria-label="Moins un"
                      disabled={!ligne || comptee === "" || comptee <= 0}
                      onClick={() => setComptee(Math.max(0, q - 1))}
                      className={`flex h-12 w-12 items-center justify-center text-[#1f2937] hover:bg-[#fafbfa] disabled:opacity-30 md:h-10 md:w-10 ${FOCUS}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-labelledby="aj-qte-label"
                      placeholder="0"
                      disabled={!ligne}
                      value={comptee}
                      onChange={(e) =>
                        setComptee(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="h-12 w-20 border-x border-[#e5e7eb] text-center text-sm tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f9d55] disabled:bg-[#fafbfa] md:h-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label="Plus un"
                      disabled={!ligne}
                      onClick={() => setComptee(q + 1)}
                      className={`flex h-12 w-12 items-center justify-center text-[#1f2937] hover:bg-[#fafbfa] disabled:opacity-30 md:h-10 md:w-10 ${FOCUS}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {ligne && (
                    <button
                      type="button"
                      onClick={() => setComptee(ligne.quantite)}
                      disabled={comptee === ligne.quantite}
                      className={`${BOUTON_SECONDAIRE} text-xs disabled:opacity-40`}
                    >
                      Conforme ({ligne.quantite})
                    </button>
                  )}
                </div>
                {!ligne && (
                  <p className="mt-1 text-xs text-[#5b6472]">Choisissez d'abord un lot.</p>
                )}
              </div>

              <div>
                <label htmlFor="aj-motif" className={etiquette}>
                  Motif
                </label>
                <input
                  id="aj-motif"
                  placeholder="Ex. comptage du 12/10, flacons cassés"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className={`${CHAMP} placeholder:text-[#5b6472]`}
                />
              </div>
            </div>

            {/* Aperçu de l'écart */}
            {ecart !== null && ligne && (
              <div
                aria-live="polite"
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] border p-3 ${
                  ecart === 0
                    ? "border-[#e5e7eb] bg-[#fafbfa]"
                    : ecart < 0
                      ? "border-[#b42318]/30 bg-[#b42318]/10"
                      : "border-[#1f9d55]/30 bg-[#e7f6ed]"
                }`}
              >
                <EcartBadge valeur={ecart} />
                <span className="text-sm tabular-nums text-[#1f2937]">
                  Théorique {ligne.quantite.toLocaleString("fr-FR")} → compté{" "}
                  {Number(comptee).toLocaleString("fr-FR")}
                </span>
                <span className="text-xs text-[#5b6472]">
                  {ecart === 0
                    ? "Le stock est conforme."
                    : ecart < 0
                      ? "Le stock du site diminuera."
                      : "Le stock du site augmentera."}
                </span>
              </div>
            )}

            <Erreur message={erreur} />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={fermer} className={BOUTON_SECONDAIRE}>
                Annuler
              </button>
              <Bouton variante="primaire" disabled={occupe || !ligne} onClick={valider}>
                {occupe && (
                  <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {occupe ? "Enregistrement…" : "Enregistrer l'ajustement"}
              </Bouton>
            </div>
          </div>
        </section>
      )}

      {/* Historique */}
      <section className="space-y-2" aria-label="Historique des ajustements">
        <Erreur message={historique.erreur} />

        <Tableau>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Produit</Th>
              <Th>Lot</Th>
              <Th>Type</Th>
              <Th className="text-right">Écart</Th>
              <Th>Motif</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f1]">
            {historiqueFiltre.map((a) => (
              <tr key={a.id} className="h-[54px] transition-colors hover:bg-[#fafbfa]">
                <Td className="whitespace-nowrap text-[#5b6472]">{formatDate(a.date)}</Td>
                <Td className="font-bold text-[#1f2937]">{a.produitNom}</Td>
                <Td>
                  {a.lotNumero ? (
                    <span className="rounded-md bg-[#e7f6ed] px-[7px] py-[3px] font-mono text-xs font-bold text-[#14703c]">
                      {a.lotNumero}
                    </span>
                  ) : (
                    <span className="text-[#5b6472]">—</span>
                  )}
                </Td>
                <Td>{a.typeLibelle}</Td>
                <Td className="text-right">
                  <EcartBadge valeur={a.ecart} compact />
                </Td>
                <Td className="max-w-[16rem] truncate text-[#5b6472]" title={a.motif ?? undefined}>
                  {a.motif || <span className="text-[#5b6472]">—</span>}
                </Td>
              </tr>
            ))}
            {historiqueFiltre.length === 0 && (
              <EtatVide
                colSpan={6}
                message={
                  recherche || filtre !== "tous"
                    ? "Aucun ajustement ne correspond à votre recherche."
                    : "Aucun ajustement enregistré pour ce site."
                }
                icone={<ClipboardCheck className="h-6 w-6" />}
              />
            )}
          </tbody>
        </Tableau>

        {compteurs.total > 0 && (
          <p className="px-1 text-xs text-[#5b6472]">
            {historiqueFiltre.length} sur {compteurs.total} ajustement
            {compteurs.total > 1 ? "s" : ""}
            {inventaire.dernier && ` · dernier le ${formatDate(inventaire.dernier)}`}
          </p>
        )}
      </section>
    </div>
  );
};

export default PanneauStockAjustements;