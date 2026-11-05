/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  Minus,
  Package,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import {
  LigneInventaireStock,
  MotifAjustement,
  RegularisationStockInput,
} from "../modele/stock-ajustements.types";

export interface FormulaireAjustementModaleProps {
  ouverte: boolean;
  onFermer: () => void;
  ligne: LigneInventaireStock | null;
  motifs: MotifAjustement[];
  typesMouvement: { id: number; libelle: string; sens: number }[];
  onValider: (input: RegularisationStockInput) => Promise<void>;
}

/* Charte : focus visible en vert */
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40";

/* Bouton secondaire : blanc, bordure grise, 40 px (48 px mobile), rayon 10 px */
const BOUTON_SECONDAIRE = `inline-flex h-12 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:opacity-40 md:h-10 ${FOCUS}`;

const nombre = (n: number) => n.toLocaleString("fr-FR");

/* Pastille de filtre : 6 px 14 px, 13 px, bordure verte si active */
const Puce: React.FC<{ actif: boolean; onClick: () => void; children: React.ReactNode }> = ({
  actif,
  onClick,
  children,
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={actif}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-[14px] py-1.5 text-[13px] transition ${FOCUS} ${
      actif
        ? "border-[#1f9d55] bg-[#e7f6ed] font-bold text-[#14703c]"
        : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
    }`}
  >
    {actif && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
    {children}
  </button>
);

/* Le sens est porté par l'icône ET le signe +/−, pas par la couleur seule */
const EcartBadge: React.FC<{ valeur: number }> = ({ valeur }) => {
  const zero = valeur === 0;
  const positif = valeur > 0;
  const couleur = zero
    ? "bg-[#f6f8f7] text-[#5b6472] ring-[#e5e7eb]"
    : positif
      ? "bg-[#e7f6ed] text-[#14703c] ring-[#1f9d55]/30"
      : "bg-[#b42318]/10 text-[#b42318] ring-[#b42318]/30";
  const Icone = zero ? Minus : positif ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ring-1 ring-inset ${couleur}`}
    >
      <Icone className="h-3.5 w-3.5" aria-hidden="true" />
      {zero ? "0" : `${positif ? "+" : ""}${nombre(valeur)}`}
    </span>
  );
};

