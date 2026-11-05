/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSession } from "@/cerveau/session";
import {
  construireEspaces,
  ESPACES_SELECTEUR,
  type ItemEcran,
  type VueCoquille,
} from "./espaces";

export type { VueCoquille } from "./espaces";

export interface BarreLateraleProps {
  vueActive: VueCoquille;
  sousOngletActif: string | null;
  onChangerVue: (vue: VueCoquille, sousId?: string) => void;
  reduite: boolean;
  onBasculerReduite: () => void;
  mobileOuvert: boolean;
  onFermerMobile: () => void;
}

interface InfobulleRail {
  titre: string;
  description: string;
  badge?: string;
  top: number;
  left: number;
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500";

/* ── Palette sidebar : bleu encre du logo ASINA ──────────────────────
 *  #0E2F44  base du fond
 *  #163a52  survol / séparateurs / surface secondaire
 *  #1f4a66  bordure de kbd
 *  #0090d8  accent cyan (rappel du logo, carte d'espace)
 *  #7dd3fc  icône cyan clair dans la carte d'espace
 *  #22c55e / #15803d  état actif (inchangé, couleur d'action)
 * ─────────────────────────────────────────────────────────────────── */

export const BarreLaterale: React.FC<BarreLateraleProps> = ({
  vueActive,
  sousOngletActif,
  onChangerVue,
  reduite,
  onBasculerReduite,
  mobileOuvert,
  onFermerMobile,
}) => {
  const { utilisateur } = useSession();
  const userRoles = utilisateur?.roles ?? [];

  const estAdmin =
    userRoles.includes("ROLE_ADMIN") || userRoles.includes("ROLE_SUPER_ADMIN");
  const estGestionnaireStock = userRoles.includes("ROLE_GESTIONNAIRE_STOCK");

  const [selecteurOuvert, setSelecteurOuvert] = useState(false);
  const [groupesReplies, setGroupesReplies] = useState<Record<string, boolean>>({});
  const [infobulle, setInfobulle] = useState<InfobulleRail | null>(null);

  const configurations = useMemo(
    () => construireEspaces(estGestionnaireStock),
    [estGestionnaireStock],
  );

  const espaceActuel = configurations[vueActive] ?? configurations.accueil;
  // Écrans réservés à l'administrateur (ids tels que déclarés dans ./espaces)
const ID_ECRANS_ADMIN = ["ajustements"];

const ecransActuels = useMemo(
  () => espaceActuel.ecrans.filter((e) => estAdmin || !ID_ECRANS_ADMIN.includes(e.id)),
  [espaceActuel, estAdmin],
);
  const IconeEspace = espaceActuel.icone;

  // Repli sur le premier écran si aucun sous-onglet n'est renseigné
  const ecranActifId = sousOngletActif ?? ecransActuels[0]?.id;

  // Regroupe les écrans consécutifs partageant le même groupe
  const groupes = useMemo(() => {
    const res: { nom: string | null; items: ItemEcran[] }[] = [];
    for (const e of ecransActuels) {
      const nom = e.groupe ?? null;
      const dernier = res[res.length - 1];
      if (dernier && dernier.nom === nom) dernier.items.push(e);
      else res.push({ nom, items: [e] });
    }
    return res;
  }, [ecransActuels]);

  const choisirEspace = (id: VueCoquille) => {
    onChangerVue(id);
    setSelecteurOuvert(false);
  };

  const listeEspaces = (
    <div className="space-y-0.5">
      {ESPACES_SELECTEUR.map((esp) => (
        <button
          key={esp.id}
          type="button"
          onClick={() => choisirEspace(esp.id)}
          className={`w-full text-left text-[13px] px-2.5 h-9 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${FOCUS} ${
            vueActive === esp.id
              ? "bg-[#163a52] text-white font-bold"
              : "text-slate-300 font-semibold hover:bg-[#163a52]/70 hover:text-white"
          }`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: esp.couleurHex }}
          />
          <span className="truncate">{esp.libelle}</span>
        </button>
      ))}
    </div>
  );

