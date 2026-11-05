# DOSSIER DE PASSATION TECHNIQUE & CONTEXTE — FRONTEND ASINA SIH

> **Système Intégré de Santé au Travail & Gestion Hospitalière — Madagascar**  
> Ce document consigne l'état complet du projet, son architecture logicielle en briques, l'ensemble des règles métier backend imposées, les écrans ergonomiques refondus selon la charte des 6 espaces de travail, et la cartographie des endpoints Symfony / API Platform.

---

## 1. Contexte Général & Spécificités Métier

### 1.1 Périmètre du projet
ASINA est une application web Single-Page (SPA) en React + TypeScript destinée à la gestion clinique et à la santé au travail pour des structures de type clinique et centres de santé à Madagascar.

- **Langue de l'interface** : Français intégral (libellés, aides, messages de statut et d'erreur).
- **Format des dates** : `jj/mm/aaaa` et heures `hh:mm` (fuseau horaire `Indian/Antananarivo`, UTC+3).
- **Devise / Numération** : Format monétaire et numérique standardisé avec séparateurs lisibles.
- **Identité visuelle de connexion** : Préservée à l'identique avec les couleurs officielles de la marque ASINA (Bleu `#1BB0EC`, Vert `#2FA14A`, Ambre `#FBB74A`, Encre `#0E2F44`) et la croix médicale en filigrane.

---

## 2. Contraintes Backend Absolues (Règles Métier Symfony)

L'application communique avec une API REST existante (Symfony + API Platform) sécurisée par JWT Bearer Token + Refresh Token. Toutes les règles métier sont autoritaires côté backend et reflétées strictement dans l'UX :

