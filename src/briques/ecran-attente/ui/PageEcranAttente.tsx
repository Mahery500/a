/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AffichageEcranSalleAttente } from "./AffichageEcranSalleAttente";
import { obtenirJetonJwt, obtenirSiteActifId } from "@/noyau/http/session";

export const PageEcranAttente: React.FC = () => {
  const isAuthenticated = !!obtenirJetonJwt();
  const siteId = obtenirSiteActifId();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f6f8f7] text-[#1f2937] flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-lg font-bold text-[#0f1b3d]">Session requise</div>
          <p className="text-sm text-[#5b6472]">
            Connectez-vous d'abord sur le poste accueil, puis rechargez cette page.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-4 py-2 bg-[#1f9d55] hover:bg-[#14703c] rounded-lg text-xs font-bold transition text-white"
          >
            Aller à la connexion
          </a>
        </div>
      </div>
    );
  }

  if (!siteId) {
    return (
      <div className="min-h-screen bg-[#f6f8f7] text-[#1f2937] flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="text-lg font-bold text-[#0f1b3d]">Aucun site actif configuré</div>
          <p className="text-sm text-[#5b6472]">
            Sélectionnez un site dans l'en-tête de l'application principale avant d'ouvrir
            cet écran.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-4 py-2 bg-[#1f9d55] hover:bg-[#14703c] rounded-lg text-xs font-bold transition text-white"
          >
            Retourner à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return <AffichageEcranSalleAttente siteId={siteId} />;
};

export default PageEcranAttente;