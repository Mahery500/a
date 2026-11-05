import React from "react";

export interface MobileBottomNavItem {
  id: string;
  libelle: string;
  Icone: React.ComponentType<{ className?: string }>;
}

export interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
  actifId?: string;
  onChange: (id: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  actifId,
  onChange,
}) => (
  <nav
    aria-label="Navigation principale"
    className="md:hidden h-16 shrink-0 bg-white border-t border-[#e5e7eb] shadow-[0_-2px_8px_rgba(15,27,61,.08)] flex"
  >
    {items.map((item) => {
      const actif = item.id === actifId;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          aria-current={actif ? "page" : undefined}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
        >
          <span
            className={`w-[52px] h-7 rounded-full flex items-center justify-center transition-colors ${
              actif ? "bg-[#e7f6ed]" : ""
            }`}
          >
            <item.Icone
              className={`w-[22px] h-[22px] ${
                actif ? "text-[#14703c]" : "text-[#5b6472]"
              }`}
            />
          </span>
          <span
            className={`text-[11px] truncate max-w-full px-1 ${
              actif ? "font-bold text-[#14703c]" : "font-medium text-[#5b6472]"
            }`}
          >
            {item.libelle}
          </span>
        </button>
      );
    })}
  </nav>
);

export default MobileBottomNav;