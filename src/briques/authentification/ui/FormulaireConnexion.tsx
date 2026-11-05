/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useConnexion } from "../hooks/useConnexion";
import { UtilisateurConnecte } from "../modele/authentification.types";

export interface FormulaireConnexionProps {
  onConnexionReussie?: (utilisateur: UtilisateurConnecte) => void;
}

const classesChamp =
  "w-full rounded-xl border border-[#D2E6D6] bg-[#F7FBF8] py-3 pl-11 text-sm text-[#0E2F44] placeholder:text-[#0E2F44]/40 transition-colors " +
  "hover:border-[#A5D3AF] focus:border-[#2FA14A] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2FA14A]/20 disabled:cursor-not-allowed disabled:opacity-60";

export const FormulaireConnexion: React.FC<FormulaireConnexionProps> = ({
  onConnexionReussie,
}) => {
  const { identifiant, setIdentifiant, motDePasse, setMotDePasse, erreur, enCours, seConnecter } =
    useConnexion(onConnexionReussie);

  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const idIdentifiant = useId();
  const idMotDePasse = useId();

  return (
    <div className="w-full">
      {/* En-tête — taille réduite sur mobile, taille normale sur desktop */}
      <div className="mb-5 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#14532D]">
          Connexion au portail
        </h1>
        <p className="mt-1.5 text-sm text-[#0E2F44]/65">
          Saisissez vos identifiants pour accéder à votre espace.
        </p>
      </div>

      {/* Erreur */}
      {erreur && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="space-y-0.5">
            <span className="block text-sm font-semibold">Connexion impossible</span>
            <span className="block text-xs leading-relaxed">{erreur}</span>
          </div>
        </div>
      )}

      <form onSubmit={seConnecter} className="space-y-5">
        {/* Identifiant */}
        <div>
          <label
            htmlFor={idIdentifiant}
            className="mb-1.5 block text-sm font-medium text-[#0E2F44]"
          >
            Identifiant
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E7F3A]/70"
              aria-hidden="true"
            />
            <input
              id={idIdentifiant}
              name="identifiant"
              type="text"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              placeholder="ex : admin"
              required
              disabled={enCours}
              autoComplete="username"
              className={`${classesChamp} pr-4`}
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <label
            htmlFor={idMotDePasse}
            className="mb-1.5 block text-sm font-medium text-[#0E2F44]"
          >
            Mot de passe
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E7F3A]/70"
              aria-hidden="true"
            />
            <input
              id={idMotDePasse}
              name="motDePasse"
              type={motDePasseVisible ? "text" : "password"}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Votre mot de passe"
              required
              disabled={enCours}
              autoComplete="current-password"
              className={`${classesChamp} pr-12`}
            />
            <button
              type="button"
              onClick={() => setMotDePasseVisible((v) => !v)}
              disabled={enCours}
              aria-label={
                motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"
              }
              aria-pressed={motDePasseVisible}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[#0E2F44]/55 transition-colors hover:bg-[#2FA14A]/10 hover:text-[#1E7F3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2FA14A] disabled:cursor-not-allowed"
            >
              {motDePasseVisible ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={enCours}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E7F3A] py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(30,127,58,0.6)] transition-colors duration-200 hover:bg-[#176630] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2FA14A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enCours ? (
            <>
              <RefreshCw
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              <span>Connexion en cours…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Se connecter</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FormulaireConnexion;