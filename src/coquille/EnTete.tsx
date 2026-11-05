/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  LogOut,
  Building2,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import { useSession } from "@/cerveau/session";
import { sitesApi, SiteHospitalier } from "@/briques/sites";
import { construireEspaces, type VueCoquille } from "./espaces";

export interface EnTeteProps {
  vueActive: VueCoquille;
  /** Écran actif de l'espace (null = premier écran), pour le fil d'Ariane. */
  sousOngletActif?: string | null;
  onBasculerMenuMobile: () => void;
  menuMobileOuvert: boolean;
  reduite?: boolean;
  onBasculerReduite?: () => void;
  /** Affiche la pastille rouge sur la cloche quand > 0. */
  notificationsNonLues?: number;
  onOuvrirNotifications?: () => void;
  /** Appelé à la validation (Entrée) de la recherche globale. */
  onRechercher?: (terme: string) => void;
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600";

const BOUTON_ICONE = `w-10 h-10 grid place-items-center rounded-[10px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer ${FOCUS}`;

export const EnTete: React.FC<EnTeteProps> = ({
  vueActive,
  sousOngletActif,
  onBasculerMenuMobile,
  menuMobileOuvert,
  reduite,
  onBasculerReduite,
  notificationsNonLues = 0,
  onOuvrirNotifications,
  onRechercher,
}) => {
  const {
    utilisateur,
    siteActifId,
    serviceActifId,
    choisirSite,
    choisirService,
    deconnecter,
  } = useSession();

  const [sites, setSites] = useState<SiteHospitalier[]>([]);
  const [menuSiteOuvert, setMenuSiteOuvert] = useState(false);
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const [terme, setTerme] = useState("");
  const rechercheRef = useRef<HTMLInputElement>(null);

  const roles = utilisateur?.roles ?? [];
  const estAdmin =
    roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPER_ADMIN");
  const estGestionnaireStock = roles.includes("ROLE_GESTIONNAIRE_STOCK");
  const peutChangerSite = estAdmin || estGestionnaireStock;

  const siteActuel = sites.find((s) => s.id === siteActifId);

  // Chargement de la liste des sites.
  //   - `.catch()` obligatoire : sans ça, une erreur réseau produit une
  //     unhandled rejection à chaque montage.
  //   - L'auto-sélection du premier site est réservée aux rôles qui ont le
  //     droit de changer de site. Pour les autres, c'est `utilisateur.siteId`
  //     qui fait foi (voir l'effet de verrouillage ci-dessous) — sinon on
  //     déclenche 2 appels API inutiles à chaque login.
  useEffect(() => {
    let actif = true;

    sitesApi
      .lister()
      .then((liste) => {
        if (!actif) return;
        const actifs = liste.filter((s) => s.actif !== false);
        setSites(actifs);
        if (peutChangerSite && !siteActifId && actifs.length > 0) {
          choisirSite(actifs[0].id);
        }
      })
      .catch(() => {
        // Silencieux : le sélecteur reste vide, l'utilisateur peut réessayer.
        // On n'appelle surtout pas `notif.erreur` ici — c'est précisément le
        // pattern qui produisait la boucle avant correctif.
      });

    return () => {
      actif = false;
    };
  }, [siteActifId, choisirSite, peutChangerSite]);

  // Verrouillage strict du site et du service pour le personnel non-admin
  useEffect(() => {
    if (
      !peutChangerSite &&
      utilisateur?.siteId &&
      siteActifId !== utilisateur.siteId
    ) {
      choisirSite(utilisateur.siteId);
    }
    if (
      !peutChangerSite &&
      utilisateur?.serviceId &&
      serviceActifId !== utilisateur.serviceId
    ) {
      choisirService(utilisateur.serviceId);
    }
  }, [
    peutChangerSite,
    utilisateur?.siteId,
    utilisateur?.serviceId,
    siteActifId,
    serviceActifId,
    choisirSite,
    choisirService,
  ]);

  // Ctrl+K / Cmd+K → focus recherche ; Échap → ferme les menus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        rechercheRef.current?.focus();
        rechercheRef.current?.select();
      }
      if (e.key === "Escape") {
        setMenuSiteOuvert(false);
        setMenuProfilOuvert(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fil d'Ariane : « Espace › Écran actif »
  const espaces = useMemo(
    () => construireEspaces(estGestionnaireStock),
    [estGestionnaireStock],
  );
  const espace = espaces[vueActive] ?? espaces.accueil;
  const ecran = espace.ecrans.find(
    (e) => e.id === (sousOngletActif ?? espace.ecrans[0]?.id),
  );

  // On masque le préfixe « Accueil » dans le fil d'Ariane : seul l'écran actif
  // est affiché pour l'espace d'accueil. Les autres espaces gardent leur préfixe.
  const afficherPrefixeEspace = vueActive !== "accueil";

  const initiales =
    utilisateur?.prenom && utilisateur?.nom
      ? `${utilisateur.prenom.charAt(0)}${utilisateur.nom.charAt(0)}`.toUpperCase()
      : utilisateur?.nom
        ? utilisateur.nom.slice(0, 2).toUpperCase()
        : "AS";

  const nomAffiche =
    utilisateur?.prenom && utilisateur?.nom
      ? `${utilisateur.prenom} ${utilisateur.nom}`
      : utilisateur?.nom || utilisateur?.identifiant || "Personnel Soignant";

  const email = (utilisateur as { email?: string } | null)?.email;
  const estMedecin = roles.includes("ROLE_MEDECIN");

  // Avatar violet pour les admins, vert pour le personnel (comme la maquette)
  const avatarClasses = estAdmin
    ? "bg-violet-100 text-violet-800"
    : "bg-green-100 text-green-800";

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center relative z-30">
      {/* ─── Bloc marque : 264 px déployé / 64 px en rail, aligné sur la sidebar ─── */}
      <div
        className={`h-full shrink-0 flex items-center gap-2.5 pl-3 md:border-r md:border-slate-200 transition-[width] duration-300 ${reduite ? "md:w-16 md:justify-center md:px-0" : "md:w-[264px] md:px-4"
          }`}
      >
        <button
          type="button"
          onClick={onBasculerMenuMobile}
          className={`md:hidden ${BOUTON_ICONE}`}
          title={menuMobileOuvert ? "Fermer le menu" : "Ouvrir le menu"}
          aria-label="Menu mobile"
          aria-expanded={menuMobileOuvert}
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/images/logo-sans-txt.png"
          alt="Logo ASINA"
          className="w-9 h-9 object-contain select-none shrink-0"
          draggable={false}
        />
        <div
          className={`hidden sm:flex items-center gap-1.5 whitespace-nowrap ${reduite ? "md:hidden" : ""
            }`}
        >
          <span className="text-[17px] font-extrabold text-slate-900 tracking-tight">
            ASINA <span className="text-green-700">Medical</span>
          </span>
          <span className="text-[11px] font-bold px-2 py-px rounded-full bg-green-100 text-green-800">
            SIH
          </span>
        </div>
      </div>

      {/* ─── Bascule de la sidebar + fil d'Ariane ─── */}
      {onBasculerReduite && (
        <button
          type="button"
          onClick={onBasculerReduite}
          className={`hidden md:grid ml-2.5 ${BOUTON_ICONE}`}
          title={
            reduite
              ? "Déployer le menu (Ctrl+B)"
              : "Réduire le menu (Ctrl+B)"
          }
          aria-label="Réduire ou déployer le menu (Ctrl+B)"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      <nav
        aria-label="Fil d'Ariane"
        className="hidden md:flex items-center gap-2 ml-1 min-w-0 text-[13px] text-slate-500"
      >
        {afficherPrefixeEspace && (
          <>
            <span className="whitespace-nowrap">{espace.nomCourt}</span>
            {ecran && (
              <ChevronRight
                className="w-3.5 h-3.5 shrink-0"
                aria-hidden="true"
              />
            )}
          </>
        )}
        {ecran && (
          <span
            className="font-bold text-slate-900 truncate"
            aria-current="page"
          >
            {ecran.libelle}
          </span>
        )}
      </nav>

      <span className="flex-1" />

      {/* ─── Recherche globale ─── */}
      <div className="relative w-[300px] hidden lg:block">
        <Search
          className="absolute left-3 top-[11px] w-[18px] h-[18px] text-slate-500 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={rechercheRef}
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && terme.trim())
              onRechercher?.(terme.trim());
            if (e.key === "Escape") rechercheRef.current?.blur();
          }}
          placeholder="Rechercher un patient, un module…"
          aria-label="Recherche globale"
          className={`block h-10 w-full rounded-[10px] border border-slate-300 bg-slate-50 pl-[38px] pr-16 text-sm text-slate-900 placeholder:text-slate-500 ${FOCUS}`}
        />
        <kbd className="absolute right-2.5 top-[9px] border border-slate-300 rounded-md px-[7px] py-0.5 text-[11px] font-sans font-semibold text-slate-500 bg-white pointer-events-none">
          Ctrl+K
        </kbd>
      </div>

      {/* ─── Site actif ─── */}
      <div className="hidden md:block ml-3.5 relative">
        {peutChangerSite ? (
          <>
            <button
              type="button"
              onClick={() => setMenuSiteOuvert((p) => !p)}
              className={`h-10 inline-flex items-center gap-2 px-4 rounded-[10px] border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-900 cursor-pointer transition-colors ${FOCUS}`}
              title="Changer d'établissement actif"
              aria-expanded={menuSiteOuvert}
              aria-haspopup="listbox"
            >
              <Building2 className="w-4 h-4" />
              <span className="max-w-[160px] truncate">
                {siteActuel?.nom || "Sélectionner un site…"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {menuSiteOuvert && (
              <>
                <button
                  type="button"
                  aria-label="Fermer le menu des sites"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuSiteOuvert(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-[14px] shadow-[0_10px_30px_rgba(15,23,42,0.18)] p-1.5 z-50 animate-slide-in">
                  <div className="text-[11px] font-bold uppercase tracking-[.05em] text-slate-500 px-2.5 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span>Établissements ASINA</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 rounded-full normal-case tracking-normal">
                      {sites.length} sites
                    </span>
                  </div>
                  <div
                    className="space-y-0.5 mt-1 max-h-56 overflow-y-auto"
                    role="listbox"
                  >
                    {sites.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={siteActifId === s.id}
                        onClick={() => {
                          choisirSite(s.id);
                          choisirService(null);
                          setMenuSiteOuvert(false);
                        }}
                        className={`w-full text-left text-sm px-2.5 h-10 rounded-[10px] flex items-center justify-between transition-colors cursor-pointer ${FOCUS} ${siteActifId === s.id
                            ? "bg-green-50 text-green-800 font-bold"
                            : "text-slate-700 font-semibold hover:bg-slate-50"
                          }`}
                      >
                        <span className="truncate">{s.nom}</span>
                        {siteActifId === s.id && (
                          <span className="w-2 h-2 rounded-full bg-green-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          siteActuel && (
            <div
              className="h-10 inline-flex items-center gap-2 px-4 rounded-[10px] border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
              title="Votre établissement"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span className="max-w-[160px] truncate">{siteActuel.nom}</span>
            </div>
          )
        )}
      </div>

      {/* ─── Actions rapides ─── */}
      <button
        type="button"
        onClick={onOuvrirNotifications}
        className={`relative ml-3.5 ${BOUTON_ICONE}`}
        title="Notifications"
        aria-label={
          notificationsNonLues > 0
            ? `Notifications (${notificationsNonLues} non lues)`
            : "Notifications"
        }
      >
        <Bell className="w-5 h-5" />
        {notificationsNonLues > 0 && (
          <span className="absolute top-2 right-[9px] w-2 h-2 rounded-full bg-red-600 border-2 border-white" />
        )}
      </button>

      <span className="w-px h-7 bg-slate-200 mx-2.5" aria-hidden="true" />

      {/* ─── Profil ─── */}
      <div className="relative mr-3 sm:mr-4">
        <button
          type="button"
          onClick={() => setMenuProfilOuvert((p) => !p)}
          className={`flex items-center gap-2 rounded-[10px] cursor-pointer ${FOCUS}`}
          aria-expanded={menuProfilOuvert}
          aria-haspopup="menu"
          aria-label="Menu du profil"
          title={nomAffiche}
        >
          <span
            className={`w-10 h-10 rounded-[10px] grid place-items-center text-xs font-bold select-none ${avatarClasses}`}
          >
            {initiales}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${menuProfilOuvert ? "rotate-180" : ""
              }`}
          />
        </button>

        {menuProfilOuvert && (
          <>
            <button
              type="button"
              aria-label="Fermer le menu du profil"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMenuProfilOuvert(false)}
            />
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-[232px] bg-white border border-slate-200 rounded-[14px] shadow-[0_10px_30px_rgba(15,23,42,0.18)] overflow-hidden z-50 animate-slide-in"
            >
              <div className="px-3.5 py-3 border-b border-slate-200">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {estMedecin ? `Dr. ${nomAffiche}` : nomAffiche}
                </div>
                {email && (
                  <div className="text-xs text-slate-500 truncate">{email}</div>
                )}
              </div>

              <div className="border-t border-slate-200">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuProfilOuvert(false);
                    deconnecter();
                  }}
                  className="w-full h-11 flex items-center gap-3 px-3.5 text-sm font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default EnTete;