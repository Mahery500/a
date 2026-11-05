/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { ModeAffichage } from "@/cerveau/permissions";
import { PanneauConsultationFile, consultationFileApi } from "@/briques/consultation-file";
import { PanneauConsultationActive } from "@/briques/consultation-active";
import { PanneauDossiersMedicaux } from "@/briques/dossiers-medicaux";
import { PanneauConsultationTableauBord } from "@/briques/consultation-tableau-bord";
// Même chemin que celui utilisé dans AssemblageInfirmerie.
import { ECRAN_CONSULTATION_DEFAUT } from "@/coquille/espaces.ts";

export interface AssemblageConsultationProps {
  siteActifId?: number | null;
  serviceActifId?: number | null;
  ongletParDefaut?: string;
  modes?: {
    tableauBord?: ModeAffichage;
    file?: ModeAffichage;
    active?: ModeAffichage;
    dossiers?: ModeAffichage;
  };
  sousOngletActif?: string | null;
  onSousOngletChange?: (id: string) => void;
}

const CLE_STOCKAGE_CONSULTATION = "asina_consultation_patient_actif";

export const AssemblageConsultation: React.FC<AssemblageConsultationProps> = ({
  siteActifId,
  ongletParDefaut = ECRAN_CONSULTATION_DEFAUT,
  modes = {},
  sousOngletActif,
  onSousOngletChange,
}) => {
  // État interne : sert de repli quand le parent ne pilote pas l'onglet
  const [ongletInterne, setOngletInterne] = useState(ongletParDefaut);

  // L'onglet effectif : la prop parente est prioritaire sur l'état interne
  const ongletActif = sousOngletActif ?? ongletInterne;

  const [consultationEnCours, setConsultationEnCours] = useState<{
    patientId?: number;
    encounterId?: number;
    numTicket?: string;
    patientNom?: string;
  } | null>(() => {
    try {
      const sauve = localStorage.getItem(CLE_STOCKAGE_CONSULTATION);
      return sauve ? JSON.parse(sauve) : null;
    } catch {
      return null;
    }
  });

  // Handler unique : met à jour l'état interne ET notifie le parent
  const changerOnglet = (id: string) => {
    setOngletInterne(id);
    onSousOngletChange?.(id);
  };

  const modeFile = modes.file ?? "edition";
  const modeActive = modes.active ?? "edition";
  const modeDossiers = modes.dossiers ?? "edition";

  // Synchronisation avec l'état réel backend du médecin connecté (GET /api/me/patient_en_cours)
  const synchroniserConsultationEnCours = useCallback(async () => {
    try {
      const enCours = await consultationFileApi.obtenirPatientEnCours();
      if (enCours?.enCours && enCours.patientId && enCours.encounterId) {
        const maj = {
          patientId: enCours.patientId,
          encounterId: enCours.encounterId,
          numTicket: enCours.numTicket ?? undefined,
          patientNom: enCours.patientNom ?? undefined,
        };
        setConsultationEnCours(maj);
        try {
          localStorage.setItem(CLE_STOCKAGE_CONSULTATION, JSON.stringify(maj));
        } catch {
          // ignore
        }
      } else {
        // Le serveur dit explicitement : plus personne (clôture locale OU externe)
        setConsultationEnCours(null);
        try {
          localStorage.removeItem(CLE_STOCKAGE_CONSULTATION);
        } catch {
          // ignore
        }
      }
    } catch {
      // Ignorer si non connecté — on conserve l'état local courant
    }
  }, []);

  useEffect(() => {
    synchroniserConsultationEnCours();
    const intervalle = setInterval(synchroniserConsultationEnCours, 15000);
    return () => clearInterval(intervalle);
  }, [synchroniserConsultationEnCours]);

  const handlePriseEnChargeSucces = (patientId: number, encounterId?: number) => {
    const nouveau = { patientId, encounterId };
    setConsultationEnCours(nouveau);
    try {
      localStorage.setItem(CLE_STOCKAGE_CONSULTATION, JSON.stringify(nouveau));
    } catch {
      // ignore
    }
    changerOnglet("active"); // ← remonte aussi vers la sidebar
  };

  const handleConsultationTerminee = () => {
    try {
      localStorage.removeItem(CLE_STOCKAGE_CONSULTATION);
    } catch {
      // ignore
    }
    setConsultationEnCours(null);
    changerOnglet("file"); // ← remonte aussi vers la sidebar
    synchroniserConsultationEnCours();
  };

  return (
    <div className="space-y-6">
      {ongletActif === ECRAN_CONSULTATION_DEFAUT && (
        <PanneauConsultationTableauBord
          siteActifId={siteActifId ?? undefined}
          consultationEnCours={consultationEnCours}
          onNaviguer={changerOnglet}
        />
      )}

      {ongletActif === "file" && (
        <PanneauConsultationFile
          mode={modeFile}
          siteActifId={siteActifId ?? undefined}
          consultationEnCours={consultationEnCours}
          onPriseEnChargeSucces={undefined}
          onPrendreEnChargeSucces={handlePriseEnChargeSucces}
          onOuvrirConsultation={() => changerOnglet("active")}
          onVoirDossier={() => changerOnglet("dossiers")}
        />
      )}

      {ongletActif === "active" && (
        <PanneauConsultationActive
          mode={modeActive}
          encounterId={consultationEnCours?.encounterId}
          patientId={consultationEnCours?.patientId}
          patientNom={consultationEnCours?.patientNom}
          ticketNumero={consultationEnCours?.numTicket}
          onConsultationTerminee={handleConsultationTerminee}
        />
      )}

      {ongletActif === "dossiers" && (
        <PanneauDossiersMedicaux
          mode={modeDossiers}
          patientIdFiltre={consultationEnCours?.patientId}
        />
      )}
    </div>
  );
};

export default AssemblageConsultation;