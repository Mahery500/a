// src/briques/actes-realisation/ui/ModaleReorientationService.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import { servicesApi, ServiceMedical } from "@/briques/services";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export interface ModaleReorientationServiceProps {
  ouvert: boolean;
  encounterId: number | null;
  numTicket?: string;
  patientNom?: string;
  serviceActuelId?: number | null;
  siteId?: number | null;
  onFermer: () => void;
  onOrienter: (serviceId: number) => Promise<boolean>;
}

const CHAMP_LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";

export const ModaleReorientationService: React.FC<ModaleReorientationServiceProps> = ({
  ouvert,
  encounterId,
  numTicket,
  patientNom,
  serviceActuelId,
  siteId,
  onFermer,
  onOrienter,
}) => {
  const [services, setServices] = useState<ServiceMedical[]>([]);
  const [serviceSelectionne, setServiceSelectionne] = useState<number | null>(null);
  const [motif, setMotif] = useState("");
  const [chargement, setChargement] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    let annule = false;
    setChargement(true);
    setErreur(null);
    setMotif("");
    setServiceSelectionne(null);

    servicesApi
      .listerServices()
      .then((liste) => {
        if (annule) return;
        const filtres = siteId ? liste.filter((s) => s.siteId === siteId) : liste;
        const aConserver = filtres.length > 0 ? filtres : liste;
        setServices(aConserver.filter((s) => s.id !== serviceActuelId));
      })
      .catch((err) => !annule && setErreur(extraireMessageErreur(err)))
      .finally(() => !annule && setChargement(false));

    return () => {
      annule = true;
    };
  }, [ouvert, siteId, serviceActuelId]);

  const serviceChoisi = useMemo(
    () => services.find((s) => s.id === serviceSelectionne) ?? null,
    [services, serviceSelectionne],
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!serviceSelectionne || !encounterId) return;
    setEnCours(true);
    setErreur(null);
    try {
      const ok = await onOrienter(serviceSelectionne);
      if (ok) onFermer();
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  if (!ouvert) return null;

  const contexte = [
    numTicket,
    encounterId ? `Dossier #${encounterId}` : null,
    "champs obligatoires marqués d'une étoile",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      fermetureBloquee={enCours}
      libelle={`Réorienter le patient${numTicket ? ` · ${numTicket}` : ""}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold leading-tight truncate">
              Réorienter le patient
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5 truncate">{contexte}</p>
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
          {patientNom && (
            <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px] text-[13px]">
              <b className="text-[#1f2937]">{patientNom}</b>
            </div>
          )}

          {erreur && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs"
            >
              {erreur}
            </div>
          )}

          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mb-3">
              Service de destination
            </div>
            <label className={CHAMP_LABEL}>
              Service <span className="text-[#b42318]">*</span>
            </label>

            {chargement ? (
              <p className="text-[#5b6472] py-2 text-xs">Chargement des services…</p>
            ) : services.length === 0 ? (
              <p className="text-[#8a5300] bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] p-2.5 text-xs">
                Aucun service actif disponible sur ce site.
              </p>
            ) : (
              <div
                className="flex flex-col gap-2.5"
                role="radiogroup"
                aria-label="Service de destination"
              >
                {services.map((s) => {
                  const actif = serviceSelectionne === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      onClick={() => {
                        setServiceSelectionne(s.id);
                        setErreur(null);
                      }}
                      disabled={enCours}
                      className={`flex items-center justify-between gap-3 min-h-[52px] px-3.5 py-3 rounded-[10px] border text-left cursor-pointer transition-colors ${
                        actif
                          ? "border-2 border-[#1f9d55] bg-[#e7f6ed] px-[13px] py-[11px]"
                          : "border border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <span className="min-w-0">
                        <b className="block text-[14px] text-[#1f2937] truncate">
                          {s.nomTypeService}
                        </b>
                        {s.nomSite && (
                          <span className="block text-[12px] text-[#5b6472] truncate">
                            {s.nomSite}
                          </span>
                        )}
                      </span>
                      {actif && (
                        <Check className="h-4 w-4 shrink-0 text-[#1f9d55]" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mb-3">
              Motif
            </div>
            <label htmlFor="reorient-motif" className={CHAMP_LABEL}>
              Motif de réorientation{" "}
              <span className="font-normal normal-case text-[#5b6472]">(facultatif)</span>
            </label>
            <textarea
              id="reorient-motif"
              rows={3}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              disabled={enCours}
              placeholder="Ex. : avis spécialisé après prise de tension"
              className="w-full bg-white border border-[#e5e7eb] rounded-[10px] px-3 py-2 text-sm text-[#1f2937] resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa] disabled:text-[#5b6472]"
            />
          </div>

          <div className="bg-[#fff4e0] text-[#8a5300] rounded-[10px] px-3.5 py-3 text-[13px] leading-relaxed">
            <b>⚠ Choix définitif pour cette prise en charge.</b> Les soins en cours seront
            clôturés au moment de la réorientation.
          </div>
        </div>

        {/* Pied */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-between shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={enCours || !serviceSelectionne || !encounterId}
            className={BTN_PRIMAIRE}
          >
            <Check className="w-[18px] h-[18px]" strokeWidth={3} />
            {enCours
              ? "Réorientation…"
              : serviceChoisi
                ? `Réorienter vers ${serviceChoisi.nomTypeService}`
                : "Réorienter"}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default ModaleReorientationService;