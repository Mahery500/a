/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CalendarPlus,
  CalendarCheck,
  Clock,
  XCircle,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import {
  demandesRendezVousApi,
  type TypeDemande,
} from "@/briques/rendez-vous/api/demandesRendezVous.api";
import { invalider, useRequete } from "@/briques/rendez-vous/hooks/useRequete";

export interface DemandeRendezVousProps {
  encounterId: number;
  patientId?: number | null;
  patientNom?: string;
  medecinNom?: string;
  estModifiable: boolean;
  motifParDefaut?: string | null;
  /** Résumé clinique proposé par défaut (ex. diagnostics de la consultation). */
  resumeParDefaut?: string;
}

const CHIPS_DELAI = [
  { label: "1 semaine", jours: 7 },
  { label: "2 semaines", jours: 14 },
  { label: "1 mois", jours: 30 },
  { label: "3 mois", jours: 90 },
];

const CHIPS_MOTIF_SUIVI = [
  "Contrôle post-traitement",
  "Résultats d'examens",
  "Suivi de maladie chronique",
  "Renouvellement d'ordonnance",
];

const pad = (n: number) => String(n).padStart(2, "0");
const versDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dansNJours = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return versDateInput(d);
};

const STYLE_STATUT = {
  EN_ATTENTE: { libelle: "En attente de la réception", classes: "border-amber-200 bg-amber-50 text-amber-800", Icone: Clock },
  PLANIFIEE: { libelle: "Rendez-vous planifié", classes: "border-emerald-200 bg-emerald-50 text-emerald-800", Icone: CalendarCheck },
  REFUSEE: { libelle: "Refusée", classes: "border-rose-200 bg-rose-50 text-rose-800", Icone: XCircle },
} as const;

const CLASSES_CHAMP =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition " +
  "focus:outline-hidden focus:border-asina-500 focus:ring-3 focus:ring-asina-100";

