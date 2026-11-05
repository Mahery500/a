/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ModeAffichage } from '@/cerveau/permissions';
import { PanneauVerificationAdherents } from '@/briques/verification-adherents';
import { PanneauTicketsAccueil } from '@/briques/tickets-accueil';
import { PageRendezVous } from '@/briques/rendez-vous';
import { PanneauPatients } from '@/briques/patients';
import { AffichageEcranSalleAttente } from '@/briques/ecran-attente';
import { PanneauTableauBordAccueil } from '@/briques/tableau-bord-accueil';

export interface AssemblageAccueilProps {
  siteActifId?: number | null;
  serviceActifId?: number | null;
  ongletParDefaut?: string;
  modes?: {
    dashboard?: ModeAffichage;
    verification?: ModeAffichage;
    tickets?: ModeAffichage;
    rendezvous?: ModeAffichage;
    patients?: ModeAffichage;
  };
  sousOngletActif?: string | null;
  onSousOngletChange?: (id: string) => void;
}

export const AssemblageAccueil: React.FC<AssemblageAccueilProps> = ({
  siteActifId,
  ongletParDefaut = "dashboard",
  modes = {},
  sousOngletActif,
  onSousOngletChange,
}) => {
  const [ongletInterne, setOngletInterne] = useState(ongletParDefaut);
  const ongletActif = sousOngletActif ?? ongletInterne;

  const modeVerification = modes.verification ?? "edition";
  const modeTickets = modes.tickets ?? "edition";
  const modeRendezvous = modes.rendezvous ?? "edition";
  const modePatients = modes.patients ?? "edition";

  return (
    <div className="space-y-6">
      {ongletActif === "dashboard" && (
        <PanneauTableauBordAccueil siteId={siteActifId} />
      )}

      {ongletActif === "tickets" && (
        <PanneauTicketsAccueil mode={modeTickets} siteId={siteActifId ?? undefined} />
      )}

      {ongletActif === "verification" && (
        <PanneauVerificationAdherents mode={modeVerification} siteId={siteActifId ?? undefined} />
      )}

      {ongletActif === 'rendezvous' && (
        <PageRendezVous />
      )}

      {ongletActif === "patients" && <PanneauPatients mode={modePatients} />}

      {ongletActif === "ecran" &&
        (siteActifId ? (
          <AffichageEcranSalleAttente siteId={siteActifId} />
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            Veuillez sélectionner un site actif dans l’en-tête pour afficher l’écran de salle
            d’attente.
          </div>
        ))}
    </div>
  );
};

export default AssemblageAccueil;