# ASINA Medical — Étude Globale, Ergonomie & Suggestions d'Évolution SIH / Santé au Travail

> **Document de cadrage fonctionnel, ergonomique et d'intégration backend.**  
> Ce document formalise l'analyse de l'application **ASINA Medical** (Association Sanitaire Interentreprises d'Antananarivo - SMIE), les améliorations d'interface apportées et les propositions fonctionnelles pour renforcer la dimension **Santé au Travail & Médecine Préventive/Curative**.

---**

## 1. Contexte Métier & Architecture du Projet

### A. La Spécificité ASINA
L'ASINA a pour mission d'assurer le suivi médical des travailleurs des entreprises adhérentes ainsi que les soins curatifs sur ses centres médico-sociaux et dispensaires :
- **Médecine du Travail (Prévention & Droit du Travail)** : Contrôle d'éligibilité des salariés (CNAPS, cotisations entreprises), visites médicales réglementaires, fiches d'aptitude, prévention des risques professionnels.
- **Activité Clinique & Hospitalière (Curatif)** : Accueil et triage physique par tickets d'aiguillage, soins infirmiers et administration de constantes, consultations de médecine générale, pharmacie de dispensation et approvisionnement en médicaments.

### B. Architecture en « Briques Lego »
L'application respecte un sens d'import unidirectionnel strict :
$$\text{Noyau (Socle)} \quad\longleftarrow\quad \text{Briques (Métiers)} \quad\longleftarrow\quad \text{Assemblages (Écrans)} \quad\longleftarrow\quad \text{Cerveau (Session \& RBAC)} \quad\longleftarrow\quad \text{Coquille (Layout)}$$

- **Zéro mock local** : Toutes les données proviennent fidèlement de l'API Symfony / API Platform (`Hydra / JSON-LD`).
- **Autonomie des briques** : Chaque brique isole son modèle TypeScript en français, son API avec mapping DTO, ses hooks React et ses composants de présentation.
- **Sécurité RBAC intégrée** : Décodage des rôles Symfony (`ROLE_ADMIN`, `ROLE_MEDECIN`, `ROLE_INFIRMIER`, `ROLE_RECEPTION`, `ROLE_GESTIONNAIRE_STOCK`) avec résolution dynamique des modes d'affichage (`edition`, `lecture`, `masque`).

---

## 2. Améliorations de Design & Ergonomie Réalisées

1. **Typographie Médicale Haute Lisibilité** :
   - Remplacement de la police par défaut par **Plus Jakarta Sans** (clarté typographique chirurgicale, distinction instantanée des caractères) et **JetBrains Mono** pour les numéros de dossiers, codes CIM-10, lots pharmaceutiques et tickets d'attente.
   - Encodage strict des chiffres en **chiffres tabulaires (`tabular-nums`)** pour supprimer tout décalage visuel lors du défilement des files ou des constantes.

2. **En-Tête Clinique Opérationnel (`EnTete.tsx`)** :
   - **Sélecteur de Site Hospitalier Actif** : Permet au personnel soignant et administratif de changer instantanément d'établissement (ex: *Site Principal*, *Dispensaire Tanjombato*, *Zone Industrielle*) avec rechargement immédiat des files et des stocks correspondants.
   - **Sélecteur de Service Actif** : Raccordement dynamique au service rattaché au site (Infirmerie, Médecine générale, Prélèvement, etc.).
   - **Raccourci Salle d'Attente** : Accès direct à l'écran de projection public (`/ecran-attente`) pour guichet et accueil.
   - **Badge d'Identité Soignant** : Indication du nom complet (`Dr. ...` ou Prénom Nom) avec rôle de santé formalisé.

3. **Sous-Navigation Segmentée Haute Définition (`SousOnglets.tsx`)** :
   - Transformation de la barre d'onglets en un contrôle segmenté moderne à fort contraste, avec support des badges numériques tabulaires (`tabular-nums`) et focus accessible.

4. **Tableaux Cliniques & Listes de Suivi (`TableauDonnees.tsx`)** :
   - Hauteur de ligne optimisée ($38\text{px}$–$42\text{px}$) pour maximiser la densité d'information sans surcharger.
   - Squelettes animés fluides lors du chargement des données API au lieu d'un unique spinner statique.
   - États vides contextuels avec guidage opérationnel.

5. **Bandeau de Consultation Active Permanente (`AssemblageConsultation.tsx`)** :
   - Affichage persistant d'un bandeau clinique en tête de vue lorsqu'un patient est en cours d'examen (identifiant, numéro de ticket, raccourci direct vers ses antécédents médicaux).

---

## 3. Matrice de Suggestions & Spécifications Backend

Pour enrichir l'application en consolidant son rôle de référence en santé au travail, voici les modules recommandés avec leurs **spécifications backend exactes** (mises en valeur en blocs clairs).

```
========================================================================================
SUGGESTION 1 : FICHE D'APTITUDE MÉDICALE AU TRAVAIL (MÉDECINE DU TRAVAIL)
========================================================================================
```

### 1.1 Contexte & Intérêt Clinique
À l'issue de chaque consultation de médecine du travail, le médecin doit obligatoirement émettre une **Fiche d'Aptitude Médicale** à destination du salarié et du service des ressources humaines de l'entreprise adhérente.  
Actuellement, la clôture médicale (`POST /api/encounters/{id}/terminer`) libère le dossier mais n'enregistre pas la conclusion formelle d'aptitude.

### 1.2 Modalités d'Aptitude Réglementaires
1. **Apte sans réserve** : Le salarié peut exercer l'intégralité des tâches de son poste.
2. **Apte avec aménagements / réserves** : Recommandations ergonomiques (ex: pas de port de charges $> 15\text{kg}$, aménagement de poste sur écran, port obligatoire d'EPI renforcés).
3. **Inapte temporaire** : Période d'arrêt ou reclassement transitoire avec date de re-convocation.
4. **Inapte définitif** : Nécessite une procédure d'étude de poste et de reclassement avec l'employeur.

```
----------------------------------------------------------------------------------------
LIEN BACKEND SYMFONY / API PLATFORM (BLOC BLANC) :
----------------------------------------------------------------------------------------
Route API       : POST /api/encounters/{id}/aptitude
Méthode HTTP    : POST (ou PATCH sur /api/encounters/{id})
Rôle requis     : ROLE_MEDECIN

Payload d'entrée (Input DTO) :
{
  "conclusion": "apte" | "apte_avec_amenagement" | "inapte_temporaire" | "inapte_definitif",
  "restrictions": [
    "PORT_CHARGES_LOURDES",
    "TRAVAIL_HAUTEUR",
    "TRAVAIL_NUIT",
    "EXPOSITION_SOLVANTS"
  ],
  "commentairesEmployeur": "Aménagement recommandé : siège ergonomique et alternance assis/debout.",
  "commentairesMedicauxConfidentiels": "Suivi lumbago chronique L4-L5, ne pas mentionner le diagnostic dans la fiche RH.",
  "dateReconvocation": "2027-04-15"
}

Réponse attendue (Output DTO) :
{
  "@id": "/api/encounters/142",
  "id": 142,
  "statut": "termine",
  "ficheAptitude": {
    "id": 89,
    "conclusion": "apte_avec_amenagement",
    "pdfUrl": "/api/fiches_aptitude/89/pdf",
    "dateEmission": "2026-10-14T11:30:00Z",
    "medecinNom": "Dr. Randrianasolo"
  }
}
----------------------------------------------------------------------------------------
```

---

```
========================================================================================
SUGGESTION 2 : TYPOLOGIE ÉTENDUE DES VISITES DE SANTÉ AU TRAVAIL
========================================================================================
```

### 2.1 Contexte & Intérêt Clinique
Les visites en SMIE ne sont pas de simples consultations généralistes. Elles répondent à des échéances et obligations légales strictes. Le système dispose déjà du référentiel `TypeEncounter`, mais son utilisation doit être explicitée lors de la **prise de rendez-vous**, de **l'émission du ticket** et de **l'accueil**.

### 2.2 Types de Visites à Intégrer :
- **Visite d'Embauche (VIP - Visite d'Information et de Prévention)** : Obligatoire dans les 3 mois suivant la prise de poste.
- **Visite Périodique Obligatoire** : Tous les 1 à 2 ans selon le poste et l'âge.
- **Visite de Reprise du Travail** : Obligatoire après arrêt de travail pour accident de travail, maladie professionnelle ou arrêt $> 30\text{ jours}$.
- **Visite de Pré-reprise** : Organisée pendant l'arrêt de travail pour préparer l'adaptation du poste.
- **Visite Occasionnelle / Spontanée** : À la demande du salarié ou de l'employeur.

```
----------------------------------------------------------------------------------------
LIEN BACKEND SYMFONY / API PLATFORM (BLOC BLANC) :
----------------------------------------------------------------------------------------
Route API       : GET /api/type_encounters?actif=true&categorie=sante_travail
Méthode HTTP    : GET
Rôle requis     : Tout utilisateur authentifié (ROLE_RECEPTION, ROLE_MEDECIN, etc.)

Réponse attendue :
[
  {
    "id": 1,
    "code": "VISITE_EMBAUCHE",
    "libelle": "Visite Préalable à l'Embauche",
    "periodiciteMois": null,
    "delaiReglementaireJours": 90,
    "supporteAiguillage": true
  },
  {
    "id": 2,
    "code": "VISITE_PERIODIQUE",
    "libelle": "Visite Périodique Systématique",
    "periodiciteMois": 24,
    "delaiReglementaireJours": null,
    "supporteAiguillage": true
  },
  {
    "id": 3,
    "code": "VISITE_REPRISE",
    "libelle": "Visite de Reprise après Arrêt",
    "periodiciteMois": null,
    "delaiReglementaireJours": 8,
    "supporteAiguillage": true
  }
]

Intégration dans la réservation de RDV :
POST /api/rendez-vous
{
  "patientId": 450,
  "typeEncounterId": 3,
  "dateRdv": "2026-10-20",
  "motif": "Reprise après arrêt maladie de 45 jours"
}
----------------------------------------------------------------------------------------
```

---

```
========================================================================================
SUGGESTION 3 : SURVEILLANCE MÉDICALE RENFORCÉE (SIR / SMR) & MATRICE DES RISQUES
========================================================================================
```

### 3.1 Contexte & Intérêt Clinique
Certains postes de travail en entreprise adhérente (usines textiles, BTP, ateliers mécaniques, laboratoires, chauffeurs) exposent les travailleurs à des risques spécifiques :
- Risques chimiques (solvants, poussières textiles, métaux lourds).
- Risques physiques (bruit $> 80\text{ dB(A)}$, vibrations, travail de nuit, travail au froid/chaud).
- Risques ergonomiques (manutention de charges, postures contraignantes, gestes répétitifs).

Le médecin du travail doit pouvoir consulter et associer ces risques au dossier médical du patient.

```
----------------------------------------------------------------------------------------
LIEN BACKEND SYMFONY / API PLATFORM (BLOC BLANC) :
----------------------------------------------------------------------------------------
Route API       : GET /api/patients/{id}/expositions_professionnelles
Méthode HTTP    : GET
Rôle requis     : ROLE_MEDECIN, ROLE_INFIRMIER

Réponse attendue :
{
  "patientId": 450,
  "entrepriseId": 12,
  "posteActuel": "Opérateur découpe industrielle",
  "datePrisePoste": "2022-03-01",
  "estSousSurveillanceRenforcee": true,
  "facteursRisques": [
    {
      "code": "BRUIT_LEQ85",
      "libelle": "Exposition sonore continue > 85 dBA",
      "frequenceSurveillanceMois": 12,
      "examensRecommandes": ["AUDIOGRAMME"]
    },
    {
      "code": "POUSSIERE_COTON",
      "libelle": "Poussières organiques de coton / textile",
      "frequenceSurveillanceMois": 12,
      "examensRecommandes": ["SPIROMETRIE_EFR", "RADIOGRAPHIE_PULMONAIRE"]
    }
  ]
}

Enregistrement d'un examen cible (ex: Audiométrie ou Spirométrie) :
POST /api/acte_realises
{
  "encounterId": 142,
  "acteDefinitionId": 48,  // Ex: Audiogramme de dépistage
  "statut": "realise",
  "resultats": [
    {
      "type": "Audiométrie tonale",
      "conclusion": "Léger déficit bilatéral sur les 4000 Hz, compatible avec traumatisme sonore professionnel",
      "interpretation": "Alerte début de surdité professionnelle, renforcement des protecteurs auditifs nécessaire"
    }
  ]
}
----------------------------------------------------------------------------------------
```

---

```
========================================================================================
SUGGESTION 4 : CARNET VACCINAL ÉLECTRONIQUE DU TRAVAILLEUR
========================================================================================
```

### 4.1 Contexte & Intérêt Clinique
La protection vaccinale est un pilier de la santé au travail (tétanos pour les ouvriers et agents de maintenance, hépatite B pour le personnel soignant et d'hygiène, typhoïde pour la restauration collective).  
Actuellement, l'infirmerie peut saisir des actes libres, mais un **suivi vaccinal dédié** permet de planifier les rappels et d'alerter si un salarié est en retard de vaccination lors de sa visite.

```
----------------------------------------------------------------------------------------
LIEN BACKEND SYMFONY / API PLATFORM (BLOC BLANC) :
----------------------------------------------------------------------------------------
Route API       : GET /api/patients/{id}/vaccinations
Méthode HTTP    : GET
Rôle requis     : ROLE_MEDECIN, ROLE_INFIRMIER

Réponse attendue :
[
  {
    "id": 12,
    "vaccin": "DTCaP (Diphtérie-Tétanos-Coqueluche-Poliomyélite)",
    "dateInjection": "2021-06-15",
    "numeroLot": "VT48921",
    "dateProchainRappel": "2031-06-15",
    "statut": "a_jour",
    "administrePar": "Inf. Ravelomanana"
  },
  {
    "id": 13,
    "vaccin": "Hépatite B",
    "dateInjection": "2024-01-10",
    "numeroLot": "HB-99120",
    "dateProchainRappel": "2024-07-10",
    "statut": "rappel_en_retard",
    "administrePar": "Inf. Ravelomanana"
  }
]

Enregistrement d'une injection vaccinale :
POST /api/vaccinations
{
  "patientId": 450,
  "encounterId": 142,
  "medicamentId": 84, // Référence vaccin du stock
  "lotId": 19,
  "dateInjection": "2026-10-14",
  "siteInjection": "Deltoïde gauche",
  "dateProchainRappel": "2031-10-14"
}
----------------------------------------------------------------------------------------
```

---

```
========================================================================================
SUGGESTION 5 : CONTRÔLE D'ALLERGIES & D'INTERACTIONS EN PRESCRIPTION MÉDICALE
========================================================================================
```

### 5.1 Contexte & Intérêt Clinique
Dans `PanneauConsultationActive`, le médecin prescrit des ordonnances électroniques via `POST /api/ordonnances`.  
Pour la sécurité du patient, un contrôle préventif des allergies déclarées (ex: Pénicilline, AINS, Sulfamides) et des contre-indications doit être affiché sous forme d'avertissement visuel avant la validation de l'ordonnance.

```
----------------------------------------------------------------------------------------
LIEN BACKEND SYMFONY / API PLATFORM (BLOC BLANC) :
----------------------------------------------------------------------------------------
Route API       : POST /api/prescriptions/analyser_risques
Méthode HTTP    : POST
Rôle requis     : ROLE_MEDECIN

Payload envoyé pour vérification à la volée :
{
  "patientId": 450,
  "medicamentsIds": [12, 45]
}

Réponse du moteur de règles cliniques :
{
  "bloquant": false,
  "alertes": [
    {
      "niveau": "CRITIQUE",
      "medicamentId": 12,
      "message": "Le patient présente une allergie documentée aux Bêta-lactamines."
    },
    {
      "niveau": "ATTENTION",
      "medicamentId": 45,
      "message": "Association AINS + Anticoagulant : risque hémorragique majoré."
    }
  ]
}
----------------------------------------------------------------------------------------
```

---

```
========================================================================================
SUGGESTION 6 : RAPPORT ANNUEL D'ACTIVITÉ SMIE & STATISTIQUES CNAPS
========================================================================================
```

### 6.1 Contexte & Intérêt Clinique
Chaque année, les SMIE ont l'obligation légale de présenter le **Rapport Annuel d'Activité Médicale** au Comité d'Entreprise et aux inspecteurs du travail, ainsi qu'à la CNAPS :
- Répartition des salariés examinés par catégorie socioprofessionnelle.
- Pathologies professionnelles et courantes diagnostiquées (chapitres CIM-10).
- Nombre de fiches d'aptitude délivrées (avec ou sans aménagement, inaptitudes).
- Accidents du travail déclarés et suivis.

```
----------------------------------------------------------------------------------------
LIEN BACKEND SYMFONY / API PLATFORM (BLOC BLANC) :
----------------------------------------------------------------------------------------
Route API       : GET /api/rapports/activite_sante_travail
Méthode HTTP    : GET
Paramètres URL  : annee=2026&companyId=14&siteId=1
Rôle requis     : ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_MEDECIN

Réponse attendue :
{
  "periode": "2026",
  "entreprise": {
    "id": 14,
    "nom": "Société Textile Tana",
    "effectifAdherent": 1250
  },
  "statistiquesVisites": {
    "totalVisitesRealisees": 980,
    "embauches": 180,
    "periodiques": 720,
    "reprises": 60,
    "spontanees": 20
  },
  "conclusionsAptitude": {
    "aptesSansRestriction": 920,
    "aptesAvecAmenagement": 48,
    "inaptesTemporaires": 10,
    "inaptesDefinitifs": 2
  },
  "topPathologiesCim10": [
    { "chapitre": "M00-M99", "libelle": "Troubles Musculo-Squelettiques (TMS)", "nb": 210 },
    { "chapitre": "H90-H95", "libelle": "Affections de l'oreille / audition", "nb": 85 },
    { "chapitre": "J00-J99", "libelle": "Affections respiratoires", "nb": 64 }
  ],
  "exportPdfUrl": "/api/rapports/activite_sante_travail/export-pdf?annee=2026&companyId=14"
}
----------------------------------------------------------------------------------------
```

---

## 4. Synthèse d'Implémentation & Prochaines Étapes

| Évolution | Effort Front | Statut Backend | Impact Métier |
| :--- | :--- | :--- | :--- |
| **Fiche d'Aptitude Médicale** | 2 jours (Modale + Template PDF) | Nouveau DTO `AptitudeInput` sur Symfony | **Critique** (Obligation légale de santé au travail) |
| **Typologie Visites SMIE** | 0.5 jour (filtres déjà prévus) | Prise en charge dans `POST /rendez-vous` | **Élevé** (Fluidité accueil et aiguillage) |
| **Matrice des Risques / SIR** | 1.5 jour (panneau dans Dossiers) | Entité `ExpositionProfessionnelle` | **Élevé** (Médecine préventive de précision) |
| **Carnet Vaccinal Salarié** | 1 jour (sous-onglet Infirmerie) | Table `vaccinations` rattachée au patient | **Moyen / Élevé** (Suivi réglementaire d'hygiène) |
| **Contrôle Allergies / Prescriptions** | 1 jour (avertissement consultation) | Endpoint d'analyse pré-enregistrement | **Critique** (Sécurité du patient) |
| **Rapports SMIE & CNAPS** | 2 jours (nouvel onglet Admin/Pilotage) | Requêtes d'agrégation SQL / Doctrine | **Stratégique** (Conformité institutionnelle) |

L'application **ASINA Medical** dispose désormais d'un socle technique stable, compilé et prêt à accueillir ces évolutions tout en conservant son architecture en briques Lego rigoureusement typée.
