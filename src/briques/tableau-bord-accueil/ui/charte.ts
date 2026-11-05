// ui/charte.ts : tokens de la charte de design ASINA Médical

export const CHARTE = {
  // Vert : uniquement action principale et état actif / sélectionné
  primaire: '#1f9d55',
  primaireFonce: '#14703c',
  primaireClair: '#e7f6ed',

  bleuNuit: '#0f1b3d',
  navInactive: '#1f2f5c',

  encre: '#1f2937',
  secondaire: '#5b6472',
  bordure: '#e5e7eb',
  separateur: '#f0f2f1',
  fondPage: '#f6f8f7',
  surface: '#ffffff',
  enteteTableau: '#fafbfa',

  alerteFond: '#fff4e0',
  alerteTexte: '#8a5300',
  codeExterneFond: '#eef2ff',
  codeExterneTexte: '#3730a3',
  erreur: '#b42318',
  overlay: 'rgba(15,27,61,.45)',
  interrupteurInactif: '#cbd5e1',

  // Dérivés pour les graphiques (hors vert, réservé à l'action et à l'actif)
  serie1: '#1f9d55', // vert primaire
  serie2: '#3730a3', // indigo (couleur des codifications externes)
  indigoFond: '#eef2ff',
  indigoBord: '#c7d2fe',
  remplissage: '#e7f6ed', // vert clair

  // Nuances dérivées pour les pastilles et alertes (fonds clairs et bordures)
  erreurFond: '#fdecea',
  erreurBord: '#f4c7c3',
  alerteBord: '#f3d9a8',
  primaireBord: '#bfe5cd',
} as const;

// Statuts de rendez-vous : le sens est aussi porté par l'étiquette texte du graphique
export const COULEUR_STATUT: Record<string, string> = {
  'Honoré': CHARTE.primaire,
  'Planifié': CHARTE.codeExterneTexte,
  'Confirmé': CHARTE.primaireFonce,
  'Annulé': CHARTE.alerteTexte,
  'Absent': CHARTE.erreur,
};

export const PALETTE_NEUTRE = [CHARTE.primaire, CHARTE.codeExterneTexte, CHARTE.alerteTexte];

// Focus visible en vert (accessibilité). Chaîne complète pour que Tailwind la détecte.
export const CLASSE_FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1f9d55]';