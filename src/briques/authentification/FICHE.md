# Fiche Brique : Authentification (`authentification`)

## 1. Rôle & Responsabilité
Gère l'écran d'accueil et de connexion au SIH ASINA Medical, la vérification des identifiants auprès du backend Symfony via JWT (LexikJWTAuthenticationBundle), le stockage du jeton de session et la lecture du profil utilisateur via `/api/me`.

## 2. Permissions requises
- **Ressource** : `auth`
- **Actions** : Aucune permission préalable requise (écran public pré-connexion).
- **Mode d'entrée** : `{ mode: 'edition' }` (affiche le formulaire) ou `{ mode: 'masque' }` (rien).

## 3. Endpoints réels appelés
- `POST /api/login` : Authentification avec `{ identifier, password }` (ou `{ username, password }`).
  - Réponse attendue : `{ token, refreshToken, roles, role }`.
- `GET /api/me` : Profil de l'utilisateur connecté (source de vérité unique pour l'id, nom, prénom, siteId, serviceId).
- `POST /api/refresh` : Rafraîchissement automatique du token expiré avec `{ refreshToken }`.
- `POST /api/logout` : Invalidation du jeton avec `{ refreshToken }`.

## 4. Modèle métier
- `UtilisateurConnecte` : `{ id, identifiant, nom, prenom, roles, rolePrincipal, siteId, serviceId, jeton, jetonRefresh }`.

## 5. Composants UI
- `PanneauAuthentification` : Panneau plein écran (bannière de marque ASINA Medical + formulaire).
- `FormulaireConnexion` : Formulaire de saisie des identifiants avec gestion d'erreurs et indicateur de chargement.

## 6. Audit Règle n°1
- Zéro donnée locale ou simulée.
- Zéro identifiant ou rôle inventé. Si la réponse `/me` ne contient pas d'id numérique valide, le mapping renvoie `null` et lève une erreur.
