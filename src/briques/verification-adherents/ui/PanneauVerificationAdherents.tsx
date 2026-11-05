/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Tv,
  Loader2,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useVerificationAdherent } from "../hooks/useVerificationAdherent";
import { CarteAdherentModale } from "./CarteAdherentModale";
import type { StatutEligibilite } from "../modele/verification-adherent.types";

/* =====================================================================
 *  Tokens du design (maquette « Vérification et éligibilité des adhérents »)
 *  vert #1f9d55 · vert foncé #14703c · vert clair #e7f6ed
 *  nuit #0f1b3d · ink #1f2937 · ink2 #5b6472 · bordure #e5e7eb
 *  séparateur #f0f2f1 · ambre #fff4e0 / #8a5300 · erreur #b42318
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px] p-5";
const BTN_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors disabled:cursor-not-allowed";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] border border-[#1f9d55] text-white hover:bg-[#14703c] disabled:bg-[#cbd5e1] disabled:border-[#cbd5e1]`;

const CHIP_ELIGIBLE =
  "inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#e7f6ed] text-[#14703c] whitespace-nowrap";
const CHIP_ATTENTE =
  "inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff4e0] text-[#8a5300] whitespace-nowrap";
const CHIP_NON_ELIGIBLE =
  "inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 whitespace-nowrap";

function initials(nom?: string, prenom?: string): string {
  const n = (nom ?? "").trim();
  const p = (prenom ?? "").trim();
  if (n && p) return (n.charAt(0) + p.charAt(0)).toUpperCase();
  if (n) return n.slice(0, 2).toUpperCase();
  if (p) return p.slice(0, 2).toUpperCase();
  return "??";
}

const fmtDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

function ChipEligibilite({
  statut,
  label,
}: {
  statut: StatutEligibilite;
  label: string;
}) {
  const cls =
    statut === "ELIGIBLE"
      ? CHIP_ELIGIBLE
      : statut === "EN_ATTENTE"
        ? CHIP_ATTENTE
        : CHIP_NON_ELIGIBLE;
  const icon = statut === "ELIGIBLE" ? "✓" : statut === "EN_ATTENTE" ? "!" : "✕";
  return (
    <span className={cls}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

export interface PanneauVerificationAdherentsProps {
  mode?: ModeAffichage;
  siteId?: number;
}

export const PanneauVerificationAdherents: React.FC<
  PanneauVerificationAdherentsProps
> = ({ mode = "edition", siteId }) => {
  const estLectureSeule = mode === "lecture";
  const [carteModaleOuverte, setCarteModaleOuverte] = useState(false);

  const {
    termeRecherche,
    setTermeRecherche,
    resultatsRecherche,
    rechercheEnCours,
    adherentActif,
    selectionnerAdherent,
    reinitialiserSelection,
    rendezVous,
    chargementRdv,
    servicesOrientation,
    serviceSelectionneId,
    setServiceSelectionneId,
    identiteVerifiee,
    setIdentiteVerifiee,
    dernierTicketEmis,
    actionEnCours,
    confirmerArriveeRdv,
    emettreTicketSpontane,
  } = useVerificationAdherent(siteId);

  if (mode === "masque") return null;

  const ouvrirEcranSalleAttente = () => {
    window.open("/ecran-attente", "asina-ecran-attente", "noopener,noreferrer");
  };

  const rdvActionnable = rendezVous.find((r) => r.actionnable) ?? null;
  const peutEmettre = identiteVerifiee && serviceSelectionneId !== null;

  const handleEmettre = async () => {
    if (!peutEmettre || estLectureSeule) return;
    if (rdvActionnable) {
      await confirmerArriveeRdv(rdvActionnable.id);
    } else {
      await emettreTicketSpontane();
    }
  };

  const handleChangerUsager = () => {
    reinitialiserSelection();
    setTermeRecherche("");
  };

  return (
    <div className="max-w-[1240px] mx-auto p-5 pb-7 space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête ===================== */}
      <div className="flex items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight">
            Vérification et éligibilité des adhérents
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Contrôlez les droits CNAPS et entreprise, confirmez l'arrivée et remettez un
            ticket de file d'attente.
          </p>
        </div>
        <button
          type="button"
          onClick={ouvrirEcranSalleAttente}
          className={`${BTN_SECONDAIRE} ml-auto shrink-0`}
          title="Ouvrir l'écran d'affichage salle d'attente dans un nouvel onglet"
        >
          <Tv className="w-[18px] h-[18px]" />
          Écran de salle d'attente
        </button>
      </div>

      {/* ===================== Grille ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-3.5 items-start">
        {/* ---------- Colonne gauche ---------- */}
        <div className="space-y-3.5">
          {/* --- Recherche --- */}
          <section className={CARTE}>
            <h2 className="text-base font-bold mb-3">Rechercher un usager</h2>
            <label
              htmlFor="verif-search"
              className="block text-xs font-bold text-[#5b6472] mb-1.5"
            >
              Nom, prénom, matricule ou numéro CNAPS
            </label>
            <input
              id="verif-search"
              type="search"
              value={termeRecherche}
              onChange={(e) => setTermeRecherche(e.target.value)}
              placeholder="Ex. RAKOTO ou SMTA-0007"
              autoComplete="off"
              className="w-full h-10 border border-[#e5e7eb] rounded-[10px] px-3 text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#e7f6ed]"
            />

            {termeRecherche.length > 1 && !adherentActif && (
              <div className="mt-2.5 border border-[#e5e7eb] rounded-[10px] max-h-[300px] overflow-auto">
                {rechercheEnCours && resultatsRecherche.length === 0 ? (
                  <div className="px-3.5 py-3 text-xs text-[#5b6472] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Recherche en cours…
                  </div>
                ) : resultatsRecherche.length === 0 ? (
                  <div className="px-3.5 py-3 text-xs text-[#5b6472]">
                    Aucun usager trouvé. Vérifiez l'orthographe ou essayez le matricule.
                  </div>
                ) : (
                  resultatsRecherche.map((a) => (
                    <button
                      key={a.patient.id}
                      type="button"
                      onClick={() => selectionnerAdherent(a)}
                      className="w-full flex items-center gap-2.5 min-h-[54px] px-3 py-2 border-t border-[#f0f2f1] first:border-t-0 bg-white hover:bg-[#e7f6ed] text-left cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">
                          {a.patient.nom} {a.patient.prenom}
                        </div>
                        <div className="text-xs text-[#5b6472] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded px-1.5 py-0.5 whitespace-nowrap">
                            {a.patient.matricule}
                          </span>
                          <span className="truncate">
                            {a.affiliation.nomEntreprise || "Sans entreprise"}
                          </span>
                        </div>
                      </div>
                      <ChipEligibilite
                        statut={a.eligibilite.statut}
                        label={a.eligibilite.label}
                      />
                    </button>
                  ))
                )}
              </div>
            )}

            {termeRecherche.length <= 1 && !adherentActif && (
              <p className="text-xs text-[#5b6472] mt-1.5">
                Saisissez au moins 2 caractères.
              </p>
            )}
          </section>

          {/* --- Fiche adhérent sélectionné --- */}
          {adherentActif ? (
            <section className={CARTE}>
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-full bg-[#e7f6ed] text-[#14703c] font-bold flex items-center justify-center shrink-0">
                  {initials(adherentActif.patient.nom, adherentActif.patient.prenom)}
                </div>
                <div className="min-w-0">
                  <b className="text-base block truncate">
                    {adherentActif.patient.nom} {adherentActif.patient.prenom}
                  </b>
                  <span className="font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded px-1.5 py-0.5 inline-block mt-0.5">
                    {adherentActif.patient.matricule}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleChangerUsager}
                  className={`${BTN_SECONDAIRE} !h-8 !px-3 !text-xs ml-auto shrink-0`}
                >
                  Changer
                </button>
              </div>

              <div
                className={`rounded-[10px] px-3.5 py-3 font-bold flex items-center gap-2 ${
                  adherentActif.eligibilite.statut === "ELIGIBLE"
                    ? "bg-[#e7f6ed] text-[#14703c]"
                    : adherentActif.eligibilite.statut === "EN_ATTENTE"
                      ? "bg-[#fff4e0] text-[#8a5300]"
                      : "bg-rose-50 text-rose-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adherentActif.eligibilite.label}</span>
                <span className="ml-auto text-[13px] font-normal whitespace-nowrap">
                  {adherentActif.eligibilite.conventionActive
                    ? "Convention active"
                    : adherentActif.eligibilite.statut === "EN_ATTENTE"
                      ? "En cours"
                      : "Sans convention"}
                </span>
              </div>

              {adherentActif.eligibilite.motif && (
                <p className="text-xs text-[#5b6472] mt-1.5">
                  {adherentActif.eligibilite.motif}
                </p>
              )}

              <dl className="mt-3.5 text-sm">
                <div className="grid grid-cols-[140px_1fr] gap-0">
                  <dt className="py-2.5 border-t border-[#f0f2f1] text-xs font-bold text-[#5b6472]">
                    Entreprise
                  </dt>
                  <dd className="py-2.5 border-t border-[#f0f2f1]">
                    {adherentActif.affiliation.nomEntreprise || (
                      <span className="text-[#8a5300]">
                        <b>À compléter</b> · Non renseigné
                      </span>
                    )}
                  </dd>

                  <dt className="py-2.5 border-t border-[#f0f2f1] text-xs font-bold text-[#5b6472]">
                    Numéro CNAPS
                  </dt>
                  <dd className="py-2.5 border-t border-[#f0f2f1]">
                    {adherentActif.affiliation.cnaps || (
                      <span className="text-[#8a5300]">
                        <b>À compléter</b> · Non renseigné
                      </span>
                    )}
                  </dd>

                  <dt className="py-2.5 border-t border-[#f0f2f1] text-xs font-bold text-[#5b6472]">
                    Téléphone
                  </dt>
                  <dd className="py-2.5 border-t border-[#f0f2f1]">
                    {adherentActif.patient.telephone || (
                      <span className="text-[#8a5300]">
                        <b>À compléter</b> · Non renseigné
                      </span>
                    )}
                  </dd>

                  <dt className="py-2.5 border-t border-[#f0f2f1] text-xs font-bold text-[#5b6472]">
                    Groupe sanguin
                  </dt>
                  <dd className="py-2.5 border-t border-[#f0f2f1]">
                    {adherentActif.patient.groupeSanguin || (
                      <span className="text-[#8a5300]">
                        <b>À compléter</b> · Inconnu
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setCarteModaleOuverte(true)}
                className={`${BTN_SECONDAIRE} w-full justify-center mt-3.5`}
              >
                Afficher la carte d'adhérent
              </button>
            </section>
          ) : (
            <div className="border-2 border-dashed border-[#cfd5dc] rounded-[14px] p-7 text-center bg-white">
              <b className="block text-base text-[#1f2937] mb-1">
                Aucun usager sélectionné
              </b>
              <p className="text-xs text-[#5b6472]">
                Recherchez un salarié ou un adhérent pour lancer la vérification d'accueil.
              </p>
            </div>
          )}
        </div>

        {/* ---------- Colonne droite ---------- */}
        <div>
          {!adherentActif ? (
            <div className="border-2 border-dashed border-[#cfd5dc] rounded-[14px] p-10 text-center bg-white">
              <ShieldCheck
                className="w-10 h-10 text-[#5b6472] mx-auto"
                strokeWidth={1.6}
              />
              <b className="block text-base text-[#1f2937] mt-2 mb-1">
                Prêt pour l'accueil
              </b>
              <p className="text-xs text-[#5b6472] max-w-md mx-auto">
                Sélectionnez un adhérent à gauche pour vérifier ses droits, confirmer sa
                présence puis émettre un ticket d'orientation.
              </p>
            </div>
          ) : dernierTicketEmis ? (
            <section className={`${CARTE} !p-6 text-center space-y-2`}>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#e7f6ed] text-[#14703c] text-xs font-bold">
                ✓ Ticket émis
              </span>
              <div className="font-mono font-bold text-[64px] leading-none text-[#0f1b3d] my-2">
                {dernierTicketEmis.numTicket}
              </div>
              <b className="text-lg text-[#1f2937] block">
                {adherentActif.patient.nom} {adherentActif.patient.prenom}
              </b>
              <p className="text-xs text-[#5b6472] max-w-md mx-auto">
                {dernierTicketEmis.estRdv
                  ? "L'arrivée a été confirmée."
                  : "Ticket de visite spontanée émis."}{" "}
                Le patient peut s'asseoir : son numéro sera annoncé sur l'écran de salle
                d'attente.
              </p>
              <button
                type="button"
                onClick={handleChangerUsager}
                className={`${BTN_PRIMAIRE} mt-3`}
              >
                Nouvel usager
              </button>
            </section>
          ) : (
            <section className={CARTE}>
              <h2 className="text-base font-bold mb-3">Émettre un ticket</h2>

              {/* --- Étape 1 : identité --- */}
              <div className="flex gap-3.5 py-4 border-t border-[#f0f2f1] first:border-t-0 first:pt-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                    identiteVerifiee
                      ? "bg-[#1f9d55] text-white"
                      : "border-2 border-[#cbd5e1] text-[#5b6472]"
                  }`}
                >
                  {identiteVerifiee ? "✓" : "1"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold mb-2.5">
                    Vérification d'identité <span className="text-[#b42318]">*</span>
                  </h3>
                  <label
                    className={`flex gap-3 items-center min-h-[54px] px-3.5 py-3 rounded-[10px] border cursor-pointer transition-colors ${
                      identiteVerifiee
                        ? "border-[#1f9d55] bg-[#e7f6ed]"
                        : "border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                    } ${estLectureSeule ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={identiteVerifiee}
                      onChange={(e) => setIdentiteVerifiee(e.target.checked)}
                      disabled={estLectureSeule || actionEnCours}
                      className="w-[18px] h-[18px] accent-[#1f9d55] m-0"
                    />
                    <span className="min-w-0">
                      <b className="block text-[#1f2937] text-sm">
                        Pièce d'identité ou badge présenté
                      </b>
                      <small className="text-xs text-[#5b6472]">
                        Je confirme avoir vérifié l'identité de l'usager au guichet.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              {/* --- Étape 2 : RDV --- */}
              <div className="flex gap-3.5 py-4 border-t border-[#f0f2f1]">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 bg-[#1f9d55] text-white">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold mb-2.5">Rendez-vous du jour</h3>
                  {chargementRdv ? (
                    <div className="px-3.5 py-3 border border-[#e5e7eb] rounded-[10px] bg-[#fafbfa] text-xs text-[#5b6472] flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Vérification des rendez-vous…
                    </div>
                  ) : rdvActionnable ? (
                    <div className="border border-[#1f9d55] rounded-[10px] px-3.5 py-3 bg-[#e7f6ed] flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#14703c] shrink-0" />
                      <div className="min-w-0">
                        <b className="block text-[#14703c] text-sm">
                          {rdvActionnable.heureRdv} — {fmtDate(rdvActionnable.dateRdv)}
                        </b>
                        <span className="text-xs text-[#14703c]/90">
                          Statut : {rdvActionnable.statut}
                          {rdvActionnable.commentaire
                            ? ` — ${rdvActionnable.commentaire}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#cfd5dc] rounded-[10px] px-3.5 py-3 bg-[#fafbfa]">
                      <b className="block text-[#1f2937] text-sm">
                        Aucun rendez-vous planifié
                      </b>
                      <span className="text-xs text-[#5b6472]">
                        Cet usager passera en visite spontanée : un ticket est émis sans
                        rendez-vous.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* --- Étape 3 : service d'orientation --- */}
              <div className="flex gap-3.5 py-4 border-t border-[#f0f2f1]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                    serviceSelectionneId !== null
                      ? "bg-[#1f9d55] text-white"
                      : "border-2 border-[#cbd5e1] text-[#5b6472]"
                  }`}
                >
                  {serviceSelectionneId !== null ? "✓" : "2"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold mb-2.5">
                    Service d'orientation <span className="text-[#b42318]">*</span>
                  </h3>
                  {servicesOrientation.length === 0 ? (
                    <p className="text-xs text-[#8a5300] bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] px-3 py-2.5">
                      Aucun service d'orientation n'est configuré pour ce site.
                    </p>
                  ) : (
                    <>
                      <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                        role="radiogroup"
                        aria-label="Service d'orientation"
                      >
                        {servicesOrientation.map((s) => {
                          const actif = serviceSelectionneId === s.id;
                          return (
                            <label
                              key={s.id}
                              className={`flex gap-2.5 items-center min-h-[54px] px-3.5 py-3 rounded-[10px] border cursor-pointer transition-colors ${
                                actif
                                  ? "border-[#1f9d55] bg-[#e7f6ed]"
                                  : "border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                              } ${estLectureSeule ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="radio"
                                name="verif-service"
                                value={s.id}
                                checked={actif}
                                onChange={() => setServiceSelectionneId(s.id)}
                                disabled={estLectureSeule || actionEnCours}
                                className="w-[18px] h-[18px] accent-[#1f9d55] m-0"
                              />
                              <span className="min-w-0">
                                <b className="block text-[#1f2937] text-sm truncate">
                                  {s.nom}
                                </b>
                                {s.description && (
                                  <small className="text-xs text-[#5b6472] truncate block">
                                    {s.description}
                                  </small>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs text-[#5b6472] mt-1.5">
                        {servicesOrientation.length} service
                        {servicesOrientation.length > 1 ? "s" : ""} disponible
                        {servicesOrientation.length > 1 ? "s" : ""} sur ce site. Un patient
                        doit toujours être orienté.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* --- Footer --- */}
              <div className="flex items-center gap-4 pt-4 border-t border-[#e5e7eb] mt-1">
                <div className="flex-1 min-w-0 text-xs text-[#5b6472]">
                  <b className="block text-sm text-[#1f2937] truncate">
                    {adherentActif.patient.nom} {adherentActif.patient.prenom}
                    {serviceSelectionneId !== null && (
                      <>
                        {" → "}
                        {servicesOrientation.find((s) => s.id === serviceSelectionneId)
                          ?.nom ?? ""}
                      </>
                    )}
                  </b>
                  {peutEmettre ? (
                    <span>Prêt à émettre le ticket.</span>
                  ) : (
                    <span className="text-[#8a5300]">
                      À compléter :{" "}
                      {[
                        !identiteVerifiee ? "la vérification d'identité" : null,
                        serviceSelectionneId === null
                          ? "le service d'orientation"
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" et ")}
                      .
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEmettre}
                  disabled={!peutEmettre || actionEnCours || estLectureSeule}
                  className={BTN_PRIMAIRE}
                >
                  {actionEnCours ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Émission…
                    </>
                  ) : (
                    "Émettre le ticket"
                  )}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modale de la carte adhérent */}
      <CarteAdherentModale
        ouvert={carteModaleOuverte}
        adherent={adherentActif}
        onFermer={() => setCarteModaleOuverte(false)}
      />
    </div>
  );
};

export default PanneauVerificationAdherents;