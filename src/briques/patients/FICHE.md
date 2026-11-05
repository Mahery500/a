# Fiche Brique : Patients & Dossiers Administratifs (`patients`)

## 1. Rôle & Responsabilité
Gère l'identification des usagers, la recherche patient, la complétion des données administratives et l'intégration des salariés :
- Recherche dynamique par nom, prénom ou matricule avec tolérance orthographique (`GET /api/patients?recherche=...`).
- Filtrage par entreprise conventionnée employeur (`GET /api/patients?idEntreprise=...`).
- Consultation de la fiche d'identification complète (état civil, contact, employeur, ayant droit).
- Complétion des champs vides de la fiche administrative sans écrasement des données existantes (`PATCH /api/patients/{id}/completer`).
- Importation en masse de salariés et ayants droit par fichier Excel `.xlsx` (`POST /api/import-patients`).
- Attribution d'un statut salarié (Agent) à un patient existant (`POST /api/agents`).

## 2. Permissions requises
- **Ressource** : `patient`
- **Actions** :
  - `patient:lire` : consultation de la liste des patients, recherche et affichage du dossier en lecture seule (`mode: 'lecture'`).
  - `patient:ecrire` : complétion de fiche, import Excel et affiliation salarié (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/patients` : Collection des patients (avec paramètres de filtrage).
- `GET /api/patients/{id}` : Détail individuel d'une fiche patient.
- `PATCH /api/patients/{id}/completer` : Complétion ciblée des champs vides (`application/merge-patch+json`).
- `POST /api/import-patients` : Upload multipart/form-data de classeurs Excel.
- `POST /api/agents` : Déclaration d'un rôle salarié pour un patient existant.
- `GET /api/companies` : Liste des entreprises conventionnées pour filtrage et rattachement.

## 4. Modèle métier
- `PatientFiche` : `{ id, matricule, nom, prenom, dateNaissance?, lieuNaissance?, sexe?, adresse?, telephone?, email?, groupeSanguin?, nir?, idEntreprise?, nomEntreprise?, statut?, idAgent?, matriculeAgent? }`.
- `CompleterFicheInput` : `{ matricule?, dateN?, lieuNaissance?, adresse?, groupeSanguin?, sexe?, telephone?, email?, nir? }`.
- `RattacherAgentInput` : `{ idPatient, idEntreprise, cnaps?, fonction? }`.
- `EntrepriseOption` : `{ id, nom }`.

## 5. Composants UI
- `PanneauPatients` : Panneau principal avec cartes d'indicateurs (Total, Salariés, Ayants Droit, Libres), filtres combinés et tableau réactif.
- `DetailPatientModale` : Consultation structurée de la fiche d'identité civile et médicale.
- `FormulaireCompleterFicheModale` : Formulaire de complétion avec verrouillage des champs déjà renseignés.
- `FormulaireImportModale` : Upload de classeur Excel `.xlsx` avec contrôle de conformité.
- `FormulairePromotionAgentModale` : Rattachement d'un statut salarié entreprise.

## 6. Audit Règle n°1
- Zéro mock, zéro donnée inventée.
- Documentation dans `API_MANQUANTES.md` de l'absence d'endpoint `POST /api/patients` unitaire hors import Excel.
