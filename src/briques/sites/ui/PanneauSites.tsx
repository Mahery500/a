/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  MoreHorizontal,
  Edit2,
  Trash2,
  Building2,
  LayoutGrid,
  List,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { ModaleConfirmationSuppression } from "@/noyau/ui/ModaleConfirmationSuppression";
import {
  SiteHospitalier,
  NouveauSiteInput,
  ModificationSiteInput,
} from "../modele/site.types";
import { useSites } from "../hooks/useSites";
import { FormulaireSiteModale } from "./FormulaireSiteModale";

/* =====================================================================
 *  Tokens du design (maquette « Sites médicaux — liste »)
 *  vert #1f9d55 · vert clair #e7f6ed · vert foncé #14703c
 *  bordure #e5e7eb · séparateur #f0f2f1 · texte #1f2937 · muted #5b6472
 * ===================================================================== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BOUTON_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BOUTON_SECONDAIRE = `${BOUTON_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BOUTON_PRIMAIRE = `${BOUTON_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

type FiltreStatut = "tous" | "actifs" | "inactifs";
type ModeVue = "liste" | "cartes";

interface MenuActions {
  site: SiteHospitalier;
  top: number;
  right: number;
}

/* ===================================================================== */
/*  Panneau                                                              */
/* ===================================================================== */
export const PanneauSites: React.FC<{ mode?: ModeAffichage }> = ({ mode = "edition" }) => {
  const estModeLectureSeule = mode === "lecture";

  const {
    sites,
    totalSites,
    chargement,
    erreur,
    recherche,
    setRecherche,
    recharger,
    creerSite,
    modifierSite,
    supprimerSite,
  } = useSites();

  /* ---------- Filtres locaux ---------- */
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [filtreVille, setFiltreVille] = useState<string>("toutes");
  const [modeVue, setModeVue] = useState<ModeVue>("liste");

  /* ---------- Modales ---------- */
  const [modalFormulaireOuverte, setModalFormulaireOuverte] = useState(false);
  const [siteEnEdition, setSiteEnEdition] = useState<SiteHospitalier | null>(null);

  const [siteASupprimer, setSiteASupprimer] = useState<SiteHospitalier | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  /* ---------- Menu « ⋯ » ---------- */
  const [menu, setMenu] = useState<MenuActions | null>(null);

  useEffect(() => {
    if (!menu) return;
    const fermer = () => setMenu(null);
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", surTouche);
    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", surTouche);
    };
  }, [menu]);

  /* ---------- Handlers ---------- */
  const ouvrirCreation = () => {
    setSiteEnEdition(null);
    setModalFormulaireOuverte(true);
  };

  const ouvrirEdition = (site: SiteHospitalier) => {
    setSiteEnEdition(site);
    setModalFormulaireOuverte(true);
  };

  const handleEnregistrer = async (
    saisie: NouveauSiteInput | ModificationSiteInput,
    id?: number,
  ): Promise<boolean> => {
    if (id) {
      return modifierSite(id, saisie);
    }
    return creerSite(saisie as NouveauSiteInput);
  };

  const confirmerSuppression = async () => {
    if (!siteASupprimer) return;
    setSuppressionEnCours(true);
    try {
      const ok = await supprimerSite(siteASupprimer.id, siteASupprimer.nom);
      if (ok) setSiteASupprimer(null);
    } finally {
      setSuppressionEnCours(false);
    }
  };

  const basculerStatut = async (site: SiteHospitalier) => {
    if (estModeLectureSeule) return;
    await modifierSite(site.id, { actif: !site.actif });
  };

  if (mode === "masque") return null;

  /* ---------- Filtrage + compteurs ---------- */
  const villes = useMemo(
    () =>
      Array.from(
        new Set(sites.map((s) => s.ville).filter((v): v is string => !!v && v.trim() !== "")),
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [sites],
  );

  const compteurs = useMemo(() => {
    const total = sites.length;
    const actifs = sites.filter((s) => s.actif).length;
    return { total, actifs, inactifs: total - actifs };
  }, [sites]);

  const sitesFiltres = useMemo(() => {
    return sites.filter((s) => {
      if (filtreStatut === "actifs" && !s.actif) return false;
      if (filtreStatut === "inactifs" && s.actif) return false;
      if (filtreVille !== "toutes" && s.ville !== filtreVille) return false;
      return true;
    });
  }, [sites, filtreStatut, filtreVille]);

  /* ---------- Rendu ---------- */
  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===================== En-tête + bouton ===================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">
            Sites médicaux et centres cliniques
          </h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            {totalSites} établissement{totalSites > 1 ? "s" : ""} répertorié
            {totalSites > 1 ? "s" : ""} dans le réseau de soins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recharger}
            disabled={chargement}
            className={`${BOUTON_SECONDAIRE} !px-2.5`}
            title="Rafraîchir la liste"
            aria-label="Rafraîchir la liste"
          >
            <RefreshCw
              className={`h-4 w-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
          </button>

          {!estModeLectureSeule && (
            <button type="button" onClick={ouvrirCreation} className={BOUTON_PRIMAIRE}>
              <Plus className="h-[18px] w-[18px]" />
              Nouveau site
            </button>
          )}
        </div>
      </div>

      {/* ===================== Barre de filtres ===================== */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Filtrer par nom, code ou ville…"
            aria-label="Rechercher un site"
            className={`${CHAMP} w-full pl-9`}
          />
        </div>

        {/* Pilules statut */}
        <div className="flex items-center gap-2" role="group" aria-label="Filtrer par statut">
          {(
            [
              { cle: "tous", label: "Tous", n: compteurs.total },
              { cle: "actifs", label: "Actifs", n: compteurs.actifs },
              { cle: "inactifs", label: "Inactifs", n: compteurs.inactifs },
            ] as const
          ).map((p) => {
            const actif = filtreStatut === p.cle;
            return (
              <button
                key={p.cle}
                type="button"
                onClick={() => setFiltreStatut(p.cle)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap border cursor-pointer transition-colors ${FOCUS} ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa] font-medium"
                }`}
              >
                {p.label} · {p.n}
              </button>
            );
          })}
        </div>

        {/* Filtre ville */}
        <select
          value={filtreVille}
          onChange={(e) => setFiltreVille(e.target.value)}
          aria-label="Filtrer par ville"
          className={`${CHAMP} min-w-[170px]`}
        >
          <option value="toutes">Toutes les villes</option>
          {villes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        {/* Bascule Liste / Cartes */}
        <div
          className="flex h-10 rounded-[10px] border border-[#e5e7eb] overflow-hidden bg-white shrink-0"
          role="group"
          aria-label="Mode d'affichage"
        >
          <button
            type="button"
            onClick={() => setModeVue("liste")}
            aria-pressed={modeVue === "liste"}
            className={`px-3.5 text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors ${FOCUS} ${
              modeVue === "liste"
                ? "bg-[#e7f6ed] text-[#14703c] font-bold"
                : "text-[#5b6472] hover:bg-[#fafbfa] font-medium"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Liste
          </button>
          <button
            type="button"
            onClick={() => setModeVue("cartes")}
            aria-pressed={modeVue === "cartes"}
            className={`px-3.5 text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors ${FOCUS} ${
              modeVue === "cartes"
                ? "bg-[#e7f6ed] text-[#14703c] font-bold"
                : "text-[#5b6472] hover:bg-[#fafbfa] font-medium"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cartes
          </button>
        </div>
      </div>

      {/* ===================== État d'erreur ===================== */}
      {erreur && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-rose-700 text-xs flex items-center justify-between">
          <span>{erreur}</span>
          <button
            type="button"
            onClick={recharger}
            className="font-bold underline cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ===================== Contenu ===================== */}
      {chargement ? (
        <div className={`${CARTE} p-12 text-center text-[#5b6472]`}>
          <div className="flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55]" />
            <span className="text-xs">Chargement des sites médicaux…</span>
          </div>
        </div>
      ) : sitesFiltres.length === 0 ? (
        <div className={`${CARTE} p-12 text-center text-[#5b6472] text-[13px]`}>
          {sites.length === 0
            ? "Aucun site médical enregistré. Cliquez sur « Nouveau site » pour en ajouter."
            : "Aucun site ne correspond aux filtres appliqués."}
        </div>
      ) : modeVue === "liste" ? (
        /* ---------- Vue LISTE (tableau) ---------- */
        <div className={`${CARTE} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    { label: "Code", w: "w-[122px]" },
                    { label: "Site", w: "w-auto" },
                    { label: "Adresse", w: "w-[272px]" },
                    { label: "Téléphone", w: "w-[162px]" },
                    { label: "Statut", w: "w-[122px]" },
                    { label: "", w: "w-[52px]" },
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`${h.w} bg-[#fafbfa] text-left h-10 px-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-t border-[#e5e7eb]`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sitesFiltres.map((site) => (
                  <tr
                    key={site.id}
                    className="h-[54px] border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors cursor-pointer"
                    onClick={() => ouvrirEdition(site)}
                  >
                    {/* Code */}
                    <td className="px-4 py-2">
                      <span className="inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-xs font-bold whitespace-nowrap">
                        {site.code || `SITE-${site.id}`}
                      </span>
                    </td>

                    {/* Site + ville */}
                    <td className="px-4 py-2 min-w-0">
                      <div className="font-bold text-[#1f2937] truncate">{site.nom}</div>
                      <div className="text-xs text-[#5b6472] truncate">
                        {site.ville || "Ville non renseignée"}
                      </div>
                    </td>

                    {/* Adresse */}
                    <td className="px-4 py-2 w-[272px]">
                      <div
                        className="truncate text-[13px] text-[#1f2937]"
                        title={site.adresse || ""}
                      >
                        {site.adresse || (
                          <span className="italic text-[#5b6472]">Non renseignée</span>
                        )}
                      </div>
                    </td>

                    {/* Téléphone */}
                    <td className="px-4 py-2 w-[162px]">
                      {site.telephone ? (
                        <span className="font-mono text-[13px] text-[#1f2937] whitespace-nowrap">
                          {site.telephone}
                        </span>
                      ) : (
                        <span className="text-[13px] italic text-[#5b6472]">—</span>
                      )}
                    </td>

                    {/* Statut toggle */}
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      {estModeLectureSeule ? (
                        <span
                          className={`${PUCE} ${
                            site.actif
                              ? "bg-[#e7f6ed] text-[#14703c]"
                              : "bg-[#f0f2f1] text-[#5b6472]"
                          }`}
                        >
                          {site.actif ? "Actif" : "Inactif"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={site.actif}
                          aria-label={`${site.actif ? "Désactiver" : "Activer"} ${site.nom}`}
                          onClick={() => basculerStatut(site)}
                          className={`inline-flex items-center gap-2 cursor-pointer ${FOCUS}`}
                        >
                          <span
                            className={`relative w-[34px] h-5 rounded-full transition-colors ${
                              site.actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                site.actif ? "left-4" : "left-0.5"
                              }`}
                            />
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              site.actif ? "text-[#14703c]" : "text-[#5b6472]"
                            }`}
                          >
                            {site.actif ? "Actif" : "Inactif"}
                          </span>
                        </button>
                      )}
                    </td>

                    {/* Menu actions */}
                    <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      {!estModeLectureSeule && (
                        <button
                          type="button"
                          aria-label={`Actions pour ${site.nom}`}
                          aria-haspopup="menu"
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setMenu({
                              site,
                              top: r.bottom + 4,
                              right: window.innerWidth - r.right,
                            });
                          }}
                          className={`w-9 h-9 grid place-items-center rounded-[10px] text-[#5b6472] hover:bg-[#fafbfa] hover:text-[#1f2937] cursor-pointer transition-colors ${FOCUS}`}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-[11px] text-[#5b6472]">
            <strong className="font-bold text-[#1f2937]">{sitesFiltres.length}</strong> site
            {sitesFiltres.length > 1 ? "s" : ""} affiché
            {sitesFiltres.length > 1 ? "s" : ""} sur {sites.length}
            {sites.length > 1 ? "" : ""} · cliquer sur une ligne pour ouvrir la fiche.
          </div>
        </div>
      ) : (
        /* ---------- Vue CARTES ---------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sitesFiltres.map((site) => (
            <div
              key={site.id}
              className={`${CARTE} p-4 flex flex-col justify-between gap-3 hover:border-[#1f9d55]/40 transition-colors cursor-pointer`}
              onClick={() => ouvrirEdition(site)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-xs font-bold">
                    {site.code || `SITE-${site.id}`}
                  </span>
                  <span
                    className={`${PUCE} ${
                      site.actif
                        ? "bg-[#e7f6ed] text-[#14703c]"
                        : "bg-[#f0f2f1] text-[#5b6472]"
                    }`}
                  >
                    {site.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#1f2937] leading-snug">{site.nom}</h4>

                <div className="space-y-1 text-xs text-[#5b6472]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#5b6472] shrink-0" />
                    <span className="truncate">
                      {site.ville}
                      {site.adresse ? ` — ${site.adresse}` : ""}
                    </span>
                  </div>
                  {site.telephone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#5b6472] shrink-0" />
                      <span className="font-mono text-[11px]">{site.telephone}</span>
                    </div>
                  )}
                </div>
              </div>

              {!estModeLectureSeule && (
                <div
                  className="flex items-center justify-end gap-1.5 pt-3 border-t border-[#f0f2f1]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => ouvrirEdition(site)}
                    title="Modifier le site"
                    className={`p-1.5 text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] rounded-md transition-colors cursor-pointer ${FOCUS}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSiteASupprimer(site)}
                    title="Supprimer le site"
                    className={`p-1.5 text-[#5b6472] hover:text-[#b42318] hover:bg-rose-50 rounded-md transition-colors cursor-pointer ${FOCUS}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===================== Menu contextuel « ⋯ » ===================== */}
      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            style={{ top: menu.top, right: menu.right }}
            className="fixed z-50 w-52 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                ouvrirEdition(menu.site);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#5b6472]" />
              Modifier
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                basculerStatut(menu.site);
                setMenu(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] cursor-pointer ${
                menu.site.actif
                  ? "text-[#b42318] hover:bg-rose-50"
                  : "text-[#14703c] hover:bg-[#e7f6ed]"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              {menu.site.actif ? "Désactiver" : "Activer"}
            </button>

            <div className="my-1 border-t border-[#f0f2f1]" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setSiteASupprimer(menu.site);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#b42318] hover:bg-rose-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          </div>
        </>
      )}

      {/* ===================== Modales ===================== */}
      <FormulaireSiteModale
        ouvert={modalFormulaireOuverte}
        siteEnEdition={siteEnEdition}
        onFermer={() => setModalFormulaireOuverte(false)}
        onEnregistrer={handleEnregistrer}
      />

      <ModaleConfirmationSuppression
        ouvert={siteASupprimer !== null}
        onFermer={() => setSiteASupprimer(null)}
        onConfirmer={confirmerSuppression}
        enCours={suppressionEnCours}
        titre="Supprimer le site médical"
        message="Voulez-vous vraiment supprimer cet établissement du réseau ? Les services associés devront être réassignés."
        nomElement={siteASupprimer?.nom}
      />
    </div>
  );
};

export default PanneauSites;