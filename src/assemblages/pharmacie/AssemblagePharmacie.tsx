/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  RefreshCw,
  X,
  LayoutDashboard,
} from "lucide-react";
import { stockApi } from "@/briques/stock-commun/api";
import type { Prescription, StockLigne } from "@/briques/stock-commun/types";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { EmptyState } from "@/noyau/ui/EmptyState";
import { TableauDonnees } from "@/noyau/ui/TableauDonnees";
import {
  TableauBordPharmacie,
  construireStatsPharmacie,
  trierParAnciennete,
  type OrdonnanceResume,
} from "@/briques/stock-dispensation/ui/Tableaubordpharmacie"; // adaptez le chemin si besoin

export interface AssemblagePharmacieProps {
  siteActifId?: number | null;
  serviceActifId?: number | null;
  sousOngletActif?: string | null;
  onSousOngletChange?: (id: string) => void;
}

type OngletPharmacie = "tableau-bord" | "a_dispenser" | "dispensees";
const ONGLETS: OngletPharmacie[] = ["tableau-bord", "a_dispenser", "dispensees"];

/** Date d'une ordonnance, quel que soit le champ renvoyé par l'API. */
const dateDe = (p: Prescription): string | null =>
  p.dateCreation || p.createdAt || p.datePrescription || null;

/** Sans date exploitable, on garde l'ordonnance (comportement précédent). */
const estAujourdhui = (iso: string | null): boolean => {
  if (!iso) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true;
  return d.toDateString() === new Date().toDateString();
};

