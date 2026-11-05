/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ActeConstanteOption {
  id: number;
  code: string;
  libelle: string;
  categorieId: number;
  categorieLibelle?: string;
}

export interface ChampObservationMoule {
  observationId: number;
  code: string;
  libelle: string;
  typeValeur: "numerique" | "texte";
  unite: string | null;
  obligatoire: boolean;
  ordre: number;
}

export interface MesureObservation {
  id: number;
  observationDefinitionId?: number;
  code: string;
  libelle?: string;
  valeur: string;
  unite: string | null;
  interpretation: string | null;
  dateObservation?: string;
  statut?: string;
}

export interface SaisieObservationValeur {
  observationDefinitionId: number;
  valeur: string;
  interpretation?: string;
}

export interface SaisieConstantesInput {
  encounterId: number;
  acteDefinitionId: number;
  observations: SaisieObservationValeur[];
  commentaire?: string;
  marquerRealise?: boolean;
}

export interface AlerteVigilance {
  parametre: string;
  severite: "attention" | "critique";
  message: string;
}

export function evaluerAlertesCliniques(constantes: {
  ta?: string;
  temp?: string;
  fc?: string;
  spo2?: string;
}): AlerteVigilance[] {
  const alertes: AlerteVigilance[] = [];

  // SpO2
  if (constantes.spo2) {
    const val = parseFloat(constantes.spo2);
    if (!isNaN(val)) {
      if (val < 92) {
        alertes.push({
          parametre: "SpO2",
          severite: "critique",
          message: `Désaturation sévère (SpO2: ${val}%), oxygénothérapie urgente requise.`,
        });
      } else if (val < 95) {
        alertes.push({
          parametre: "SpO2",
          severite: "attention",
          message: `Saturation basse (SpO2: ${val}%). À surveiller.`,
        });
      }
    }
  }

  // Température
  if (constantes.temp) {
    const val = parseFloat(constantes.temp);
    if (!isNaN(val)) {
      if (val >= 39.5) {
        alertes.push({
          parametre: "Température",
          severite: "critique",
          message: `Hyperthermie majeure (${val}°C). Prévenir le médecin.`,
        });
      } else if (val >= 38.5) {
        alertes.push({
          parametre: "Température",
          severite: "attention",
          message: `État fébrile (${val}°C).`,
        });
      } else if (val < 35.5) {
        alertes.push({
          parametre: "Température",
          severite: "attention",
          message: `Hypothermie (${val}°C).`,
        });
      }
    }
  }

  // Fréquence cardiaque
  if (constantes.fc) {
    const val = parseFloat(constantes.fc);
    if (!isNaN(val)) {
      if (val > 120) {
        alertes.push({
          parametre: "Pouls",
          severite: "critique",
          message: `Tachycardie marquée (${val} bpm).`,
        });
      } else if (val < 50) {
        alertes.push({
          parametre: "Pouls",
          severite: "attention",
          message: `Bradycardie (${val} bpm).`,
        });
      }
    }
  }

  // Tension artérielle (ex "18/10", "180/100")
  if (constantes.ta) {
    const parties = constantes.ta.split(/[/,-]/).map((p) => parseFloat(p.trim()));
    if (parties.length >= 2 && !isNaN(parties[0]) && !isNaN(parties[1])) {
      const sys = parties[0];
      const dia = parties[1];
      const sysCorrigee = sys < 30 ? sys * 10 : sys;
      const diaCorrigee = dia < 30 ? dia * 10 : dia;

      if (sysCorrigee >= 180 || diaCorrigee >= 110) {
        alertes.push({
          parametre: "Tension",
          severite: "critique",
          message: `Suspicion de crise hypertensive (${constantes.ta} mmHg). Alerte médecin immédiate.`,
        });
      } else if (sysCorrigee <= 90 || diaCorrigee <= 60) {
        alertes.push({
          parametre: "Tension",
          severite: "attention",
          message: `Hypotension artérielle (${constantes.ta} mmHg).`,
        });
      }
    }
  }

  return alertes;
}
