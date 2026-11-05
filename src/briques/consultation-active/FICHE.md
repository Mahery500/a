# Fiche Brique : Consultation Active (`consultation-active`)

## 1. Rôle & Responsabilité
Poste de consultation médicale avancée du praticien :
- Saisie de l'anamnèse, examen clinique et observations (`POST /api/acte_realises/{id}/observations`).
- Pose et codification de diagnostics médicaux CIM-10 issus du référentiel des diagnostics (`GET /api/diagnostic_definitions`, `POST /api/diagnostics`, `GET /api/diagnostics?encounterId=...`).
- Enregistrement direct d'actes médicaux exécutés lors de la consultation (`POST /api/acte_realises` avec statut réalisé/en cours/planifié, `POST /api/acte_realises/{id}/statut`).
- Prescription et émission de demandes d'actes médicaux, de biologie ou de soins infirmiers (`POST /api/demandes`, `POST /api/demande_actes`, `POST /api/acte_realises`).
- Clôture médicale du dossier de consultation (`POST /api/encounters/{id}/terminer`).

## 2. Permissions requises
- **Ressource** : `consultation_active`
- **Actions** :
  - `consultation_active:lire` : consultation du dossier clinique en cours (`mode: 'lecture'`).
  - `consultation_active:ecrire` : enregistrement de diagnostics, actes et clôture (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/diagnostics?encounterId=...` : Diagnostics enregistrés sur la consultation.
- `POST /api/diagnostics` : Ajout d'un nouveau diagnostic médical.
- `POST /api/diagnostics/{id}/statut` : Évolution de la certitude diagnostique.
- `GET /api/demandes?encounterId=...` ou `GET /api/demande_actes?encounterId=...` : Demandes d'actes émises.
- `POST /api/demandes` ou `POST /api/demande_actes` : Émission d'une demande d'acte / prescription.
- `GET /api/acte_realises?encounterId=...` : Actes et prescriptions rattachés.
- `GET /api/acte_definitions` : Catalogue des actes pour les prescriptions.
- `POST /api/acte_realises` : Création d'actes prescrits ou d'un acte support d'examen clinique.
- `POST /api/acte_realises/{id}/observations` : Enregistrement des données d'examen.
- `POST /api/encounters/{id}/terminer` : Clôture médicale de la consultation.

## 4. Modèle métier
- `DiagnosticItem` : `{ id, encounterId, staffId, code, libelle, type, statut, dateDiagnostic, commentaire }`.
- `NouveauDiagnosticSaisie` : `{ encounterId, code?, libelle, type, statut, commentaire? }`.
- `PrescriptionActeSaisie` : `{ encounterId, acteDefinitionId, statut, commentaire? }`.
- `DemandeActeItem` : `{ id, demandeId?, encounterId, patientId?, acteDefinitionId, acteDefinitionLibelle, priorite, urgente, serviceId?, serviceNom?, statut?, commentaire?, dateDemande }`.
- `DemandeActeInput` : `{ encounterId, patientId?, acteDefinitionId, priorite?, urgente?, serviceId?, commentaire? }`.

## 5. Composants UI
- `PanneauConsultationActive` : Espace complet du médecin intégrant examen clinique, diagnostics CIM-10, prescriptions & demandes d'actes pour le personnel soignant et clôture du dossier.
