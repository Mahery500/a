/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { dossiersMedicauxApi } from "../api/dossier-medical.api";
import { PatientDossierResume, EncounterHistoriqueItem } from "../modele/dossier-medical.types";
import { extraireMessageErreur } from "@/noyau/utils/erreur";

export function useDossiersMedicaux(patientInitialId?: number | null) {
  const [patients, setPatients] = useState<PatientDossierResume[]>([]);
  const [patientSelectionne, setPatientSelectionne] = useState<PatientDossierResume | null>(null);
  const [encounters, setEncounters] = useState<EncounterHistoriqueItem[]>([]);
  const [chargementPatients, setChargementPatients] = useState(false);
  const [chargementDossier, setChargementDossier] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const chargerPatients = useCallback(async (terme?: string) => {
    setChargementPatients(true);
    setErreur(null);
    try {
      const res = await dossiersMedicauxApi.rechercherPatients(terme);
      setPatients(res);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargementPatients(false);
    }
  }, []);

  const selectionnerPatient = useCallback(async (patient: PatientDossierResume) => {
    setPatientSelectionne(patient);
    setChargementDossier(true);
    setErreur(null);
    try {
      const encs = await dossiersMedicauxApi.listerEncountersPatient(patient.id);
      setEncounters(encs);
    } catch (err) {
      setErreur(extraireMessageErreur(err));
    } finally {
      setChargementDossier(false);
    }
  }, []);

  useEffect(() => {
    chargerPatients();
  }, [chargerPatients]);

  useEffect(() => {
    if (patientInitialId) {
      dossiersMedicauxApi
        .obtenirPatient(patientInitialId)
        .then((p) => selectionnerPatient(p))
        .catch(() => {});
    }
  }, [patientInitialId, selectionnerPatient]);

  return {
    patients,
    patientSelectionne,
    encounters,
    chargementPatients,
    chargementDossier,
    erreur,
    rechercher: chargerPatients,
    selectionnerPatient,
  };
}
