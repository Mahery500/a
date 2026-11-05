# Fiche Brique : Écran Salle d'Attente (`ecran-attente`)

## 1. Rôle & Responsabilité
Gère l'affichage public en salle d'attente sur moniteur ou télévision secondaire :
- Affichage autonome grand écran haute lisibilité (mode Fullscreen).
- Mise en avant dynamique du dernier ticket appelé avec le service de destination.
- Synthèse vocale de rappel et carillon audio synchronisé.
- Affichage des consultations en cours et des prochains numéros en attente.
- Horloge numérique et date en temps réel.

## 2. Permissions requises
- **Ressource** : `ticket_file`
- **Actions** :
  - `ticket_file:lire` : consultation de la file d'attente publique (`mode: 'lecture'`).

## 3. Endpoints réels appelés
- `GET /api/aiguillages?siteId=...&statut=EN_ATTENTE` : Tickets en attente.
- `GET /api/aiguillages?siteId=...&statut=EN_COURS` : Tickets actuellement pris en charge.
- `GET /api/services` : Noms des services médicaux associés.
- `GET /api/patients` : Noms des usagers associés.

## 4. Modèle métier
- `TicketAppele` : `{ id, ticketId, numTicket, patientNom?, serviceNom, serviceId, heureAffichee }`.
- `EtatEcranSalleAttente` : `{ dernierAppele, enCours, enAttente }`.

## 5. Composants UI
- `AffichageEcranSalleAttente` : Vue grand écran principale avec support plein écran, horloge et synthèse vocale.

## 6. Audit Règle n°1
- Zéro donnée inventée, zéro ticket fictif.
- Connexion temps réel avec la base de données Symfony.
