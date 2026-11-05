import React from "react";
import { Menu, Search, Bell, ChevronDown } from "lucide-react";

export interface MobileHeaderProps {
  titre: string;
  sousTitre?: string;
  onMenuClick: () => void;
  onSousTitreClick?: () => void;
  onSearchClick?: () => void;
  notificationsCount?: number;
  onNotificationsClick?: () => void;
  initiales?: string;
  onAvatarClick?: () => void;
}

const BTN =
  "w-11 h-11 grid place-items-center text-white cursor-pointer rounded-[10px] " +
  "hover:bg-white/10 active:bg-white/15 transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-white/70";

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  titre,
  sousTitre,
  onMenuClick,
  onSousTitreClick,
  onSearchClick,
  notificationsCount = 0,
  onNotificationsClick,
  initiales = "AS",
  onAvatarClick,
}) => (
  <header className="md:hidden h-14 shrink-0 bg-[#0f1b3d] text-white flex items-center pl-1 pr-2 gap-0.5">
    <button type="button" onClick={onMenuClick} aria-label="Ouvrir le menu" className={BTN}>
      <Menu className="w-6 h-6" aria-hidden="true" />
    </button>

    <div className="flex-1 min-w-0 pl-1 leading-tight">
      <div className="text-[17px] font-bold truncate">{titre}</div>
      {sousTitre &&
        (onSousTitreClick ? (
          <button
            type="button"
            onClick={onSousTitreClick}
            className="text-[12px] text-[#9fb0e0] inline-flex items-center gap-1 max-w-full hover:text-white transition-colors cursor-pointer"
          >
            <span className="truncate">{sousTitre}</span>
            <ChevronDown className="w-3 h-3 shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <div className="text-[12px] text-[#9fb0e0] truncate">{sousTitre}</div>
        ))}
    </div>

    {onSearchClick && (
      <button type="button" onClick={onSearchClick} aria-label="Rechercher" className={BTN}>
        <Search className="w-[22px] h-[22px]" aria-hidden="true" />
      </button>
    )}

    <button
      type="button"
      onClick={onNotificationsClick}
      aria-label={
        notificationsCount > 0
          ? `Notifications, ${notificationsCount} non lues`
          : "Notifications"
      }
      className={`relative ${BTN}`}
    >
      <Bell className="w-[22px] h-[22px]" aria-hidden="true" />
      {notificationsCount > 0 && (
        <span className="absolute top-[5px] right-[3px] min-w-[18px] h-[18px] px-1 rounded-full bg-[#1f9d55] text-white text-[11px] font-extrabold grid place-items-center tabular-nums">
          {notificationsCount > 9 ? "9+" : notificationsCount}
        </span>
      )}
    </button>

    <button
      type="button"
      onClick={onAvatarClick}
      aria-label="Mon compte"
      className="w-9 h-9 ml-1 rounded-full bg-[#e7f6ed] text-[#14703c] font-bold text-[13px] grid place-items-center cursor-pointer shrink-0"
    >
      {initiales}
    </button>
  </header>
);

export default MobileHeader;