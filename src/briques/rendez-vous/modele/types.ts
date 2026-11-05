/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatutRendezVous = 'PLANIFIE' | 'CONFIRME' | 'HONORE' | 'ANNULE' | 'ABSENT';

/** Un agenda réservable = un par staff (GET /api/agendas). */
export interface Agenda {
  id: number;
  staffId: number;
  staffNom: string;
  specialite?: string;
}

/** Créneau recalculé à chaque appel, jamais persisté. */
export interface CreneauDisponible {
  debut: string; // "2026-10-14T09:00:00" (heure locale du serveur)
  fin: string;
}

export interface NouveauRendezVous {
  patientId: number;
  agendaId: number;
  creneauDebut: string; // ISO, ex. "2026-10-27T09:00:00+03:00"
  creneauFin: string;
  commentaire?: string;
}
/**
 * Saisie d'agenda par la secrétaire / réception.
 * ⚠ Suppose POST /api/agendas et PUT /api/agendas/{id} à créer côté Symfony.
 */
export interface PlageHebdomadaire {
  jour: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = lundi
  heureDebut: string; // HH:mm
  heureFin: string;
}

export interface AgendaInput {
  staffId: number;
  dureeCreneauMinutes: number;
  plages: PlageHebdomadaire[];
}
/** Forme du modèle métier décrit dans FICHE.md. */
export interface RendezVous {
  id: number;
  dateRdv: string;
  dateAffichee: string;
  heureAffichee: string;
  statut: StatutRendezVous;
  commentaire?: string;
  patientId: number;
  patientNom?: string;
  patientMatricule?: string;
  encounterId?: number;
  actionnable?: boolean;
  estAujourdHui?: boolean;
}

export interface PatientOption {
  id: number;
  nom?: string;
  prenom?: string;
  matricule?: string;
}