export const FormulaireAjustementModale: React.FC<FormulaireAjustementModaleProps> = ({
  ouverte,
  onFermer,
  ligne,
  motifs,
  typesMouvement,
  onValider,
}) => {
  const [quantiteReelle, setQuantiteReelle] = useState<string>(
    ligne ? String(ligne.quantiteTheorique) : "0",
  );
  const [motifId, setMotifId] = useState<string>(motifs[0] ? String(motifs[0].id) : "");
  const [typeMvtId, setTypeMvtId] = useState<string>("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // La modale est réutilisée : on repart du stock théorique à chaque ouverture / changement de ligne.
  useEffect(() => {
    if (ligne) {
      setQuantiteReelle(String(ligne.quantiteTheorique));
      setErreur(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouverte, ligne?.produitId, ligne?.siteId, ligne?.quantiteTheorique]);

  // Les motifs peuvent arriver après le premier rendu.
  useEffect(() => {
    if (!motifId && motifs[0]) setMotifId(String(motifs[0].id));
  }, [motifs, motifId]);

  if (!ligne) return null;

  const qteTheorique = ligne.quantiteTheorique;
  const saisie = quantiteReelle.trim();
  const qteValide = saisie !== "" && Number.isInteger(Number(saisie)) && Number(saisie) >= 0;
  const qteConstatee = Number(saisie) || 0;
  const ecart = qteConstatee - qteTheorique;

  // Un surplus ne peut être qu'une entrée, un déficit qu'une sortie.
  const typesCompatibles =
    ecart === 0 ? typesMouvement : typesMouvement.filter((t) => t.sens > 0 === ecart > 0);
  const typeEffectif = typesCompatibles.some((t) => String(t.id) === typeMvtId)
    ? typeMvtId
    : typesCompatibles[0]
      ? String(typesCompatibles[0].id)
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const mId = Number(motifId);
    const tmId = Number(typeEffectif);

    if (!qteValide) {
      setErreur("La quantité constatée doit être un nombre entier positif ou nul.");
      return;
    }
    if (!mId) {
      setErreur("Veuillez sélectionner un motif d’ajustement");
      return;
    }
    if (!tmId) {
      setErreur("Veuillez sélectionner un type de mouvement");
      return;
    }
    if (ecart === 0) {
      setErreur(
        "La quantité constatée est identique au stock théorique (aucun écart à régulariser).",
      );
      return;
    }

    try {
      setEnCours(true);
      await onValider({
        produitId: ligne.produitId,
        siteId: ligne.siteId,
        motifAjustementId: mId,
        mouvementTypeId: tmId,
        quantite: Math.abs(ecart),
      });
      onFermer();
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : "Erreur de régularisation");
    } finally {
      setEnCours(false);
    }
  };

  /* Titre de volet : gras, couleur encre */
  const titre = "text-sm font-bold text-[#1f2937]";

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre={`Régularisation d’inventaire — ${ligne.produitNom}`}
    >
      <form onSubmit={handleSubmit} className="space-y-[14px] text-sm text-[#1f2937]">
        {erreur && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[10px] border border-[#b42318]/30 bg-[#b42318]/10 p-3 text-[#b42318]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{erreur}</span>
          </div>
        )}

        {/* Contexte */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[14px] border border-[#e5e7eb] bg-[#fafbfa] p-3">
          <span className="inline-flex items-center gap-2 text-[#5b6472]">
            <Building2 className="h-4 w-4 text-[#5b6472]" aria-hidden="true" />
            <span className="font-bold text-[#1f2937]">{ligne.siteNom}</span>
          </span>
          <span className="inline-flex items-center gap-2 text-[#5b6472]">
            <Package className="h-4 w-4 text-[#5b6472]" aria-hidden="true" />
            Stock théorique
            <span className="font-bold tabular-nums text-[#1f2937]">
              {nombre(qteTheorique)} unités
            </span>
          </span>
        </div>

        {/* Quantité constatée */}
        <section aria-labelledby="aj-qte" className="space-y-2">
          <h4 id="aj-qte" className={titre}>
            Quantité physique constatée
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center overflow-hidden rounded-[10px] border bg-white ${
                saisie !== "" && !qteValide ? "border-[#b42318]" : "border-[#e5e7eb]"
              }`}
            >
              <button
                type="button"
                aria-label="Moins un"
                disabled={!qteValide || qteConstatee <= 0}
                onClick={() => setQuantiteReelle(String(Math.max(0, qteConstatee - 1)))}
                className={`flex h-12 w-12 items-center justify-center text-[#1f2937] hover:bg-[#fafbfa] disabled:opacity-30 md:h-10 md:w-10 ${FOCUS}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                aria-labelledby="aj-qte"
                aria-invalid={saisie !== "" && !qteValide}
                value={quantiteReelle}
                onChange={(e) => setQuantiteReelle(e.target.value)}
                className="h-12 w-24 border-x border-[#e5e7eb] text-center text-sm tabular-nums text-[#1f2937] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1f9d55] md:h-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                aria-label="Plus un"
                onClick={() => setQuantiteReelle(String((qteValide ? qteConstatee : 0) + 1))}
                className={`flex h-12 w-12 items-center justify-center text-[#1f2937] hover:bg-[#fafbfa] md:h-10 md:w-10 ${FOCUS}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setQuantiteReelle(String(qteTheorique))}
              disabled={saisie === String(qteTheorique)}
              className={`${BOUTON_SECONDAIRE} text-xs`}
            >
              Conforme ({nombre(qteTheorique)})
            </button>
          </div>
        </section>

        {/* Aperçu de l'écart */}
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
          <span className="tabular-nums text-[#1f2937]">
            Théorique {nombre(qteTheorique)} → constaté {nombre(qteConstatee)}
          </span>
          <span className="text-xs text-[#5b6472]">
            {ecart === 0
              ? "Aucun écart à régulariser."
              : ecart > 0
                ? "Surplus : le stock du site augmentera."
                : "Déficit : le stock du site diminuera."}
          </span>
        </div>

        {/* Motif */}
        <section aria-labelledby="aj-motif" className="space-y-2">
          <h4 id="aj-motif" className={titre}>
            Motif d’ajustement
          </h4>
          <div role="radiogroup" aria-labelledby="aj-motif" className="flex flex-wrap gap-2">
            {motifs.map((m) => (
              <Puce
                key={m.id}
                actif={String(m.id) === motifId}
                onClick={() => setMotifId(String(m.id))}
              >
                {m.libelle}
              </Puce>
            ))}
            {motifs.length === 0 && <p className="text-[#5b6472]">Aucun motif disponible.</p>}
          </div>
        </section>

        {/* Type de mouvement */}
        <section aria-labelledby="aj-type" className="space-y-2">
          <h4 id="aj-type" className={titre}>
            Type de mouvement comptable
            {ecart !== 0 && (
              <span className="ml-1.5 text-xs font-normal text-[#5b6472]">
                ({ecart > 0 ? "entrée" : "sortie"})
              </span>
            )}
          </h4>
          <div role="radiogroup" aria-labelledby="aj-type" className="flex flex-wrap gap-2">
            {typesCompatibles.map((t) => (
              <Puce
                key={t.id}
                actif={String(t.id) === typeEffectif}
                onClick={() => setTypeMvtId(String(t.id))}
              >
                {t.libelle}
                {ecart === 0 && (
                  <span className="text-xs opacity-70">({t.sens > 0 ? "Entrée" : "Sortie"})</span>
                )}
              </Puce>
            ))}
            {typesCompatibles.length === 0 && (
              <p className="text-[#5b6472]">
                Aucun type de mouvement {ecart > 0 ? "d’entrée" : "de sortie"} disponible.
              </p>
            )}
          </div>
        </section>

        <ActionsFormulaire
          onAnnuler={onFermer}
          chargement={enCours}
          texteValider="Enregistrer la régularisation"
        />
      </form>
    </Modale>
  );
};