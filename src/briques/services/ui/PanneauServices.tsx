// src/briques/services/ui/PanneauServices.tsx
import React, { useState } from "react";
import {
  Plus, RefreshCw, Search, MoreHorizontal, Edit2, Trash2, Building2, Check, X,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { ModaleConfirmationSuppression } from "@/noyau/ui/ModaleConfirmationSuppression";
import {
  ServiceMedical, TypeServiceMedical,
  NouveauServiceInput, ModificationServiceInput,
  NouveauTypeServiceInput, ModificationTypeServiceInput,
  DomaineService, DOMAINES_SERVICE, LIBELLES_DOMAINE_SERVICE,
} from "../modele/service.types";
import { useServices } from "../hooks/useServices";
import { FormulaireServiceModale } from "./FormulaireServiceModale";
import { FormulaireTypeServiceModale } from "./FormulaireTypeServiceModale";

/* =============== Tokens =============== */
const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BTN_BASE = "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDAIRE = `${BTN_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BTN_PRIMAIRE = `${BTN_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP = "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const CHIP = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap";
const CHIP_CODE = "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-xs font-bold whitespace-nowrap";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

const chipDomaine = (d: DomaineService | null | undefined): string => {
  switch (d) {
    case "MEDICAL": return "bg-[#e7f6ed] text-[#14703c]";
    case "MEDICO_TECHNIQUE": return "bg-[#e0f2fe] text-[#0369a1]";
    case "LOGISTIQUE": return "bg-[#fff4e0] text-[#8a5300]";
    default: return "bg-[#f0f2f1] text-[#5b6472]";
  }
};

/* =============== Petits composants =============== */
const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}> = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${checked ? "bg-[#1f9d55]" : "bg-[#d1d5db]"} ${FOCUS}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-4" : "left-0.5"}`} />
  </button>
);

const PiluleFiltre: React.FC<{
  actif: boolean; onClick: () => void; nombre: number; children: React.ReactNode;
}> = ({ actif, onClick, nombre, children }) => (
  <button
    type="button"
    aria-pressed={actif}
    onClick={onClick}
    className={`px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer transition ${FOCUS} ${
      actif
        ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
        : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
    }`}
  >
    {children} · {nombre}
  </button>
);