  /**
   * @param compact  rail 64 px (desktop uniquement)
   * @param mobile   tiroir mobile : toujours déployé, avec bouton de fermeture
   */
  const rendreSidebar = (compact: boolean, mobile: boolean) => (
    <div
      className={`flex flex-col h-full bg-[#0E2F44] text-slate-300 select-none relative ${
        compact ? "items-center pt-3.5" : "px-3 pt-3.5"
      }`}
    >
      {/* ─── Carte de l'espace actif ─── */}
      {mobile && (
        <div className="flex justify-end w-full -mt-1 mb-1">
          <button
            type="button"
            onClick={onFermerMobile}
            className={`w-9 h-9 grid place-items-center rounded-[10px] text-slate-400 hover:text-white hover:bg-[#163a52] cursor-pointer ${FOCUS}`}
            aria-label="Fermer la navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {compact ? (
        <div className="relative">
          <button
            type="button"
            disabled={!estAdmin}
            onClick={() => estAdmin && setSelecteurOuvert((p) => !p)}
            className={`w-9 h-9 rounded-[10px] bg-[#0090d8]/20 border border-[#0090d8]/30 grid place-items-center text-[#7dd3fc] shrink-0 ${
              estAdmin ? "cursor-pointer hover:bg-[#0090d8]/30" : "cursor-default"
            } ${FOCUS}`}
            title={`${espaceActuel.titre} — ${espaceActuel.roleNom}${
              estAdmin ? " (cliquer pour changer d'espace)" : ""
            }`}
            aria-label={espaceActuel.titre}
            aria-expanded={estAdmin ? selecteurOuvert : undefined}
          >
            <IconeEspace className="w-[18px] h-[18px]" />
          </button>

          {estAdmin && selecteurOuvert && (
            <>
              <button
                type="button"
                aria-label="Fermer le sélecteur d'espace"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setSelecteurOuvert(false)}
              />
              <div className="fixed left-[72px] top-[70px] w-56 bg-[#0E2F44] border border-[#163a52] rounded-xl shadow-2xl p-1.5 z-50 animate-slide-in">
                <div className="text-[11px] font-bold uppercase tracking-[.05em] text-slate-400 px-2.5 py-1.5 border-b border-[#163a52] mb-1">
                  Changer d'espace
                </div>
                {listeEspaces}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="relative w-full">
          {estAdmin ? (
            <button
              type="button"
              onClick={() => setSelecteurOuvert((p) => !p)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl border border-[#163a52] hover:bg-[#163a52]/50 text-left cursor-pointer transition-colors ${FOCUS}`}
              aria-expanded={selecteurOuvert}
              title="Changer d'espace de travail"
            >
              <CarteEspaceContenu
                Icone={IconeEspace}
                titre={espaceActuel.titre}
                role={espaceActuel.roleNom}
              />
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                  selecteurOuvert ? "rotate-180" : ""
                }`}
              />
            </button>
          ) : (
            <div className="w-full flex items-center gap-2.5 p-2 rounded-xl border border-[#163a52]">
              <CarteEspaceContenu
                Icone={IconeEspace}
                titre={espaceActuel.titre}
                role={espaceActuel.roleNom}
              />
            </div>
          )}

          {estAdmin && selecteurOuvert && (
            <>
              <button
                type="button"
                aria-label="Fermer le sélecteur d'espace"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setSelecteurOuvert(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#0E2F44] border border-[#163a52] rounded-xl shadow-2xl p-1.5 z-50 animate-slide-in">
                <div className="text-[11px] font-bold uppercase tracking-[.05em] text-slate-400 px-2.5 py-1.5 border-b border-[#163a52] mb-1">
                  Supervision · changer d'espace
                </div>
                {listeEspaces}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Modules ─── */}
      <nav
        aria-label="Navigation principale"
        className={`flex-1 min-h-0 overflow-y-auto w-full ${
          compact ? "flex flex-col items-center gap-1.5 mt-1" : ""
        }`}
      >
        {groupes.map((groupe, gi) => {
          const cle = `${vueActive}:${groupe.nom ?? ""}`;
          const replie = !compact && groupe.nom !== null && !!groupesReplies[cle];

          return (
            <div
              key={cle}
              className={compact ? "flex flex-col items-center gap-1.5 w-full" : ""}
            >
              {/* Séparateur (rail) ou titre de section (déployé) */}
              {compact
                ? (gi > 0 || groupe.nom !== null) && (
                    <span className="w-7 h-px bg-[#163a52] my-1.5" aria-hidden="true" />
                  )
                : groupe.nom !== null && (
                    <button
                      type="button"
                      onClick={() =>
                        setGroupesReplies((p) => ({ ...p, [cle]: !p[cle] }))
                      }
                      aria-expanded={!replie}
                      className={`w-full flex items-center justify-between px-2 pt-3.5 pb-1.5 text-[11px] font-bold uppercase tracking-[.05em] text-slate-400 hover:text-slate-200 cursor-pointer ${FOCUS}`}
                    >
                      {groupe.nom}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          replie ? "-rotate-90" : ""
                        }`}
                      />
                    </button>
                  )}

              {!replie &&
                groupe.items.map((ecran) => {
                  const actif = ecranActifId === ecran.id;
                  const IconeEcran = ecran.icone;

                  if (compact) {
                    return (
                      <button
                        key={ecran.id}
                        type="button"
                        onClick={() => onChangerVue(vueActive, ecran.id)}
                        onMouseEnter={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          setInfobulle({
                            titre: ecran.libelle,
                            description: ecran.description,
                            badge: ecran.badge,
                            top: r.top + r.height / 2,
                            left: r.right + 8,
                          });
                        }}
                        onFocus={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          setInfobulle({
                            titre: ecran.libelle,
                            description: ecran.description,
                            badge: ecran.badge,
                            top: r.top + r.height / 2,
                            left: r.right + 8,
                          });
                        }}
                        onMouseLeave={() => setInfobulle(null)}
                        onBlur={() => setInfobulle(null)}
                        aria-label={ecran.libelle}
                        aria-current={actif ? "page" : undefined}
                        className={`relative w-9 h-9 rounded-[10px] grid place-items-center shrink-0 cursor-pointer transition-colors ${FOCUS} ${
                          actif
                            ? "bg-green-700 text-white"
                            : "text-slate-400 hover:bg-[#163a52] hover:text-white"
                        }`}
                      >
                        <IconeEcran className="w-[18px] h-[18px]" />
                        {actif && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0E2F44]" />
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={ecran.id}
                      type="button"
                      onClick={() => {
                        onChangerVue(vueActive, ecran.id);
                        if (mobile) onFermerMobile();
                      }}
                      title={ecran.description}
                      aria-current={actif ? "page" : undefined}
                      className={`w-full h-11 flex items-center gap-3 px-2 rounded-[10px] text-left cursor-pointer transition-colors ${FOCUS} ${
                        actif
                          ? "bg-[rgba(21,128,61,0.22)] shadow-[inset_3px_0_0_#22c55e]"
                          : "hover:bg-[#163a52]/70"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-[10px] grid place-items-center shrink-0 ${
                          actif ? "bg-green-700 text-white" : "text-slate-400"
                        }`}
                      >
                        <IconeEcran className="w-[18px] h-[18px]" />
                      </span>
                      <span
                        className={`flex-1 min-w-0 truncate text-sm ${
                          actif ? "font-bold text-white" : "font-semibold text-slate-300"
                        }`}
                      >
                        {ecran.libelle}
                      </span>
                      {ecran.badge && (
                        <span
                          className={`shrink-0 text-[11px] font-bold px-2 py-px rounded-full uppercase ${
                            actif
                              ? "bg-green-900 text-green-200"
                              : "bg-[#163a52] text-slate-300"
                          }`}
                        >
                          {ecran.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* ─── Pied de sidebar ─── */}
      {compact ? (
        <div className="h-[60px] w-full shrink-0 border-t border-[#163a52] flex items-center justify-center">
          <button
            type="button"
            onClick={onBasculerReduite}
            className={`w-11 h-11 grid place-items-center rounded-[10px] text-slate-300 hover:text-white hover:bg-[#163a52] cursor-pointer ${FOCUS}`}
            aria-label="Déployer le menu (Ctrl+B)"
            title="Déployer le menu (Ctrl+B)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="w-full shrink-0 border-t border-[#163a52] pt-2.5 pb-3">
          {!mobile && (
            <button
              type="button"
              onClick={onBasculerReduite}
              className={`w-full h-11 flex items-center gap-2.5 px-2 rounded-[10px] text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-[#163a52]/70 cursor-pointer transition-colors ${FOCUS}`}
            >
              <ChevronLeft className="w-[18px] h-[18px]" />
              Réduire le menu
              <kbd className="ml-auto border border-[#1f4a66] rounded-md px-[7px] py-0.5 text-[11px] font-sans text-slate-400">
                Ctrl+B
              </kbd>
            </button>
          )}
          <div className="flex items-center gap-2 px-2 pt-1 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Connecté
          </div>
        </div>
      )}

      {/* ─── Infobulle du rail (position fixe : jamais tronquée par un overflow) ─── */}
      {compact && infobulle && (
        <div
          className="fixed z-50 -translate-y-1/2 flex items-center pointer-events-none animate-slide-in"
          style={{ top: `${infobulle.top}px`, left: `${infobulle.left}px` }}
          role="tooltip"
        >
          <span className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#0E2F44]" />
          <span className="bg-[#0E2F44] text-white px-3 py-2 rounded-lg shadow-[0_6px_16px_rgba(15,23,42,0.25)] leading-snug">
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-bold">{infobulle.titre}</span>
              {infobulle.badge && (
                <span className="text-[11px] font-bold px-2 py-px rounded-full bg-[#163a52] text-slate-300 uppercase">
                  {infobulle.badge}
                </span>
              )}
            </span>
            <span className="block text-xs text-slate-400 whitespace-nowrap">
              {infobulle.description}
            </span>
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar desktop : 264 px déployée / 64 px en rail */}
      <aside
        className={`hidden md:block shrink-0 transition-[width] duration-300 ease-in-out select-none ${
          reduite ? "w-16" : "w-[264px]"
        }`}
      >
        {rendreSidebar(reduite, false)}
      </aside>

      {/* Tiroir mobile (toujours déployé, même si le desktop est en rail) */}
      {mobileOuvert && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={onFermerMobile}
          />
          <div className="relative w-72 max-w-[85vw] z-10 animate-slide-in shadow-2xl">
            {rendreSidebar(false, true)}
          </div>
        </div>
      )}
    </>
  );
};

const CarteEspaceContenu: React.FC<{
  Icone: React.ComponentType<{ className?: string }>;
  titre: string;
  role: string;
}> = ({ Icone, titre, role }) => (
  <>
    <span className="w-9 h-9 rounded-[10px] bg-[#0090d8]/20 border border-[#0090d8]/30 grid place-items-center text-[#7dd3fc] shrink-0">
      <Icone className="w-[18px] h-[18px]" />
    </span>
    <span className="flex-1 min-w-0 leading-tight">
      <span className="block text-sm font-bold text-white truncate">{titre}</span>
      <span className="block text-xs text-slate-400 truncate">{role}</span>
    </span>
  </>
);

export default BarreLaterale;