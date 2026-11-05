/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitaires d'affichage textuel (titres, noms de personnes, rôles).
 */

export function texteOuTiret(valeur: string | null | undefined): string {
  if (!valeur || !valeur.trim()) {
    return "—";
  }
  return valeur.trim();
}

export function initialeAvatar(
  nom?: string | null,
  prenom?: string | null,
  identifiant?: string | null,
): string {
  if (prenom && prenom.trim()) {
    return prenom.trim()[0].toUpperCase();
  }
  if (nom && nom.trim()) {
    return nom.trim()[0].toUpperCase();
  }
  if (identifiant && identifiant.trim()) {
    return identifiant.trim()[0].toUpperCase();
  }
  return "—";
}

export function formaterNomUtilisateur(options: {
  nom?: string | null;
  prenom?: string | null;
  identifiant?: string | null;
  estMedecin?: boolean;
}): string {
  const { nom, prenom, identifiant, estMedecin } = options;
  const nomPropre = nom?.trim();
  const prenomPropre = prenom?.trim();

  let affichage: string;
  if (prenomPropre && nomPropre) {
    affichage = `${prenomPropre} ${nomPropre}`;
  } else if (nomPropre) {
    affichage = nomPropre;
  } else if (prenomPropre) {
    affichage = prenomPropre;
  } else if (identifiant?.trim()) {
    affichage = identifiant.trim();
  } else {
    return "Utilisateur";
  }

  return estMedecin ? `Dr. ${affichage}` : affichage;
}

export function formaterLibelleRole(codeRole?: string | null): string {
  if (!codeRole || !codeRole.trim()) {
    return "Utilisateur";
  }

  const correspondances: Record<string, string> = {
    ROLE_ADMIN: "Administrateur",
    ROLE_SUPER_ADMIN: "Super Administrateur",
    ROLE_GESTIONNAIRE_STOCK: "Gestionnaire de stock",
    ROLE_RESPONSABLE_STOCK: "Responsable de stock",
    ROLE_DISPENSATEUR: "Dispensateur",
    ROLE_MEDECIN: "Médecin",
    ROLE_INFIRMIER: "Infirmier",
    ROLE_RECEPTION: "Accueil",
    ROLE_SECRETAIRE: "Secrétaire Médicale",
    ROLE_USER: "Utilisateur",
  };

  const cle = codeRole.trim().toUpperCase();
  if (correspondances[cle]) {
    return correspondances[cle];
  }

  if (cle.startsWith("ROLE_")) {
    const sansPrefixe = cle.replace("ROLE_", "");
    if (correspondances[sansPrefixe]) {
      return correspondances[sansPrefixe];
    }
    return sansPrefixe.charAt(0) + sansPrefixe.slice(1).toLowerCase().replace(/_/g, " ");
  }

  return codeRole.trim();
}
