# Fiche Brique : Sites Médicaux (`sites`)

## 1. Rôle & Responsabilité
Gère les établissements et centres de soins du réseau ASINA : liste des sites avec filtrage rapide, création de nouveaux sites, modification des coordonnées (ville, adresse, téléphone, code) et suppression.

## 2. Permissions requises
- **Ressource** : `site`
- **Actions** :
  - `site:lire` : affichage des sites en mode consultation seule (`mode: 'lecture'`).
  - `site:ecrire` : activation des boutons de création, modification et suppression (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/sites` : Liste des sites (extraction de collection API Platform standard).
- `GET /api/sites/{id}` : Détail d'un site.
- `POST /api/sites` : Création avec `{ code, name, city, address, phone }`.
- `PUT /api/sites/{id}` : Mise à jour complète du site.
- `DELETE /api/sites/{id}` : Suppression d'un site.

## 4. Modèle métier
- `SiteHospitalier` : `{ id, code, nom, ville, adresse, telephone, actif, dateCreation }`.
- `NouveauSiteInput` : `{ code, nom, ville, adresse?, telephone? }`.
- `ModificationSiteInput` : `{ code?, nom?, ville?, adresse?, telephone?, actif? }`.

## 5. Composants UI
- `PanneauSites` : Composant d'entrée acceptant `{ mode: 'edition' | 'lecture' | 'masque' }`.
- `FormulaireSiteModale` : Fenêtre de saisie/mise à jour d'un site (champs vides à la création).

## 6. Audit Règle n°1
- Zéro valeur par défaut inventée : les champs de création sont vides (suppression de l'ancien `city: 'Antananarivo'` et de l'ancien calcul de `SITE-${Date.now()}`).
- Tout élément sans identifiant numérique valide (`id <= 0`) retourné par l'API est ignoré par le mapping.
- Aucun `|| 1` ou `?? 1`.
