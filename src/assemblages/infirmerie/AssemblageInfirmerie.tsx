/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { ModeAffichage } from "@/cerveau/permissions";
import {
  PanneauInfirmerieFile,
  infirmerieFileApi,
  PriseEnChargeInfo,
} from "@/briques/infirmerie-file";
import { PanneauActes, actesApi } from "@/briques/actes-realisation";
import { PanneauInfirmerieHistorique } from "@/briques/infirmerie-historique";
import { PanneauInfirmerieTableauBord } from "@/briques/infirmerie-tableau-bord";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import {
  estConflitActesDemandes,
  extraireCodesActes,
} from "@/noyau/http/erreursCloture";
import { useAllergiesActives } from "@/briques/allergies";
// Adapte ce chemin à l'emplacement réel de ton fichier de configuration des espaces.
import { ECRAN_INFIRMERIE_DEFAUT } from "@/coquille/espaces.ts";

export interface AssemblageInfirmerieProps {
  siteActifId?: number | null;
  serviceActifId?: number | null;
  ongletParDefaut?: string;
  modes?: {
    tableauBord?: ModeAffichage;
    file?: ModeAffichage;
    soins?: ModeAffichage;
    historique?: ModeAffichage;
  };
  sousOngletActif?: string | null;
  onSousOngletChange?: (id: string) => void;
}

export interface PatientActifInfirmerie {
  patientId: number;
  encounterId: number;
  numTicket?: string;
  patientNom?: string;
  debut?: string;
  dureeMinutes?: number;
}

export const AssemblageInfirmerie: React.FC<AssemblageInfirmerieProps> = ({
  siteActifId,
  serviceActifId,
  ongletParDefaut = ECRAN_INFIRMERIE_DEFAUT,
  modes = {},
  sousOngletActif,
  onSousOngletChange,
}) => {
  const [ongletInterne, setOngletInterne] = useState(ongletParDefaut);
  const ongletActif = sousOngletActif ?? ongletInterne;

  const changerOnglet = (id: string) => {
    setOngletInterne(id);
    onSousOngletChange?.(id);
  };

  const [patientActif, setPatientActif] =
    useState<PatientActifInfirmerie | null>(null);
  const [clotureEnCours, setClotureEnCours] = useState(false);

  const { notifierSucces, notifierErreur } = useNotifier();

  // Allergies actives du patient en cours — passées à PanneauActes.
  const { libelles: allergiesPatient } = useAllergiesActives(
    patientActif?.patientId ?? null,
  );

  // NB : `modeTableauBord` est réservé pour un futur mode lecture/édition du panneau.
  const modeFile = modes.file ?? "edition";
  const modeSoins = modes.soins ?? "edition";
  const modeHistorique = modes.historique ?? "edition";

  const synchroniserPatientEnCours = useCallback(async () => {
    try {
      const enCours = await infirmerieFileApi.obtenirPatientEnCours();

      if (enCours?.enCours && enCours.patientId && enCours.encounterId) {
        setPatientActif({
          patientId: enCours.patientId,
          encounterId: enCours.encounterId,
          numTicket: enCours.numTicket || undefined,
          patientNom: enCours.patientNom || `Patient #${enCours.patientId}`,
          debut: enCours.debut || undefined,
          dureeMinutes: enCours.dureeMinutes || undefined,
        });
      } else {
        setPatientActif(null);
      }
    } catch {
      // Échec réseau : on ne touche PAS à l'état courant.
    }
  }, []);

  useEffect(() => {
    synchroniserPatientEnCours();

    const intervalle = setInterval(synchroniserPatientEnCours, 15000);

    return () => clearInterval(intervalle);
  }, [synchroniserPatientEnCours]);

  const handlePriseEnChargeSucces = (info: PriseEnChargeInfo) => {
    setPatientActif({
      patientId: info.patientId,
      encounterId: info.encounterId,
      numTicket: info.numTicket,
      patientNom: info.patientNom || `Patient #${info.patientId}`,
      debut: new Date().toISOString(),
      dureeMinutes: 0,
    });

    changerOnglet("soins");
  };

  // Clôture de la prise en charge (à brancher sur un bouton dans PanneauActes si besoin).
  const handleCloturerSoins = async () => {
    if (!patientActif?.encounterId) return;

    if (
      !window.confirm(
        `Confirmez-vous la fin de prise en charge pour ${
          patientActif.patientNom || "ce patient"
        } ?`,
      )
    ) {
      return;
    }

    setClotureEnCours(true);

    try {
      try {
        await actesApi.terminer(patientActif.encounterId, false);
      } catch (err: unknown) {
        if (estConflitActesDemandes(err)) {
          const codes = extraireCodesActes(extraireMessageErreur(err));
          const liste = codes.length > 0 ? `\n• ${codes.join("\n• ")}` : "";

          if (
            !window.confirm(
              `Il reste des actes demandés non réalisés :${liste}\n\nSouhaitez-vous forcer la clôture ?`,
            )
          ) {
            return;
          }

          await actesApi.terminer(patientActif.encounterId, true);
        } else {
          throw err;
        }
      }

      notifierSucces(
        "Prise en charge infirmerie clôturée avec succès. Le poste est libéré.",
      );

      setPatientActif(null);
      changerOnglet("file");
      await synchroniserPatientEnCours();
    } catch (err: unknown) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setClotureEnCours(false);
    }
  };

  return (
    <div className="space-y-6">
      {ongletActif === ECRAN_INFIRMERIE_DEFAUT && (
        <PanneauInfirmerieTableauBord
          siteActifId={siteActifId ?? undefined}
          onNaviguer={changerOnglet}
        />
      )}

      {ongletActif === "file" && (
        <PanneauInfirmerieFile
          mode={modeFile}
          siteActifId={siteActifId ?? undefined}
          patientEnCoursActif={patientActif}
          onPrendreEnChargeSucces={handlePriseEnChargeSucces}
          onOuvrirSoinsPatient={() => changerOnglet("soins")}
        />
      )}

      {ongletActif === "soins" && (
        <PanneauActes
          mode={modeSoins}
          encounterId={patientActif?.encounterId}
          patientId={patientActif?.patientId}
          patientNom={patientActif?.patientNom}
          ticketNumero={patientActif?.numTicket}
          dureeMinutes={
            patientActif?.debut
              ? Math.max(
                  0,
                  Math.floor(
                    (Date.now() - new Date(patientActif.debut).getTime()) /
                      60_000,
                  ),
                )
              : 0
          }
          allergies={allergiesPatient}
          serviceActuelId={serviceActifId}
          siteId={siteActifId}
        />
      )}

      {ongletActif === "historique" && (
        <PanneauInfirmerieHistorique
          mode={modeHistorique}
          patientIdFiltre={patientActif?.patientId}
        />
      )}
    </div>
  );
};

export default AssemblageInfirmerie;