export const DemandeRendezVous: React.FC<DemandeRendezVousProps> = ({
  encounterId,
  patientId,
  patientNom,
  medecinNom,
  estModifiable,
  motifParDefaut,
  resumeParDefaut,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();
  const [type, setType] = useState<TypeDemande | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [dateSouhaitee, setDateSouhaitee] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [motif, setMotif] = useState("");
  const [specialiteId, setSpecialiteId] = useState<number | "">("");
  const [resume, setResume] = useState("");

  const demandes = useRequete(
    () => demandesRendezVousApi.lister({ encounterId }),
    [encounterId],
    { tag: "demandes-rdv" },
  );

  const specialites = useRequete(
    () => demandesRendezVousApi.listerSpecialites(),
    [],
    { enabled: type === "SPECIALISTE" },
  );

  const ouvrir = (t: TypeDemande) => {
    setType(t);
    setDateSouhaitee("");
    setUrgent(false);
    setSpecialiteId("");
    setResume(resumeParDefaut ?? "");
    setMotif(t === "SUIVI" && motifParDefaut ? `Suivi : ${motifParDefaut}` : "");
  };

  const fermer = () => setType(null);
  const estSpecialiste = type === "SPECIALISTE";

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    if (!patientId) {
      notifierErreur("Patient introuvable pour cette consultation.");
      return;
    }
    if (estSpecialiste && !specialiteId) {
      notifierErreur("Choisissez la spécialité.");
      return;
    }
    if (!motif.trim()) {
      notifierErreur("Indiquez le motif.");
      return;
    }
    setEnCours(true);
    try {
      await demandesRendezVousApi.creer({
        type,
        patientId,
        patientNom,
        encounterId,
        demandeurLibelle: medecinNom,
        specialiteId: estSpecialiste ? Number(specialiteId) : undefined,
        dateSouhaitee: dateSouhaitee || undefined,
        urgent,
        motif: motif.trim(),
        resumeClinique: estSpecialiste && resume.trim() ? resume.trim() : undefined,
      });
      invalider("demandes-rdv");
      notifierSucces("Demande envoyée à la réception.");
      fermer();
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="space-y-2.5 border-t border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Suivi et orientation
          </h4>
          <p className="text-[11px] text-slate-400">
            Envoyez une demande : la réception fixera le rendez-vous.
          </p>
        </div>
        {estModifiable && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => ouvrir("SUIVI")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <CalendarPlus className="h-4 w-4" />
              Demander un suivi
            </button>
            <button
              type="button"
              onClick={() => ouvrir("SPECIALISTE")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-asina-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-asina-700 active:scale-[0.98]"
            >
              <Stethoscope className="h-4 w-4" />
              Orienter vers un spécialiste
            </button>
          </div>
        )}
      </div>

      {(demandes.data ?? []).length > 0 && (
        <ul className="space-y-1">
          {demandes.data!.map((d) => {
            const s = STYLE_STATUT[d.statut] ?? STYLE_STATUT.EN_ATTENTE;
            return (
              <li
                key={d.id}
                className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] ${s.classes}`}
              >
                <s.Icone className="h-3.5 w-3.5 shrink-0" />
                <strong>{s.libelle}</strong>
                {d.type === "SPECIALISTE" && (
                  <span className="rounded bg-white/70 px-1.5 py-px font-bold">
                    Spécialiste : {d.specialiteLibelle ?? "—"}
                  </span>
                )}
                {d.urgent && <span className="font-bold text-rose-700">URGENT</span>}
                <span>— {d.motif}</span>
              </li>
            );
          })}
        </ul>
      )}

      {type && (
        <Modale
          ouvert
          onFermer={fermer}
          titre={estSpecialiste ? "Orienter vers un spécialiste" : "Demande de suivi"}
          icone={
            estSpecialiste ? (
              <Stethoscope className="h-4 w-4 text-asina-600" />
            ) : (
              <CalendarPlus className="h-4 w-4 text-asina-600" />
            )
          }
          largeurMax="md"
          enfants={
            <form id="form-demande-rdv" onSubmit={soumettre} className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                Patient : <strong>{patientNom || `#${patientId ?? "?"}`}</strong>
              </div>

              {estSpecialiste && (
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-700">
                    Spécialité <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={specialiteId}
                    onChange={(e) =>
                      setSpecialiteId(e.target.value ? Number(e.target.value) : "")
                    }
                    disabled={specialites.isLoading}
                    className={CLASSES_CHAMP}
                  >
                    <option value="">
                      {specialites.isLoading ? "Chargement…" : "— Choisir une spécialité —"}
                    </option>
                    {(specialites.data ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.libelle}
                      </option>
                    ))}
                  </select>
                  {specialites.isError && (
                    <p className="mt-1 text-rose-600">Impossible de charger les spécialités.</p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1.5 block font-semibold text-slate-700">
                  {estSpecialiste ? "Motif d'orientation / question posée" : "Motif"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder={
                    estSpecialiste ? "ex. Avis cardiologique pour douleurs thoraciques" : "ex. Contrôle après traitement"
                  }
                  className={CLASSES_CHAMP}
                />
                {!estSpecialiste && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CHIPS_MOTIF_SUIVI.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotif(m)}
                        className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10.5px] text-slate-700 transition hover:border-asina-400 hover:text-asina-700"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {estSpecialiste && (
                <div>
                  <label className="mb-1.5 block font-semibold text-slate-700">
                    Résumé clinique (facultatif)
                  </label>
                  <textarea
                    rows={4}
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Antécédents, diagnostic, traitement en cours…"
                    className={CLASSES_CHAMP}
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block font-semibold text-slate-700">
                  Délai souhaité (facultatif)
                </label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {CHIPS_DELAI.map((c) => (
                    <button
                      key={c.jours}
                      type="button"
                      onClick={() => setDateSouhaitee(dansNJours(c.jours))}
                      className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[10.5px] transition ${
                        dateSouhaitee === dansNJours(c.jours)
                          ? "border-asina-500 bg-asina-50 font-bold text-asina-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-asina-400"
                      }`}
                    >
                      Dans {c.label}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  min={versDateInput(new Date())}
                  value={dateSouhaitee}
                  onChange={(e) => setDateSouhaitee(e.target.value)}
                  className={CLASSES_CHAMP}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                Demande urgente
              </label>
            </form>
          }
          pied={
            <div className="w-full">
              <ActionsFormulaire
                idFormulaire="form-demande-rdv"
                onAnnuler={fermer}
                enCours={enCours}
                desactive={enCours}
                labelValider="Envoyer à la réception"
              />
            </div>
          }
        />
      )}
    </div>
  );
};

export default DemandeRendezVous;