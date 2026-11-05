import { useState } from "react";
import { MobileHeader, MobileMenu, type MobileMenuSection } from "@/noyau/ui/mobile";
import { Users, Activity, Building2, LayoutGrid, FileText, Award } from "lucide-react";

const [menuOuvert, setMenuOuvert] = useState(false);

const sections: MobileMenuSection[] = [
  {
    titre: "ACCÈS & PERSONNEL",
    items: [
      { id: "utilisateurs", libelle: "Comptes Utilisateurs", icone: <Users className="w-[18px] h-[18px]" />, badge: stats.total },
      { id: "affectations", libelle: "Affectations Personnel", icone: <Activity className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    titre: "STRUCTURE",
    items: [
      { id: "sites", libelle: "Sites Hospitaliers", icone: <Building2 className="w-[18px] h-[18px]" /> },
      { id: "services", libelle: "Services Médicaux", icone: <LayoutGrid className="w-[18px] h-[18px]" /> },
      { id: "entreprises", libelle: "Entreprises Adhérentes", icone: <Building2 className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    titre: "RÉFÉRENTIELS CLINIQUES",
    items: [
      { id: "catalogue-actes", libelle: "Catalogue des Actes", icone: <FileText className="w-[18px] h-[18px]" /> },
      { id: "observations", libelle: "Observations Cliniques", icone: <Activity className="w-[18px] h-[18px]" /> },
      { id: "cim10", libelle: "Définitions CIM-10", icone: <FileText className="w-[18px] h-[18px]" /> },
      { id: "type-encounters", libelle: "Types de Prise en Charge", icone: <LayoutGrid className="w-[18px] h-[18px]" /> },
      { id: "competences", libelle: "Compétences & Habilitations", icone: <Award className="w-[18px] h-[18px]" /> },
    ],
  },
];

<MobileHeader
  titre="Utilisateurs"
  sousTitre={siteNom ?? "ASINA Antananarivo"}
  onMenuClick={() => setMenuOuvert(true)}
  onSousTitreClick={() => setSelecteurSiteOuvert(true)}
  onSearchClick={() => setRechercheOuverte(true)}
  notificationsCount={3}
  onNotificationsClick={() => setNotifsOuvertes(true)}
/>

<MobileMenu
  ouvert={menuOuvert}
  onFermer={() => setMenuOuvert(false)}
  sections={sections}
  actifId={routeActiveId}
  onNaviguer={(id) => naviguer(id)}
  siteLibelle={siteNom}
  onSiteClick={() => setSelecteurSiteOuvert(true)}
  utilisateur={{
    nom: utilisateur.nom || utilisateur.login,
    role: utilisateur.libelleRole,
    initiales: initiales(utilisateur),
  }}
  onDeconnexion={deconnecter}
  onEcranSalleAttente={() =>
    window.open("/ecran-attente", "asina-ecran-attente", "noopener,noreferrer")
  }
/>