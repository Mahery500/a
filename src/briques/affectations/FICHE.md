# Fiche Brique : Affectations du Personnel (`affectations`)

## 1. Rôle & Responsabilité
Gère la répartition opérationnelle de l'ensemble du personnel hospitalier (accueil, secrétariat, soins infirmiers, consultations médicales, dispensation pharmacie et gestion des stocks) entre les sites et services :
- Tout collaborateur peut être affecté à un service, à l'exception des profils administrateurs (`ADMIN` / `ROLE_ADMIN`).
- Consultation des affectations actives et passées avec filtres par site et statut.
- Affectation d'un collaborateur à un service d'un établissement donné avec date de prise de fonction.
- Distinction de l'affectation principale de l'agent.
- Modification des dates et du statut d'une affectation via `PATCH /api/assignments/{id}`.
- Retrait / suppression d'une affectation via `DELETE /api/assignments/{id}`.

## 2. Permissions requises
- **Ressource** : `affectation`
- **Actions** :
  - `affectation:lire` : consultation du tableau des affectations en lecture seule (`mode: 'lecture'`).
  - `affectation:ecrire` : création, modification et suppression des affectations (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/assignments` : Liste de toutes les affectations enregistrées.
- `POST /api/assignments` : Création d'une affectation `{ staffId, serviceId, dateDebut, dateFin?, estPrincipal? }`.
- `PATCH /api/assignments/{id}` : Mise à jour complète/partielle d'une affectation.
- `DELETE /api/assignments/{id}` : Suppression d'une affectation.
- `GET /api/staffs` : Référentiel complet de tous les membres du personnel. Dans la liste déroulante d'affectation, les profils ayant le rôle ADMIN sont systématiquement exclus (`role !== 'ADMIN'`).
- `GET /api/services` : Référentiel des services médicaux avec rattachement aux sites.
- `GET /api/sites` : Référentiel des sites hospitaliers.

## 4. Modèle métier
- `AffectationPersonnel` : `{ id, staffId, nomPersonnel, prenomPersonnel, rolePersonnel, serviceId, nomService, siteId, nomSite, dateDebut, dateFin, estPrincipal, actif, dateCreation }`.
- `NouvelleAffectationInput` : `{ staffId, serviceId, dateDebut, dateFin?, estPrincipal? }`.
- `ModificationAffectationInput` : `{ serviceId?, dateDebut?, dateFin?, estPrincipal?, actif? }`.
- `OptionPersonnel` : `{ id, nom, prenom, role }`.
- `OptionServiceSite` : `{ serviceId, nomService, siteId, nomSite }`.
- `OptionSite` : `{ id, nom, code }`.

## 5. Composants UI
- `PanneauAffectations` : Panneau principal affichant métriques d'affectation, filtres de recherche et par site, et tableau des assignations.
- `FormulaireAffectationModale` : Fenêtre de création/modification avec sélection dynamique de l'agent, du site et filtrage automatique des services disponibles.
- `ModaleConfirmationSuppression` : Fenêtre de confirmation de suppression d'une affectation.

## 6. Audit Règle n°1
- Zéro valeur inventée ou de secours arbitraire (`staffId: 1`, `serviceId: 1` supprimés).
- Respect strict des relations inter-entités réelles provenant de l'API Symfony.
- Filtrage strict des identifiants valides (`id > 0`).
