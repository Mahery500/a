/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Paperclip,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { formaterDateHeure } from "@/noyau/utils/dates";
import { useHistoriqueMedical } from "../hooks/useHistoriqueMedical";
import type {
  ActeHistoriqueApi,
  DiagnosticHistoriqueApi,
  HistoriqueEncounterApiOutput,
  ObservationHistoriqueApi,
  ResultatHistoriqueApi,
} from "../api/historique-medical.contrats";

export interface PanneauHistoriqueMedicalProps {
  patientId?: number | null;
  /** Prise en charge en cours : repérée dans la liste (badge « En cours »). */
  encounterCourantId?: number | null;
  /** Nombre de prises en charge par page. */
  limit?: number;
}

/* ------------------------------------------------------------------ *
 *  Statuts
 * ------------------------------------------------------------------ */

/** Statuts « la ligne ne compte plus » : visibles pour la trace, mais masqués par défaut. */
const STATUTS_INACTIFS = new Set(["saisi_par_erreur", "annule", "corrige"]);
const estInactif = (statut: string) => STATUTS_INACTIFS.has(statut);

const LIBELLE_STATUT: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
  realise: "Réalisé",
  saisi_par_erreur: "Saisi par erreur",
  corrige: "Corrigé",
  preliminaire: "Préliminaire",
  final: "Final",
  provisoire: "Provisoire",
  confirme: "Confirmé",
  infirme: "Infirmé",
};

const CLASSE_STATUT: Record<string, string> = {
  en_cours: "bg-[#e7f6ed] text-[#14703c]",
  termine: "bg-[#f0f2f1] text-[#5b6472]",
  realise: "bg-[#e7f6ed] text-[#14703c]",
  confirme: "bg-[#e7f6ed] text-[#14703c]",
  provisoire: "bg-amber-50 text-amber-800",
  planifie: "bg-amber-50 text-amber-800",
  annule: "bg-rose-50 text-rose-700",
  infirme: "bg-rose-50 text-rose-700",
  saisi_par_erreur: "bg-rose-50 text-rose-700",
  corrige: "bg-slate-100 text-slate-600",
};

const BadgeStatut: React.FC<{ statut: string }> = ({ statut }) => (
  <span
    className={`px-1.5 py-px rounded text-[10px] font-bold whitespace-nowrap ${
      CLASSE_STATUT[statut] ?? "bg-slate-100 text-slate-600"
    }`}
  >
    {LIBELLE_STATUT[statut] ?? statut}
  </span>
);

/* ------------------------------------------------------------------ *
 *  Briques d'affichage
 * ------------------------------------------------------------------ */

const TitreSection: React.FC<{ icone: React.ReactNode; titre: string; count: number }> = ({
  icone,
  titre,
  count,
}) => (
  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5b6472] mb-1">
    {icone}
    <span>
      {titre} ({count})
    </span>
  </div>
);

const LigneObservation: React.FC<{ o: ObservationHistoriqueApi }> = ({ o }) => (
  <div className={`py-0.5 ${estInactif(o.statut) ? "opacity-60 line-through" : ""}`}>
    <span className="text-[#1f2937]">{o.libelle} :</span>{" "}
    <strong className="text-[#1f2937]">
      {o.valeur}
      {o.uniteCode ? ` ${o.uniteCode}` : ""}
    </strong>
    {o.interpretation && <span className="text-[#5b6472] italic"> · {o.interpretation}</span>}
    {o.commentaire && <span className="text-[#5b6472]"> — {o.commentaire}</span>}
    {estInactif(o.statut) && (
      <span className="ml-1.5 no-underline inline-block">
        <BadgeStatut statut={o.statut} />
      </span>
    )}
  </div>
);

