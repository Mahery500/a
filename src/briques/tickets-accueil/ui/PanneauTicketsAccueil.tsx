/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  Tv,
  Plus,
  Volume2,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useSession } from "@/cerveau/session";
import { AffichageEcranSalleAttente } from "@/briques/ecran-attente";
import { useTicketsAccueil } from "../hooks/useTicketsAccueil";
import { FormulaireNouveauTicketModale } from "./FormulaireNouveauTicketModale";

/* =====================================================================
 *  Tokens du design (maquettes File-attente 1 & 2)
 *  vert #1f9d55 · vert foncé #14703c · vert clair #e7f6ed
 *  ink #1f2937 · ink2 #5b6472 · bordure #e5e7eb · séparateur #f0f2f1
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] border border-[#1f9d55] text-white hover:bg-[#14703c]`;
const CHIP_CODE =
  "font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] inline-block";
const TAG_GRIS =
  "inline-block text-[12px] font-bold bg-[#f0f2f1] text-[#1f2937] rounded-full px-2.5 py-0.5";
const TAG_ACTIF =
  "inline-block text-[12px] font-bold bg-white text-[#14703c] rounded-full px-2.5 py-0.5";

const COMPTEUR =
  "text-[12px] font-bold bg-[#f0f2f1] text-[#1f2937] rounded-full px-2.5 py-0.5 tabular-nums";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

/* ===================================================================== */
export interface PanneauTicketsAccueilProps {
  mode?: ModeAffichage;
  siteId?: number;
}

