# Fiche Brique : État des Stocks (`stock-niveaux`)

## 1. Rôle & Responsabilité
Visualisation et supervision multi-sites des inventaires de la pharmacie :
- Vue consolidée des quantités en stock par produit et par site (`GET /api/stock_resources`).
- Filtrage par site pharmaceutique (`GET /api/site_resources`).
- Alertes de rupture de stock (quantité = 0) et de stock critique.
- Synthèse des stocks totaux et valorisation.

## 2. Permissions requises
- **Ressource** : `stock_niveau`
- **Actions** :
  - `stock_niveau:lire` : consultation des niveaux de stocks (`mode: 'lecture'`).
  - `stock_niveau:ecrire` : mise à jour des seuils d'alerte (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/stock_resources` : Niveaux de stocks calculés en temps réel par le backend.
- `GET /api/site_resources` : Liste des sites pharmaceutiques.

## 4. Modèle métier
- `LigneStockNiveau` : `{ produitId, produitLibelle, siteId, siteLibelle, quantite, statutStock: 'disponible' | 'critique' | 'rupture' }`.
- `SitePharmacie` : `{ id, libelle, adresse, contact }`.

## 5. Composants UI
- `PanneauStockNiveaux` : Tableau avec cartes métriques (total articles, ruptures, alertes), filtre par site et recherche produit.
