# Fiche Brique : Historique des Soins Infirmiers (`infirmerie-historique`)

## 1. Rôle & Responsabilité
Permet la traçabilité médico-légale et la revue des actes et soins infirmiers réalisés :
- Consultation chronologique des soins effectués par le soignant (`GET /api/me/historique_actes`).
- Filtrage par identifiant patient, date de début (`du`) et date de fin (`au`).
- Pagination par incrément ("Charger plus").
- Visualisation détaillée de chaque acte avec son statut, observations cliniques et résultats.
- Prise en compte des actes invalidés (« Saisi par erreur »).

## 2. Permissions requises
- **Ressource** : `infirmerie_historique`
- **Actions** :
  - `infirmerie_historique:lire` : consultation de l'historique et filtrage (`mode: 'lecture'`).

## 3. Endpoints réels appelés
- `GET /api/me/historique_actes?patientId=...&du=...&au=...&page=...&limit=...` : Historique paginé d'actes du soignant connecté.
- `GET /api/patients/{id}` : Résolution du nom complet du patient.

## 4. Modèle métier
- `ActeHistorique` : `{ id, encounterId, patientId, patientNom, serviceId, acteDefinitionId, acteDefinitionCode, acteDefinitionLibelle, dateRealisation, statut, saisiParErreur, commentaire, observations, resultats }`.
- `FiltresHistorique` : `{ patientId?, du?, au?, page: number, limite: number }`.

## 5. Composants UI
- `PanneauInfirmerieHistorique` : Panneau de filtrage et liste chronologique avec pagination.
