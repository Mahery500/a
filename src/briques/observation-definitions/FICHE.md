# Fiche Brique : Définitions d’Observations (`observation_definitions`)

## 1. Rôle & Responsabilité
Gère la nomenclature et le référentiel des paramètres cliniques, des constantes vitales, des mesures de laboratoire et des observations qualitatives :
- Création et mise à jour des définitions d'observations (`code`, `libelle`, `typeValeur: numerique | texte`, `uniteId`).
- Respect strict des contraintes métier Symfony : une observation numérique exige une unité de mesure, une observation texte ne peut pas en avoir.
- Gestion des unités de mesure cliniques (`/api/unites`).
- Gestion des terminologies de référence (`/api/code_systems` : LOINC, SNOMED CT, etc.).
- Gestion des codifications externes par observation (`PUT /api/observation_definitions/{id}/codifications`).
- Configuration du moule d'observations attendues pour chaque acte médical (`/api/acte_definitions/{id}/observations`).

## 2. Permissions requises
- **Ressource** : `observation_definition`
- **Actions** :
  - `observation_definition:lire` : consultation de la nomenclature et des unités (`mode: 'lecture'`).
  - `observation_definition:ecrire` : création, modification, gestion des unités et codifications (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/observation_definitions` : Liste des définitions d'observations (filtre possible `?actif=true`).
- `GET /api/observation_definitions/{id}` : Consultation détaillée d'une définition.
- `POST /api/observation_definitions` : Création d'une définition `{ code, libelle, typeValeur, uniteId? }`.
- `PATCH /api/observation_definitions/{id}` : Mise à jour ciblée (`libelle`, et structure si non encore utilisée en base).
- `PUT /api/observation_definitions/{id}/codifications` : Mise à jour complète des codes externes (`{ codifications: [{ codeSystem, code }] }`).
- `GET /api/unites` : Référentiel des unités de mesure.
- `POST /api/unites` : Création d'une unité `{ code, libelle }`.
- `POST /api/unites/{id}/activation` : Activation/désactivation d'une unité `{ actif: boolean }`.
- `GET /api/code_systems` : Référentiel des systèmes de codification.
- `POST /api/code_systems` : Création d'un système `{ code, libelle, uri? }`.
- `POST /api/code_systems/{id}/activation` : Activation/désactivation d'une terminologie `{ actif: boolean }`.
- `GET /api/acte_definitions/{id}/observations` : Récupération du moule d'observations de l'acte.
- `PUT /api/acte_definitions/{id}/observations` : Enregistrement du moule d'observations de l'acte.

## 4. Modèle métier
- `ObservationDefinition` : `{ id, code, libelle, typeValeur, actif, uniteId, uniteCode, uniteLibelle, codifications }`.
- `UniteMesure` : `{ id, code, libelle, actif }`.
- `CodeSysteme` : `{ id, code, libelle, uri, actif }`.
- `NouvelleObservationDefinitionInput` : `{ code, libelle, typeValeur, uniteId?, codifications? }`.
- `ModificationObservationDefinitionInput` : `{ libelle?, code?, typeValeur?, uniteId? }`.

## 5. Composants UI
- `PanneauObservationDefinitions` : Vue principale avec statistiques, filtres combinés, tableau complet et accès aux modales de gestion.
- `FormulaireObservationDefinitionModale` : Fenêtre de création/modification avec validation de cohérence numérique/unité.
- `FormulaireCodificationsModale` : Fenêtre d'association des codes LOINC et SNOMED.
- `GestionUnitesModale` : Fenêtre de gestion et bascule d'activation des unités.
- `GestionCodeSystemsModale` : Fenêtre de gestion des terminologies.
