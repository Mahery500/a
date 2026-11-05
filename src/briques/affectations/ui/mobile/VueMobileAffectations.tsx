import React, { useState } from "react";
import {
  Plus, RefreshCw, Search, MoreHorizontal, MapPin, Building2,
  CheckCircle2, Calendar, X, Check,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { formaterDate } from "@/noyau/utils/dates";
import { ModaleConfirmationSuppression } from "@/noyau/ui/ModaleConfirmationSuppression";
import {
  AffectationPersonnel, NouvelleAffectationInput, ModificationAffectationInput,
} from "../../modele/affectation.types";
import { useAffectations } from "../../hooks/useAffectations";
import { FormulaireAffectationSheet } from "./FormulaireAffectationSheet";
import { MenuActionsAffectationSheet } from "./MenuActionsAffectationSheet";

export interface VueMobileAffectationsProps {
  mode?: ModeAffichage;
}

const CHIP =
  "inline-flex items-center gap-1 rounded-full text-[12px] font-bold px-2.5 py-0.5 whitespace-nowrap";

export const VueMobileAffectations: React.FC<VueMobileAffectationsProps> = ({
  mode = "edition",
}) => {
  const lecture = mode === "lecture";

  const {
    affectations, affectationsToutes, optionsPersonnel, optionsServices, optionsSites,
    chargement, stats, recherche, setRecherche,
    filtreSiteId, setFiltreSiteId, filtreActif, setFiltreActif,
    recharger, creerAffectation, modifierAffectation, supprimerAffectation,
  } = useAffectations();

  const [formOuvert, setFormOuvert] = useState(false);
  const [affectationEnEdition, setAffectationEnEdition] =
    useState<AffectationPersonnel | null>(null);
  const [menuAffectation, setMenuAffectation] =
    useState<AffectationPersonnel | null>(null);
  const [aSupprimer, setASupprimer] = useState<AffectationPersonnel | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  if (mode === "masque") return null;

  const nomAffiche = (aff: AffectationPersonnel) =>
    `${aff.nomPersonnel ?? ""} ${aff.prenomPersonnel ?? ""}`.trim() ||
    `Personnel #${aff.staffId}`;

  const initiales = (aff: AffectationPersonnel) => {
    const n = aff.nomPersonnel?.trim() ?? "";
    const p = aff.prenomPersonnel?.trim() ?? "";
    if (n && p) return `${p[0]}${n[0]}`.toUpperCase();
    if (n) return n.slice(0, 2).toUpperCase();
    return "??";
  };

  const handleEnregistrer = async (
    saisie: NouvelleAffectationInput | ModificationAffectationInput,
    id?: number,
  ) =>
    id
      ? modifierAffectation(id, saisie as ModificationAffectationInput)
      : creerAffectation(saisie as NouvelleAffectationInput);

  const cloturer = async (aff: AffectationPersonnel) => {
    setMenuAffectation(null);
    await modifierAffectation(aff.id, {
      staffId: aff.staffId,
      serviceId: aff.serviceId,
      dateDebut: aff.dateDebut,
      dateFin: new Date().toISOString().split("T")[0],
      estPrincipal: aff.estPrincipal,
      actif: false,
    });
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    setSuppressionEnCours(true);
    try {
      const ok = await supprimerAffectation(aSupprimer.id, nomAffiche(aSupprimer));
      if (ok) setASupprimer(null);
    } finally {
      setSuppressionEnCours(false);
    }
  };

  const pilules: { cle: "tous" | "actifs" | "inactifs"; libelle: string; n: number }[] = [
    { cle: "tous", libelle: "Toutes", n: stats.total },
    { cle: "actifs", libelle: "Actives", n: stats.actives },
    { cle: "inactifs", libelle: "Clôturées", n: stats.inactives },
  ];

  return (
    <div className="p-4 pb-32">
      {/* En-tête + stats */}
      <h1 className="text-[22px] font-extrabold leading-tight text-[#1f2937]">
        Affectations
      </h1>
      <p className="text-[13px] text-[#5b6472] mt-0.5">
        <b className="text-[#1f2937]">{stats.total}</b> affectations ·{" "}
        <b className="text-[#1f2937]">{stats.actives}</b> actives ·{" "}
        <b className="text-[#1f2937]">{stats.agentsAffectes}</b> personnes réparties
      </p>

      {/* Recherche + rafraîchir */}
      <div className="flex gap-2 mt-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5b6472] pointer-events-none" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Agent, service ou rôle…"
            aria-label="Rechercher une affectation"
            className="h-12 w-full pl-11 pr-3 rounded-[10px] border border-[#e5e7eb] bg-white text-base text-[#1f2937] placeholder:text-[#5b6472] focus:outline-none focus:border-[#1f9d55]"
          />
        </div>
        <button
          type="button"
          onClick={recharger}
          disabled={chargement}
          aria-label="Rafraîchir"
          className="w-12 h-12 shrink-0 rounded-[10px] border border-[#e5e7eb] bg-white grid place-items-center text-[#1f2937] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`} />
        </button>
      </div>

      {/* Filtres chips */}
      <div className="flex gap-2 mt-3 overflow-x-auto -mx-4 px-4 scrollbar-none">
        {pilules.map((p) => {
          const actif = filtreActif === p.cle;
          return (
            <button
              key={p.cle}
              type="button"
              onClick={() => setFiltreActif(p.cle)}
              className={`h-9 shrink-0 rounded-full border text-[13px] px-3.5 ${
                actif
                  ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                  : "border-[#e5e7eb] bg-white text-[#5b6472]"
              }`}
            >
              {p.libelle} · {p.n}
            </button>
          );
        })}
      </div>

      {/* Filtre site */}
      <select
        value={filtreSiteId === "tous" ? "" : filtreSiteId}
        onChange={(e) => {
          const v = e.target.value;
          setFiltreSiteId(v === "" ? "tous" : Number(v));
        }}
        aria-label="Filtrer par établissement"
        className="mt-2 h-11 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm text-[#1f2937]"
      >
        <option value="">Tous les établissements</option>
        {optionsSites.map((s) => (
          <option key={s.id} value={s.id}>{s.nom}</option>
        ))}
      </select>

      {/* Liste cards */}
      <div className="mt-3 flex flex-col gap-2.5">
        {chargement ? (
          <div className="p-10 text-center text-[#5b6472] text-[13px]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#1f9d55] mx-auto mb-2" />
            Chargement des affectations…
          </div>
        ) : affectations.length === 0 ? (
          <div className="p-10 text-center text-[#5b6472] text-[13px] bg-white border border-[#e5e7eb] rounded-[14px]">
            {affectationsToutes.length === 0
              ? "Aucune affectation enregistrée."
              : "Aucune affectation ne correspond aux filtres."}
          </div>
        ) : (
          affectations.map((aff) => {
            const attenue = aff.actif ? "" : "opacity-60";
            return (
              <article
                key={aff.id}
                className={`bg-white border border-[#e5e7eb] rounded-[14px] p-3 flex gap-2.5 ${attenue}`}
              >
                <div
                  aria-hidden="true"
                  className={`w-9 h-9 shrink-0 rounded-[10px] grid place-items-center text-[12px] font-bold ${
                    aff.actif ? "bg-[#e7f6ed] text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"
                  }`}
                >
                  {initiales(aff)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-[#1f2937] truncate">
                    {nomAffiche(aff)}
                  </div>
                  <div className="text-[13px] text-[#5b6472] truncate">
                    {aff.rolePersonnel}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1.5 text-[13px] font-semibold text-[#1f2937]">
                    <Building2 className="w-3.5 h-3.5 text-[#5b6472] shrink-0" />
                    <span className="truncate">{aff.nomService}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-[#5b6472]">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{aff.nomSite}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`${CHIP} ${aff.actif ? "bg-[#e7f6ed] text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"}`}>
                      {aff.actif ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {aff.actif ? "Active" : "Clôturée"}
                    </span>
                    {aff.estPrincipal && (
                      <span className={`${CHIP} bg-white border border-[#bfe3cd] text-[#14703c]`}>
                        Principale
                      </span>
                    )}
                    <span className="text-[12px] text-[#5b6472] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {aff.dateFin
                        ? `${formaterDate(aff.dateDebut)} → ${formaterDate(aff.dateFin)}`
                        : `Depuis le ${formaterDate(aff.dateDebut)}`}
                    </span>
                  </div>
                </div>

                {!lecture && (
                  <button
                    type="button"
                    onClick={() => setMenuAffectation(aff)}
                    aria-label={`Actions pour ${nomAffiche(aff)}`}
                    className="w-10 h-10 -mr-1 -mt-1 shrink-0 grid place-items-center rounded-[10px] text-[#1f2937] hover:bg-slate-50"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Footer */}
      {affectationsToutes.length > 0 && (
        <div className="mt-3 text-center text-[12px] text-[#5b6472] flex items-center justify-center gap-1.5">
          {affectations.length} affichés sur {affectationsToutes.length} ·{" "}
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1f9d55]" /> À jour
          </span>
        </div>
      )}

      {/* FAB */}
      {!lecture && (
        <button
          type="button"
          onClick={() => {
            setAffectationEnEdition(null);
            setFormOuvert(true);
          }}
          className="fixed bottom-20 right-4 h-[52px] pl-4 pr-5 rounded-full bg-[#1f9d55] text-white font-bold text-sm shadow-[0_6px_16px_rgba(31,157,85,.35)] inline-flex items-center gap-2 z-30"
        >
          <Plus className="w-5 h-5" />
          Nouvelle affectation
        </button>
      )}

      {/* Menu actions */}
      <MenuActionsAffectationSheet
        ouvert={!!menuAffectation}
        affectation={menuAffectation}
        onFermer={() => setMenuAffectation(null)}
        onModifier={() => {
          setAffectationEnEdition(menuAffectation);
          setMenuAffectation(null);
          setFormOuvert(true);
        }}
        onCloturer={() => menuAffectation && cloturer(menuAffectation)}
        onSupprimer={() => {
          setASupprimer(menuAffectation);
          setMenuAffectation(null);
        }}
      />

      {/* Formulaire bottom sheet */}
      <FormulaireAffectationSheet
        ouvert={formOuvert}
        affectationEnEdition={affectationEnEdition}
        optionsPersonnel={optionsPersonnel}
        optionsServices={optionsServices}
        optionsSites={optionsSites}
        affectationsExistantes={affectationsToutes}
        onFermer={() => {
          setFormOuvert(false);
          setAffectationEnEdition(null);
        }}
        onEnregistrer={handleEnregistrer}
      />

      {/* Confirmation suppression */}
      <ModaleConfirmationSuppression
        ouvert={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        onConfirmer={confirmerSuppression}
        enCours={suppressionEnCours}
        titre="Supprimer l'affectation"
        message="Voulez-vous vraiment retirer cette affectation ?"
        nomElement={
          aSupprimer ? `${nomAffiche(aSupprimer)} (${aSupprimer.nomService})` : undefined
        }
      />
    </div>
  );
};

export default VueMobileAffectations;