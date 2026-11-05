/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { useSession } from "@/cerveau/session";

export type ProfilStock = "admin" | "gestionnaire" | "responsable" | "dispensateur" | "aucun";

export interface PermissionsStock {
  profil: ProfilStock;
  libelleProfil: string;
  peutVoirNiveaux: boolean;
  peutDispenser: boolean;
  peutGererCommandes: boolean;
  peutGererAppro: boolean;
  peutGererTransferts: boolean;
  peutVoirMouvements: boolean;
  peutGererAjustements: boolean;
  peutVoirCatalogue: boolean;
  peutChangerSite: boolean;
}

type Regles = Omit<PermissionsStock, "profil" | "libelleProfil">;

const REGLES: Record<Exclude<ProfilStock, "aucun">, Regles> = {
  admin: {
    peutVoirNiveaux: true,
    peutDispenser: true,
    peutGererCommandes: true,
    peutGererAppro: true,
    peutGererTransferts: true,
    peutVoirMouvements: true,
    peutGererAjustements: true, // Inventaires & Ajustements : ADMIN UNIQUEMENT
    peutVoirCatalogue: true,
    peutChangerSite: true,
  },
  gestionnaire: {
    peutVoirNiveaux: true,
    peutDispenser: false,
    peutGererCommandes: true,
    peutGererAppro: true,
    peutGererTransferts: true,
    peutVoirMouvements: true,
    peutGererAjustements: false, // réservé à l'admin
    peutVoirCatalogue: true,
    peutChangerSite: true, // vue globale multi-sites
  },
  responsable: {
    peutVoirNiveaux: true,
    peutDispenser: false,
    peutGererCommandes: false,
    peutGererAppro: false,
    peutGererTransferts: false,
    peutVoirMouvements: true,
    peutGererAjustements: false, // réservé à l'admin
    peutVoirCatalogue: true,
    peutChangerSite: false, // verrouillé sur son site
  },
  dispensateur: {
    peutVoirNiveaux: true,
    peutDispenser: true,
    peutGererCommandes: false,
    peutGererAppro: false,
    peutGererTransferts: false,
    peutVoirMouvements: false,
    peutGererAjustements: false,
    peutVoirCatalogue: false,
    peutChangerSite: false, // verrouillé sur son site
  },
};

const LIBELLES: Record<ProfilStock, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire de stock",
  responsable: "Responsable de stock",
  dispensateur: "Dispensateur",
  aucun: "Aucun accès stock",
};

const AUCUN_DROIT: PermissionsStock = {
  profil: "aucun",
  libelleProfil: LIBELLES.aucun,
  peutVoirNiveaux: false,
  peutDispenser: false,
  peutGererCommandes: false,
  peutGererAppro: false,
  peutGererTransferts: false,
  peutVoirMouvements: false,
  peutGererAjustements: false,
  peutVoirCatalogue: false,
  peutChangerSite: false,
};

function detecterProfil(roles: string[]): ProfilStock {
  if (roles.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN")) return "admin";
  if (roles.includes("ROLE_GESTIONNAIRE_STOCK")) return "gestionnaire";
  if (roles.includes("ROLE_RESPONSABLE_STOCK")) return "responsable";
  if (roles.includes("ROLE_DISPENSATEUR")) return "dispensateur";
  return "aucun";
}

export function useStockPermissions(): PermissionsStock {
  const { utilisateur } = useSession();
  const roles = utilisateur?.roles ?? [];
  const signature = roles.slice().sort().join("|");

  return useMemo(() => {
    const profil = detecterProfil(roles);
    if (profil === "aucun") return AUCUN_DROIT;
    return {
      profil,
      libelleProfil: LIBELLES[profil],
      ...REGLES[profil],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}

export default useStockPermissions;