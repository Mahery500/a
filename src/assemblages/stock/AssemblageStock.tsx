// AssemblageStock.tsx
import React, { useMemo, useState } from "react";
import {
  Layers,
  LayoutDashboard,
  Pill,
  ClipboardCheck,
  BookOpen,
  Truck,
  Repeat,
  PackagePlus,
  Package,
  ShieldAlert,
} from "lucide-react";
import { useSession } from "@/cerveau/session";
import { ModeAffichage } from "@/cerveau/permissions";
import { PanneauStockNiveaux } from "@/briques/stock-niveaux";
import { PanneauStockDispensation } from "@/briques/stock-dispensation";
import { PanneauStockCommandes } from "@/briques/stock-commandes";
import { PanneauStockAppro } from "@/briques/stock-appro";
import { PanneauStockTransferts } from "@/briques/stock-transferts";
import { PanneauStockAjustements } from "@/briques/stock-ajustements";
import { PanneauPharmacieCatalogue } from "@/briques/pharmacie-catalogue";
import TableauBordStock from "@/briques/stock-tableau-bord/ui/PanneauStockTableauBord";
import { useStockPermissions } from "./useStockPermissions";

type Cle =
  | "tableau-bord"
  | "niveaux"
  | "dispensation"
  | "commandes"
  | "appro"
  | "transferts"
  | "ajustements"
  | "catalogue";

export interface AssemblageStockProps {
  siteActifId?: number | null;
  serviceActifId?: number | null;
  ongletParDefaut?: Cle;
  modes?: Partial<Record<Cle, ModeAffichage>>;
  sousOngletActif?: string | null;
  onSousOngletChange?: (id: string) => void;
}

interface DefinitionOnglet {
  id: Cle;
  libelle: string;
  icone?: React.ReactNode;
  autorise: boolean;
  groupe?: string;
}

export const AssemblageStock: React.FC<AssemblageStockProps> = ({
  siteActifId,
  ongletParDefaut = "tableau-bord",
  modes = {},
  sousOngletActif,
  onSousOngletChange,
}) => {
  const { siteActifId: siteSessionId } = useSession();
  const permissions = useStockPermissions();

  const tousOnglets: DefinitionOnglet[] = useMemo(
    () => [
      {
        id: "tableau-bord",
        libelle: "Tableau de Bord",
        icone: <LayoutDashboard className="w-4 h-4" />,
        autorise: permissions.peutVoirNiveaux,
        groupe: "Pilotage",
      },
      {
        id: "niveaux",
        libelle: "État des Stocks & Alertes",
        icone: <Layers className="w-4 h-4" />,
        autorise: permissions.peutVoirNiveaux,
        groupe: "Pilotage",
      },
      {
        id: "dispensation",
        libelle: "Dispensation Comptoir",
        icone: <Pill className="w-4 h-4" />,
        autorise: permissions.peutDispenser,
        groupe: "Pilotage",
      },
      {
        id: "commandes",
        libelle: "Commandes & Réceptions",
        icone: <Truck className="w-4 h-4" />,
        autorise: permissions.peutGererCommandes,
        groupe: "Flux",
      },
      {
        id: "appro",
        libelle: "Approvisionnements",
        icone: <PackagePlus className="w-4 h-4" />,
        autorise: permissions.peutGererAppro,
        groupe: "Flux",
      },
      {
        id: "transferts",
        libelle: "Transferts",
        icone: <Repeat className="w-4 h-4" />,
        autorise: permissions.peutGererTransferts,
        groupe: "Flux",
      },
      {
        id: "ajustements",
        libelle: "Inventaires & Ajustements",
        icone: <ClipboardCheck className="w-4 h-4" />,
        autorise: permissions.peutGererAjustements,
        groupe: "Flux",
      },
      {
        id: "catalogue",
        libelle: "Référentiel Médicaments",
        icone: <BookOpen className="w-4 h-4" />,
        autorise: permissions.peutVoirCatalogue,
        groupe: "Référentiel",
      },
    ],
    [permissions],
  );

  const onglets = useMemo(() => tousOnglets.filter((o) => o.autorise), [tousOnglets]);

  const [actifInterne, setActifInterne] = useState<Cle>(ongletParDefaut);

  const actif: Cle = useMemo(() => {
    const propose = (sousOngletActif as Cle | null) ?? actifInterne;
    if (onglets.some((o) => o.id === propose)) return propose;
    return onglets[0]?.id ?? "niveaux";
  }, [sousOngletActif, actifInterne, onglets]);

  // Le site vient de la prop ou de la session (plus de sélecteur dans l'en-tête)
  const site: number | null = siteActifId ?? siteSessionId ?? null;

  const m = (c: Cle): ModeAffichage => modes[c] ?? "edition";

  const naviguer = (id: string) => {
    setActifInterne(id as Cle);
    onSousOngletChange?.(id);
  };

  if (permissions.profil === "aucun") {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2">
        <ShieldAlert className="h-8 w-8 text-amber-500 mx-auto" />
        <h4 className="text-sm font-bold text-slate-700">Aucun accès au module Stock</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Votre compte ne dispose d'aucun profil Stock (Dispensateur, Responsable ou Gestionnaire).
          Contactez un administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* En-tête : titre contextuel du module */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200/60">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              {tousOnglets.find((o) => o.id === actif)?.libelle ?? "Espace Stock"}
            </h1>
            <p className="text-xs text-slate-500">
              {permissions.peutChangerSite
                ? "Vision consolidée multi-sites & flux inter-établissements"
                : "Gestion du stock local rattaché à votre établissement"}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="min-w-0">
        {actif === "tableau-bord" && (
          <TableauBordStock
            siteId={permissions.peutChangerSite ? undefined : (site ?? undefined)}
            multiSites={permissions.peutChangerSite}
            onNaviguer={naviguer}
          />
        )}
        {actif === "niveaux" && (
          <PanneauStockNiveaux mode={m("niveaux")} siteActifId={site ?? undefined} />
        )}
        {actif === "dispensation" && (
          <PanneauStockDispensation mode={m("dispensation")} siteActifId={site ?? undefined} />
        )}
        {actif === "commandes" && (
          <PanneauStockCommandes mode={m("commandes")} siteActifId={site ?? undefined} />
        )}
        {actif === "appro" && (
          <PanneauStockAppro mode={m("appro")} siteActifId={site ?? undefined} />
        )}
        {actif === "transferts" && (
          <PanneauStockTransferts mode={m("transferts")} siteActifId={site ?? undefined} />
        )}
        {actif === "ajustements" && (
          <PanneauStockAjustements mode={m("ajustements")} siteActifId={site ?? undefined} />
        )}
        {actif === "catalogue" && <PanneauPharmacieCatalogue mode={m("catalogue")} />}
      </div>
    </div>
  );
};

export default AssemblageStock;