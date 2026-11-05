# Fiche Brique : Entreprises Partenaires (`entreprises`)

## 1. Rôle & Responsabilité
Gère les entreprises partenaires conventionnées avec le service de santé au travail ASINA : consultation de la liste des entreprises partenaires, recherche/filtrage, enregistrement d'une nouvelle entreprise, modification et suppression sous contrôle des permissions RBAC.

## 2. Permissions requises
- **Ressource** : `entreprise`
- **Actions** :
  - `entreprise:lire` : affichage des entreprises partenaires en mode consultation (`mode: 'lecture'`).
  - `entreprise:ecrire` : autorisation de créer, modifier et supprimer des entreprises (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/entreprises` (fallback `/api/companies`) : Liste des entreprises conventionnées.
- `GET /api/entreprises/{id}` (fallback `/api/companies/{id}`) : Détail d'une entreprise.
- `POST /api/entreprises` (fallback `/api/companies`) : Création avec payload `{ nom, raisonSociale, adresse, contact, numeroCnaps, matriculeAsina }`.
- `PUT /api/entreprises/{id}` (fallback `/api/companies/{id}`) : Modification. Si l'API backend renvoie 404/405/501 (absence d'implémentation côté Symfony), l'erreur explicite est remontée et documentée dans `API_MANQUANTES.md`.
- `DELETE /api/entreprises/{id}` (fallback `/api/companies/{id}`) : Suppression. Même traitement en cas d'absence d'implémentation côté Symfony.

## 4. Modèle métier
- `EntreprisePartenaire` : `{ id, nom, raisonSociale?, adresse, contact, numeroCnaps?, matriculeAsina?, nombreAgents? }`.
- `NouvelleEntrepriseInput` : `{ nom, raisonSociale?, adresse?, contact?, numeroCnaps?, matriculeAsina? }`.
- `ModificationEntrepriseInput` : `{ nom?, raisonSociale?, adresse?, contact?, numeroCnaps?, matriculeAsina? }`.

## 5. Composants UI
- `PanneauEntreprises` : Point d'entrée de la brique recevant `{ mode }`, liste avec cartes d'entreprises, recherche, compteurs et actions.
- `FormulaireEntrepriseModale` : Fenêtre de saisie/modification réutilisant les composants du noyau (`Modale`, `ChampTexte`, `ActionsFormulaire`).

## 6. Audit Règle n°1
- Zéro `indexFallback = 1` ou `raw.id ?? indexFallback`.
- Zéro nom par défaut fabriqué (`Entreprise ${indexFallback}`).
- Zéro code fabriqué avec `Date.now()`.
- Tout élément renvoyé sans identifiant numérique valide (`id <= 0`) est ignoré (`null`).
- Formulaires de création strictement vides par défaut.