export const PanneauTicketsAccueil: React.FC<PanneauTicketsAccueilProps> = ({
  mode = "edition",
  siteId,
}) => {
  if (mode === "masque") return null;
  const estLectureSeule = mode === "lecture";

  const { siteActifId } = useSession();

  const {
    enAttente,
    enCours,
    statistiques,
    chargement,
    filtreService,
    setFiltreService,
    patients,
    services,
    recharger,
    emettreTicket,
    appelerTicket,
  } = useTicketsAccueil(siteId);

  const [vueActive, setVueActive] = useState<"guichet" | "ecran">("guichet");
  const [modaleTicketOuverte, setModaleTicketOuverte] = useState(false);

  const sitePourEcran = siteId ?? siteActifId ?? 1;

  const ouvrirEcran = () => {
    window.open("/ecran-attente", "asina-ecran-attente", "noopener,noreferrer");
  };

  /* ===================================================================== */
  /*  Rendu                                                                */
  /* ===================================================================== */
  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            File d'attente et tickets
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-1 max-w-[560px]">
            Suivez les patients en temps réel, appelez-les au guichet et orientez-les vers
            le bon service.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={recharger}
            disabled={chargement}
            className={`${BTN_SECONDAIRE} ${FOCUS}`}
          >
            <RefreshCw
              className={`w-4 h-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
            Actualiser
          </button>

          <button
            type="button"
            onClick={ouvrirEcran}
            className={`${BTN_SECONDAIRE} ${FOCUS}`}
            title="Ouvrir l'écran d'affichage salle d'attente dans un nouvel onglet"
          >
            <Tv className="w-4 h-4" />
            Écran de la salle d'attente
          </button>

          {!estLectureSeule && (
            <button
              type="button"
              onClick={() => setModaleTicketOuverte(true)}
              className={`${BTN_PRIMAIRE} ${FOCUS}`}
            >
              <Plus className="w-4 h-4" />
              Émettre un ticket
            </button>
          )}
        </div>
      </div>

      {/* ===================== Carte statistiques + filtre ===================== */}
      <section
        aria-label="Statistiques"
        className={`${CARTE} flex flex-wrap items-center gap-y-2 px-5 py-3.5`}
      >
        <div className="flex-1 min-w-[120px] pr-5">
          <small className="block text-[12px] text-[#5b6472]">En attente</small>
          <b className="text-[22px] font-bold text-[#1f2937] tabular-nums">
            {statistiques.totalEnAttente}
          </b>
        </div>
        <div className="flex-1 min-w-[120px] px-5 border-l border-[#f0f2f1]">
          <small className="block text-[12px] text-[#5b6472]">En cours d'appel</small>
          <b className="text-[22px] font-bold text-[#1f2937] tabular-nums">
            {statistiques.totalEnCours}
          </b>
        </div>
        <div className="flex-1 min-w-[120px] px-5 border-l border-[#f0f2f1]">
          <small className="block text-[12px] text-[#5b6472]">Services actifs</small>
          <b className="text-[22px] font-bold text-[#1f2937] tabular-nums">
            {services.length}
          </b>
        </div>

        <select
          value={filtreService}
          onChange={(e) => setFiltreService(e.target.value)}
          aria-label="Filtrer par service"
          className={`ml-auto h-10 border border-[#e5e7eb] rounded-[10px] px-3 text-sm bg-white text-[#1f2937] ${FOCUS}`}
        >
          <option value="ALL">Tous les services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nom}
            </option>
          ))}
        </select>
      </section>

      {/* ===================== Onglets ===================== */}
      <div className="border-b border-[#e5e7eb]">
        <button
          type="button"
          onClick={() => setVueActive("guichet")}
          aria-pressed={vueActive === "guichet"}
          className={`pb-2 pt-2.5 px-1 mr-5 text-sm border-b-2 transition-colors cursor-pointer ${FOCUS} ${
            vueActive === "guichet"
              ? "text-[#14703c] font-bold border-[#1f9d55]"
              : "text-[#5b6472] border-transparent hover:text-[#1f2937]"
          }`}
        >
          Guichet d'appel
        </button>
        <button
          type="button"
          onClick={() => setVueActive("ecran")}
          aria-pressed={vueActive === "ecran"}
          className={`pb-2 pt-2.5 px-1 mr-5 text-sm border-b-2 transition-colors cursor-pointer ${FOCUS} ${
            vueActive === "ecran"
              ? "text-[#14703c] font-bold border-[#1f9d55]"
              : "text-[#5b6472] border-transparent hover:text-[#1f2937]"
          }`}
        >
          Aperçu de l'écran
        </button>
      </div>

      {/* ===================== Contenu ===================== */}
      {vueActive === "guichet" ? (
        <div className="flex flex-wrap gap-3.5 items-start">
          {/* ---------- Au guichet ---------- */}
          <section className={`${CARTE} flex-[1_1_300px] p-5`}>
            <div className="flex justify-between items-center mb-3.5">
              <h2 className="text-base font-bold">Au guichet</h2>
              <span className={COMPTEUR}>{enCours.length}</span>
            </div>

            {enCours.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-12 text-center">
                <CheckCircle2
                  className="w-8 h-8 text-[#5b6472]"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <b className="text-sm text-[#1f2937]">Aucun patient au guichet</b>
                <span className="text-[12px] text-[#5b6472] max-w-[280px]">
                  Les tickets pris en charge par les professionnels apparaîtront ici.
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {enCours.map((t) => (
                  <div
                    key={t.id}
                    className="border-2 border-[#1f9d55] bg-[#e7f6ed] rounded-[14px] p-4 flex justify-between items-center gap-3 flex-wrap"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-[26px] font-bold text-[#14703c] leading-none">
                          {t.numTicket}
                        </span>
                        <span className={TAG_ACTIF}>Au guichet</span>
                      </div>
                      <div className="font-bold mt-1.5 truncate">
                        {t.patientNom || `Patient #${t.patientId}`}
                      </div>
                      <div className="text-[12px] text-[#14703c] truncate">
                        {t.serviceNom} · appelé à {t.heureAffichee}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => appelerTicket(t)}
                      disabled={estLectureSeule}
                      className={`${BTN_PRIMAIRE} !h-12 ${FOCUS}`}
                      title="Rejouer l'annonce vocale en salle d'attente"
                    >
                      <Volume2 className="w-4 h-4" />
                      Rappeler le patient
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---------- Salle d'attente ---------- */}
          <section className={`${CARTE} flex-[1.4_1_420px] overflow-hidden`}>
            <div className="flex justify-between items-center px-5 pt-4 pb-3">
              <h2 className="text-base font-bold">Salle d'attente</h2>
              <span className={COMPTEUR}>{enAttente.length}</span>
            </div>

            {enAttente.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-12 text-center px-4">
                <Clock
                  className="w-8 h-8 text-[#5b6472]"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <b className="text-sm text-[#1f2937]">Salle d'attente vide</b>
                <span className="text-[12px] text-[#5b6472] max-w-[280px]">
                  Aucun patient en attente pour ce service.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#fafbfa] border-y border-[#e5e7eb]">
                      {["Ticket", "Patient", "Arrivée", "Attente"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enAttente.map((t) => (
                      <tr
                        key={t.id}
                        className="border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className={CHIP_CODE}>{t.numTicket}</span>
                        </td>
                        <td className="px-4 py-3 min-w-0">
                          <b className="block text-[#1f2937] truncate">
                            {t.patientNom || `Patient #${t.patientId}`}
                          </b>
                          <span className="text-[12px] text-[#5b6472] truncate block">
                            {t.serviceNom}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {t.heureAffichee}
                        </td>
                        <td className="px-4 py-3">
                          <span className={TAG_GRIS}>
                            {t.dureeAttenteMinutes} min
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* ---------- Aperçu de l'écran ---------- */
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs text-[#5b6472]">
              Aperçu de l'écran salle d'attente. Pour l'afficher en plein écran sur le 2ᵉ
              moniteur, cliquez sur{" "}
              <span className="font-semibold text-[#1f2937]">
                Écran de la salle d'attente
              </span>{" "}
              en haut à droite.
            </p>
            <button
              type="button"
              onClick={ouvrirEcran}
              className={`${BTN_SECONDAIRE} shrink-0 ${FOCUS}`}
            >
              <Tv className="w-4 h-4" />
              Ouvrir en plein écran
            </button>
          </div>
          <AffichageEcranSalleAttente siteId={sitePourEcran} />
        </div>
      )}

      {/* ===================== Modale d'émission ===================== */}
      <FormulaireNouveauTicketModale
        ouvert={modaleTicketOuverte}
        patients={patients}
        services={services}
        onFermer={() => setModaleTicketOuverte(false)}
        onEnregistrer={emettreTicket}
      />
    </div>
  );
};

export default PanneauTicketsAccueil;