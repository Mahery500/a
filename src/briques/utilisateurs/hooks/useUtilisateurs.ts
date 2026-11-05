/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { affectationsApi } from "@/briques/affectations/api/affectations.api";
import {
  UtilisateurCompte,
  NouveauCompteAdminInput,
  NouveauComptePersonnelInput,
  ModificationCompteInput,
} from "../modele/utilisateur.types";
import { utilisateursApi } from "../api/utilisateurs.api";

export function useUtilisateurs() {
  const notif = useNotifier();

  const [comptes, setComptes] = useState<UtilisateurCompte[]>([]);
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [recherche, setRecherche] = useState<string>("");
  const [filtreType, setFiltreType] = useState<"tous" | "personnel" | "admin">("tous");
  const [filtreStatut, setFiltreStatut] = useState<"tous" | "actifs" | "inactifs">("tous");
  const [filtreRole, setFiltreRole] = useState<string>("tous");

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const liste = await utilisateursApi.lister();
      setComptes(liste);
    } catch (err) {
      const msg = messageErreur(err, "Impossible de charger la liste des utilisateurs.");
      setErreur(msg);
      notif.erreur(msg);
    } finally {
      setChargement(false);
    }
  }, [notif]);

  useEffect(() => { recharger(); }, [recharger]);

  const comptesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return comptes.filter((c) => {
      if (filtreType === "admin" && c.typeCompte !== "admin") return false;
      if (filtreType === "personnel" && c.typeCompte !== "personnel") return false;
      if (filtreStatut === "actifs" && !c.actif) return false;
      if (filtreStatut === "inactifs" && c.actif) return false;
      if (filtreRole !== "tous" && !c.roles.includes(filtreRole)) return false;
      if (q) {
        return (
          c.nom.toLowerCase().includes(q) ||
          c.prenom.toLowerCase().includes(q) ||
          c.login.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.libelleRole.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [comptes, recherche, filtreType, filtreStatut, filtreRole]);

  const creerAdmin = useCallback(async (saisie: NouveauCompteAdminInput): Promise<boolean> => {
    try {
      const nouvelAdmin = await utilisateursApi.creerAdmin(saisie);
      setComptes((prev) =>
        [...prev, nouvelAdmin].sort((a, b) => (a.nom || a.login).localeCompare(b.nom || b.login, "fr")),
      );
      notif.succes(`Compte administrateur « ${nouvelAdmin.login} » créé avec succès.`);
      return true;
    } catch (err) {
      notif.erreur(messageErreur(err, "Échec de la création du compte administrateur."));
      return false;
    }
  }, [notif]);

  /**
   * Crée le compte du personnel puis, si `saisie.affectation` est fourni,
   * l'affectation correspondante.
   * L'ID à utiliser pour l'affectation est `nouveauStaff.idApi` (staff id) —
   * jamais `nouveauStaff.id` (qui est le user id, unique mais pas le bon
   * pour la table Affectation).
   */
  const creerPersonnel = useCallback(async (saisie: NouveauComptePersonnelInput): Promise<boolean> => {
    let nouveauStaff: UtilisateurCompte;

    try {
      nouveauStaff = await utilisateursApi.creerPersonnel(saisie);
    } catch (err) {
      notif.erreur(messageErreur(err, "Échec de la création du membre du personnel."));
      return false;
    }

    setComptes((prev) =>
      [...prev, nouveauStaff].sort((a, b) => (a.nom || a.login).localeCompare(b.nom || b.login, "fr")),
    );

    const nomComplet = `${nouveauStaff.prenom} ${nouveauStaff.nom}`.trim();

    if (!saisie.affectation) {
      notif.succes(`Membre du personnel ${nomComplet} enregistré.`);
      return true;
    }

    try {
      await affectationsApi.creer({
        staffId: nouveauStaff.idApi,
        serviceId: saisie.affectation.serviceId,
        dateDebut: saisie.affectation.dateDebut,
        dateFin: saisie.affectation.dateFin ?? null,
        estPrincipal: saisie.affectation.estPrincipal,
      });
      notif.succes(`Membre du personnel ${nomComplet} enregistré et affecté.`);
    } catch (err) {
      notif.succes(`Membre du personnel ${nomComplet} enregistré.`);
      notif.erreur(
        `${messageErreur(err, "L'affectation a échoué.")} Le compte est créé : ` +
          "vous pouvez l'affecter depuis sa fiche.",
      );
    }

    return true;
  }, [notif]);

  /**
   * @param compte Compte à modifier (fournit `idApi` et `typeCompte`).
   */
  const modifierCompte = useCallback(
    async (compte: UtilisateurCompte, saisie: ModificationCompteInput): Promise<boolean> => {
      try {
        const modifie = await utilisateursApi.modifier(compte.idApi, saisie, compte.typeCompte);
        setComptes((prev) =>
          prev.map((c) => (c.id === compte.id && c.typeCompte === compte.typeCompte
            ? { ...c, ...modifie, id: compte.id }
            : c)),
        );
        notif.succes(`Compte « ${modifie.login} » mis à jour avec succès.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la mise à jour du compte utilisateur."));
        return false;
      }
    },
    [notif],
  );

  const basculerStatut = useCallback(
    async (compte: UtilisateurCompte): Promise<boolean> => {
      const nouvelEtat = !compte.actif;
      try {
        await utilisateursApi.changerStatut(compte.idApi, nouvelEtat, compte.typeCompte);
        setComptes((prev) =>
          prev.map((c) =>
            c.id === compte.id && c.typeCompte === compte.typeCompte ? { ...c, actif: nouvelEtat } : c,
          ),
        );
        notif.info(
          nouvelEtat
            ? `Le compte « ${compte.login} » est désormais actif.`
            : `Le compte « ${compte.login} » a été désactivé.`,
        );
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Impossible de modifier le statut de ce compte."));
        return false;
      }
    },
    [notif],
  );

  const supprimerCompte = useCallback(
    async (compte: UtilisateurCompte): Promise<boolean> => {
      try {
        await utilisateursApi.supprimer(compte.idApi, compte.typeCompte);
        // Le backend ne supprime pas : il désactive (`POST /{users,staffs}/{id}/deactivate`).
        setComptes((prev) =>
          prev.map((c) =>
            c.id === compte.id && c.typeCompte === compte.typeCompte ? { ...c, actif: false } : c,
          ),
        );
        notif.succes(`Compte « ${compte.login} » désactivé.`);
        return true;
      } catch (err) {
        notif.erreur(messageErreur(err, "Échec de la désactivation du compte sur le serveur."));
        return false;
      }
    },
    [notif],
  );

  const stats = useMemo(() => {
    const total = comptes.length;
    const personnel = comptes.filter((c) => c.typeCompte === "personnel").length;
    const admins = comptes.filter((c) => c.typeCompte === "admin").length;
    const actifs = comptes.filter((c) => c.actif).length;
    const inactifs = total - actifs;
    return { total, personnel, admins, actifs, inactifs };
  }, [comptes]);

  return {
    comptes: comptesFiltres,
    comptesTous: comptes,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    filtreType,
    setFiltreType,
    filtreStatut,
    setFiltreStatut,
    filtreRole,
    setFiltreRole,
    recharger,
    creerAdmin,
    creerPersonnel,
    modifierCompte,
    basculerStatut,
    supprimerCompte,
  };
}