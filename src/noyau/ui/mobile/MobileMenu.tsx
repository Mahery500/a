import React, { useEffect, useState } from "react";
import { ChevronDown, LogOut, X, Building2 } from "lucide-react";

type IconeComposant = React.ComponentType<{ className?: string }>;

export interface MobileMenuItem {
  id: string;
  libelle: string;
  Icone: IconeComposant;
  badge?: number | string;
}

export interface MobileMenuSection {
  titre: string;
  items: MobileMenuItem[];
}

export interface MobileMenuEspace {
  id: string;
  titre: string;
  roleNom: string;
  Icone: IconeComposant;
}

export interface MobileMenuEspaceOption {
  id: string;
  libelle: string;
  couleurHex: string;
}

export interface MobileMenuUtilisateur {
  nom: string;
  role: string;
  initiales: string;
}

export interface MobileMenuProps {
  ouvert: boolean;
  onFermer: () => void;
  sections: MobileMenuSection[];
  actifId?: string;
  onNaviguer: (id: string) => void;
  espaceActuel: MobileMenuEspace;
  /** Vide → bloc Espace non cliquable (non-admin : pas de « Changer d'espace »). */
  espacesDisponibles?: MobileMenuEspaceOption[];
  onChangerEspace?: (id: string) => void;
  siteLibelle?: string;
  onSiteClick?: () => void;
  utilisateur?: MobileMenuUtilisateur;
  onDeconnexion?: () => void;
}

const ITEM =
  "w-full h-11 flex items-center gap-3 px-3 rounded-[12px] text-left cursor-pointer transition-colors";

