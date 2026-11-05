/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ModeAffichage } from "@/cerveau/permissions";
import { PanneauUtilisateurs } from "@/briques/utilisateurs";
import { PanneauAffectations } from "@/briques/affectations";
import { PanneauSites } from "@/briques/sites";
import { PanneauServices } from "@/briques/services";
import { PanneauEntreprises } from "@/briques/entreprises";
import { PanneauCatalogueActes } from "@/briques/catalogue-actes";
import { PanneauObservationDefinitions } from "@/briques/observation-definitions";
import { PanneauDiagnosticDefinitions } from "@/briques/diagnostic-definitions";
import { PanneauTypeEncounters } from "@/briques/type-encounters";
import { PanneauCompetences } from "@/briques/competences-habilitations";
import { PanneauMatriceHabilitations } from "@/briques/matrice-habilitations";
import { PanneauReferentielAllergies } from "@/briques/allergies";
import { PanneauDashboardAdmin } from "@/briques/dashboard-admin";

export interface AssemblageAdministrationProps {
  siteActifId?: number | null;
  serviceActifId?: number | null;
  ongletParDefaut?: string;
  modes?: {
    utilisateurs?: ModeAffichage;
    affectations?: ModeAffichage;
    sites?: ModeAffichage;
    services?: ModeAffichage;
    entreprises?: ModeAffichage;
    catalogue?: ModeAffichage;
    observations?: ModeAffichage;
    diagnostics?: ModeAffichage;
    typeEncounters?: ModeAffichage;
    competences?: ModeAffichage;
    matrice?: ModeAffichage;
    allergiesRef?: ModeAffichage;
  };
  sousOngletActif?: string | null;
  onSousOngletChange?: (id: string) => void;
}

export const AssemblageAdministration: React.FC<
  AssemblageAdministrationProps
> = ({
  ongletParDefaut = "tableau-bord-admin",
  modes = {},
  sousOngletActif,
  onSousOngletChange,
}) => {
  const [ongletInterne, setOngletInterne] = useState(ongletParDefaut);
  const ongletActif = sousOngletActif ?? ongletInterne;

  const changerOnglet = (id: string) => {
    setOngletInterne(id);
    onSousOngletChange?.(id);
  };

  const modeUtilisateurs = modes.utilisateurs ?? "edition";
  const modeAffectations = modes.affectations ?? "edition";
  const modeSites = modes.sites ?? "edition";
  const modeServices = modes.services ?? "edition";
  const modeEntreprises = modes.entreprises ?? "edition";
  const modeCatalogue = modes.catalogue ?? "edition";
  const modeObservations = modes.observations ?? "edition";
  const modeDiagnostics = modes.diagnostics ?? "edition";
  const modeTypeEncounters = modes.typeEncounters ?? "edition";
  const modeCompetences = modes.competences ?? "edition";
  const modeMatrice = modes.matrice ?? "edition";
  const modeAllergiesRef = modes.allergiesRef ?? "edition";

  return (
    <div className="space-y-6">
      {ongletActif === "tableau-bord-admin" && <PanneauDashboardAdmin />}

      {ongletActif === "utilisateurs" && (
        <PanneauUtilisateurs mode={modeUtilisateurs} />
      )}

      {ongletActif === "affectations" && (
        <PanneauAffectations mode={modeAffectations} />
      )}

      {ongletActif === "sites" && <PanneauSites mode={modeSites} />}

      {ongletActif === "services" && <PanneauServices mode={modeServices} />}

      {ongletActif === "entreprises" && (
        <PanneauEntreprises mode={modeEntreprises} />
      )}

      {ongletActif === "catalogue" && (
        <PanneauCatalogueActes mode={modeCatalogue} />
      )}

      {ongletActif === "observations" && (
        <PanneauObservationDefinitions mode={modeObservations} />
      )}

      {ongletActif === "diagnostics" && (
        <PanneauDiagnosticDefinitions mode={modeDiagnostics} />
      )}

      {(ongletActif === "type-encounters" || ongletActif === "typeEncounters") && (
        <PanneauTypeEncounters mode={modeTypeEncounters} />
      )}

      {(ongletActif === "competences" ||
        ongletActif === "corps_medicaux" ||
        ongletActif === "specialites") && (
        <PanneauCompetences
          mode={modeCompetences}
          sousOngletActif={ongletActif === "competences" ? null : ongletActif}
          onSousOngletChange={onSousOngletChange}
        />
      )}

      {ongletActif === "matrice" && (
        <PanneauMatriceHabilitations mode={modeMatrice} />
      )}

      {(ongletActif === "allergies_ref" || ongletActif === "allergiesRef") && (
        <PanneauReferentielAllergies mode={modeAllergiesRef} />
      )}
    </div>
  );
};

export default AssemblageAdministration;