/* =============== Panneau =============== */
export const PanneauServices: React.FC<{ mode?: ModeAffichage }> = ({ mode = "edition" }) => {
  const estLectureSeule = mode === "lecture";

  const {
    services, totalServices, statsServices,
    types, typesTous, totalTypes, statsTypes,
    sitesDisponibles, chargement, erreur,
    sousOnglet, setSousOnglet,
    recherche, setRecherche,
    siteFiltreId, setSiteFiltreId,
    filtreStatut, setFiltreStatut,
    filtreDomaine, setFiltreDomaine,
    recharger,
    creerService, modifierService, supprimerService,
    creerType, modifierType, supprimerType,
  } = useServices();

  const [modalServiceOuverte, setModalServiceOuverte] = useState(false);
  const [serviceEnEdition, setServiceEnEdition] = useState<ServiceMedical | null>(null);
  const [modalTypeOuverte, setModalTypeOuverte] = useState(false);
  const [typeEnEdition, setTypeEnEdition] = useState<TypeServiceMedical | null>(null);

  const [serviceASupprimer, setServiceASupprimer] = useState<ServiceMedical | null>(null);
  const [typeASupprimer, setTypeASupprimer] = useState<TypeServiceMedical | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  if (mode === "masque") return null;

  const domaineDe = (s: ServiceMedical): DomaineService | null =>
    typesTous.find((t) => t.id === s.typeServiceId)?.domaine ?? null;

  const handleEnregistrerService = (saisie: NouveauServiceInput | ModificationServiceInput, id?: number) =>
    id ? modifierService(id, saisie) : creerService(saisie as NouveauServiceInput);

  const handleEnregistrerType = (saisie: NouveauTypeServiceInput | ModificationTypeServiceInput, id?: number) =>
    id ? modifierType(id, saisie) : creerType(saisie as NouveauTypeServiceInput);

  const confirmerSuppressionService = async () => {
    if (!serviceASupprimer) return;
    setSuppressionEnCours(true);
    try {
      if (await supprimerService(serviceASupprimer.id)) setServiceASupprimer(null);
    } finally { setSuppressionEnCours(false); }
  };

  const confirmerSuppressionType = async () => {
    if (!typeASupprimer) return;
    setSuppressionEnCours(true);
    try {
      if (await supprimerType(typeASupprimer.id, typeASupprimer.nom)) setTypeASupprimer(null);
    } finally { setSuppressionEnCours(false); }
  };

  const stats = sousOnglet === "cartographie" ? statsServices : statsTypes;

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* ===== En-tête ===== */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">Services et spécialités médicales</h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Cartographie des services et catalogue des spécialités cliniques.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={recharger} disabled={chargement}
            className={`${BTN_SECONDAIRE} !px-2.5`} title="Rafraîchir" aria-label="Rafraîchir">
            <RefreshCw className={`h-4 w-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`} />
          </button>
          {!estLectureSeule && sousOnglet === "cartographie" && (
            <button type="button"
              onClick={() => { setServiceEnEdition(null); setModalServiceOuverte(true); }}
              disabled={sitesDisponibles.length === 0 || types.length === 0}
              className={BTN_PRIMAIRE}>
              <Plus className="h-[18px] w-[18px]" />
              Rattacher un service
            </button>
          )}
          {!estLectureSeule && sousOnglet === "types" && (
            <button type="button"
              onClick={() => { setTypeEnEdition(null); setModalTypeOuverte(true); }}
              className={BTN_PRIMAIRE}>
              <Plus className="h-[18px] w-[18px]" />
              Nouveau type
            </button>
          )}
        </div>
      </div>

      {/* ===== Bandeau de stats ===== */}
      <div className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 h-14`}>
        {sousOnglet === "cartographie" ? (
          <>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsServices.total}</b> services</span>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsServices.actifs}</b> actifs</span>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsServices.sites}</b> établissements</span>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsServices.types}</b> types</span>
          </>
        ) : (
          <>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsTypes.total}</b> types</span>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsTypes.actifs}</b> actifs</span>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsTypes.aiguillables} / {statsTypes.total}</b> aiguillables</span>
            <span className="text-[13px] text-[#1f2937]"><b className="text-[15px]">{statsTypes.medicaux} / {statsTypes.total}</b> domaine médical</span>
          </>
        )}
      </div>

      {/* ===== Filtres ===== */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none" />
          <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder={sousOnglet === "cartographie" ? "Filtrer par service ou établissement…" : "Filtrer par nom ou code…"}
            aria-label="Rechercher" className={`${CHAMP} w-full pl-9`} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PiluleFiltre actif={filtreStatut === "tous"} onClick={() => setFiltreStatut("tous")}
            nombre={sousOnglet === "cartographie" ? statsServices.total : statsTypes.total}>Tous</PiluleFiltre>
          <PiluleFiltre actif={filtreStatut === "actifs"} onClick={() => setFiltreStatut("actifs")}
            nombre={sousOnglet === "cartographie" ? statsServices.actifs : statsTypes.actifs}>Actifs</PiluleFiltre>
          {sousOnglet === "cartographie" && (
            <select value={siteFiltreId === "tous" ? "" : siteFiltreId}
              onChange={(e) => setSiteFiltreId(e.target.value === "" ? "tous" : Number(e.target.value))}
              aria-label="Filtrer par établissement" className={`${CHAMP} min-w-[170px]`}>
              <option value="">Tous les établissements</option>
              {sitesDisponibles.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          )}
          <select value={filtreDomaine} onChange={(e) => setFiltreDomaine(e.target.value as DomaineService | "tous")}
            aria-label="Filtrer par domaine" className={`${CHAMP} min-w-[150px]`}>
            <option value="tous">Tous domaines</option>
            {DOMAINES_SERVICE.map((d) => <option key={d} value={d}>{LIBELLES_DOMAINE_SERVICE[d]}</option>)}
          </select>
        </div>
      </div>

      {/* ===== Erreur ===== */}
      {erreur && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-rose-700 text-xs flex items-center justify-between">
          <span>{erreur}</span>
          <button type="button" onClick={recharger} className="font-bold underline cursor-pointer">Réessayer</button>
        </div>
      )}

      {/* ===== Carte principale : tabs + tableau ===== */}
      <div className={`${CARTE} overflow-hidden`}>
        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb]">
          {(
            [
              { id: "cartographie" as const, label: "Cartographie des services", count: totalServices },
              { id: "types" as const, label: "Types et spécialités", count: totalTypes },
            ]
          ).map((t) => {
            const actif = sousOnglet === t.id;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={actif}
                onClick={() => setSousOnglet(t.id)}
                className={`px-5 h-12 flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer transition-colors border-b-2 ${FOCUS} ${
                  actif ? "text-[#14703c] font-bold border-[#1f9d55]" : "text-[#5b6472] font-semibold border-transparent hover:text-[#1f2937]"
                }`}>
                {t.label}
                <span className={`px-2 rounded-full text-[10px] font-bold tabular-nums ${actif ? "bg-[#e7f6ed] text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"}`}>{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* Tableau */}
        {chargement ? (
          <div className="p-12 text-center text-[#5b6472]">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55] mx-auto mb-2" />
            <span className="text-xs">Chargement en cours…</span>
          </div>
        ) : sousOnglet === "cartographie" ? (
          services.length === 0 ? (
            <div className="p-12 text-center text-[#5b6472] text-[13px]">
              Aucun service ne correspond aux filtres appliqués.
            </div>
          ) : (
            <>
              <div className="bg-[#fafbfa] flex items-center h-10 px-4 border-b border-[#e5e7eb]">
                <span className="w-[62px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">ID</span>
                <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Service</span>
                <span className="w-[212px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Établissement</span>
                <span className="w-[142px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Domaine</span>
                <span className="w-[122px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Statut</span>
                <span className="w-[40px]" />
              </div>
              {services.map((s) => {
                const domaine = domaineDe(s);
                return (
                  <div key={s.id} className="h-[54px] flex items-center px-4 gap-3 border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors">
                    <span className="w-[50px] font-mono text-xs text-[#5b6472]">{s.id}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#1f2937] truncate">{s.nomTypeService || `Service #${s.id}`}</div>
                      <div className="text-[12px] text-[#5b6472] truncate max-w-[420px]">{s.description || "—"}</div>
                    </div>
                    <div className="w-[200px] flex items-center gap-2 text-[13px] text-[#1f2937]">
                      <Building2 className="h-4 w-4 text-[#5b6472] shrink-0" />
                      <span className="truncate">{s.nomSite || `Site #${s.siteId}`}</span>
                    </div>
                    <div className="w-[130px]">
                      <span className={`${CHIP} ${chipDomaine(domaine)}`}>
                        {domaine ? LIBELLES_DOMAINE_SERVICE[domaine] : "—"}
                      </span>
                    </div>
                    <div className="w-[110px] flex items-center gap-2">
                      {estLectureSeule ? (
                        <span className={`${CHIP} ${s.actif ? "bg-[#e7f6ed] text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"}`}>
                          {s.actif ? "Actif" : "Inactif"}
                        </span>
                      ) : (
                        <>
                          <Toggle checked={s.actif} onChange={(v) => modifierService(s.id, { actif: v })} label={`Activer ${s.nomTypeService}`} />
                          <span className={`text-[12px] font-bold ${s.actif ? "text-[#14703c]" : "text-[#5b6472]"}`}>
                            {s.actif ? "Actif" : "Inactif"}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="w-[40px] text-center">
                      {!estLectureSeule && (
                        <button type="button"
                          onClick={() => { setServiceEnEdition(s); setModalServiceOuverte(true); }}
                          aria-label={`Modifier ${s.nomTypeService}`}
                          className={`h-8 w-8 grid place-items-center rounded-md text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer ${FOCUS}`}>
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="px-4 py-2.5 border-t border-[#f0f2f1] bg-[#fafbfa] text-[11px] text-[#5b6472]">
                <strong className="font-bold text-[#1f2937]">{services.length}</strong> service{services.length > 1 ? "s" : ""} affiché{services.length > 1 ? "s" : ""} sur {totalServices}
              </div>
            </>
          )
        ) : (
          types.length === 0 ? (
            <div className="p-12 text-center text-[#5b6472] text-[13px]">
              Aucun type ne correspond aux filtres appliqués.
            </div>
          ) : (
            <>
              <div className="bg-[#fafbfa] flex items-center h-10 px-4 border-b border-[#e5e7eb]">
                <span className="w-[162px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Code</span>
                <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Type de service</span>
                <span className="w-[142px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Domaine</span>
                <span className="w-[152px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Orientation</span>
                <span className="w-[122px] text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">Statut</span>
                <span className="w-[40px]" />
              </div>
              {types.map((t) => (
                <div key={t.id} className="h-[54px] flex items-center px-4 gap-3 border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors">
                  <div className="w-[150px]"><span className={CHIP_CODE}>{t.code}</span></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1f2937] truncate">{t.nom}</div>
                    <div className="text-[12px] text-[#5b6472] truncate max-w-[420px]">{t.description || "—"}</div>
                  </div>
                  <div className="w-[130px]">
                    <span className={`${CHIP} ${chipDomaine(t.domaine)}`}>{LIBELLES_DOMAINE_SERVICE[t.domaine]}</span>
                  </div>
                  <div className="w-[140px] flex items-center gap-1.5 text-[13px]">
                    {t.supporteAiguillage ? (
                      <><Check className="h-4 w-4 text-[#14703c]" /><span className="text-[#14703c] font-semibold">Aiguillable</span></>
                    ) : (
                      <><X className="h-4 w-4 text-[#5b6472]" /><span className="text-[#5b6472]">Non aiguillable</span></>
                    )}
                  </div>
                  <div className="w-[110px] flex items-center gap-2">
                    {estLectureSeule ? (
                      <span className={`${CHIP} ${t.actif ? "bg-[#e7f6ed] text-[#14703c]" : "bg-[#f0f2f1] text-[#5b6472]"}`}>
                        {t.actif ? "Actif" : "Inactif"}
                      </span>
                    ) : (
                      <>
                        <Toggle checked={t.actif} onChange={(v) => modifierType(t.id, { actif: v })} label={`Activer ${t.nom}`} />
                        <span className={`text-[12px] font-bold ${t.actif ? "text-[#14703c]" : "text-[#5b6472]"}`}>
                          {t.actif ? "Actif" : "Inactif"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="w-[40px] text-center">
                    {!estLectureSeule && (
                      <button type="button"
                        onClick={() => { setTypeEnEdition(t); setModalTypeOuverte(true); }}
                        aria-label={`Modifier ${t.nom}`}
                        className={`h-8 w-8 grid place-items-center rounded-md text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer ${FOCUS}`}>
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5 border-t border-[#f0f2f1] bg-[#fafbfa] text-[11px] text-[#5b6472]">
                <strong className="font-bold text-[#1f2937]">{types.length}</strong> type{types.length > 1 ? "s" : ""} affiché{types.length > 1 ? "s" : ""} sur {totalTypes}
              </div>
            </>
          )
        )}
      </div>

      {/* ===== Modales ===== */}
      <FormulaireServiceModale
        ouvert={modalServiceOuverte}
        serviceEnEdition={serviceEnEdition}
        sitesDisponibles={sitesDisponibles}
        typesDisponibles={typesTous}
        onFermer={() => setModalServiceOuverte(false)}
        onEnregistrer={handleEnregistrerService}
        onSupprimer={(s) => { setModalServiceOuverte(false); setServiceASupprimer(s); }}
      />
      <FormulaireTypeServiceModale
        ouvert={modalTypeOuverte}
        typeEnEdition={typeEnEdition}
        onFermer={() => setModalTypeOuverte(false)}
        onEnregistrer={handleEnregistrerType}
        onSupprimer={(t) => { setModalTypeOuverte(false); setTypeASupprimer(t); }}
      />
      <ModaleConfirmationSuppression
        ouvert={serviceASupprimer !== null}
        onFermer={() => setServiceASupprimer(null)}
        onConfirmer={confirmerSuppressionService}
        enCours={suppressionEnCours}
        titre="Détacher le service"
        message="Voulez-vous vraiment retirer ce service du site médical ?"
        nomElement={serviceASupprimer?.nomTypeService}
      />
      <ModaleConfirmationSuppression
        ouvert={typeASupprimer !== null}
        onFermer={() => setTypeASupprimer(null)}
        onConfirmer={confirmerSuppressionType}
        enCours={suppressionEnCours}
        titre="Supprimer le type de service"
        message="Voulez-vous vraiment supprimer cette spécialité du catalogue ?"
        nomElement={typeASupprimer?.nom}
      />
    </div>
  );
};

export default PanneauServices;