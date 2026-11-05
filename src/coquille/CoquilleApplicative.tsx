/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Menu as MenuIcon } from "lucide-react";

import { useSession } from "@/cerveau/session";
import { resoudreModeBrique } from "@/cerveau/permissions";

import { PanneauAuthentification } from "@/briques/authentification";
import type { UtilisateurConnecte } from "@/briques/authentification";
import { useSites } from "@/briques/sites";

import {
  AssemblageAccueil,
  AssemblageInfirmerie,
  AssemblageConsultation,
  AssemblagePharmacie,
  AssemblageStock,
  AssemblageAdministration,
} from "@/assemblages";

import { EnTete } from "./EnTete";
import { BarreLaterale, VueCoquille } from "./BarreLaterale";
import { PageSansAffectation } from "./PageSansAffectation";

import { construireEspaces, ESPACES_SELECTEUR } from "./espaces";

import {
  useIsMobile,
  MobileHeader,
  MobileBottomNav,
  MobileMenu,
} from "@/noyau/ui/mobile";

/* -------------------------------------------------------------------------- */
/* Raccourcis de navigation mobile                                            */
/* -------------------------------------------------------------------------- */

/**
 * Les trois raccourcis affichés dans la barre inférieure.
 * Les autres écrans restent accessibles depuis le menu « Plus ».
 *
 * Si une vue n'est pas définie ici, les trois premiers écrans
 * de cette vue sont utilisés automatiquement.
 */
const RACCOURCIS_MOBILE: Partial<Record<VueCoquille, string[]>> = {
  consultation: ["file", "active", "dossiers"],
  administration: ["tableau-bord-admin", "utilisateurs", "sites"],
};

/* -------------------------------------------------------------------------- */
/* Point d'entrée : aiguillage avant/après authentification                   */
/* -------------------------------------------------------------------------- */

export const CoquilleApplicative: React.FC = () => {
  const { estConnecte, utilisateur, definirUtilisateur } = useSession();

  // ── Aucun hook de données (pas de useSites, useIsMobile, etc.) avant ce point ──
  // Toute requête partirait sans jeton JWT → 401 → notifications en cascade.
  if (!estConnecte || !utilisateur) {
    return <PanneauAuthentification onConnexionReussie={definirUtilisateur} />;
  }

  if (utilisateur.sansAffectation) {
    return <PageSansAffectation />;
  }

  // ── Le shell authentifié ne s'instancie qu'une fois `utilisateur` non null. ──
  // Au logout / 401, il est démonté : plus aucun fetch en arrière-plan.
  return <ShellAuthentifie utilisateur={utilisateur} />;
};

/* -------------------------------------------------------------------------- */
/* Shell authentifié : navigation, données, layout                            */
/* -------------------------------------------------------------------------- */

interface ShellAuthentifieProps {
  utilisateur: UtilisateurConnecte;
}