export const MobileMenu: React.FC<MobileMenuProps> = ({
  ouvert,
  onFermer,
  sections,
  actifId,
  onNaviguer,
  espaceActuel,
  espacesDisponibles = [],
  onChangerEspace,
  siteLibelle,
  onSiteClick,
  utilisateur,
  onDeconnexion,
}) => {
  const [selecteurEspaceOuvert, setSelecteurEspaceOuvert] = useState(false);
  const peutChangerEspace = espacesDisponibles.length > 0 && !!onChangerEspace;

  useEffect(() => {
    if (!ouvert) return;
    setSelecteurEspaceOuvert(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  const IconeEspace = espaceActuel.Icone;

  return (
    <div className="md:hidden fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-[rgba(15,27,61,.45)]"
        onClick={onFermer}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0f1b3d] flex flex-col shadow-[4px_0_24px_rgba(15,27,61,.35)]"
      >
        {/* En-tête blanc avec logo */}
        <div className="h-[76px] bg-white flex items-center gap-2.5 pl-4 pr-2 shrink-0">
          <img
            src="/images/asina-logo.png"
            alt="ASINA"
            className="h-14 w-auto object-contain"
          />
          <div className="flex-1 text-[12px] font-bold text-[#5b6472] leading-tight">
            ASINA Médical
            <br />
            <span className="font-medium">Système d’information hospitalier</span>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer le menu"
            className="w-11 h-11 grid place-items-center text-[#1f2937] rounded-[10px] hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Carte Espace + Établissement */}
        <div className="m-3 border border-[#2a3a6a] rounded-xl bg-[#16264f] overflow-hidden shrink-0">
          {/* Espace — dépliable UNIQUEMENT si admin */}
          <div>
            <button
              type="button"
              onClick={() =>
                peutChangerEspace && setSelecteurEspaceOuvert((v) => !v)
              }
              disabled={!peutChangerEspace}
              aria-expanded={
                peutChangerEspace ? selecteurEspaceOuvert : undefined
              }
              className={`w-full min-h-[60px] flex items-center gap-2.5 px-3 py-2 text-left ${
                peutChangerEspace
                  ? "cursor-pointer hover:bg-[#1a2d5c] transition-colors"
                  : "cursor-default"
              }`}
            >
              <span className="w-9 h-9 rounded-[10px] bg-[#1f9d55] border border-[#2a3a6a] grid place-items-center shrink-0">
                <IconeEspace className="w-5 h-5 text-white" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold tracking-wider text-[#9fb0e0]">
                  ESPACE
                </span>
                <span className="block text-[15px] font-bold text-white truncate">
                  {espaceActuel.titre}
                </span>
                <span className="block text-[12px] text-[#9fb0e0] truncate">
                  {espaceActuel.roleNom}
                  {peutChangerEspace && " · Changer d’espace"}
                </span>
              </span>
              {peutChangerEspace && (
                <ChevronDown
                  className={`w-5 h-5 text-[#9fb0e0] shrink-0 transition-transform ${
                    selecteurEspaceOuvert ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>

            {peutChangerEspace && selecteurEspaceOuvert && (
              <div className="border-t border-[#2a3a6a] bg-[#0f1b3d] p-1.5 space-y-0.5">
                {espacesDisponibles.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelecteurEspaceOuvert(false);
                      onChangerEspace?.(s.id);
                    }}
                    className={`w-full h-10 px-3 rounded-lg flex items-center gap-2.5 text-left text-[13px] cursor-pointer transition-colors ${
                      s.id === espaceActuel.id
                        ? "bg-[#16264f] text-white font-bold"
                        : "text-[#b6c2e0] font-semibold hover:bg-[#16264f]/70 hover:text-white"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.couleurHex }}
                    />
                    <span className="truncate">{s.libelle}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Établissement — chevron seulement si changement autorisé */}
          <button
            type="button"
            onClick={onSiteClick}
            disabled={!onSiteClick}
            className={`w-full min-h-[60px] flex items-center gap-2.5 px-3 py-2 text-left border-t border-[#2a3a6a] ${
              onSiteClick
                ? "cursor-pointer hover:bg-[#1a2d5c] transition-colors"
                : "cursor-default"
            }`}
          >
            <span className="w-9 h-9 rounded-[10px] bg-[#0f1b3d] border border-[#2a3a6a] grid place-items-center shrink-0">
              <Building2 className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-bold tracking-wider text-[#9fb0e0]">
                ÉTABLISSEMENT
              </span>
              <span className="block text-[15px] font-bold text-white truncate">
                {siteLibelle ?? "—"}
              </span>
              {onSiteClick && (
                <span className="block text-[12px] text-[#9fb0e0] truncate">
                  Choisir un établissement
                </span>
              )}
            </span>
            {onSiteClick && (
              <ChevronDown
                className="w-5 h-5 text-[#9fb0e0] shrink-0"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Sections de navigation (groupées comme sur desktop) */}
        <nav className="flex-1 overflow-y-auto px-3 pb-1">
          {sections.map((section) => (
            <div key={section.titre}>
              <div className="text-[12px] font-bold tracking-wider text-[#9fb0e0] px-3 pt-3.5 pb-1.5 uppercase">
                {section.titre}
              </div>
              {section.items.map((item) => {
                const actif = item.id === actifId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNaviguer(item.id)}
                    aria-current={actif ? "page" : undefined}
                    className={`${ITEM} ${
                      actif
                        ? "bg-[#1f9d55] text-white font-bold"
                        : "text-[#e5e7eb] font-medium hover:bg-white/5"
                    }`}
                  >
                    <item.Icone
                      className={`w-5 h-5 shrink-0 ${
                        actif ? "text-white" : "text-[#9fb0e0]"
                      }`}
                    />
                    <span className="flex-1 truncate text-[14px]">
                      {item.libelle}
                    </span>
                    {item.badge !== undefined && (
                      <span className="text-[11px] font-bold bg-[#e7f6ed] text-[#14703c] px-2 py-px rounded-full shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Pied utilisateur */}
        {utilisateur && (
          <div className="border-t border-[#2a3a6a] px-4 py-3 flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#e7f6ed] text-[#14703c] font-bold text-[13px] grid place-items-center shrink-0">
              {utilisateur.initiales}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-[14px] font-bold text-white truncate">
                {utilisateur.nom}
              </div>
              <div className="text-[12px] text-[#9fb0e0] truncate">
                ● Connecté · {utilisateur.role}
              </div>
            </div>
            {onDeconnexion && (
              <button
                type="button"
                onClick={onDeconnexion}
                aria-label="Se déconnecter"
                className="w-11 h-11 grid place-items-center border border-[#2a3a6a] rounded-xl text-white hover:bg-white/5 cursor-pointer shrink-0"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};

export default MobileMenu;