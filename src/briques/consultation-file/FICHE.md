# Fiche Brique : File d'Attente Médecin (`consultation-file`)

## 1. Rôle & Responsabilité
Gère la file d'attente spécifique du cabinet de consultation médicale :
- Consultation en temps réel des patients attendant le médecin (`GET /api/me/file_attente`).
- Détection du patient actuellement pris en charge par le médecin (`GET /api/me/patient_en_cours`).
- Prise en charge officielle du patient (`POST /api/aiguillages/{id}/prendre_en_charge`).
- Visualisation du temps d'attente, du type d'admission (RDV / sans RDV), et du motif de visite.

## 2. Permissions requises
- **Ressource** : `consultation_file`
- **Actions** :
  - `consultation_file:lire` : consultation des patients en attente (`mode: 'lecture'`).
  - `consultation_file:ecrire` : appel et prise en charge du patient (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/me/file_attente` : File ordonnée des patients pour le médecin connecté.
- `GET /api/me/patient_en_cours` : État de la consultation active.
- `POST /api/aiguillages/{id}/prendre_en_charge` : Prise en charge du patient.
- `GET /api/patients/{id}` : Récupération des informations complémentaires du patient (nom, matricule, groupe sanguin).

## 4. Modèle métier
- `PatientFileMedecin` : `{ position, aiguillageId, ticketId, numTicket, patientId, patientNom, matricule, type, dateAiguillage, attenteMinutes, groupeSanguin }`.
- `ConsultationEnCours` : `{ enCours, aiguillageId, encounterId, ticketId, numTicket, patientId, patientNom, debut, dureeMinutes }`.

## 5. Composants UI
- `PanneauConsultationFile` : Vue des patients en attente de consultation médicale avec boutons d'appel, temps d'attente et indicateurs de priorité.