const ShellAuthentifie: React.FC<ShellAuthentifieProps> = ({ utilisateur }) => {
  const { siteActifId, serviceActifId, deconnecter } = useSession();

  /* ---------------------------------------------------------------------- */
  /* États de navigation                                                    */
  /* ---------------------------------------------------------------------- */

  const [reduite, setReduite] = useState(false);

  const [mobileMenuOuvert, setMobileMenuOuvert] = useState(false);

  const [sousOngletParVue, setSousOngletParVue] = useState<
    Record<VueCoquille, string | null>
  >({
    accueil: null,
    infirmerie: null,
    consultation: null,
    pharmacie: null,
    stock: null,
    administration: null,
  });

  /* ---------------------------------------------------------------------- */
  /* Détection mobile et informations du site                               */
  /* ---------------------------------------------------------------------- */

  const isMobile = useIsMobile();

  const { sites } = useSites();

  const siteActuel = sites.find((s) => s.id === siteActifId);

  const siteNom =
    siteActuel?.nom ?? (siteActifId ? `Site #${siteActifId}` : "");

  /* ---------------------------------------------------------------------- */
  /* Résolution des rôles                                                   */
  /* ---------------------------------------------------------------------- */

  const roles = useMemo(() => utilisateur.roles ?? [], [utilisateur.roles]);

  const estAdmin =
    roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPER_ADMIN");

  const estGestionnaireStock = roles.includes("ROLE_GESTIONNAIRE_STOCK");

  const peutChangerSite = estAdmin || estGestionnaireStock;

  /* ---------------------------------------------------------------------- */
  /* Détermination de l'espace par défaut                                   */
  /* ---------------------------------------------------------------------- */

  const vueParDefaut = useMemo<VueCoquille>(() => {
    if (
      roles.includes("ROLE_ADMIN") ||
      roles.includes("ROLE_SUPER_ADMIN")
    ) {
      return "administration";
    }

    if (roles.includes("ROLE_MEDECIN")) {
      return "consultation";
    }

    if (roles.includes("ROLE_INFIRMIER")) {
      return "infirmerie";
    }

    if (
      roles.includes("ROLE_RECEPTION") ||
      roles.includes("ROLE_SECRETAIRE")
    ) {
      return "accueil";
    }

    if (roles.includes("ROLE_DISPENSATEUR")) {
      return "pharmacie";
    }

    if (
      roles.includes("ROLE_GESTIONNAIRE_STOCK") ||
      roles.includes("ROLE_RESPONSABLE_STOCK")
    ) {
      return "stock";
    }

    return "accueil";
  }, [roles]);

  const [vueActive, setVueActive] = useState<VueCoquille>(vueParDefaut);

  /* Synchronisation lorsque l'utilisateur change */

  useEffect(() => {
    setVueActive(vueParDefaut);
  }, [vueParDefaut]);

  /* ---------------------------------------------------------------------- */
  /* Gestion des sous-onglets                                               */
  /* ---------------------------------------------------------------------- */

  const sousOngletActif = sousOngletParVue[vueActive];

  const handleChangerSousOnglet = (id: string) => {
    setSousOngletParVue((prev) => ({
      ...prev,
      [vueActive]: id,
    }));
  };

  const handleChangerVue = (vue: VueCoquille, sousId?: string) => {
    setVueActive(vue);

    if (sousId) {
      setSousOngletParVue((prev) => ({
        ...prev,
        [vue]: sousId,
      }));
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Permissions : ESPACE ACCUEIL                                           */
  /* ---------------------------------------------------------------------- */

  const modesAccueil = useMemo(
    () => ({
      verification: resoudreModeBrique(roles, "verification_adherent"),
      tickets: resoudreModeBrique(roles, "ticket_file"),
      rendezvous: resoudreModeBrique(roles, "rendez_vous"),
      patients: resoudreModeBrique(roles, "patient"),
    }),
    [roles],
  );

  /* ---------------------------------------------------------------------- */
  /* Permissions : ESPACE INFIRMERIE                                        */
  /* ---------------------------------------------------------------------- */

  const modesInfirmerie = useMemo(
    () => ({
      file: resoudreModeBrique(roles, "infirmerie_file"),
      constantes: resoudreModeBrique(roles, "constante_vitale"),
      soins: resoudreModeBrique(roles, "soin_acte"),
      historique: resoudreModeBrique(roles, "infirmerie_historique"),
    }),
    [roles],
  );

  /* ---------------------------------------------------------------------- */
  /* Permissions : ESPACE CONSULTATION                                      */
  /* ---------------------------------------------------------------------- */

  const modesConsultation = useMemo(
    () => ({
      file: resoudreModeBrique(roles, "consultation_file"),
      active: resoudreModeBrique(roles, "consultation_active"),
      dossiers: resoudreModeBrique(roles, "dossier_medical"),
    }),
    [roles],
  );

  /* ---------------------------------------------------------------------- */
  /* Permissions : ESPACE STOCK                                             */
  /* ---------------------------------------------------------------------- */

  const modesStock = useMemo(
    () => ({
      niveaux: resoudreModeBrique(roles, "stock_niveau"),
      dispensation: resoudreModeBrique(roles, "stock_dispensation"),
      mouvements: resoudreModeBrique(roles, "stock_mouvement"),
      ajustements: resoudreModeBrique(roles, "stock_ajustement"),
      catalogue: resoudreModeBrique(roles, "stock_catalogue"),
    }),
    [roles],
  );

  /* ---------------------------------------------------------------------- */
  /* Permissions : ESPACE ADMINISTRATION                                    */
  /* ---------------------------------------------------------------------- */

  const modesAdmin = useMemo(
    () => ({
      "tableau-bord-admin": resoudreModeBrique(roles, "dashboard_admin"),
      utilisateurs: resoudreModeBrique(roles, "utilisateur"),
      affectations: resoudreModeBrique(roles, "affectation"),
      sites: resoudreModeBrique(roles, "site"),
      services: resoudreModeBrique(roles, "service"),
      entreprises: resoudreModeBrique(roles, "entreprise"),
      catalogue: resoudreModeBrique(roles, "catalogue_actes"),
      observations: resoudreModeBrique(roles, "observation_definition"),
      diagnostics: resoudreModeBrique(roles, "diagnostic_definition"),
      typeEncounters: resoudreModeBrique(roles, "type_encounter"),
      competences: resoudreModeBrique(roles, "corps_medical"),
      matrice: resoudreModeBrique(roles, "corps_medical"),
      // Le référentiel Allergies hérite du niveau d'accès
      // du référentiel des corps médicaux.
      allergiesRef: resoudreModeBrique(roles, "corps_medical"),
    }),
    [roles],
  );

  /* ---------------------------------------------------------------------- */
  /* Raccourci clavier Ctrl+B / Cmd+B                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setReduite((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Construction des espaces                                               */
  /* ---------------------------------------------------------------------- */

  const espaces = useMemo(
    () => construireEspaces(estGestionnaireStock),
    [estGestionnaireStock],
  );

  const espaceActuel = espaces[vueActive] ?? espaces.accueil;

  const ecranActif = espaceActuel.ecrans.find(
    (e) => e.id === (sousOngletActif ?? espaceActuel.ecrans[0]?.id),
  );

  /* ---------------------------------------------------------------------- */
  /* Menu mobile : regroupement des écrans                                  */
  /* ---------------------------------------------------------------------- */

  const menuSections = useMemo(() => {
    const groups: {
      nom: string | null;
      items: typeof espaceActuel.ecrans;
    }[] = [];

    for (const e of espaceActuel.ecrans) {
      const nom = e.groupe ?? null;
      const last = groups[groups.length - 1];

      if (last && last.nom === nom) {
        last.items.push(e);
      } else {
        groups.push({ nom, items: [e] });
      }
    }

    return groups.map((g) => ({
      titre: g.nom ?? "Navigation",
      items: g.items.map((e) => ({
        id: e.id,
        libelle: e.libelle,
        Icone: e.icone,
      })),
    }));
  }, [espaceActuel]);

  /* ---------------------------------------------------------------------- */
  /* Navigation inférieure mobile                                           */
  /* ---------------------------------------------------------------------- */

  const cibles =
    RACCOURCIS_MOBILE[vueActive] ??
    espaceActuel.ecrans.slice(0, 3).map((e) => e.id);

  const quickItems = cibles
    .map((id) => espaceActuel.ecrans.find((e) => e.id === id))
    .filter(
      (x): x is (typeof espaceActuel.ecrans)[number] => Boolean(x),
    );

  const inQuick =
    !sousOngletActif || quickItems.some((i) => i.id === sousOngletActif);

  const activeBottomId = inQuick
    ? sousOngletActif ?? quickItems[0]?.id
    : "__plus__";

  const bottomItems = [
    ...quickItems.map((i) => ({
      id: i.id,
      libelle: i.libelle,
      Icone: i.icone,
    })),
    {
      id: "__plus__",
      libelle: "Plus",
      Icone: MenuIcon,
    },
  ];

  const handleBottomNav = (id: string) => {
    if (id === "__plus__") {
      setMobileMenuOuvert(true);
      return;
    }

    handleChangerVue(vueActive, id);
  };

  /* ---------------------------------------------------------------------- */
  /* Informations utilisateur                                               */
  /* ---------------------------------------------------------------------- */

  const nomAffiche =
    utilisateur.prenom && utilisateur.nom
      ? `${utilisateur.prenom} ${utilisateur.nom}`
      : utilisateur.nom || utilisateur.identifiant || "";

  const initiales = (
    (utilisateur.prenom?.[0] ?? "") +
    (utilisateur.nom?.[0] ?? "") ||
    utilisateur.identifiant?.slice(0, 2) ||
    "AS"
  ).toUpperCase();

  /* ---------------------------------------------------------------------- */
  /* Contenu commun : les six assemblages                                   */
  /* ---------------------------------------------------------------------- */

  const contenu = (
    <>
      {vueActive === "accueil" && (
        <AssemblageAccueil
          siteActifId={siteActifId}
          serviceActifId={serviceActifId}
          modes={modesAccueil}
          sousOngletActif={sousOngletActif}
          onSousOngletChange={handleChangerSousOnglet}
        />
      )}

      {vueActive === "infirmerie" && (
        <AssemblageInfirmerie
          siteActifId={siteActifId}
          serviceActifId={serviceActifId}
          modes={modesInfirmerie}
          sousOngletActif={sousOngletActif}
          onSousOngletChange={handleChangerSousOnglet}
        />
      )}

      {vueActive === "consultation" && (
        <AssemblageConsultation
          siteActifId={siteActifId}
          serviceActifId={serviceActifId}
          modes={modesConsultation}
          sousOngletActif={sousOngletActif}
          onSousOngletChange={handleChangerSousOnglet}
        />
      )}

      {vueActive === "pharmacie" && (
        <AssemblagePharmacie
          siteActifId={siteActifId}
          serviceActifId={serviceActifId}
          sousOngletActif={sousOngletActif}
          onSousOngletChange={handleChangerSousOnglet}
        />
      )}

      {vueActive === "stock" && (
        <AssemblageStock
          siteActifId={siteActifId}
          serviceActifId={serviceActifId}
          modes={modesStock}
          sousOngletActif={sousOngletActif}
          onSousOngletChange={handleChangerSousOnglet}
        />
      )}

      {vueActive === "administration" && (
        <AssemblageAdministration
          siteActifId={siteActifId}
          serviceActifId={serviceActifId}
          modes={modesAdmin}
          sousOngletActif={sousOngletActif}
          onSousOngletChange={handleChangerSousOnglet}
        />
      )}
    </>
  );

  /* ===================================================================== */
  /* LAYOUT MOBILE                                                          */
  /* ===================================================================== */

  if (isMobile) {
    return (
      <div className="h-screen bg-[#f6f8f7] flex flex-col overflow-hidden font-sans antialiased text-[#1f2937]">
        <MobileHeader
          titre={ecranActif?.libelle ?? espaceActuel.nomCourt}
          sousTitre={siteNom || espaceActuel.nomCourt}
          onMenuClick={() => setMobileMenuOuvert(true)}
          onSousTitreClick={peutChangerSite ? () => { } : undefined}
          notificationsCount={0}
          onNotificationsClick={() => { }}
          onSearchClick={() => { }}
          initiales={initiales}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{contenu}</div>
        </main>

        <MobileBottomNav
          items={bottomItems}
          actifId={activeBottomId}
          onChange={handleBottomNav}
        />

        <MobileMenu
          ouvert={mobileMenuOuvert}
          onFermer={() => setMobileMenuOuvert(false)}
          sections={menuSections}
          actifId={sousOngletActif ?? undefined}
          onNaviguer={(id) => {
            handleChangerVue(vueActive, id);
            setMobileMenuOuvert(false);
          }}
          espaceActuel={{
            id: vueActive,
            titre: espaceActuel.titre,
            roleNom: espaceActuel.roleNom,
            Icone: espaceActuel.icone,
          }}
          espacesDisponibles={estAdmin ? ESPACES_SELECTEUR : []}
          onChangerEspace={
            estAdmin
              ? (id) => {
                handleChangerVue(id as VueCoquille);
                setMobileMenuOuvert(false);
              }
              : undefined
          }
          siteLibelle={siteNom}
          onSiteClick={peutChangerSite ? () => { } : undefined}
          utilisateur={{
            nom: nomAffiche,
            role: utilisateur.libelleRole ?? "",
            initiales,
          }}
          onDeconnexion={deconnecter}
        />
      </div>
    );
  }

  /* ===================================================================== */
  /* LAYOUT DESKTOP                                                         */
  /* ===================================================================== */

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500/20">
      <EnTete
        vueActive={vueActive}
        sousOngletActif={sousOngletActif}
        onBasculerMenuMobile={() => { }}
        menuMobileOuvert={false}
        reduite={reduite}
        onBasculerReduite={() => setReduite((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        <BarreLaterale
          vueActive={vueActive}
          sousOngletActif={sousOngletActif}
          onChangerVue={handleChangerVue}
          reduite={reduite}
          onBasculerReduite={() => setReduite((prev) => !prev)}
          mobileOuvert={false}
          onFermerMobile={() => { }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 bg-slate-100">
          <div className="max-w-7xl mx-auto h-full">{contenu}</div>
        </main>
      </div>
    </div>
  );
};

export default CoquilleApplicative;