/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Send,
  Trash2,
  Printer,
  Eye,
  X,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { imprimerOrdonnance } from "@/briques/ordonnances/utils/imprimerOrdonnance";
import { genererPdfOrdonnance } from "@/briques/ordonnances/utils/genererPdfOrdonnance";
import { genererTicketOrdonnance } from "@/briques/ordonnances/utils/genererTicketOrdonnance";
import type {
  MedicamentCatalogue,
  OrdonnanceItem,
  CreerOrdonnancePayload,
} from "@/briques/ordonnances/api/ordonnances.api";
import { RechercheMedicament } from "./RechercheMedicament";

// ─── State local pour chaque ligne d'ordonnance ────────────────────────────
interface LigneForm {
  cle: number;
  medicamentId: string;
  quantite: string;
  posologie: string;
  dureeJours: string;
}

type FormatApercu = "a4" | "ticket";

interface ApercuState {
  numero: number;
  url: string;
  format: FormatApercu;
}

let compteur = 0;
const nouvelleLigne = (): LigneForm => ({
  cle: ++compteur,
  medicamentId: "",
  quantite: "",
  posologie: "",
  dureeJours: "",
});

const CHIPS_POSOLOGIE = [
  "1 cp matin et soir",
  "1 cp 3 fois par jour",
  "5 ml 3 fois par jour",
  "1 ampoule IM par jour",
];

export interface OngletOrdonnanceProps {
  encounterId: number;
  patientNom?: string;
  ticketNumero?: string;
  /** Médecin connecté, utilisé si l'ordonnance ne porte pas son émetteur. */
  medecinNom?: string;
  estModifiable: boolean;
  medicaments: MedicamentCatalogue[];
  ordonnances: OrdonnanceItem[];
  chargementMedicaments: boolean;
  erreurMedicaments: string | null;
  ordonnanceEnCours: boolean;
  onCreerOrdonnance: (payload: CreerOrdonnancePayload) => Promise<OrdonnanceItem>;
  onAnnulerOrdonnance: (id: number) => Promise<void>;
}