const BlocResultat: React.FC<{ r: ResultatHistoriqueApi }> = ({ r }) => {
  const piecesActives = r.piecesJointes.filter((p) => p.statut === "actif");
  return (
    <div className="mt-1 ml-2 pl-2 border-l-2 border-[#e5e7eb] space-y-0.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1f2937]">
        <FileText className="h-3 w-3 text-[#5b6472]" />
        {r.type}
        {r.dateValidation && (
          <span className="font-normal text-[#5b6472]">
            · validé le {formaterDateHeure(r.dateValidation)}
          </span>
        )}
      </div>
      {r.conclusion && <div className="text-[11px] text-[#1f2937]">{r.conclusion}</div>}
      {r.interpretation && (
        <div className="text-[11px] text-[#5b6472] italic">{r.interpretation}</div>
      )}
      {r.observations.map((o) => (
        <div key={o.id} className="text-[11px]">
          <LigneObservation o={o} />
        </div>
      ))}
      {piecesActives.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-[#5b6472]">
          <Paperclip className="h-3 w-3" />
          {piecesActives.length} pièce{piecesActives.length > 1 ? "s" : ""} jointe
          {piecesActives.length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

const LigneActe: React.FC<{ a: ActeHistoriqueApi }> = ({ a }) => (
  <div className="py-1">
    <div className={`flex items-start justify-between gap-2 ${estInactif(a.statut) ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <div className={`text-[#1f2937] ${estInactif(a.statut) ? "line-through" : ""}`}>
          {a.acteDefinitionLibelle}
        </div>
        <div className="text-[10px] text-[#5b6472]">{formaterDateHeure(a.dateRealisation)}</div>
      </div>
      <BadgeStatut statut={a.statut} />
    </div>
    {a.commentaire && <div className="text-[11px] text-[#5b6472] italic">{a.commentaire}</div>}
    {a.observations.length > 0 && (
      <div className="mt-0.5 ml-2 text-[11px]">
        {a.observations.map((o) => (
          <LigneObservation key={o.id} o={o} />
        ))}
      </div>
    )}
    {a.resultats.map((r) => (
      <BlocResultat key={r.id} r={r} />
    ))}
  </div>
);

const LigneDiagnostic: React.FC<{ d: DiagnosticHistoriqueApi }> = ({ d }) => (
  <div className="py-1">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="font-mono text-[10px] font-bold text-rose-700">[{d.code}]</span>{" "}
        <span className={`text-[#1f2937] ${d.statut === "infirme" ? "line-through opacity-60" : ""}`}>
          {d.libelle}
        </span>
      </div>
      <BadgeStatut statut={d.statut} />
    </div>
    {d.commentaire && <div className="text-[11px] text-[#5b6472] italic">{d.commentaire}</div>}
  </div>
);

/* ------------------------------------------------------------------ *
 *  Une prise en charge (carte repliable)
 * ------------------------------------------------------------------ */

const CarteEncounter: React.FC<{
  entree: HistoriqueEncounterApiOutput;
  ouvert: boolean;
  courant: boolean;
  afficherTout: boolean;
  onBasculer: () => void;
}> = ({ entree, ouvert, courant, afficherTout, onBasculer }) => {
  const { encounter: e } = entree;

  const actes = afficherTout ? entree.actes : entree.actes.filter((a) => !estInactif(a.statut));
  const constats = afficherTout
    ? entree.constats
    : entree.constats.filter((c) => !estInactif(c.statut));
  const diagnostics = entree.diagnostics;

  return (
    <div className={`rounded-lg border ${courant ? "border-[#1f9d55]" : "border-[#e5e7eb]"} bg-white`}>
      <button
        type="button"
        onClick={onBasculer}
        aria-expanded={ouvert}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left cursor-pointer"
      >
        {ouvert ? (
          <ChevronDown className="h-4 w-4 mt-0.5 text-[#5b6472] shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-0.5 text-[#5b6472] shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-[#1f2937]">{e.typeEncounterLibelle}</span>
            <BadgeStatut statut={e.statut} />
            {courant && (
              <span className="px-1.5 py-px rounded text-[10px] font-bold bg-[#1f9d55] text-white">
                Consultation actuelle
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#5b6472]">
            {formaterDateHeure(e.dateDebut)}
            {e.dateFin ? ` → ${formaterDateHeure(e.dateFin)}` : ""}
          </div>
          <div className="text-[11px] text-[#5b6472] mt-0.5">
            {diagnostics.length} diagnostic{diagnostics.length > 1 ? "s" : ""} · {actes.length} acte
            {actes.length > 1 ? "s" : ""} · {constats.length} constat
            {constats.length > 1 ? "s" : ""}
          </div>
        </div>
      </button>

      {ouvert && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-[#f0f2f1] text-xs">
          {diagnostics.length === 0 && actes.length === 0 && constats.length === 0 && (
            <p className="text-[11px] text-[#5b6472] italic pt-2">
              Rien d'enregistré pour cette prise en charge.
            </p>
          )}

          {diagnostics.length > 0 && (
            <div className="pt-2">
              <TitreSection
                icone={<ClipboardList className="h-3 w-3" />}
                titre="Diagnostics"
                count={diagnostics.length}
              />
              {diagnostics.map((d) => (
                <LigneDiagnostic key={d.id} d={d} />
              ))}
            </div>
          )}

          {constats.length > 0 && (
            <div>
              <TitreSection
                icone={<Stethoscope className="h-3 w-3" />}
                titre="Constats"
                count={constats.length}
              />
              {constats.map((c) => (
                <LigneObservation key={c.id} o={c} />
              ))}
            </div>
          )}

          {actes.length > 0 && (
            <div>
              <TitreSection
                icone={<Activity className="h-3 w-3" />}
                titre="Actes"
                count={actes.length}
              />
              {actes.map((a) => (
                <LigneActe key={a.id} a={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ *
 *  Panneau principal
 * ------------------------------------------------------------------ */

export const PanneauHistoriqueMedical: React.FC<PanneauHistoriqueMedicalProps> = ({
  patientId,
  encounterCourantId,
  limit = 10,
}) => {
  const {
    donnees,
    chargement,
    erreur,
    page,
    totalPages,
    pagePrecedente,
    pageSuivante,
    rafraichir,
  } = useHistoriqueMedical(patientId, limit);

  const [afficherTout, setAfficherTout] = useState(false);
  const [ouverts, setOuverts] = useState<Set<number>>(new Set());

  // À chaque nouvelle page : on ouvre la première prise en charge.
  useEffect(() => {
    const premier = donnees?.encounters[0]?.encounter.id;
    setOuverts(premier ? new Set([premier]) : new Set());
  }, [donnees]);

  const basculer = (id: number) =>
    setOuverts((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });

  if (!patientId) {
    return (
      <div className="p-6 text-center text-xs text-[#5b6472]">
        Patient introuvable : impossible d'afficher le dossier.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAfficherTout((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5b6472] hover:text-[#1f2937] cursor-pointer"
          title="Les lignes corrigées, annulées ou saisies par erreur restent en base pour la trace"
        >
          {afficherTout ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {afficherTout ? "Masquer les lignes annulées" : "Afficher les lignes annulées"}
        </button>
        <button
          type="button"
          onClick={rafraichir}
          disabled={chargement}
          className="p-1 text-[#5b6472] hover:text-[#1f2937] cursor-pointer disabled:opacity-50"
          title="Actualiser"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${chargement ? "animate-spin" : ""}`} />
        </button>
      </div>

      {erreur && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {erreur}
        </div>
      )}

      {chargement && !donnees && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-[#5b6472]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement du dossier…
        </div>
      )}

      {donnees && donnees.encounters.length === 0 && !erreur && (
        <p className="text-xs text-[#5b6472] italic text-center py-4">
          Aucune prise en charge enregistrée pour ce patient.
        </p>
      )}

      {donnees && donnees.encounters.length > 0 && (
        <div className={`space-y-2 ${chargement ? "opacity-60" : ""}`}>
          {donnees.encounters.map((entree) => (
            <CarteEncounter
              key={entree.encounter.id}
              entree={entree}
              ouvert={ouverts.has(entree.encounter.id)}
              courant={entree.encounter.id === encounterCourantId}
              afficherTout={afficherTout}
              onBasculer={() => basculer(entree.encounter.id)}
            />
          ))}
        </div>
      )}

      {donnees && totalPages > 1 && (
        <div className="flex items-center justify-between text-[11px] text-[#5b6472]">
          <button
            type="button"
            onClick={pagePrecedente}
            disabled={page <= 1 || chargement}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#e5e7eb] bg-white hover:bg-[#fafbfa] disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-3 w-3" /> Plus récent
          </button>
          <span>
            Page {page} / {totalPages} · {donnees.total} prises en charge
          </span>
          <button
            type="button"
            onClick={pageSuivante}
            disabled={page >= totalPages || chargement}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#e5e7eb] bg-white hover:bg-[#fafbfa] disabled:opacity-40 cursor-pointer"
          >
            Plus ancien <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {donnees && donnees.resultatsExternes.length > 0 && (
        <div className="pt-2 border-t border-[#f0f2f1] text-xs">
          <TitreSection
            icone={<FileText className="h-3 w-3" />}
            titre="Résultats externes"
            count={donnees.resultatsExternes.length}
          />
          {donnees.resultatsExternes.map((r) => (
            <BlocResultat key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PanneauHistoriqueMedical;