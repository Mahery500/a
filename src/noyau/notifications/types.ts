/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TypeNotification = "succes" | "erreur" | "avertissement" | "info";

export interface ElementNotification {
  id: string;
  type: TypeNotification;
  message: string;
  dureeMs?: number;
}

export interface ContexteNotificationsValeur {
  notificationActive: ElementNotification | null;
  notifier: (type: TypeNotification, message: string, dureeMs?: number) => void;
  succes: (message: string) => void;
  erreur: (message: string) => void;
  notifierSucces: (message: string) => void;
  notifierErreur: (message: string) => void;
  avertissement: (message: string) => void;
  info: (message: string) => void;
  fermer: () => void;
}
