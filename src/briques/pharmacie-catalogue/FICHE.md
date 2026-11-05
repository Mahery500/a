# Fiche Brique : Référentiel Médicaments & Produits (`pharmacie-catalogue`)

## 1. Rôle & Responsabilité
Gère le catalogue pharmaceutique et les référentiels de la pharmacie :
- Liste et gestion des familles de médicaments (`/api/famille_resources`).
- Principes actifs (`/api/principe_actif_resources`).
- Formes galéniques / présentations (`/api/presentation_resources`).
- Conditionnements (`/api/conditionnement_resources`).
- Médicaments composés (`/api/medicament_resources`).
- Produits commerciaux délivrables (`/api/produit_resources`).
- Fournisseurs et laboratoires partenaires (`/api/fournisseur_resources`).

## 2. Permissions requises
- **Ressource** : `stock_catalogue`
- **Actions** :
  - `stock_catalogue:lire` : consultation du catalogue pharmaceutique (`mode: 'lecture'`).
  - `stock_catalogue:ecrire` : création et modification de produits, médicaments et fournisseurs (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET/POST/PUT /api/produit_resources`
- `GET/POST/PUT /api/medicament_resources`
- `GET/POST/PUT /api/fournisseur_resources`
- `GET /api/famille_resources`
- `GET /api/principe_actif_resources`
- `GET /api/presentation_resources`
- `GET /api/conditionnement_resources`

## 4. Modèle métier
- `ProduitPharmacie` : `{ id, nomCommercial, medicamentId, familleLibelle, presentationLibelle, conditionnementId, conditionnementLibelle, principeActifs }`.
- `Fournisseur` : `{ id, nom, adresse, telephone, email }`.
- `ReferentielSimple` : `{ id, libelle }`.

## 5. Composants UI
- `PanneauPharmacieCatalogue` : Tableau de consultation et de recherche des produits et médicaments avec filtres.
- `FormulaireProduitModale` : Modale d'ajout ou modification de produit pharmaceutique.
