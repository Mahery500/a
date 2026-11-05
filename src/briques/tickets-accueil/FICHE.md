# Fiche Brique : Tickets & File d'Attente Accueil (`tickets-accueil`)

## 1. Rôle & Responsabilité
Gère la file d'attente globale de l'accueil, l'émission des tickets patients et l'appel sonore :
- Émission unitaire de ticket de file d'attente (`POST /api/tickets`) avec choix du service initial (visite spontanée ou aiguillage direct).
- Supervision des aiguillages actifs par site (`GET /api/aiguillages?siteId=...&statut=EN_ATTENTE|EN_COURS`).
- Détection automatique et annonce vocale des nouveaux tickets appelés (`speakTicket` + carillon sonore).
- Rappel manuel au guichet avec diffusion `BroadcastChannel` vers l'écran déporté salle d'attente.
- Affichage du temps d'attente dynamique par patient et par service.

## 2. Permissions requises
- **Ressource** : `ticket_file`
- **Actions** :
  - `ticket_file:lire` : consultation de la file d'attente (`mode: 'lecture'`).
  - `ticket_file:ecrire` : émission de tickets (`mode: 'edition'`).
  - `ticket_file:appeler` : appel et rappel sonore des tickets.

## 3. Endpoints réels appelés
- `POST /api/tickets` : Émission de ticket dans le système backend Symfony.
- `GET /api/aiguillages?siteId=...&statut=EN_ATTENTE|EN_COURS` : Récupération des patients en file d'attente et en consultation.
- `GET /api/patients` : Référentiel des usagers pour l'émission au guichet.
- `GET /api/services` : Référentiel des services médicaux d'orientation.

## 4. Modèle métier
- `TicketAiguillage` : `{ id, ticketId, numTicket, patientId, patientNom?, patientMatricule?, serviceId, serviceNom, statut, dateAiguillage, heureAffichee, dureeAttenteMinutes }`.
- `NouveauTicketInput` : `{ patientId, premierServiceId, siteId, rendezVousId? }`.
- `TicketEmisResultat` : `{ id, numTicket, statut, dateEmission, estAssocieAUnRendezVous }`.

## 5. Composants UI
- `PanneauTicketsAccueil` : Poste de contrôle principal de la file d'attente avec métriques (En attente, En cours, Services), bascule vue guichet / aperçu écran, et tableau d'attente.
- `FormulaireNouveauTicketModale` : Modale d'émission de ticket avec sélection du patient et du service initial.

## 6. Audit Règle n°1
- Zéro mock, zéro génération locale d'identifiant (`POST /api/tickets` retourne le véritable numéro de ticket émis par Symfony).
- Synchronisation continue avec l'API Platform (`GET /api/aiguillages`).
