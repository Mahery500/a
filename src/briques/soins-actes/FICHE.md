# Fiche Brique : Réalisation d'Actes & Soins (`soins-actes`)

## 1. Rôle & Responsabilité
Gère la réalisation des soins et actes paramédicaux sur le dossier de consultation ou d'admission actif :
- Consultation des actes prescrits / demandés à faire (`GET /api/me/actes_a_faire?patientId=...`).
- Exécution d'un acte prescrit avec enregistrement direct (`POST /api/acte_realises`).
- Saisie libre d'un acte depuis le catalogue autorisé (`GET /api/acte_definitions?realisableEncounterId=...`).
- Gestion du cycle de vie de l'acte (`planifie` → `en_cours` → `realise` / `annule` / `saisi_par_erreur` via `POST /api/acte_realises/{id}/statut`).
- Ajout d'observations et de résultats cliniques chiffrés ou qualitatifs (`POST /api/acte_realises/{id}/resultats` et `/observations`).
- Clôture médicale de l'encounter (`POST /api/encounters/{id}/terminer`).

## 2. Permissions requises
- **Ressource** : `soin_acte`
- **Actions** :
  - `soin_acte:lire` : consultation des actes prescrits et réalisés (`mode: 'lecture'`).
  - `soin_acte:ecrire` : saisie, mise à jour des statuts, ajout de résultats et clôture (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/me/patient_en_cours` : Identification du dossier actif.
- `GET /api/me/actes_a_faire?patientId=...` : Lignes d'actes demandées pour ce patient.
- `GET /api/acte_realises?encounterId=...` : Actes enregistrés sur cet encounter.
- `GET /api/acte_definitions` : Actes autorisés pour le soignant connecté dans ce service (filtrage prioritaire sur la catégorie Soins infirmiers avec identifiant base 3 : `?categorie=3` ou `?categorieId=3`, ou `?realisableEncounterId=...`).
- `POST /api/acte_realises` : Création et liaison d'un acte réalisé à l'encounter.
- `POST /api/acte_realises/{id}/statut` : Transition d'état de l'acte.
- `POST /api/acte_realises/{id}/observations` : Ajout d'une observation clinique.
- `POST /api/acte_realises/{id}/resultats` : Ajout d'un résultat d'analyse ou d'examen.
- `POST /api/encounters/{id}/terminer` : Clôture de la prise en charge.

## 4. Modèle métier
- `StatutActe` : `'planifie' | 'en_cours' | 'realise' | 'annule' | 'saisi_par_erreur'`.
- `ActeSaisi` : `{ id, encounterId, acteDefinitionId, code, libelle, dateRealisation, statut, commentaire, observations, resultats }`.
- `LigneDemandeActe` : `{ id, demandeId, acteDefinitionId, libelle, urgente, priorite, commentaire, dateDemande }`.
- `ResultatSoin` : `{ id, type, resultat, interpretation }`.

## 5. Composants UI
- `PanneauSoinsActes` : Panneau interactif affichant les actes demandés à exécuter, la saisie d'actes du catalogue, le suivi des actes en cours avec transition de statut, les résultats, et le bouton de clôture.
