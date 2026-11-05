# Fiche Brique : Utilisateurs & Accès (`utilisateurs`)

## 1. Rôle & Responsabilité
Gère les comptes d'accès à l'application, l'attribution des rôles Symfony, le cycle de vie des identifiants et l'activation des personnels :
- Création des comptes administrateurs (`POST /api/users` avec `ROLE_ADMIN`).
- Création des comptes du personnel soignant (`POST /api/staffs` avec rôles médicaux/paramédicaux).
- Modification des comptes (email, rôles, activation `isActive`) via `PUT /api/users/{id}`.
- Activation et désactivation en un clic des accès utilisateurs.
- Suppression définitive d'un compte via `DELETE /api/users/{id}`.

## 2. Permissions requises
- **Ressource** : `utilisateur`
- **Actions** :
  - `utilisateur:lire` : consultation de la liste des utilisateurs et filtres en mode lecture seule (`mode: 'lecture'`).
  - `utilisateur:ecrire` : activation des actions d'ajout, modification, activation/désactivation et suppression (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/users` : Liste des comptes d'accès avec rôles et statuts d'activation.
- `POST /api/users` : Création d'un compte administrateur avec `{ login, email, password }` (`ROLE_ADMIN`).
- `PATCH /api/users/{id}` : Mise à jour d'un compte utilisateur avec `{ email, isActive }`.
- `POST /api/users/{id}/activate` / `POST /api/users/{id}/deactivate` : Activation/désactivation directe de compte.
- `GET /api/staffs` : Liste des membres du personnel soignant.
- `POST /api/staffs` : Création d'un personnel soignant avec `{ prenom, nom, login, password, roles: [role] }`.
- `PATCH /api/staffs/{id}` : Mise à jour d'un profil soignant avec `{ email, roles }`.
- `POST /api/staffs/{id}/activate` / `POST /api/staffs/{id}/deactivate` : Activation/désactivation directe de soignant.
- `POST /api/staffs/{id}/reset-password` : Réinitialisation du mot de passe du soignant avec `{ newPassword }`.

## 4. Modèle métier
- `UtilisateurCompte` : `{ id, login, email, nom, prenom, roles, rolePrincipal, libelleRole, actif, typeCompte, dateCreation }`.
- `NouveauCompteAdminInput` : `{ type: 'admin', login, email, motDePasse }`.
- `NouveauComptePersonnelInput` : `{ type: 'personnel', prenom, nom, login, motDePasse, role, email?, telephone? }`.
- `ModificationCompteInput` : `{ email?, roles?, actif? }`.

## 5. Composants UI
- `PanneauUtilisateurs` : Panneau principal avec métriques globales, filtres par catégorie (Tous / Personnel / Admins), filtres par rôle et statut, recherche et tableau réactif.
- `FormulaireUtilisateurModale` : Fenêtre de création avec bascule Personnel / Administrateur, validation stricte de mot de passe (regex Symfony `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/`) et bouton de génération automatique.
- `FormulaireEditionUtilisateurModale` : Fenêtre de mise à jour d'un compte existant.
- `ModaleConfirmationSuppression` : Boîte de dialogue de confirmation sécurisée.

## 6. Audit Règle n°1
- Zéro mock, zéro valeur locale ou inventée (`Date.now()`, `|| 1`).
- Filtrage strict des identifiants valides (`id > 0`).
- Tous les rôles sont issus de la matrice officielle Symfony (`App\Auth\Security\Roles`).
