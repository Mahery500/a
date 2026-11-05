// src/briques/actes-realisation/ui/PanneauActes.tsx
import React, { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { actesApi } from "../api/actes.api";
import { ActeEnregistre } from "../modele/acte.types";
import { SelecteurActe } from "./SelecteurActe";
import { ModaleReorientationService } from "./ModaleReorientationService";

export interface PanneauActesProps {
  mode?: ModeAffichage;
  encounterId?: number | null;
  patientId?: number | null;
  patientNom?: string;
  ticketNumero?: string;
  dureeMinutes?: number;
  allergies?: string[];
  serviceActuelId?: number | null;
  siteId?: number | null;
  filtreCategorieCodes?: string[];
  onEnregistre?: (acte: ActeEnregistre) => void;
}

export const PanneauActes: React.FC<PanneauActesProps> = ({
  mode = "edition",
  encounterId,
  patientId,
  patientNom,
  ticketNumero,
  dureeMinutes = 0,
  allergies,
  serviceActuelId,
  siteId,
  filtreCategorieCodes,
  onEnregistre,
}) => {
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const { notifierSucces, notifierErreur } = useNotifier();

  const selecteur = (
    <SelecteurActe
      mode={mode}
      encounterId={encounterId}
      patientId={patientId}
      filtreCategorieCodes={filtreCategorieCodes}
      onEnregistre={onEnregistre}
    />
  );

  if (!encounterId || mode !== "edition") return selecteur;

  const orienter = async (serviceId: number): Promise<boolean> => {
    try {
      await actesApi.orienter(encounterId, serviceId);
      notifierSucces("Patient réorienté. Il apparaîtra dans la file du service destinataire.");
      return true;
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
      return false;
    }
  };

  const aDesAllergies = allergies !== undefined && allergies.length > 0;

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* === En-tête de page (maquette : h1 + sous-titre + bouton Réorienter) === */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight">Actes et soins</h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Enregistrer les actes réalisés pour le patient pris en charge.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModaleOuverte(true)}
          className="h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition-colors shrink-0"
          title="Orienter le patient vers un autre service sans clôturer la prise en charge"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Réorienter vers un service
        </button>
      </div>

      {/* === Bandeau patient vert (maquette) === */}
      <div className="bg-[#e7f6ed] border border-[#1f9d55] rounded-[14px] px-5 py-3 flex flex-wrap items-center gap-3.5">
        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#1f9d55] text-white shrink-0">
          Consultation en cours
        </span>
        {ticketNumero && (
          <span className="font-mono text-[12px] font-bold bg-white text-[#14703c] border border-[#1f9d55]/40 rounded-md px-[7px] py-[3px]">
            {ticketNumero}
          </span>
        )}
        <b className="text-[16px] text-[#14703c] flex-1 min-w-0 truncate">
          {patientNom || "Patient"}
        </b>
        <span className="text-[13px] text-[#14703c]/90 whitespace-nowrap">
          Dossier #{encounterId} · pris en charge il y a {dureeMinutes} min
        </span>
        {allergies !== undefined && (
          <span
            className={`text-[12px] font-semibold px-3 py-2 rounded-[10px] ${
              aDesAllergies
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-[#fff4e0] text-[#8a5300]"
            }`}
          >
            {aDesAllergies
              ? `⚠ Allergies : ${allergies!.join(", ")}`
              : "⚠ Allergies non renseignées"}
          </span>
        )}
      </div>

      {selecteur}

      <ModaleReorientationService
        ouvert={modaleOuverte}
        encounterId={encounterId}
        numTicket={ticketNumero}
        patientNom={patientNom}
        serviceActuelId={serviceActuelId}
        siteId={siteId}
        onFermer={() => setModaleOuverte(false)}
        onOrienter={orienter}
      />
    </div>
  );
};

export default PanneauActes;