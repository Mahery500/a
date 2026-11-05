/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import { servicesApi, ServiceMedical } from "@/briques/services";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export interface ResultatCloture {
  /** Non null si l'utilisateur a demandé une réorientation avant clôture. */
  orienterVersServiceId: number | null;
  /** Facultatif : note affichée aux soignants du service destinataire. */
  motifOrientation: string | null;
}

export interface TiroirClotureSoinsProps {
  ouvert: boolean;
  encounterId: number | null;
  patientNom?: string;
  numTicket?: string;
  dureeMinutes?: number;
  /** Nombre d'actes encore demandés (approximatif, fourni par le parent). */
  actesEnSuspens?: number;
  /** Pour exclure le service courant de la liste d'orientation. */
  serviceActuelId?: number | null;
  siteId?: number | null;
  enCours?: boolean;
  erreur?: string | null;
  onFermer: () => void;
  onConfirmer: (resultat: ResultatCloture) => Promise<void>;
}

const CHAMP_LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_DANGER =
  "h-10 px-4 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 bg-[#b42318] hover:bg-[#912018] text-white cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed";

export const TiroirClotureSoins: React.FC<TiroirClotureSoinsProps> = ({
  ouvert,
  encounterId,
  patientNom,
  numTicket,
  dureeMinutes = 0,
  actesEnSuspens = 0,
  serviceActuelId,
  siteId,
  enCours = false,
  erreur = null,
  onFermer,
  onConfirmer,
}) => {
  const [services, setServices] = useState<ServiceMedical[]>([]);
  const [chargementServices, setChargementServices] = useState(false);
  const [erreurServices, setErreurServices] = useState<string | null>(null);

  const [orienter, setOrienter] = useState(false);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [motif, setMotif] = useState("");

  /* ---------- Reset à chaque ouverture + charge les services ---------- */
  useEffect(() => {
    if (!ouvert) return;
    setOrienter(false);
    setServiceId(null);
    setMotif("");
    setErreurServices(null);

    let annule = false;
    setChargementServices(true);
    servicesApi
      .listerServices()
      .then((liste) => {
        if (annule) return;
        const filtres = siteId ? liste.filter((s) => s.siteId === siteId) : liste;
        const aConserver = filtres.length > 0 ? filtres : liste;
        setServices(aConserver.filter((s) => s.id !== serviceActuelId));
      })
      .catch((err) => !annule && setErreurServices(extraireMessageErreur(err)))
      .finally(() => !annule && setChargementServices(false));

    return () => {
      annule = true;
    };
  }, [ouvert, siteId, serviceActuelId]);

  const serviceChoisi = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const peutConfirmer = !enCours && (!orienter || serviceId !== null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!peutConfirmer || !encounterId) return;
    await onConfirmer({
      orienterVersServiceId: orienter ? serviceId : null,
      motifOrientation: orienter && motif.trim() ? motif.trim() : null,
    });
  };

  if (!ouvert) return null;

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      fermetureBloquee={enCours}
      libelle="Terminer la prise en charge"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        {/* En-tête */}
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold leading-tight truncate">
              Terminer la prise en charge
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5 truncate">
              {[numTicket, encounterId ? `Dossier #${encounterId}` : null]
                .filter(Boolean)
                .join(" · ") || "Clôture de l'encounter"}
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? undefined : onFermer}
            disabled={enCours}
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50 shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* --- Récapitulatif patient --- */}
          <div className="bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <b className="text-[15px] text-[#1f2937] truncate">
                {patientNom || "Patient"}
              </b>
              {numTicket && (
                <span className="font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] border border-[#1f9d55]/30 rounded-md px-[7px] py-[3px] shrink-0">
                  {numTicket}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-[12px] text-[#5b6472] flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Durée : {dureeMinutes} min
              </span>
              {actesEnSuspens > 0 ? (
                <span className="inline-flex items-center gap-1 text-[#8a5300] font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {actesEnSuspens} acte{actesEnSuspens > 1 ? "s" : ""} en attente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#14703c] font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Aucun acte en suspens
                </span>
              )}
            </div>
          </div>

          {erreur && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs flex items-start gap-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{erreur}</span>
            </div>
          )}

          {actesEnSuspens > 0 && (
            <div className="bg-[#fff4e0] text-[#8a5300] rounded-[10px] px-3.5 py-3 text-[12px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <b>{actesEnSuspens} acte{actesEnSuspens > 1 ? "s" : ""} demandé{actesEnSuspens > 1 ? "s" : ""} n'a{actesEnSuspens > 1 ? "ont" : ""} pas encore été exécuté{actesEnSuspens > 1 ? "s" : ""}.</b>{" "}
                La clôture sera refusée par le serveur : vous pourrez forcer la clôture dans un
                second temps si nécessaire.
              </span>
            </div>
          )}

          {/* --- Option : réorienter avant clôture --- */}
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mb-3">
              Réorientation <span className="font-normal normal-case">(facultatif)</span>
            </div>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-[10px] border cursor-pointer transition-colors select-none ${
                orienter
                  ? "border-[#1f9d55] bg-[#e7f6ed]"
                  : "border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
              } ${enCours ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={orienter}
                onChange={(e) => {
                  setOrienter(e.target.checked);
                  if (!e.target.checked) {
                    setServiceId(null);
                    setMotif("");
                  }
                }}
                disabled={enCours}
                className="mt-0.5 h-4 w-4 accent-[#1f9d55] shrink-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="min-w-0">
                <b className="block text-[#1f2937] text-[13px] inline-flex items-center gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-[#14703c]" />
                  Réorienter le patient vers un autre service
                </b>
                <span className="block text-[12px] text-[#5b6472] mt-0.5">
                  La clôture de cette prise en charge créera un nouvel aiguillage dans le service
                  choisi.
                </span>
              </span>
            </label>

            {orienter && (
              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <label className={CHAMP_LABEL}>
                    Service de destination <span className="text-[#b42318]">*</span>
                  </label>

                  {chargementServices ? (
                    <p className="text-[#5b6472] py-2 text-xs">Chargement des services…</p>
                  ) : erreurServices ? (
                    <p className="text-[#b42318] bg-rose-50 border border-rose-200 rounded-[10px] p-2.5 text-xs">
                      {erreurServices}
                    </p>
                  ) : services.length === 0 ? (
                    <p className="text-[#8a5300] bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] p-2.5 text-xs">
                      Aucun autre service disponible sur ce site.
                    </p>
                  ) : (
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                      role="radiogroup"
                      aria-label="Service de destination"
                    >
                      {services.map((s) => {
                        const actif = serviceId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={actif}
                            disabled={enCours}
                            onClick={() => setServiceId(s.id)}
                            className={`flex items-center justify-between gap-2 min-h-[46px] px-3 py-2.5 rounded-[10px] border text-left cursor-pointer transition-colors ${
                              actif
                                ? "border-2 border-[#1f9d55] bg-[#e7f6ed] px-[11px] py-[9px]"
                                : "border border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          >
                            <span className="min-w-0">
                              <b className="block text-[13px] text-[#1f2937] truncate">
                                {s.nomTypeService}
                              </b>
                              {s.nomSite && (
                                <span className="block text-[11px] text-[#5b6472] truncate">
                                  {s.nomSite}
                                </span>
                              )}
                            </span>
                            {actif && (
                              <Check
                                className="h-4 w-4 shrink-0 text-[#1f9d55]"
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="cloture-motif" className={CHAMP_LABEL}>
                    Motif de réorientation{" "}
                    <span className="font-normal normal-case text-[#5b6472]">
                      (facultatif)
                    </span>
                  </label>
                  <textarea
                    id="cloture-motif"
                    rows={2}
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    disabled={enCours}
                    placeholder="Ex. : avis spécialisé après prise de tension"
                    className="w-full bg-white border border-[#e5e7eb] rounded-[10px] px-3 py-2 text-sm text-[#1f2937] resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa] disabled:text-[#5b6472]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-between shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Annuler
          </button>
          <button type="submit" disabled={!peutConfirmer || !encounterId} className={BTN_DANGER}>
            {enCours ? (
              <>
                <Clock className="h-4 w-4 animate-pulse" />
                Clôture…
              </>
            ) : orienter ? (
              <>
                <Check className="h-[18px] w-[18px]" strokeWidth={3} />
                {serviceChoisi
                  ? `Réorienter vers ${serviceChoisi.nomTypeService} et clôturer`
                  : "Réorienter et clôturer"}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Terminer les soins
              </>
            )}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default TiroirClotureSoins;