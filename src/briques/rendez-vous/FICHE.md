# Fiche Brique : Rendez-Vous & Planning Médical (`rendez-vous`)

## 1. Rôle & Responsabilité
Gère l'agenda, la planification des consultations, la consultation des créneaux et l'enregistrement de l'arrivée physique :
- Consultation globale et filtrée des rendez-vous par patient, statut et date.
- Planification / réservation d'un nouveau créneau de consultation (`POST /api/rendez-vous`).
- Annulation d'un rendez-vous non honoré (`DELETE /api/rendez-vous/{id}`).
- Constat de présence au guichet et confirmation d'arrivée atomique (`POST /api/rendez-vous/{id}/confirmer-arrivee`) générant le ticket de file d'attente.
- Suivi du statut des rendez-vous selon la nomenclature officielle Symfony : `PLANIFIE`, `CONFIRME`, `HONORE`, `ANNULE`, `ABSENT`.

## 2. Permissions requises
- **Ressource** : `rendez_vous`
- **Actions** :
  - `rendez_vous:lire` : consultation de la liste des rendez-vous et du planning (`mode: 'lecture'`).
  - `rendez_vous:ecrire` : réservation d'un créneau, confirmation d'arrivée et annulation (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/rendez-vous` : Récupération de la collection des rendez-vous (supporte le filtre `patientId`).
- `GET /api/rendez-vous/{id}` : Récupération du détail d'un rendez-vous.
- `POST /api/rendez-vous` : Réservation d'un nouveau créneau.
- `DELETE /api/rendez-vous/{id}` : Annulation d'un rendez-vous.
- `POST /api/rendez-vous/{id}/confirmer-arrivee` : Confirmation d'arrivée physique avec génération de ticket.
- `GET /api/patients` : Référentiel des usagers pour la sélection patient.
- `GET /api/services` : Référentiel des services pour l'aiguillage lors de l'arrivée.

## 4. Modèle métier
- `RendezVous` : `{ id, dateRdv, dateAffichee, heureAffichee, statut, commentaire, patientId, patientNom?, patientMatricule?, encounterId, actionnable, estAujourdHui }`.
- `NouveauRendezVousInput` : `{ patientId, dateRdv, heureRdv, commentaire?, agendaId? }`.
- `StatutRendezVous` : `'PLANIFIE' | 'CONFIRME' | 'HONORE' | 'ANNULE' | 'ABSENT'`.
- `RendezVousFiltres` : `{ recherche, statut, filtreDate }`.

## 5. Composants UI
- `PanneauRendezVous` : Tableau de bord principal avec indicateurs (Total, Aujourd'hui, Planifiés, Confirmés, Honorés, Annulés), filtres rapides et tableau d'actions.
- `FormulaireRendezVousModale` : Formulaire de planification avec sélection patient, choix de date/heure et motif.
- Modale intégrée de confirmation d'arrivée avec sélection du service d'orientation.

## 6. Audit Règle n°1
- Zéro mock, zéro génération locale d'identifiant (`Math.max(...) + 1` banni).
- Zéro date fictive codée en dur.
- Respect absolu des statuts réels Symfony et des endpoints de l'API Platform.
