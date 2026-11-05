# FICHE BRIQUE : Définitions de Diagnostics (`diagnostic-definitions`)

## 1. Rôle & Responsabilité
Gère le référentiel des diagnostics médicaux, la classification nosologique (CIM-10, CIM-11), les chapitres cliniques et les correspondances terminologiques internationales (SNOMED-CT). Permet aux praticiens de disposer d'une nomenclature normalisée lors de la consultation active.

## 2. Permissions requises
- `diagnostic_definition:lire` : consultation de la nomenclature (`mode: 'lecture'`).
- `diagnostic_definition:ecrire` : création, mise à jour, activation et codifications (`mode: 'edition'`).

## 3. Endpoints Symfony appelés
- `GET /api/diagnostic_definitions` : Liste des définitions de diagnostics.
- `GET /api/diagnostic_definitions/{id}` : Consultation détaillée.
- `POST /api/diagnostic_definitions` : Création d'une nouvelle définition diagnostique.
- `PATCH /api/diagnostic_definitions/{id}` ou `PUT` : Mise à jour du libellé, chapitre, description.
- `POST /api/diagnostic_definitions/{id}/activation` : Activation/désactivation de la disponibilité.
- `PUT /api/diagnostic_definitions/{id}/codifications` : Association des codes externes (CIM-10, SNOMED).
- `GET /api/code_systems` : Liste des systèmes de terminologie actifs.

## 4. Composants UI
- `PanneauDiagnosticDefinitions` : Tableau de bord d'administration avec filtres par chapitre, statut actif/inactif et recherche textuelle.
- `FormulaireDiagnosticDefinitionModale` : Formulaire modal de saisie/modification.
- `FormulaireCodificationsDiagnosticModale` : Modal d'alignement avec les terminologies internationales.
