# Fiche Brique : Services Médicaux (`services`)

## 1. Rôle & Responsabilité
Gère les types de services/spécialités médicales (`/type-services`) et leur rattachement effectif aux établissements de soins (`/services`) : consultation par sous-onglets, création, modification et détachement d'un service.

## 2. Permissions requises
- **Ressource** : `service`
- **Actions** :
  - `service:lire` : affichage des services et types en mode consultation seule (`mode: 'lecture'`).
  - `service:ecrire` : activation des boutons de création, modification et suppression (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/services` : Liste des services déployés par site.
- `GET /api/services/{id}` : Détail d'un service.
- `POST /api/services` : Rattachement d'un service avec `{ siteId, typeServiceId, description }`.
- `PUT /api/services/{id}` : Modification d'un service rattaché.
- `DELETE /api/services/{id}` : Détachement d'un service.
- `GET /api/type-services` : Référentiel des types de spécialités médicales.
- `POST /api/type-services` : Création d'un type avec `{ code, name, description }`.
- `PUT /api/type-services/{id}` : Mise à jour d'un type.
- `DELETE /api/type-services/{id}` : Suppression d'un type.
- `GET /api/sites` : Récupération des sites disponibles pour la sélection sans import direct d'autre brique.

## 4. Modèle métier
- `ServiceMedical` : `{ id, siteId, nomSite, typeServiceId, nomTypeService, description, actif, dateCreation }`.
- `TypeServiceMedical` : `{ id, code, nom, description, actif }`.
- `NouveauServiceInput` : `{ siteId, typeServiceId, description? }`.
- `NouveauTypeServiceInput` : `{ code, nom, description? }`.

## 5. Composants UI
- `PanneauServices` : Panneau avec sous-onglets « Cartographie des Services » et « Types & Spécialités ».
- `FormulaireServiceModale` : Fenêtre de rattachement avec listes déroulantes de site et de spécialité (aucun choix forcé par défaut).
- `FormulaireTypeServiceModale` : Fenêtre de création/mise à jour d'un type de service.

## 6. Audit Règle n°1
- Zéro valeur de repli arbitraire (`siteId: 1`, `typeServiceId: 1` supprimés).
- Zéro code généré automatiquement avec `Date.now()`.
- Tout élément sans identifiant numérique valide (`id <= 0`) est ignoré par les mappers.