export const OngletOrdonnance: React.FC<OngletOrdonnanceProps> = ({
  encounterId,
  patientNom,
  ticketNumero,
  medecinNom,
  estModifiable,
  medicaments,
  ordonnances,
  chargementMedicaments,
  erreurMedicaments,
  ordonnanceEnCours,
  onCreerOrdonnance,
  onAnnulerOrdonnance,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();
  const [lignes, setLignes] = useState<LigneForm[]>(() => [nouvelleLigne()]);

  // ── Aperçu PDF / ticket (fenêtre modale) ───────────────────────────────
  const [apercu, setApercu] = useState<ApercuState | null>(null);
  const [apercuEnCours, setApercuEnCours] = useState(false);
  const apercuRef = useRef<HTMLIFrameElement>(null);

  const fermerApercu = () => setApercu(null);

  // Échap + libération de l'URL blob à la fermeture
  useEffect(() => {
    if (!apercu) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setApercu(null);
    };
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener("keydown", surTouche);
      URL.revokeObjectURL(apercu.url);
    };
  }, [apercu]);

  const majLigne = (cle: number, champ: keyof Omit<LigneForm, "cle">, valeur: string) => {
    setLignes((prev) => prev.map((l) => (l.cle === cle ? { ...l, [champ]: valeur } : l)));
  };

  const ajouterLigne = () => setLignes((prev) => [...prev, nouvelleLigne()]);

  const supprimerLigne = (cle: number) =>
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.cle !== cle)));

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estModifiable) return;

    // Validations ligne par ligne
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i];
      const n = i + 1;
      if (!l.medicamentId) {
        notifierErreur(`Ligne ${n} : sélectionnez un médicament.`);
        return;
      }
      if (!(Number(l.quantite) > 0) || !Number.isInteger(Number(l.quantite))) {
        notifierErreur(`Ligne ${n} : quantité entière strictement positive requise.`);
        return;
      }
      if (!l.posologie.trim()) {
        notifierErreur(`Ligne ${n} : posologie obligatoire.`);
        return;
      }
      if (
        l.dureeJours.trim() &&
        (!(Number(l.dureeJours) > 0) || !Number.isInteger(Number(l.dureeJours)))
      ) {
        notifierErreur(`Ligne ${n} : durée entière strictement positive requise.`);
        return;
      }
    }

    // Pas de doublons
    const ids = lignes.map((l) => l.medicamentId);
    if (new Set(ids).size !== ids.length) {
      notifierErreur("Un même médicament apparaît plusieurs fois.");
      return;
    }

    try {
      await onCreerOrdonnance({
        encounterId,
        lignes: lignes.map((l) => ({
          medicamentId: Number(l.medicamentId),
          quantite: Number(l.quantite),
          posologie: l.posologie.trim(),
          dureeJours: l.dureeJours.trim() ? Number(l.dureeJours) : null,
        })),
      });
      notifierSucces("Ordonnance enregistrée.");
      setLignes([nouvelleLigne()]);
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  const annuler = async (id: number) => {
    if (!estModifiable) return;
    if (!window.confirm("Annuler cette ordonnance ?")) return;
    try {
      await onAnnulerOrdonnance(id);
      notifierSucces("Ordonnance annulée.");
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  // ── Médecin émetteur : celui de l'ordonnance, sinon le médecin connecté ──
  const praticienDe = (o: OrdonnanceItem): string | undefined => {
    const brut = o as OrdonnanceItem & {
      medecinNom?: string | null;
      praticienNom?: string | null;
      medecin?: { nom?: string | null; libelle?: string | null } | null;
    };
    return (
      brut.medecinNom ??
      brut.praticienNom ??
      brut.medecin?.nom ??
      brut.medecin?.libelle ??
      medecinNom ??
      undefined
    );
  };

  const nomMedicament = (l: NonNullable<OrdonnanceItem["lignes"]>[number]) =>
    l.medicamentLibelle ??
    l.medicamentNom ??
    medicaments.find((m) => m.id === l.medicamentId)?.libelle ??
    `Médicament #${l.medicamentId}`;

  const donneesImpression = (o: OrdonnanceItem) => ({
    numero: o.id,
    date: o.createdAt ?? o.dateCreation ?? null,
    patientNom: patientNom || "Patient",
    praticien: praticienDe(o),
    ticketNumero,
    encounterId,
    lignes: (o.lignes ?? []).map((l) => ({
      nom: nomMedicament(l),
      forme: medicaments.find((m) => m.id === l.medicamentId)?.forme ?? null,
      quantite: l.quantite,
      posologie: l.posologie,
      dureeJours: l.dureeJours,
    })),
  });

  const imprimer = async (o: OrdonnanceItem) => {
    if (!o.lignes || o.lignes.length === 0) {
      notifierErreur("Ordonnance vide.");
      return;
    }
    try {
      await imprimerOrdonnance(donneesImpression(o));
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  const voirApercu = async (o: OrdonnanceItem, format: FormatApercu = "a4") => {
    if (!o.lignes || o.lignes.length === 0) {
      notifierErreur("Ordonnance vide.");
      return;
    }
    setApercuEnCours(true);
    try {
      const donnees = donneesImpression(o);
      const blob =
        format === "ticket"
          ? await genererTicketOrdonnance(donnees, 80) // mettre 58 pour un rouleau 58 mm
          : await genererPdfOrdonnance(donnees);
      setApercu({ numero: o.id, url: URL.createObjectURL(blob), format });
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setApercuEnCours(false);
    }
  };

  const imprimerDepuisApercu = () => {
    if (!apercu) return;
    try {
      apercuRef.current?.contentWindow?.focus();
      apercuRef.current?.contentWindow?.print();
    } catch {
      // Repli : le viewer du nouvel onglet a son propre bouton imprimer
      window.open(apercu.url, "_blank");
    }
  };

  return (
    <div className="p-5 space-y-5">
      {estModifiable && erreurMedicaments && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{erreurMedicaments}</span>
        </div>
      )}

      {estModifiable && (
        <form onSubmit={creer} className="space-y-3">
          {lignes.map((l, idx) => (
            <div
              key={l.cle}
              className="p-3 bg-violet-50/40 border border-violet-200 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-800">
                  Ligne {idx + 1}
                </span>
                {lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => supprimerLigne(l.cle)}
                    className="text-slate-400 hover:text-red-700 cursor-pointer"
                    title="Retirer cette ligne"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Médicament *
                  </label>
                  <RechercheMedicament
                    medicaments={medicaments}
                    valeur={l.medicamentId}
                    onChange={(id) => majLigne(l.cle, "medicamentId", id)}
                    exclusIds={lignes
                      .filter((autre) => autre.cle !== l.cle && autre.medicamentId)
                      .map((autre) => autre.medicamentId)}
                    chargement={chargementMedicaments}
                    disabled={ordonnanceEnCours}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={l.quantite}
                    onChange={(e) => majLigne(l.cle, "quantite", e.target.value)}
                    placeholder="20"
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold focus:outline-hidden focus:border-asina-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Durée (jours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={l.dureeJours}
                    onChange={(e) => majLigne(l.cle, "dureeJours", e.target.value)}
                    placeholder="Facultatif"
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-asina-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Posologie *
                </label>
                <input
                  type="text"
                  value={l.posologie}
                  onChange={(e) => majLigne(l.cle, "posologie", e.target.value)}
                  placeholder="ex. 1 comprimé matin et soir"
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-asina-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CHIPS_POSOLOGIE.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => majLigne(l.cle, "posologie", p)}
                      className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-white text-[10.5px] text-slate-700 hover:border-asina-400 hover:text-asina-700 transition cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={ajouterLigne}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-300 flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un médicament
            </button>

            <button
              type="submit"
              disabled={ordonnanceEnCours}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-violet-700 hover:bg-violet-800 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs transition"
            >
              <Send className="h-4 w-4" />
              <span>{ordonnanceEnCours ? "Enregistrement…" : "Émettre l'ordonnance"}</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Ordonnances émises ({ordonnances.length})
        </h4>

        {ordonnances.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center italic">
            Aucune ordonnance pour cette consultation.
          </p>
        ) : (
          <ul className="space-y-2">
            {ordonnances.map((o) => {
              const statut = (o.statut ?? "").toLowerCase();
              const annulee = statut === "annulee" || statut === "annulée";
              const dispensee = statut === "dispensee" || statut === "dispensée";
              const praticien = praticienDe(o);
              return (
                <li
                  key={o.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    annulee ? "bg-red-50/50 border-red-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <strong className={`text-slate-900 ${annulee ? "line-through" : ""}`}>
                        Ordonnance #{o.id}
                      </strong>
                      {o.statut && (
                        <span
                          className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            annulee
                              ? "bg-red-100 text-red-800"
                              : dispensee
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {annulee ? "Annulée" : dispensee ? "Dispensée" : "En attente"}
                        </span>
                      )}
                      {praticien && (
                        <div className="text-[10.5px] text-slate-500 mt-0.5">
                          Médecin : {praticien}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!annulee && (
                        <>
                          <button
                            type="button"
                            onClick={() => voirApercu(o, "a4")}
                            disabled={apercuEnCours}
                            className="px-2 py-0.5 text-sky-700 hover:bg-sky-50 border border-sky-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{apercuEnCours ? "Génération…" : "Aperçu"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => voirApercu(o, "ticket")}
                            disabled={apercuEnCours}
                            title="Aperçu au format ticket thermique"
                            className="px-2 py-0.5 text-slate-700 hover:bg-slate-100 border border-slate-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Ticket</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => imprimer(o)}
                            className="px-2 py-0.5 text-violet-700 hover:bg-violet-50 border border-violet-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Imprimer</span>
                          </button>
                        </>
                      )}
                      {estModifiable && !annulee && (
                        <button
                          type="button"
                          onClick={() => annuler(o.id)}
                          disabled={ordonnanceEnCours}
                          className="text-[10px] text-slate-400 hover:text-red-700 cursor-pointer disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>

                  {o.lignes && o.lignes.length > 0 && (
                    <ul className="space-y-1">
                      {o.lignes.map((l, i) => (
                        <li
                          key={`${l.id ?? i}`}
                          className="p-1.5 bg-white rounded border border-slate-200 flex flex-wrap justify-between items-start gap-1 text-[11px]"
                        >
                          <span className="text-slate-800">
                            <strong>{nomMedicament(l)}</strong>
                            <span className="text-slate-500 italic ml-2">— {l.posologie}</span>
                          </span>
                          <span className="text-slate-600 font-mono">
                            {l.quantite} u.{l.dureeJours ? ` · ${l.dureeJours}j` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Modale d'aperçu PDF / ticket ────────────────────────────────── */}
      {apercu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={fermerApercu}
          role="dialog"
          aria-modal="true"
          aria-label={`Aperçu de l'ordonnance ${apercu.numero}`}
        >
          <div
            className={`flex flex-col w-full ${
              apercu.format === "ticket" ? "max-w-[420px]" : "max-w-[900px]"
            } h-[92vh] bg-slate-100 rounded-xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">
                {apercu.format === "ticket" ? "Ticket thermique" : "Aperçu PDF"} — Ordonnance #
                {apercu.numero}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={apercu.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Ouvrir dans un onglet
                </a>
                <button
                  type="button"
                  onClick={imprimerDepuisApercu}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-violet-700 hover:bg-violet-800 text-white flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  type="button"
                  onClick={fermerApercu}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer transition"
                  title="Fermer (Échap)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <iframe
              ref={apercuRef}
              title={`Ordonnance ${apercu.numero}`}
              src={apercu.url}
              className="flex-1 w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OngletOrdonnance;