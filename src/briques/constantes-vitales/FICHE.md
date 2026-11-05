# Fiche Brique : Constantes Vitales (`constantes-vitales`)

## 1. Rôle & Responsabilité
Gère le relevé, l'évaluation et la transmission des paramètres vitaux du patient en consultation ou soin :
- Saisie des signes vitaux standards : Tension artérielle (TA), Température (TEMP), Fréquence cardiaque (FC), Saturation en oxygène (SPO2), Poids (POIDS), Glycémie capillaire.
- Ajout d'observations cliniques personnalisées ou bandelettes urinaires.
- Évaluation des seuils d'alerte clinique (HTA sévère, hypotension, fièvre, tachycardie, désaturation SpO2).
- Enregistrement structuré sur le dossier d'admission du patient via l'API Platform (`POST /api/acte_realises/{id}/observations`).
- Consultation de l'historique des constantes du dossier actif.

## 2. Permissions requises
- **Ressource** : `constante_vitale`
- **Actions** :
  - `constante_vitale:lire` : consultation des constantes enregistrées (`mode: 'lecture'`).
  - `constante_vitale:ecrire` : saisie et validation de nouvelles constantes (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/me/patient_en_cours` : Identification du patient et du dossier actif (`encounterId`).
- `GET /api/acte_realises?encounterId=...` : Liste des actes de l'encounter et de leurs observations.
- `GET /api/acte_definitions?realisableEncounterId=...` : Actes réalisables par le soignant dans ce service.
- `POST /api/acte_realises` : Création de l'acte support de constantes si non existant.
- `POST /api/acte_realises/{id}/observations` : Enregistrement de chaque mesure vitale unitaire.

## 4. Modèle métier
- `SigneVitalCode` : `'TA' | 'TEMP' | 'POIDS' | 'FC' | 'SPO2' | 'GLYCEMIE' | string`.
- `ObservationMesure` : `{ id, code, valeur, unite, interpretation, datePrise }`.
- `FormulaireConstantes` : `{ ta, temp, poids, fc, spo2, glycemie, commentaire, observationLibre }`.
- `AlerteClinique` : `{ type: 'warning' | 'danger'; message: string }`.

## 5. Composants UI
- `PanneauConstantesVitales` : Interface de saisie rapide avec pavés de saisie intuitifs, jauges de vigilance et historique des constantes du dossier en cours.
