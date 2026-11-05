// src/briques/allergies/ui/BadgesAllergie.tsx

import React from "react";
import {
  COULEURS_CRITICITE,
  COULEURS_SEVERITE,
  COULEURS_STATUT,
  COULEURS_VERIFICATION,
  type AllergieCriticalite,
  type AllergieStatut,
  type AllergieVerificationStatut,
  type SeveriteReaction,
} from "../modele/allergie.types";

const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap";

export const BadgeStatut: React.FC<{ statut: AllergieStatut }> = ({ statut }) => (
  <span className={`${BASE} ${COULEURS_STATUT[statut].chip}`}>
    {COULEURS_STATUT[statut].label}
  </span>
);

export const BadgeCriticalite: React.FC<{ valeur: AllergieCriticalite }> = ({
  valeur,
}) => (
  <span className={`${BASE} ${COULEURS_CRITICITE[valeur].chip}`}>
    {valeur === "high" && "⚠ "}
    {COULEURS_CRITICITE[valeur].label}
  </span>
);

export const BadgeSeverite: React.FC<{ valeur: SeveriteReaction }> = ({ valeur }) => (
  <span className={`${BASE} ${COULEURS_SEVERITE[valeur].chip}`}>
    {COULEURS_SEVERITE[valeur].label}
  </span>
);

export const BadgeVerification: React.FC<{ valeur: AllergieVerificationStatut }> = ({
  valeur,
}) => (
  <span className={`${BASE} ${COULEURS_VERIFICATION[valeur].chip}`}>
    {COULEURS_VERIFICATION[valeur].label}
  </span>
);