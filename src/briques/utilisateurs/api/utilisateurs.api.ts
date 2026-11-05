/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import { ErreurApi } from "@/noyau/http/erreurApi";
import {
  UtilisateurCompte,
  NouveauCompteAdminInput,
  NouveauComptePersonnelInput,
  ModificationCompteInput,
} from "../modele/utilisateur.types";
import { UserOutputApi, StaffOutputApi } from "./utilisateurs.contrats";
import {
  mapperUtilisateurDepuisApi,
  mapperAdminVersApi,
  mapperPersonnelVersApi,
  mapperModificationVersApi,
} from "./utilisateurs.mapping";

const PER_PAGE = 100;

export const utilisateursApi = {
  /**
   * Liste unifiée /staffs + /users.
   *
   * Correctif « admin affiché deux fois » :
   *  - un même login ne peut exister qu'une fois (contrainte UNIQUE en base) ;
   *  - on déduplique par login **après** la fusion, en gardant la version
   *    de /staffs qui porte `personnelMedical` ;
   *  - le mapper garantit `id` = user id (unique), ce qui supprime la
   *    collision « staff 1 / user 1 ».
   */
  lister: async (): Promise<UtilisateurCompte[]> => {
    const [reponseUsers, reponseStaffs] = await Promise.allSettled([
      clientHttp<unknown>("/users", { params: { limit: PER_PAGE } }),
      clientHttp<unknown>("/staffs", { params: { limit: PER_PAGE } }),
    ]);

    const elementsUsers =
      reponseUsers.status === "fulfilled"
        ? extraireElementsCollection<Record<string, unknown>>(reponseUsers.value)
        : [];

    const elementsStaffs =
      reponseStaffs.status === "fulfilled"
        ? extraireElementsCollection<Record<string, unknown>>(reponseStaffs.value)
        : [];

    // Index login → prenom/nom (fallback pour les admins sans nom)
    const indexStaffParLogin = new Map<string, { prenom: string; nom: string }>();
    for (const st of elementsStaffs) {
      const login = String(st.login ?? "").trim().toLowerCase();
      if (!login) continue;
      indexStaffParLogin.set(login, {
        prenom: String(st.firstName ?? st.prenom ?? "").trim(),
        nom: String(st.lastName ?? st.nom ?? "").trim().toUpperCase(),
      });
    }

    const comptes: UtilisateurCompte[] = [];
    const loginsDejaVus = new Set<string>();

    // 1er passage : /staffs (source de vérité pour personnelMedical)
    for (const st of elementsStaffs) {
      const login = String(st.login ?? "").trim().toLowerCase();
      if (!login || loginsDejaVus.has(login)) continue;
      loginsDejaVus.add(login);

      const compte = mapperUtilisateurDepuisApi(st, "personnel");
      if (compte) comptes.push(compte);
    }

    // 2e passage : /users pour les admins restants
    for (const u of elementsUsers) {
      const login = String(u.login ?? u.username ?? "").trim().toLowerCase();
      if (!login || loginsDejaVus.has(login)) continue;
      loginsDejaVus.add(login);

      const compte = mapperUtilisateurDepuisApi(u, "admin", indexStaffParLogin.get(login));
      if (compte) comptes.push(compte);
    }

    // Filet de sécurité : dédoublonner par login si le backend renvoie
    // plusieurs fois la même entrée (pagination, alias /companies etc.).
    const parLogin = new Map<string, UtilisateurCompte>();
    for (const c of comptes) {
      const cle = (c.login || `${c.typeCompte}#${c.id}`).toLowerCase();
      if (!parLogin.has(cle)) parLogin.set(cle, c);
    }

    return Array.from(parLogin.values()).sort((a, b) =>
      (a.nom || a.login).localeCompare(b.nom || b.login, "fr"),
    );
  },

  creerAdmin: async (saisie: NouveauCompteAdminInput): Promise<UtilisateurCompte> => {
    const payload = mapperAdminVersApi(saisie);
    const reponse = await clientHttp<UserOutputApi>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const compte = mapperUtilisateurDepuisApi(reponse, "admin");
    if (!compte) {
      throw new ErreurApi(500, "L'API a répondu sans identifiant valide pour l'administrateur créé.");
    }
    return compte;
  },

  creerPersonnel: async (saisie: NouveauComptePersonnelInput): Promise<UtilisateurCompte> => {
    const payload = mapperPersonnelVersApi(saisie);
    const reponse = await clientHttp<StaffOutputApi>("/staffs", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    let emailFinal = reponse.email ?? null;

    // Le CreateStaffRequest Symfony ne prend pas d'email : on l'ajoute via PATCH.
    // ⚠ on utilise reponse.id qui EST le staff id (retour du POST /staffs).
    if (saisie.email && saisie.email.trim()) {
      try {
        const patchReponse = await clientHttp<StaffOutputApi>(`/staffs/${reponse.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/merge-patch+json" },
          body: JSON.stringify({ email: saisie.email.trim() }),
        });
        emailFinal = patchReponse.email ?? saisie.email.trim();
      } catch (err) {
        console.warn("L'email n'a pas pu être associé immédiatement au profil :", err);
      }
    }

    const compte = mapperUtilisateurDepuisApi(
      { ...reponse, email: emailFinal },
      "personnel",
      { prenom: saisie.prenom, nom: saisie.nom, login: saisie.login },
    );
    if (!compte) {
      throw new ErreurApi(500, "L'API a répondu sans identifiant valide pour le membre du personnel créé.");
    }
    return compte;
  },

  /** @param idApi id à utiliser côté serveur (staff id ou user id, voir UtilisateurCompte). */
  modifier: async (
    idApi: number,
    saisie: ModificationCompteInput,
    typeCompte: "admin" | "personnel" = "admin",
  ): Promise<UtilisateurCompte> => {
    const payload = mapperModificationVersApi(saisie, typeCompte);
    const endpoint = typeCompte === "admin" ? `/users/${idApi}` : `/staffs/${idApi}`;
    const reponse = await clientHttp<UserOutputApi>(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/merge-patch+json" },
      body: JSON.stringify(payload),
    });
    const compte = mapperUtilisateurDepuisApi(
      reponse,
      typeCompte === "admin" ? "admin" : "personnel",
    );
    if (!compte) {
      throw new ErreurApi(500, "L'API a répondu sans identifiant valide lors de la mise à jour du compte.");
    }
    return compte;
  },

  /** @param idApi id à utiliser côté serveur (staff id ou user id). */
  changerStatut: async (
    idApi: number,
    actif: boolean,
    typeCompte: "admin" | "personnel" = "personnel",
  ): Promise<void> => {
    const action = actif ? "activate" : "deactivate";
    const endpointPrincipal =
      typeCompte === "admin" ? `/users/${idApi}/${action}` : `/staffs/${idApi}/${action}`;
    try {
      await clientHttp<void>(endpointPrincipal, { method: "POST" });
    } catch {
      const endpointSecondaire =
        typeCompte === "admin" ? `/staffs/${idApi}/${action}` : `/users/${idApi}/${action}`;
      await clientHttp<void>(endpointSecondaire, { method: "POST" });
    }
  },

  /** @param idApi id à utiliser côté serveur (staff id ou user id). */
  supprimer: async (
    idApi: number,
    typeCompte: "admin" | "personnel" = "admin",
  ): Promise<void> => {
    if (typeCompte === "personnel") {
      await clientHttp<void>(`/staffs/${idApi}/deactivate`, { method: "POST" });
    } else {
      await clientHttp<void>(`/users/${idApi}/deactivate`, { method: "POST" });
    }
  },
};

export default utilisateursApi;