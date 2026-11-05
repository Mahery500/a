# Fiche Brique : Dossiers Médicaux (`dossiers-medicaux`)

## 1. Rôle & Responsabilité
Répertoire clinique hospitalier et traçabilité médicale complète des patients :
- Recherche textuelle de dossiers patients (nom, prénom, matricule).
- Consultation synthétique de l'identité médico-administrative (groupe sanguin, antécédents, entreprise).
- Historique chronologique complet des consultations et passages (`GET /api/encounters?patientId=...`).
- Consultation des diagnostics antérieurs posés par les praticiens (`GET /api/diagnostics`).
- Consultation des actes, examens et observations cliniques antérieures (`GET /api/acte_realises`).

## 2. Permissions requises
- **Ressource** : `dossier_medical`
- **Actions** :
  - `dossier_medical:lire` : consultation des dossiers et historiques médicaux (`mode: 'lecture'`).
  - `dossier_medical:ecrire` : mise à jour / ajout de notes au dossier (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/patients` : Recherche et liste des dossiers patients.
- `GET /api/patients/{id}` : Fiche détaillée du patient.
- `GET /api/encounters?patientId=...` : Historique des admissions et consultations.
- `GET /api/diagnostics?encounterId=...` : Diagnostics posés lors de chaque passage.
- `GET /api/acte_realises?encounterId=...` : Actes et soins réalisés avec observations.

## 4. Modèle métier
- `DossierPatientSummary` : `{ id, nom, prenom, matricule, groupeSanguin, dateNaissance, telephone }`.
- `ConsultationPasseItem` : `{ id, dateDebut, dateFin, serviceNom, statut, diagnostics, actes, observations }`.

## 5. Composants UI
- `PanneauDossiersMedicaux` : Interface scindée avec barre de recherche à gauche et visualisation chronologique exhaustive à droite.