export const AssemblagePharmacie: React.FC<AssemblagePharmacieProps> = ({
  siteActifId,
  sousOngletActif,
  onSousOngletChange,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();

  const [ongletInterne, setOngletInterne] = useState<OngletPharmacie>("tableau-bord");
  const onglet: OngletPharmacie = ONGLETS.includes(sousOngletActif as OngletPharmacie)
    ? (sousOngletActif as OngletPharmacie)
    : ongletInterne;

  const changerOnglet = (id: string) => {
    setOngletInterne(id as OngletPharmacie);
    onSousOngletChange?.(id);
  };

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stocks, setStocks] = useState<StockLigne[]>([]);
  const [chargement, setChargement] = useState(false);
  const [recherche, setRecherche] = useState("");

  // Mode focus : ordonnance sélectionnée pour dispensation FEFO
  const [ordonnanceFocus, setOrdonnanceFocus] = useState<Prescription | null>(null);
  const [dispensationEnCours, setDispensationEnCours] = useState(false);

  const chargerDonnees = useCallback(async () => {
    setChargement(true);
    try {
      const [resPrescriptions, resStocks] = await Promise.allSettled([
        stockApi.prescriptions(),
        stockApi.niveaux(siteActifId ?? undefined),
      ]);

      if (resPrescriptions.status === "fulfilled") {
        setPrescriptions(resPrescriptions.value);
      } else {
        notifierErreur(extraireMessageErreur(resPrescriptions.reason));
      }

      if (resStocks.status === "fulfilled") {
        setStocks(resStocks.value);
      } else {
        notifierErreur(extraireMessageErreur(resStocks.reason));
      }
    } finally {
      setChargement(false);
    }
  }, [siteActifId, notifierErreur]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  // Filtrage selon onglet
  const ordonnancesADispenser = useMemo(() => {
    return prescriptions.filter((p) => {
      const st = (p.statut || "").toLowerCase();
      return st !== "dispensee" && st !== "annulee" && st !== "annule";
    });
  }, [prescriptions]);

  const ordonnancesDispensees = useMemo(() => {
    return prescriptions.filter((p) => {
      const st = (p.statut || "").toLowerCase();
      return st === "dispensee" && estAujourdhui(dateDe(p));
    });
  }, [prescriptions]);

  const listeCourante = onglet === "dispensees" ? ordonnancesDispensees : ordonnancesADispenser;

  const listeFiltree = useMemo(() => {
    if (!recherche.trim()) return listeCourante;
    const q = recherche.toLowerCase().trim();
    return listeCourante.filter(
      (p) =>
        String(p.id).includes(q) ||
        (p.patientNom && p.patientNom.toLowerCase().includes(q)) ||
        (p.medecinNom && p.medecinNom.toLowerCase().includes(q)) ||
        (p.matricule && p.matricule.toLowerCase().includes(q)),
    );
  }, [listeCourante, recherche]);

  // ----- Données du tableau de bord -----
  const ordonnancesResume = useMemo<OrdonnanceResume[]>(
    () =>
      ordonnancesADispenser.map((p) => ({
        id: p.id,
        patientNom: p.patientNom || `Patient #${p.patientId}`,
        medecinNom: p.medecinNom,
        creeLe: dateDe(p),
        nbLignes: (p.lignes ?? p.details ?? []).length,
      })),
    [ordonnancesADispenser],
  );

  const statsPharmacie = useMemo(() => {
    const limite = Date.now() + 90 * 24 * 3600 * 1000; // péremption < 90 jours
    const lotsPerimesProches = stocks.filter(
      (s: any) => s.datePeremption && new Date(s.datePeremption).getTime() <= limite,
    ).length;
    const produitsSousSeuil = stocks.filter(
      (s: any) =>
        s.seuilAlerte != null &&
        (s.quantiteReelle ?? s.quantite ?? 0) <= s.seuilAlerte,
    ).length;

    return construireStatsPharmacie({
      aDispenser: ordonnancesResume,
      dispenseesAujourdhui: ordonnancesDispensees.length,
      lotsPerimesProches,
      produitsSousSeuil,
    });
  }, [ordonnancesResume, ordonnancesDispensees, stocks]);

  const prochaines = useMemo(
    () => trierParAnciennete(ordonnancesResume),
    [ordonnancesResume],
  );

  // Vérification de disponibilité stock pour une ordonnance
  const verifierDisponibiliteOrdonnance = (p: Prescription) => {
    const lignes = p.lignes ?? p.details ?? [];
    if (lignes.length === 0) return { dispo: true, manquants: [] as string[] };
    const manquants: string[] = [];

    for (const ligne of lignes) {
      const prodId = ligne.medicamentId ?? ligne.produitId;
      const stockItem = stocks.find((s) => s.produitId === prodId);
      const stockDispo = stockItem ? (stockItem.quantiteReelle ?? stockItem.quantite ?? 0) : 0;
      const qte = ligne.quantite ?? ligne.qtePrescrite ?? 0;
      if (stockDispo < qte) {
        manquants.push(ligne.medicamentNom || ligne.produitNom || `Médicament #${prodId}`);
      }
    }

    return {
      dispo: manquants.length === 0,
      manquants,
    };
  };

  const handleConfirmerDispensation = async () => {
    if (!ordonnanceFocus || !siteActifId) {
      notifierErreur("Veuillez sélectionner un établissement / site actif dans l'en-tête.");
      return;
    }

    setDispensationEnCours(true);
    try {
      await stockApi.dispenser(ordonnanceFocus.id, siteActifId);
      notifierSucces(`Ordonnance #${ordonnanceFocus.id} dispensée avec succès en une seule fois.`);
      setOrdonnanceFocus(null);
      await chargerDonnees();
    } catch (err) {
      // Contrainte backend : pas de dispensation partielle, rollback complet
      notifierErreur(
        extraireMessageErreur(
          err,
          "Échec de la dispensation. Stock insuffisant : aucun médicament n'a été déstocké.",
        ),
      );
    } finally {
      setDispensationEnCours(false);
    }
  };

  const classeOnglet = (actif: boolean, texteActif: string) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
      actif ? `bg-white ${texteActif} shadow-xs` : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="space-y-6">
      {/* En-tête Espace Pharmacie (sans contour) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-snug">
              Espace Pharmacie & Dispensation
            </h1>
            <p className="text-xs text-slate-500">
              Contrôle FEFO par date de péremption · Dispensation complète unitaire
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={chargerDonnees}
            disabled={chargement}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-orange-50 hover:text-orange-700 transition cursor-pointer"
            title="Rafraîchir les ordonnances"
          >
            <RefreshCw className={`w-4 h-4 ${chargement ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Barre d'outils : commutateur en pilule + recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-orange-50 rounded-xl border border-orange-200 shadow-2xs">
          <button
            type="button"
            onClick={() => changerOnglet("tableau-bord")}
            className={classeOnglet(onglet === "tableau-bord", "text-orange-900")}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-orange-600" />
            <span>Tableau de bord</span>
          </button>

          <button
            type="button"
            onClick={() => changerOnglet("a_dispenser")}
            className={classeOnglet(onglet === "a_dispenser", "text-orange-900")}
          >
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>À dispenser</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-800 font-bold">
              {ordonnancesADispenser.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => changerOnglet("dispensees")}
            className={classeOnglet(onglet === "dispensees", "text-emerald-900")}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dispensées aujourd'hui</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {ordonnancesDispensees.length}
            </span>
          </button>
        </div>

        {onglet !== "tableau-bord" && (
          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-400" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher par patient, médecin ou n°..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-orange-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        )}
      </div>

      {/* Contenu de l'onglet */}
      {onglet === "tableau-bord" ? (
        <TableauBordPharmacie
          stats={statsPharmacie}
          prochaines={prochaines}
          chargement={chargement}
          onOuvrirFile={() => changerOnglet("a_dispenser")}
          onOuvrirDispensees={() => changerOnglet("dispensees")}
        />
      ) : listeFiltree.length === 0 ? (
        <EmptyState
          icon={<Pill className="w-8 h-8 text-orange-400" />}
          title={
            onglet === "a_dispenser"
              ? "Aucune ordonnance en attente"
              : "Aucune ordonnance dispensée aujourd'hui"
          }
          description="Toutes les prescriptions médicales émises par les médecins apparaissent ici pour délivrance."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listeFiltree.map((ordo) => {
            const verif = verifierDisponibiliteOrdonnance(ordo);
            const ordoLignes = ordo.lignes ?? ordo.details ?? [];
            const totalUnites = ordoLignes.reduce(
              (acc, l) => acc + (l.quantite ?? l.qtePrescrite ?? 0),
              0,
            );
            const nbMedocs = ordoLignes.length;

            return (
              <div
                key={ordo.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-orange-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      Ordonnance #{ordo.id}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {dateDe(ordo) || "Aujourd'hui"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {ordo.patientNom ||
                        (ordo.patientPrenom
                          ? `${ordo.patientPrenom} ${ordo.patientNom ?? ""}`
                          : `Patient #${ordo.patientId}`)}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Matricule : {ordo.matricule || ordo.patientMatricule || "Non renseigné"}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Prescrit par :{" "}
                      <strong className="text-slate-800">{ordo.medecinNom || "Médecin traitant"}</strong>
                    </p>
                  </div>

                  {/* Résumé des lignes */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      <strong>{nbMedocs}</strong> médicament{nbMedocs > 1 ? "s" : ""}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      Total : {totalUnites} unité{totalUnites > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Alerte stock insuffisant */}
                  {onglet === "a_dispenser" && !verif.dispo && (
                    <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Stock insuffisant pour : {verif.manquants.join(", ")}</span>
                    </div>
                  )}
                </div>

                {onglet === "a_dispenser" ? (
                  <button
                    type="button"
                    onClick={() => setOrdonnanceFocus(ordo)}
                    className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Dispenser l'ordonnance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Délivrée au comptoir</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Écran de Dispensation Focus (Modal Plein Écran FEFO) */}
      {ordonnanceFocus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-slide-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-orange-100 bg-orange-50/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-orange-600 text-white px-2 py-0.5 rounded">
                    FEFO
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Dispensation Ordonnance #{ordonnanceFocus.id}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient :{" "}
                  <strong>{ordonnanceFocus.patientNom || `Patient #${ordonnanceFocus.patientId}`}</strong>{" "}
                  · Prescripteur : {ordonnanceFocus.medecinNom}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOrdonnanceFocus(null)}
                className="p-1.5 text-slate-400 hover:text-orange-700 rounded-lg hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 text-xs text-slate-600">
                <p>
                  <strong>Règle de dispensation stricte :</strong> Une ordonnance est dispensée en une
                  seule fois ou annulée. Les lots sont automatiquement ordonnés par date de péremption
                  la plus proche (FEFO).
                </p>
              </div>

              <TableauDonnees
                colonnes={[
                  { cle: "medicament", entete: "Médicament / Produit" },
                  { cle: "quantite", entete: "Quantité", alignement: "droite" },
                  { cle: "posologie", entete: "Posologie prescrite" },
                  { cle: "lot", entete: "Lot FEFO proposé" },
                  { cle: "statut", entete: "Disponibilité" },
                ]}
              >
                {(ordonnanceFocus.lignes ?? ordonnanceFocus.details ?? []).map((ligne, idx) => {
                  const prodId = ligne.medicamentId ?? ligne.produitId;
                  const stockItem = stocks.find((s) => s.produitId === prodId);
                  const stockDispo = stockItem
                    ? (stockItem.quantiteReelle ?? stockItem.quantite ?? 0)
                    : 0;
                  const qteDemandee = ligne.quantite ?? ligne.qtePrescrite ?? 0;
                  const dispo = stockDispo >= qteDemandee;

                  return (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {ligne.medicamentNom || ligne.produitNom || `Médicament #${prodId}`}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {qteDemandee}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {ligne.posologie || "1 prise"}{" "}
                        {ligne.dureeJours ? `(${ligne.dureeJours} jours)` : ""}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-orange-700">
                        {stockItem?.numLot || stockItem?.lotNumero || "Lot standard FEFO"}
                      </td>
                      <td className="py-3 px-3.5">
                        {dispo ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            En stock ({stockDispo})
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Stock insuffisant
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </TableauDonnees>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Validation irréversible avec déstockage immédiat.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrdonnanceFocus(null)}
                  disabled={dispensationEnCours}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmerDispensation}
                  disabled={dispensationEnCours}
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {dispensationEnCours ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirmer la dispensation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblagePharmacie;