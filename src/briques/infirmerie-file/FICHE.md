# Fiche Brique : File d'Attente Infirmerie (`infirmerie-file`)

## 1. Rôle & Responsabilité
Supervise l'activité du poste de soins infirmiers et la file d'attente du service actif :
- Consultation en temps réel des patients en attente (`GET /api/me/file_attente`).
- Détection du patient actuellement en cours de soins (`GET /api/me/patient_en_cours`).
- Suivi des rendez-vous infirmiers planifiés du jour et de leur état d'arrivée (`GET /api/me/rendez_vous_du_jour`).
- Synthèse des actes demandés et urgents en attente (`GET /api/me/actes_a_faire?urgentes=1`).
- Prise en charge d'un patient de la file (`POST /api/aiguillages/{id}/prendre_en_charge`).

## 2. Permissions requises
- **Ressource** : `infirmerie_file`
- **Actions** :
  - `infirmerie_file:lire` : consultation de la file d'attente et du tableau de bord (`mode: 'lecture'`).
  - `infirmerie_file:ecrire` : prise en charge d'un patient et appel au poste (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/me/file_attente` : Liste ordonnée des patients en file d'attente pour le soignant connecté.
- `GET /api/me/patient_en_cours` : État de la consultation ou soin en cours.
- `GET /api/me/rendez_vous_du_jour` : Rendez-vous du jour du service.
- `GET /api/me/actes_a_faire` : Actes demandés au service de soins.
- `POST /api/aiguillages/{id}/prendre_en_charge` : Prise en charge officielle du patient.
- `GET /api/patients/{id}` : Récupération du nom du patient (si non inclus dans l'aiguillage).

## 4. Modèle métier
- `PatientFileAttente` : `{ position, aiguillageId, ticketId, numTicket, patientId, patientNom, type, dateAiguillage, attenteMinutes }`.
- `PatientEnCours` : `{ enCours, aiguillageId, encounterId, ticketId, numTicket, patientId, patientNom, debut, dureeMinutes }`.
- `RendezVousDuJour` : `{ id, heure, patientId, patientNom, statut, etat }`.
- `ActeAFaire` : `{ id, demandeId, encounterId, patientId, acteDefinitionLibelle, urgente, commentaire }`.

## 5. Composants UI
- `PanneauInfirmerieFile` : Composant principal affichant la synthèse (4 compteurs clés), la liste de file d'attente, les rendez-vous du jour et les alertes d'actes urgents.
