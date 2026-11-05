/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Carillon audio et synthèse vocale pour l'appel de tickets en salle d'attente.
 * Reprise du mécanisme audio Web standard de l'ancien code (audioChime.ts).
 */

export function jouerCarillonFile(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Note aiguë (A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // Note grave (D5 - 587.33Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 1.2);
  } catch (err) {
    console.debug("Carillon audio indisponible :", err);
  }
}

export function annoncerVocalementTicket(numeroTicket: string, libelleService: string): void {
  try {
    if (!("speechSynthesis" in window)) return;
    const epellation = numeroTicket.split("").join(" ");
    const texte = `Ticket ${epellation}, ${libelleService}`;
    const enonciation = new SpeechSynthesisUtterance(texte);
    enonciation.lang = "fr-FR";
    enonciation.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(enonciation);
  } catch (err) {
    console.debug("Annonce vocale indisponible :", err);
  }
}

const CLE_STOCKAGE_ANNONCE = "asina_dernier_ticket_appele";

export interface SignalAnnonceTicket {
  ticketId: number;
  numTicket: string;
  serviceLabel: string;
  at: number;
}

export function diffuserAnnonceTicket(signal: SignalAnnonceTicket): void {
  try {
    localStorage.setItem(CLE_STOCKAGE_ANNONCE, JSON.stringify(signal));
  } catch {
    // Ignore les erreurs de stockage
  }
}

export function abonnerAnnonceTicket(callback: (signal: SignalAnnonceTicket) => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === CLE_STOCKAGE_ANNONCE && event.newValue) {
      try {
        callback(JSON.parse(event.newValue));
      } catch {
        // Ignore les données corrompues
      }
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

// Alias de compatibilité
export const playQueueChime = jouerCarillonFile;
export const speakTicket = annoncerVocalementTicket;
export const broadcastAnnounce = diffuserAnnonceTicket;
export const subscribeAnnounce = abonnerAnnonceTicket;
export type AnnounceSignal = SignalAnnonceTicket;
