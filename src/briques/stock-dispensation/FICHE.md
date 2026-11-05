# Fiche Brique : Dispensation Pharmaceutique (`stock-dispensation`)

## 1. Rôle & Responsabilité
Gère la délivrance de médicaments et dispositifs médicaux aux patients au comptoir de la pharmacie :
- Sélection du patient (`GET /api/patients`).
- Vérification du stock disponible sur le site (`GET /api/stock_resources`).
- Enregistrement de la sortie de stock pour délivrance (`POST /api/mouvement_resources`).
- Traçabilité immédiate de la délivrance et mise à jour de l'inventaire.

## 2. Permissions requises
- **Ressource** : `stock_dispensation`
- **Actions** :
  - `stock_dispensation:lire` : consultation des délivrances et du stock disponible (`mode: 'lecture'`).
  - `stock_dispensation:ecrire` : enregistrement de nouvelles dispensations (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/patients` : Recherche et sélection du patient.
- `GET /api/stock_resources` : Niveaux de stocks disponibles.
- `GET /api/produit_resources` : Catalogue des produits.
- `GET /api/mouvement_type_resources` : Types de mouvements pour identifier la sortie dispensation.
- `POST /api/mouvement_resources` : Déstockage officiel lié à la dispensation.

## 4. Modèle métier
- `DispensationSaisie` : `{ patientId, produitId, siteId, quantite, commentaire? }`.
- `ProduitDisponible` : `{ produitId, nomCommercial, quantiteEnStock }`.

## 5. Composants UI
- `PanneauStockDispensation` : Interface de délivrance avec sélection patient, choix du produit, contrôle de stock et confirmation.
