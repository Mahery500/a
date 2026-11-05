# Fiche Brique : Vérification Adhérents (`verification-adherents`)

## 1. Rôle & Responsabilité
Gère l'accueil physique, le contrôle d'éligibilité et l'aiguillage des usagers au guichet :
- Recherche et identification de l'adhérent (salarié, ayant droit ou indépendant).
- Contrôle de la convention entreprise et de l'affiliation CNAPS.
- Vérification physique de l'identité et constat de présence au guichet.
- Consultation des rendez-vous planifiés et confirmation d'arrivée (`POST /api/rendez-vous/{id}/confirmer-arrivee`) générant le ticket de file d'attente.
- Émission de ticket pour visite spontanée sans rendez-vous (`POST /api/tickets`).
- Génération, prévisualisation et impression de la Carte d'Adhérent officielle Santé au Travail ASINA SIH.
- Synchronisation en direct avec l'écran d'affichage salle d'attente (`/ecran-attente`).

## 2. Permissions requises
- **Ressource** : `verification_adherent`
- **Actions** :
  - `verification_adherent:lire` : consultation et recherche des adhérents (`mode: 'lecture'`).
  - `verification_adherent:ecrire` : confirmation d'arrivée, émission de ticket et génération de carte (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/patients?recherche=...` : Recherche dynamique des usagers.
- `GET /api/patients/{id}` : Récupération du dossier administratif.
- `GET /api/rendez-vous?patientId=...` : Récupération des rendez-vous de l'adhérent.
- `POST /api/rendez-vous/{id}/confirmer-arrivee` : Confirmation d'arrivée physique et émission atomique du ticket.
- `POST /api/tickets` : Émission de ticket de file d'attente pour visite spontanée.
- `GET /api/services` : Liste des services médicaux d'orientation disponibles.
- `GET /api/companies` : Liste des entreprises conventionnées partenaires.

## 4. Modèle métier
- `AdherentComplet` : `{ patient, affiliation, eligibilite }`
- `StatutEligibilite` : `'ELIGIBLE' | 'NON_ELIGIBLE' | 'EN_ATTENTE'`
- `RendezVousDuJour` : `{ id, dateRdv, heureRdv, statut, commentaire, actionnable, encounterId }`
- `ServiceOrientationOption` : `{ id, nom, codeFile }`
- `ResultatConfirmationArrivee` : `{ rendezVousId, ticketId, numTicket, dateEmission }`
- `ResultatEmissionTicket` : `{ ticketId, numTicket, dateEmission }`

## 5. Composants UI
- `PanneauVerificationAdherents` : Composant principal d'accueil au guichet avec recherche, profil, confirmation RDV et émission ticket.
- `BadgeEligibilite` : Badge d'état d'éligibilité et convention active.
- `CarteAdherentModale` : Modale d'aperçu et d'impression recto/verso de la carte d'adhérent santé au travail.

## 6. Audit Règle n°1
- Zéro mock, zéro donnée inventée.
- Les statuts de RDV respectent strictement l'API Symfony (`PLANIFIE`, `CONFIRME`, `HONORE`, `ANNULE`, `ABSENT`).
- Tous les tickets sont persistés via les endpoints réels backend (`/api/rendez-vous/{id}/confirmer-arrivee` et `/api/tickets`).
