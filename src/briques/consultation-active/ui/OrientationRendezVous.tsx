/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CalendarPlus, CalendarCheck, Clock } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { SelecteurStaff } from "@/briques/rendez-vous/ui/SelecteursRendezVous";

export interface OrientationRdvPayload {
  patientId: number;
  encounterId: number;
  staffId?: number;
  /** Format "YYYY-MM-DDTHH:mm:00" (heure locale) */
  debut: string;
  commentaire: string;
}

export interface OrientationRendezVousProps {
  encounterId: number;
  patientId?: number | null;
  patientNom?: string;
  estModifiable: boolean;
  /** Motif proposé par défaut (ex. motif de la consultation). */
  motifParDefaut?: string | null;
  onCreer: (payload: OrientationRdvPayload) => Promise<unknown>;
}

const CHIPS_DELAI = [
  { label: "Dans 1 semaine", jours: 7 },
  { label: "Dans 2 semaines", jours: 14 },
  { label: "Dans 1 mois", jours: 30 },
  { label: "Dans 3 mois", jours: 90 },
];

const CHIPS_MOTIF = [
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

interface Orientation {
  date: string;
  heure: string;
  motif: string;
}

const CLASSES_CHAMP =
  "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs transition " +
  "focus:outline-hidden focus:border-asina-500 focus:ring-3 focus:ring-asina-100";

export const OrientationRendezVous: React.FC<OrientationRendezVousProps> = ({
  encounterId,
  patientId,
  patientNom,
  estModifiable,
  motifParDefaut,
  onCreer,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [orientations, setOrientations] = useState<Orientation[]>([]);

  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("09:00");
  const [motif, setMotif] = useState("");
  const [staffId, setStaffId] = useState<number | undefined>(undefined);

  const ouvrir = () => {
    setDate(dansNJours(14));
    setHeure("09:00");
    setMotif(motifParDefaut ? `Suivi : ${motifParDefaut}` : "");
    setStaffId(undefined);
    setOuvert(true);
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      notifierErreur("Patient introuvable pour cette consultation.");
      return;
    }
    if (!date || !heure) {
      notifierErreur("Choisissez une date et une heure.");
      return;
    }
    const debut = `${date}T${heure}:00`;
    if (new Date(debut).getTime() <= Date.now()) {
      notifierErreur("Le rendez-vous doit être dans le futur.");
      return;
    }
    if (!motif.trim()) {
      notifierErreur("Indiquez le motif du rendez-vous.");
      return;
    }

    setEnCours(true);
    try {
      await onCreer({
        patientId,
        encounterId,
        staffId,
        debut,
        commentaire: motif.trim(),
      });
      setOrientations((prev) => [...prev, { date, heure, motif: motif.trim() }]);
      notifierSucces("Patient orienté vers un rendez-vous.");
      setOuvert(false);
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Suivi du patient
          </h4>
          <p className="text-[11px] text-slate-400">
            Orientez le patient vers un prochain rendez-vous.
          </p>
        </div>
        {estModifiable && (
          <button
            type="button"
            onClick={ouvrir}
            className="inline-flex items-center gap-1.5 rounded-lg bg-asina-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-asina-700 active:scale-[0.98] cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4" />
            Orienter vers un rendez-vous
          </button>
        )}
      </div>

      {orientations.length > 0 && (
        <ul className="space-y-1">
          {orientations.map((o, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800"
            >
              <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
              <strong>
                {new Date(`${o.date}T${o.heure}`).toLocaleDateString("fr-FR")} à {o.heure}
              </strong>
              <span className="text-emerald-700">— {o.motif}</span>
            </li>
          ))}
        </ul>
      )}

      {ouvert && (
        <Modale
          ouvert={ouvert}
          onFermer={() => setOuvert(false)}
          titre="Orienter vers un rendez-vous"
          icone={<CalendarPlus className="h-4 w-4 text-asina-600" />}
          largeurMax="md"
          enfants={
            <form id="form-orientation-rdv" onSubmit={soumettre} className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                Patient : <strong>{patientNom || `#${patientId ?? "?"}`}</strong>
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-slate-700">
                  Date du rendez-vous <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CHIPS_DELAI.map((c) => (
                    <button
                      key={c.jours}
                      type="button"
                      onClick={() => setDate(dansNJours(c.jours))}
                      className={`px-2.5 py-0.5 rounded-full border text-[10.5px] transition cursor-pointer ${
                        date === dansNJours(c.jours)
                          ? "border-asina-500 bg-asina-50 text-asina-700 font-bold"
                          : "border-slate-200 bg-white text-slate-700 hover:border-asina-400"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    required
                    min={versDateInput(new Date())}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={CLASSES_CHAMP}
                  />
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      required
                      value={heure}
                      onChange={(e) => setHeure(e.target.value)}
                      className={`${CLASSES_CHAMP} pl-8`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-slate-700">
                  Motif <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="ex. Contrôle après traitement"
                  className={CLASSES_CHAMP}
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CHIPS_MOTIF.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMotif(m)}
                      className="px-2.5 py-0.5 rounded-full border border-slate-200 bg-white text-[10.5px] text-slate-700 hover:border-asina-400 hover:text-asina-700 transition cursor-pointer"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optionnel : médecin / membre du personnel concerné */}
              <SelecteurStaff valeur={staffId} changer={setStaffId} />
            </form>
          }
          pied={
            <div className="w-full">
              <ActionsFormulaire
                idFormulaire="form-orientation-rdv"
                onAnnuler={() => setOuvert(false)}
                enCours={enCours}
                desactive={enCours}
                labelValider="Planifier le rendez-vous"
              />
            </div>
          }
        />
      )}
    </div>
  );
};

export default OrientationRendezVous;