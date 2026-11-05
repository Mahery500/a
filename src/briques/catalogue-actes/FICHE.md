# Fiche Brique : Catalogue d'Actes Médicaux (`catalogue-actes`)

## 1. Rôle & Responsabilité
Gère le référentiel et la nomenclature officielle des actes médicaux et de soins infirmiers :
- Définition des actes avec libellés, codes permanents, catégories cliniques associées, profils autorisés (`ROLE_MEDECIN`, `ROLE_INFIRMIER`), et services applicables.
- Activation / désactivation des actes (les actes ne sont jamais supprimés physiquement pour garantir la traçabilité médico-légale des dossiers patients).
- Consultation et création des catégories d'actes cliniques.

## 2. Permissions requises
- **Ressource** : `catalogue_actes`
- **Actions** :
  - `catalogue_actes:lire` : affichage et filtrage du catalogue en mode consultation seule (`mode: 'lecture'`).
  - `catalogue_actes:ecrire` : activation des boutons de création, modification et bascule d'état actif/inactif (`mode: 'edition'`).

## 3. Endpoints réels appelés
- `GET /api/acte_definitions` : Liste complète des actes du catalogue (actifs et inactifs).
- `POST /api/acte_definitions` : Création d'un acte `{ code, libelle, categorieCode, rolesAutorises, typeServiceIds? }`.
- `PATCH /api/acte_definitions/{id}` : Modification ciblée d'un acte (`application/merge-patch+json`).
- `POST /api/acte_definitions/{id}/activation` : Activation / désactivation de l'acte `{ actif: boolean }`.
- `GET /api/acte_definitions/{id}/observations` : Récupération du moule d'observations attendues pour cet acte.
- `PUT /api/acte_definitions/{id}/observations` : Enregistrement du moule d'observations attendues `{ observations: [{ observationId, ordre, obligatoire }] }`.
- `GET /api/categorie_actes` : Liste des catégories de la nomenclature.
- `POST /api/categorie_actes` : Création d'une catégorie `{ code, libelle }`.
- `GET /api/type-services` : Référentiel des types de services pour le ciblage sans dépendance inter-briques.
- `GET /api/code_systems` : Référentiel des systèmes de codification (LOINC, CCAM, CIM-10, SNOMED).
- `POST /api/code_systems` : Création d'un système de codification.
- `POST /api/code_systems/{id}/activation` : Activation / désactivation d'un système de codification.
- `PUT /api/acte_definitions/{id}/codifications` : Mise à jour des codifications de l'acte `{ codifications: [{ codeSystem, code, libelle? }] }`.

## 4. Modèle métier
- `ActeMedical` : `{ id, code, libelle, actif, categorie: { id, code, libelle }, rolesAutorises, typeServiceIds, codifications }`.
- `CategorieActe` : `{ id, code, libelle }`.
- `CodeSystemeOption` : `{ id, code, libelle, uri, actif }`.
- `CodificationActe` : `{ codeSystem, code, libelle? }`.
- `NouvelActeInput` : `{ code, libelle, categorieCode, rolesAutorises, typeServiceIds?, codifications? }`.
- `ModificationActeInput` : `{ libelle?, categorieCode?, rolesAutorises?, typeServiceIds?, actif?, codifications? }`.
- `NouvelleCategorieInput` : `{ code, libelle }`.

## 5. Composants UI
- `PanneauCatalogueActes` : Panneau principal avec cartes de statistiques, filtres combinés (catégorie, profil, statut, recherche), gestion des terminologies et tableau des actes avec moule d'observations et codifications.
- `FormulaireActeModale` : Fenêtre de création/modification d'un acte (code verrouillé en édition, sélection de catégorie, cases à cocher des profils et services, codification initiale).
- `FormulaireCodificationsActeModale` : Fenêtre d'association et gestion des codes externes par acte (CCAM, LOINC, CIM-10, etc.).
- `FormulaireCategorieModale` : Fenêtre de consultation des catégories existantes et ajout rapide.

## 6. Audit Règle n°1
- Zéro mock, zéro valeur inventée (`Date.now()`, `|| 1`).
- Codes techniques saisis en majuscules sans auto-génération arbitraire.
- Filtrage strict des identifiants numériques valides (`id > 0`).
- Documentation dans `API_MANQUANTES.md` de l'absence de DELETE/PATCH sur `/categorie_actes` et de DELETE sur `/acte_definitions`.
