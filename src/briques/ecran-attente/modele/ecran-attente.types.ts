/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TicketAppele {
  id: number;
  ticketId: number;
  numTicket: string;
  patientNom?: string;
  serviceNom: string;
  serviceId: number;
  heureAffichee: string;
}

export interface EtatEcranSalleAttente {
  dernierAppele: TicketAppele | null;
  enCours: TicketAppele[];
  enAttente: TicketAppele[];
}