1. **Un utilisateur = un seul rôle métier** :
   - Aucun cumul de rôles. Le rôle est extrait directement du token JWT lors de la connexion (`ROLE_RECEPTION`, `ROLE_SECRETAIRE`, `ROLE_MEDECIN`, `ROLE_INFIRMIER`, `ROLE_DISPENSATEUR`, `ROLE_GESTIONNAIRE_STOCK`, `ROLE_RESPONSABLE_STOCK`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`).
   - Il ne change jamais durant la session.
2. **Un seul patient en cours de prise en charge par service à la fois** :
   - Le soignant (médecin ou infirmier) doit obligatoirement clôturer ou terminer la prise en charge active avant de pouvoir appeler ou prendre en charge un autre patient.
3. **Pas de passation d'actes entre soignants** :
   - L'auteur d'un acte médical (encounter, diagnostic posé, acte réalisé, observation) reste le seul habilité à le modifier ou le clôturer.
4. **Pas de dispensation partielle** :
   - Une ordonnance médicale est soit entièrement dispensée en une seule fois, soit pas du tout. En cas de rupture sur une seule ligne, un rollback complet est opéré par le serveur.
5. **Une seule ordonnance par prise en charge** :
   - Un encounter médical admet au maximum une seule prescription/ordonnance rattachée.
6. **Règle n°1 du Socle (Zéro Donnée Inventée)** :
   - Aucune donnée factice, aucun `Date.now()` en dur pour les identifiants, aucun mock local. Tout provient exclusivement des réponses HTTP de l'API Symfony. Les champs non modifiables ne sont jamais écrasés par le frontend.

---

## 3. Architecture Logicielle : Modèle en « Briques LEGO »

Le code est structuré selon un modèle en couches étanches avec une règle de dépendance unidirectionnelle stricte :
`src/noyau/` ← `src/briques/` ← `src/assemblages/` ← `src/cerveau/` ← `src/coquille/`

### 3.1 Découpage des répertoires
- `src/noyau/` : Socle indépendant et autonome.
  - `http/` : Client HTTP typé avec gestion automatique du Bearer token, refresh token et parsing JSON-LD / Hydra.
  - `notifications/` : Système de toasts et alertes non bloquantes (`useNotifier`).
  - `utils/` : Formatage dates (`jj/mm/aaaa`), gestionnaires d'erreurs d'API.
  - `ui/` : Composants de présentation génériques (Modale, TableauDonnees, BadgeStatut, SousOnglets, EmptyState, PatientCard, TicketPrintPreview).
- `src/briques/` : Briques fonctionnelles isolées contenant leur propre manifeste (`brique.ts`), types, appels d'API, hooks de données et composants graphiques :
  - `authentification/` : Écran de connexion (design marque d'origine préservé).
  - `patients/` : Fiches patients, complétion de profil, ayants droit, importation Excel.
  - `verification-adherents/` : Contrôle d'éligibilité entreprise/CNAPS, émission de ticket d'arrivée.
  - `tickets-accueil/` : File d'attente d'accueil, aiguillages vers services, appels guichet.
  - `rendez-vous/` : Agenda des rendez-vous par praticien et prise de créneaux.
  - `ecran-attente/` : Affichage autonome grand écran pour la salle d'attente (avec synthèse vocale et carillon).
  - `infirmerie-file/` & `consultation-file/` : Files d'attente ciblées par service médical.
  - `consultation-active/` : Workspace soignant (anamnèse, examen, diagnostics CIM-10, prescriptions, actes).
  - `constantes-vitales/` : Paramètres vitaux (TA, température, pouls, SpO2, poids).
  - `soins-actes/` : Réalisation d'actes de soins, observations et résultats.
  - `ordonnances/` : Gestion de la prescription médicale unique de l'encounter.
  - `pharmacie-catalogue/` : Nomenclature médicaments, formes, dosages et conditionnements.
  - `stock-niveaux/` : Niveaux de stocks consolidés ou mono-site avec seuils d'alerte.
  - `stock-dispensation/` : Délivrance au comptoir avec ordonnancement FEFO.
  - `stock-commandes/` : Commandes fournisseurs et réceptions.
  - `stock-appro/` : Enregistrement des approvisionnements et gestion des numéros de lot.
  - `stock-transferts/` : Transferts inter-établissements.
  - `stock-ajustements/` : Inventaires physiques et saisie d'écarts.
  - `sites/`, `services/`, `entreprises/`, `utilisateurs/`, `affectations/`, `catalogue-actes/`, `diagnostic-definitions/`, `type-encounters/` : Référentiels d'administration SIH.
- `src/assemblages/` : Orchestrateurs de vues par rôle regroupant les briques nécessaires sous une ergonomie unifiée :
  - `accueil/` : AssemblageAccueil (Bleu Ciel)
  - `infirmerie/` & `consultation/` : Espace Soins (Vert Émeraude)
  - `pharmacie/` : AssemblagePharmacie (Violet)
  - `stock/` : AssemblageStock (Ambre, multi-sites pour gestionnaire, mono-site pour responsable)
  - `administration/` : AssemblageAdministration (Gris Ardoise)
- `src/cerveau/` :
  - `session/` : État de l'utilisateur connecté, site actif et service actif.
  - `permissions/` : Matrice de contrôle d'accès basée sur les rôles (RBAC).
  - `registre/` : Registre des briques applicatives.
- `src/coquille/` : CoquilleApplicative, EnTete, BarreLaterale (gestion des 6 espaces, sélecteurs contextuels et navigation responsive).

---

## 4. Refonte Graphique & Ergonomique des 6 Espaces de Travail

Chaque espace de travail possède sa couleur dominante, son thème visuel propre dans la barre latérale et l'en-tête, et un tableau de bord optimisé pour son métier :

### 4.1 Espace Accueil (RECEPTION, SECRETAIRE) — Couleur Bleu Ciel `#0ea5e9`
- **Salle d'attente à deux colonnes** :
  - Colonne gauche : 4 onglets compteurs (« À émettre », « En attente », « Appelés », « RDV du jour »).
  - Colonne droite : Gros bouton d'action primaire « Émettre un ticket » en tête, suivi de la liste filtrée des tickets avec statut, heure d'émission, matricule et bouton d'action rapide.
- **Émission de ticket en modale plein écran** :
  - Moteur de recherche patient intelligent (nom, prénom, matricule).
  - Choix du service destinataire dans une liste déroulante filtrée.
  - Aperçu instantané du ticket thermique prêt à imprimer à droite avant confirmation.
- **Agenda & Calendrier des RDV** :
  - Vue semaine (lundi au dimanche) avec colonnes par personnel soignant.
  - Créneaux libres en gris clair et créneaux réservés en bleu.
  - Clic sur créneau pour prise de rendez-vous immédiate.
- **Fiches Patients** :
  - En-tête avec nom, prénom, matricule, entreprise affiliée, statut familial (Agent / Conjoint / Enfant) et bouton « Imprimer la carte ».
  - Onglets dédiés : Identité, Ayants droit, Historique des passages, RDV.
  - Complétion sécurisée : seuls les champs vides sont éditables pour respecter l'intégrité de l'API.

### 4.2 Espace Soins (MEDECIN, INFIRMIER) — Couleur Vert Émeraude `#10b981`
- **Écran « Mon Patient » focalisé** :
  - Si aucun patient en cours : Message clair d'attente et affichage de la file d'attente du service (3 à 5 prochains patients avec durée d'attente).
  - Si patient pris en charge : Bandeau permanent en tête avec identité, âge, matricule, numéro de ticket, chronomètre de consultation en cours et motif d'admission, complété par le bouton de clôture.
- **Workspace clinique complet** :
  - **Onglet Diagnostics** *(Médecin uniquement)* : Liste des diagnostics posés avec statuts `provisoire`, `confirme` ou `infirme`. Recherche nosologique sur le catalogue CIM-10 / CIM-11 et verrouillage médico-légal une fois infirmé.
  - **Onglet Actes** : Actes réalisables filtrés dynamiquement selon la qualification du soignant et le type de service.
  - **Onglet Observations** : Formulaires d'observations attendues groupées par acte avec étoiles rouges pour les observations obligatoires bloquantes.
  - **Onglet Ordonnance** : Création d'une prescription unique par encounter, ajout de lignes (médicament, quantité, posologie, durée) et verrouillage en lecture seule dès la délivrance ou l'annulation.
- **Règle de séparation de rôle** : L'infirmier n'accède pas à la saisie nosologique des diagnostics, réservée au médecin.

### 4.3 Espace Pharmacie (DISPENSATEUR) — Couleur Violet `#8b5cf6`
- **File de dispensation** :
  - Deux onglets dynamiques : « À dispenser » (avec badge compteur) et « Dispensées aujourd'hui ».
  - Cartes ordonnances claires affichant numéro, prescripteur, patient, matricule, délai écoulé, nombre de médicaments et total d'unités.
  - Bandeau d'avertissement ambre immédiat en cas de rupture de stock sur l'une des lignes prescrites.
- **Écran Focus de Dispensation (FEFO)** :
  - Modale plein écran avec tableau détaillé des lignes.
  - Attribution automatique du lot le plus proche de la péremption (règle FEFO).
  - Validation atomique en un clic : déstockage immédiat ou rollback complet avec message d'erreur si stock insuffisant.

### 4.4 Espace Stock — Couleur Ambre `#f59e0b`
- **Sous-vue Gestionnaire de Stock (`ROLE_GESTIONNAIRE_STOCK`) — Vision Multi-Sites** :
  - 4 cartes KPI : Commandes en cours, Appros en attente, Transferts en cours, Alertes stock bas.
  - Tableau consolidé multi-sites avec colonnes par établissement et total général.
  - Listes d'action en bas : Commandes à valider et transferts inter-sites.
  - Accès complet en écriture au catalogue produits et nomenclatures.
  - Sélecteur de site actif disponible en haut à droite.
- **Sous-vue Responsable de Stock (`ROLE_RESPONSABLE_STOCK`) — Vision Mono-Site** :
  - 3 cartes KPI : Réceptions à traiter, Inventaires à faire, Alertes stock bas.
  - Tableau du stock local du site affecté (Produit, Numéro de lot, Péremption, Quantité).
  - Deux boutons d'action clés : « Réceptionner un appro » et « Démarrer un inventaire ».
  - Verrouillage strict sur son propre site (sélecteur de site masqué) et catalogue en consultation seule.

### 4.5 Espace Administration (ADMIN, SUPER_ADMIN) — Couleur Gris Ardoise `#475569`
- **Arborescence d'administration** :
  - Utilisateurs & Staff, Sites Hospitaliers, Services Médicaux, Entreprises partenaires, Catalogue d'actes, Observations cliniques, Définitions diagnostics CIM-10, Types de prise en charge.
  - Tableaux filtrables et paginés avec actions contextuelles.
- **Règles d'intégrité administrative** :
  - Un acte ou un diagnostic ne peut jamais être supprimé physiquement : uniquement basculé en inactif (`isActive = false`).
  - Un administrateur ne peut pas se désactiver lui-même ni désactiver le dernier administrateur actif du système.
  - Affectations de personnel : un membre du staff ne peut avoir qu'une seule affectation principale active à la fois.

### 4.6 Refonte Ergonomique de la Navigation (Suppression de la Double Navigation Redondante)
- **Élimination des sous-onglets redondants horizontaux** :
  - Dans les assemblages (`AssemblageAccueil`, `AssemblageInfirmerie`, `AssemblageConsultation`, `AssemblageStock`, `AssemblageAdministration`), les barres horizontales d'onglets qui dupliquaient exactement les entrées de la barre latérale ont été éliminées.
  - La barre latérale (`BarreLaterale`) constitue désormais l'unique **centre de commande primaire** de navigation de l'espace de travail.
  - Cette refonte libère 50 à 60 pixels d'espace vertical utile sur tous les écrans médicaux et élimine la confusion cognitive liée à la double navigation.
  - Les seuls onglets conservés sont les **onglets internes de documents ou d'entités** (ex. : onglets de dossier patient *Identité / Ayants droit / Historique*, onglets de consultation active *Diagnostics / Actes / Observations / Ordonnance*, et commutateur en pilule ergonomique pour la Pharmacie *À dispenser / Dispensées*).

### 4.7 Verrouillage du Site et Service pour le Personnel Non-Admin (« Ne pas les fixer en haut »)
- **Verrouillage strict (règle métier hospitalière)** :
  - Pour les soignants et utilisateurs opérationnels non-administrateurs (`ROLE_MEDECIN`, `ROLE_INFIRMIER`, `ROLE_RECEPTION`, `ROLE_SECRETAIRE`, `ROLE_DISPENSATEUR`, `ROLE_RESPONSABLE_STOCK`), l'établissement hospitalier et le service médical sont **strictement verrouillés et fixés** sur leur affectation de poste (`utilisateur.siteId`, `utilisateur.serviceId`).
  - Aucun risque d'erreur humaine ou de permutation accidentelle de centre de santé pendant un soin ou une consultation.
- **Désengorgement total et design épuré de l'en-tête supérieur (`EnTete.tsx`)** :
  - Suppression complète de tout affichage textuel ou badge superflu de type « site affecté » ou « fixé » pour les soignants et utilisateurs non-admins.
  - L'espace de travail est immédiatement aéré, sans surcharge cognitive : l'en-tête ne présente que le logo, la pastille d'espace clinique, et les contrôles essentiels (profil soignant, déconnexion).
  - Pour les administrateurs et gestionnaires de stock ayant explicitement besoin de basculer de site, un sélecteur volant discret reste accessible sans encombrer la navigation.
  - Le pied de barre latérale a également été épuré pour afficher sobrement un statut de connexion système (« Système connecté ») sans mention redondante d'établissement.

### 4.8 Système de Menu Escamotable (Collapsible Sidebar) & Icônes Minimalistes
- **Architecture escamotable (2 modes d'affichage)** :
  - **Mode déployé (largeur 256px)** : Navigation complète avec icônes fines, titres, sous-titres contextuels, badges d'état (« Direct », « FEFO », « TV »), et sélecteur d'espace pour Super Admin.
  - **Mode escamoté / compact (largeur 68px)** : Rail minimaliste réduisant l'encombrement visuel au strict minimum pour maximiser l'espace de consultation clinique et de saisie.
  - **Transition fluide & ergonomique** : Animation CSS douce (`transition-all duration-300 ease-in-out`), bascule accessible via bouton dédié en haut, bouton en bas de rail, icône dans l'en-tête supérieur ou raccourci clavier global `Ctrl+B` / `Cmd+B`.
- **Info-bulles flottantes en mode escamoté** :
  - En mode replié, le survol de chaque icône affiche instantanément une info-bulle flottante non tronquée, avec la pastille de couleur du rôle, le titre du module, le badge d'état et le résumé fonctionnel.
- **Préservation intégrale du code couleur par rôle métier** :
  - **Médecin Clinicien (`ROLE_MEDECIN`)** : Vert Émeraude (`#10b981`).
  - **Infirmier de Soins (`ROLE_INFIRMIER`)** : Sarcelle / Vert d'eau médical (`#14b8a6`).
  - **Accueil & Réception (`ROLE_RECEPTION`, `ROLE_SECRETAIRE`)** : Bleu Ciel / Azur (`#0ea5e9`).
  - **Pharmacie & Dispensation (`ROLE_DISPENSATEUR`)** : Violet / Pourpre (`#8b5cf6`).
  - **Gestion de Stock (`ROLE_GESTIONNAIRE_STOCK`, `ROLE_RESPONSABLE_STOCK`)** : Ambre / Doré (`#f59e0b`).
  - **Administration SIH (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)** : Indigo / Bleu Nuit (`#6366f1`).
  - Chaque rôle bénéficie de son badge distinctif, de sa lueur subtile (`accentGlow`), de son indicateur actif vertical et de sa mise en valeur d'icône.

---

## 5. Cartographie des Liens Backend (API Platform & Endpoints)

| Domaine Métier | Méthodes & Endpoints Symfony | Modèle Frontend Associé |
| :--- | :--- | :--- |
| **Authentification** | `POST /api/login_check`<br>`GET /api/me`<br>`POST /api/token/refresh` | `UtilisateurConnecte`, `TokenJwt` |
| **Patients & Adhérents** | `GET /api/patients`<br>`PATCH /api/patients/{id}`<br>`POST /api/import-patients`<br>`POST /api/agents` | `FichePatient`, `AdherentInfo` |
| **Tickets & Aiguillages** | `POST /api/tickets`<br>`GET /api/aiguillages`<br>`POST /api/aiguillages/{id}/prendre_en_charge` | `TicketAccueil`, `Aiguillage` |
| **Prise en charge active** | `GET /api/me/patient_en_cours`<br>`POST /api/encounters/{id}/terminer` | `ConsultationEnCours`, `Encounter` |
| **Rendez-vous** | `GET /api/rendez-vous`<br>`POST /api/rendez-vous`<br>`POST /api/rendez-vous/{id}/confirmer-arrivee`<br>`DELETE /api/rendez-vous/{id}` | `RendezVous`, `PlanningCreneau` |
| **Catalogue & Actes** | `GET /api/categorie_actes`<br>`GET /api/acte_definitions`<br>`POST /api/acte_definitions`<br>`PUT /api/acte_definitions/{id}/codifications` | `CategorieActe`, `ActeDefinition` |
| **Actes Soignants & Soins** | `POST /api/acte_realises`<br>`POST /api/acte_realises/{id}/resultats`<br>`POST /api/acte_realises/{id}/observations`<br>`PATCH /api/acte_realises/{id}/statut` | `ActeRealise`, `ObservationSaisie` |
| **Diagnostics CIM-10** | `GET /api/diagnostic_definitions`<br>`POST /api/diagnostic_definitions`<br>`POST /api/diagnostics` | `DiagnosticDefinition`, `DiagnosticEncounter` |
| **Prescriptions Médicales** | `GET /api/ordonnances`<br>`POST /api/ordonnances`<br>`PATCH /api/ordonnances/{id}` | `Prescription`, `DetailPrescription` |
| **Pharmacie & Stocks** | `GET /api/stocks`<br>`GET /api/lots`<br>`POST /api/dispensations`<br>`POST /api/commandes`<br>`POST /api/transferts`<br>`POST /api/ajustements` | `StockLigne`, `Lot`, `Dispensation` |
| **Administration SIH** | `GET/POST/PUT /api/sites`<br>`GET/POST/PUT /api/services`<br>`GET/POST/PUT /api/companies`<br>`GET/POST/PUT /api/users`<br>`GET/POST/PUT /api/assignments` | `SiteHospitalier`, `ServiceMedical`, `CompteUtilisateur` |

---

## 6. Suggestions d'Améliorations & Évolutions Futures

1. **Impression thermique directe (ESC/POS & WebUSB / WebBluetooth)** :
   - Intégrer un pilote d'impression thermique pour les tickets d'accueil (format 80mm ou 58mm) et les étiquettes code-barres des flacons de médicaments directement sans passer par la boîte de dialogue standard du navigateur.
2. **Synchronisation en Temps Réel via Mercure / Server-Sent Events (SSE)** :
   - Brancher le hub Mercure de Symfony sur la file d'attente d'accueil et l'écran salle d'attente pour actualiser instantanément l'appel des tickets et les temps d'attente sans requêtes de rafraîchissement périodique (polling).
3. **Mode Dégradé Hors-Ligne (Offline Queue / PWA)** :
   - En contexte de connexion instable ou de coupure réseau dans certains centres médicaux isolés de province, introduire un cache local de consultation des fiches patients et une file d'attente locale de synchronisation pour l'émission des tickets d'accueil dès le rétablissement de la liaison.
4. **Export Réglementaire CNAPS & Statistiques Médicales** :
   - Générateur de rapports périodiques de santé au travail conformes aux formats exigés par la médecine du travail et la caisse nationale de prévoyance sociale à Madagascar.
