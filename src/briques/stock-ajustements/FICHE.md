# Fiche Brique : Inventaires & Ajustements (`stock-ajustements`)

## 1. Rôle & Responsabilité
Gère les inventaires physiques périodiques et les corrections d'écarts de stock :
- Consultation des types de motifs d'ajustement (`GET /api/ajustement_type_resources`).
- Comparaison entre stock théorique calculé et stock physique constaté.
- Enregistrement des ajustements d'écarts d'inventaire via les mouvements de régularisation (`POST /api/mouvement_resources`).
- Traçabilité des pertes, péremptions et réévaluations.

## 2. Permissions requises
- **Ressource** : `stock_ajustement`
- **Actions** :
  - `stock_ajustement:lire` : consultation des motifs et niveaux d'inventaire (`mode: 'lecture'`).
  - `stock_ajustement:ecrire` : saisie d'ajustements et régularisation (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/ajustement_type_resources` : Motifs d'ajustements.
- `GET /api/stock_resources` : Niveaux de stocks théoriques.
- `GET /api/produit_resources` : Catalogue de produits.
- `GET /api/site_resources` : Sites de stockage.
- `POST /api/mouvement_resources` : Mouvement de régularisation d'écart.

## 4. Modèle métier
- `MotifAjustement` : `{ id, libelle }`.
- `AjustementSaisie` : `{ produitId, siteId, motifId, quantiteEcart, sens: 'positif' | 'negatif', commentaire? }`.

## 5. Composants UI
- `PanneauStockAjustements` : Tableau d'inventaire et comparatif avec bouton d'ajustement.
- `FormulaireAjustementModale` : Modale de régularisation d'écart d'inventaire.
