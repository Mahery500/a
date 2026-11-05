/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import {
  Shield,
  Volume2,
  Maximize2,
  Minimize2,
  Clock,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useEcranAttente } from "../hooks/useEcranAttente";
import { jouerCarillonFile } from "@/noyau/utils/carillon";

export interface AffichageEcranSalleAttenteProps {
  siteId: number;
}

/** Délai sans mise à jour avant de signaler une connexion interrompue. */
const SEUIL_OFFLINE_MS = 45_000;

export const AffichageEcranSalleAttente: React.FC<AffichageEcranSalleAttenteProps> = ({
  siteId,
}) => {
  const {
    appeles,
    enAttente,
    dernierAppele,
    heureCourante,
    dateCourante,
    chargement,
  } = useEcranAttente(siteId);

  const [estPleinEcran, setEstPleinEcran] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(() => Date.now());
  const [now, setNow] = useState<number>(() => Date.now());

  /* ---------- Détection d'une connexion perdue ----------
   * Chaque poll réussi remplace `appeles` et `enAttente` par de nouveaux
   * tableaux (le hook fait toujours `.map()`), ce qui déclenche l'effet.
   * Si aucun effet ne se déclenche pendant 45 s, c'est que le poll échoue. */
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [appeles, enAttente]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const offline = !chargement && now - lastUpdate > SEUIL_OFFLINE_MS;

  /* ---------- Dérivés ---------- */
  const appelsPrecedents = appeles.slice(1, 4); // 3 derniers au maximum
  const prochains = enAttente.slice(0, 5); // 5 prochains au maximum

  const heurePerte = new Date(lastUpdate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* ---------- Actions ---------- */
  const basculerPleinEcran = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setEstPleinEcran(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setEstPleinEcran(false))
        .catch(() => {});
    }
  };

  const testerSon = () => {
    jouerCarillonFile();
  };

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#1f2937] flex flex-col select-none">
      {/* ===================== En-tête ===================== */}
      <header className="h-16 bg-white border-b border-[#e5e7eb] px-6 flex items-center gap-3.5 shrink-0">
        <div className="w-[38px] h-[38px] rounded-[10px] bg-[#1f9d55] grid place-items-center shrink-0">
          <Shield className="w-[22px] h-[22px] text-white" strokeWidth={2} />
        </div>

        <div className="min-w-0">
          <h1 className="text-[19px] font-bold leading-tight flex items-center gap-2 flex-wrap">
            <span className="truncate">ASINA Santé au Travail</span>
            <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#e7f6ed] text-[#14703c] whitespace-nowrap">
              Salle d'attente
            </span>
          </h1>
          <p className="text-[12px] text-[#5b6472]">
            Appel numéroté et orientation médicale
          </p>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold text-[#5b6472] mr-1">
            <Volume2 className="w-4 h-4" />
            Son activé
          </div>
          <button
            type="button"
            onClick={testerSon}
            className="p-2 rounded-lg text-[#5b6472] hover:text-[#14703c] hover:bg-[#fafbfa] transition cursor-pointer"
            title="Tester le carillon audio"
            aria-label="Tester le carillon audio"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={basculerPleinEcran}
            className="p-2 rounded-lg text-[#5b6472] hover:text-[#14703c] hover:bg-[#fafbfa] transition cursor-pointer"
            title="Basculer en plein écran"
            aria-label={estPleinEcran ? "Quitter le plein écran" : "Passer en plein écran"}
          >
            {estPleinEcran ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="text-right pl-[18px] border-l border-[#e5e7eb] shrink-0">
          <div className="font-mono font-bold text-[30px] leading-none tracking-[0.05em] text-[#0f1b3d] tabular-nums">
            {heureCourante}
          </div>
          <div className="text-[12px] text-[#5b6472] mt-[3px] capitalize">
            {dateCourante}
          </div>
        </div>
      </header>

      {/* ===================== Bandeau hors-ligne ===================== */}
      {offline && (
        <div
          role="alert"
          className="bg-[#fff4e0] text-[#8a5300] border-b border-[#f1d29a] px-6 py-3 font-bold text-[15px] flex items-center gap-2 shrink-0"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            Connexion interrompue depuis {heurePerte}. Les informations peuvent être
            dépassées : adressez-vous à l'accueil.
          </span>
        </div>
      )}

      {/* ===================== Corps ===================== */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4 p-5 max-w-[1500px] w-full mx-auto">
        {/* ---------- Colonne gauche : Appelés maintenant ---------- */}
        <section
          className="bg-white border border-[#e5e7eb] rounded-[14px] p-5 sm:p-6 flex flex-col"
          aria-live="polite"
        >
          <h2 className="text-[19px] font-bold flex items-center gap-2.5 mb-3 text-[#0f1b3d]">
            Appelés maintenant
            <span className="ml-auto text-[13px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-full px-3 py-0.5 tabular-nums">
              {appeles.length}
            </span>
          </h2>

          {dernierAppele ? (
            <>
              {/* Carte du dernier appelé */}
              <div className="border-2 border-[#1f9d55] bg-[#e7f6ed] rounded-[14px] p-5 sm:p-7 grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-9 items-center">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[#5b6472] mb-1">
                    Ticket
                  </div>
                  <div className="font-mono font-bold text-[clamp(64px,8vw,128px)] leading-none text-[#0f1b3d] tracking-tight">
                    {dernierAppele.numTicket}
                  </div>
                </div>

                <div className="border-l border-[#b9dcc7] pl-6 sm:pl-9 min-w-0">
                  <div className="text-[13px] font-bold text-[#5b6472] mb-1">
                    Rendez-vous à
                  </div>
                  <div className="text-[clamp(26px,3vw,46px)] font-bold leading-[1.1] text-[#0f1b3d] flex items-center gap-3">
                    <ArrowRight
                      className="w-8 h-8 sm:w-10 sm:h-10 text-[#1f9d55] shrink-0"
                      strokeWidth={2.6}
                    />
                    <span className="truncate">{dernierAppele.serviceNom}</span>
                  </div>

                  {dernierAppele.heureAffichee && (
                    <div className="text-[18px] sm:text-[20px] text-[#5b6472] mt-1.5">
                      Appelé à {dernierAppele.heureAffichee}
                    </div>
                  )}

                  <span className="inline-block text-[15px] font-bold px-3.5 py-[5px] rounded-full mt-3.5 bg-white text-[#14703c] border border-[#1f9d55]">
                    ● Nouvel appel
                  </span>
                </div>
              </div>

              {/* Appels précédents */}
              {appelsPrecedents.length > 0 && (
                <>
                  <div className="text-[13px] font-bold text-[#5b6472] mt-5 mb-1">
                    Appels précédents
                  </div>
                  {appelsPrecedents.map((t) => (
                    <div
                      key={t.id}
                      className="grid grid-cols-[130px_1fr] sm:grid-cols-[150px_1fr] gap-4 sm:gap-[18px] items-center min-h-[64px] sm:min-h-[72px] border-t border-[#f0f2f1] text-[20px] sm:text-[26px] font-bold text-[#0f1b3d]"
                    >
                      <span className="font-mono text-[22px] sm:text-[28px] bg-[#e7f6ed] text-[#14703c] rounded-lg px-3 py-1 justify-self-start">
                        {t.numTicket}
                      </span>
                      <span className="truncate">{t.serviceNom}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            /* État vide */
            <div className="m-auto text-center p-6 sm:p-10">
              <Clock
                className="w-14 h-14 sm:w-16 sm:h-16 text-[#5b6472] mx-auto"
                strokeWidth={1.6}
              />
              <b className="block text-[24px] sm:text-[30px] mt-3.5 mb-2 text-[#0f1b3d]">
                En attente d'appel
              </b>
              <span className="text-[16px] sm:text-[19px] text-[#5b6472] max-w-md block mx-auto">
                Votre numéro s'affichera ici dès que le soignant vous appelle.
              </span>
            </div>
          )}
        </section>

        {/* ---------- Colonne droite : Prochains passages ---------- */}
        <section className="bg-white border border-[#e5e7eb] rounded-[14px] p-5 sm:p-6 flex flex-col">
          <h2 className="text-[19px] font-bold flex items-center gap-2.5 mb-3 text-[#0f1b3d]">
            Prochains passages
            <span className="ml-auto text-[13px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-full px-3 py-0.5 tabular-nums">
              {enAttente.length}
            </span>
          </h2>

          {prochains.length === 0 ? (
            <div className="m-auto text-[#5b6472] text-center text-[15px] sm:text-[17px] px-4">
              Aucun patient en attente pour le moment.
            </div>
          ) : (
            prochains.map((t, i) => (
              <div
                key={t.id}
                className={`grid grid-cols-[96px_1fr_auto] sm:grid-cols-[104px_1fr_auto] gap-3 sm:gap-3.5 items-center min-h-[58px] sm:min-h-[68px] text-[16px] sm:text-[20px] ${
                  i === 0
                    ? "bg-[#e7f6ed] rounded-[10px] px-2.5 py-2 border border-[#1f9d55] mb-1.5"
                    : "border-t border-[#f0f2f1]"
                }`}
              >
                <span
                  className={`font-mono text-[20px] sm:text-[24px] rounded-lg px-2 py-[3px] justify-self-start ${
                    i === 0
                      ? "bg-white text-[#14703c]"
                      : "bg-[#e7f6ed] text-[#14703c]"
                  }`}
                >
                  {t.numTicket}
                </span>

                <span className="min-w-0">
                  <span className="truncate block text-[#0f1b3d]">
                    {t.serviceNom}
                  </span>
                  {i === 0 && (
                    <span className="block text-[12px] sm:text-[14px] text-[#14703c] font-normal">
                      Prochain : préparez votre pièce d'identité
                    </span>
                  )}
                </span>

                <span
                  className={`font-bold text-[15px] sm:text-[18px] whitespace-nowrap tabular-nums ${
                    i === 0 ? "text-[#14703c]" : "text-[#5b6472]"
                  }`}
                >
                  {t.heureAffichee}
                </span>
              </div>
            ))
          )}
        </section>
      </main>

      {/* ===================== Pied de page ===================== */}
      <footer className="flex justify-between gap-5 px-6 py-3 bg-white border-t border-[#e5e7eb] text-[13px] sm:text-[15px] text-[#5b6472] shrink-0">
        <span className="truncate">
          Gardez votre ticket en main et préparez votre pièce d'identité ou votre badge
          employeur.
        </span>
        <span className="whitespace-nowrap hidden sm:inline">
          ASINA SIH · Système sécurisé
        </span>
      </footer>
    </div>
  );
};

export default AffichageEcranSalleAttente;