/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SiteHospitalier, NouveauSiteInput, ModificationSiteInput } from "../modele/site.types";
import { SiteInputApi, SiteOutputApi } from "./sites.contrats";

/**
 * Mappe un objet renvoyé par l'API Symfony vers le modèle pur SiteHospitalier.
 * Règle n°1 : Renvoie null si aucun identifiant numérique valide (> 0) n'est présent.
 */
export function mapperSite(brut: unknown): SiteHospitalier | null {
  if (!brut || typeof brut !== "object") {
    return null;
  }

  const obj = brut as Record<string, unknown>;
  const idBrut = obj.id ?? obj.Id_Site;
  const idNum = typeof idBrut === "number" ? idBrut : Number(idBrut);

  if (!Number.isFinite(idNum) || idNum <= 0) {
    return null;
  }

  const nom = String(obj.name ?? obj.Libelle ?? obj.libelle ?? "").trim();
  const code = String(obj.code ?? "").trim();
  const ville = String(obj.city ?? "").trim();
  const adresse = typeof obj.address === "string" ? obj.address.trim() : "";
  const telephone = typeof obj.phone === "string" ? obj.phone.trim() : "";
  const actif = typeof obj.isActive === "boolean" ? obj.isActive : true;
  const dateCreation = typeof obj.createdAt === "string" ? obj.createdAt : undefined;

  return {
    id: idNum,
    code,
    nom,
    ville,
    adresse,
    telephone,
    actif,
    dateCreation,
  };
}

/**
 * Mappe la saisie utilisateur vers le contrat attendu par l'API Symfony.
 */
export function mapperVersApi(saisie: NouveauSiteInput | ModificationSiteInput): SiteInputApi {
  return {
    code: (saisie.code ?? "").trim(),
    name: (saisie.nom ?? "").trim(),
    city: (saisie.ville ?? "").trim(),
    address: saisie.adresse?.trim() ? saisie.adresse.trim() : null,
    phone: saisie.telephone?.trim() ? saisie.telephone.trim() : null,
  };
}
