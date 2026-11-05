// src/briques/services/ui/FormulaireServiceModale.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import {
  ServiceMedical, TypeServiceMedical,
  NouveauServiceInput, ModificationServiceInput,
} from "../modele/service.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP = "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa] disabled:text-[#5b6472]";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const SECTION = "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN = "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE = "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${checked ? "bg-[#1f9d55]" : "bg-[#d1d5db]"}`}>
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-4" : "left-0.5"}`} />
  </button>
);

export interface FormulaireServiceModaleProps {
  ouvert: boolean;
  serviceEnEdition: ServiceMedical | null;
  sitesDisponibles: { id: number; nom: string; code: string }[];
  typesDisponibles: TypeServiceMedical[];
  onFermer: () => void;
  onEnregistrer: (saisie: NouveauServiceInput | ModificationServiceInput, id?: number) => Promise<boolean>;
  onSupprimer?: (service: ServiceMedical) => void;
}

export const FormulaireServiceModale: React.FC<FormulaireServiceModaleProps> = ({
  ouvert, serviceEnEdition, sitesDisponibles, typesDisponibles,
  onFermer, onEnregistrer, onSupprimer,
}) => {
  const [siteId, setSiteId] = useState<string>("");
  const [typeServiceId, setTypeServiceId] = useState<string>("");
  const [actif, setActif] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    if (serviceEnEdition) {
      setSiteId(String(serviceEnEdition.siteId));
      setTypeServiceId(String(serviceEnEdition.typeServiceId));
      setActif(serviceEnEdition.actif);
    } else {
      setSiteId(sitesDisponibles[0] ? String(sitesDisponibles[0].id) : "");
      setTypeServiceId(typesDisponibles[0] ? String(typesDisponibles[0].id) : "");
      setActif(true);
    }
    setErreurValidation(null);
  }, [ouvert, serviceEnEdition, sitesDisponibles, typesDisponibles]);

  const typeSelectionne = useMemo(
    () => typesDisponibles.find((t) => String(t.id) === typeServiceId) ?? null,
    [typesDisponibles, typeServiceId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurValidation(null);

    const sId = Number(siteId);
    const tId = Number(typeServiceId);
    if (!Number.isFinite(sId) || sId <= 0) return setErreurValidation("Veuillez sélectionner un établissement.");
    if (!Number.isFinite(tId) || tId <= 0) return setErreurValidation("Veuillez sélectionner un type de service.");

    setEnCours(true);
    try {
      const saisie: NouveauServiceInput | ModificationServiceInput = {
        siteId: sId,
        typeServiceId: tId,
        description: typeSelectionne?.description || undefined,
        actif,
      };
      const ok = await onEnregistrer(saisie, serviceEnEdition?.id);
      if (ok) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  const titre = serviceEnEdition ? "Modifier le rattachement" : "Rattacher un service";
  const sousTitre = serviceEnEdition
    ? "Ajuster le rattachement de ce service."
    : "Associer un type de service à un établissement.";
  const libelleAction = serviceEnEdition ? "Enregistrer" : "Rattacher le service";

  return (
    <TiroirLateral ouvert={ouvert} onFermer={onFermer} fermetureBloquee={enCours} libelle={titre}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        {/* En-tête */}
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">{titre}</h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">{sousTitre}</p>
          </div>
          <button type="button" onClick={enCours ? undefined : onFermer} disabled={enCours}
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
            aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {erreurValidation && (
            <div role="alert" className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs">
              {erreurValidation}
            </div>
          )}

          <div className={SECTION}>Service</div>

          <div>
            <label htmlFor="svc-type" className={LABEL}>Type de service <span className="text-[#b42318]">*</span></label>
            <select id="svc-type" value={typeServiceId} onChange={(e) => setTypeServiceId(e.target.value)}
              disabled={enCours || typesDisponibles.length === 0} className={CHAMP}>
              <option value="" disabled>Choisir un type…</option>
              {typesDisponibles.map((t) => (
                <option key={t.id} value={t.id}>{t.nom} ({t.code})</option>
              ))}
            </select>
            <p className={AIDE}>Le service hérite de la description du type.</p>
          </div>

          <div>
            <label htmlFor="svc-site" className={LABEL}>Établissement <span className="text-[#b42318]">*</span></label>
            <select id="svc-site" value={siteId} onChange={(e) => setSiteId(e.target.value)}
              disabled={enCours || sitesDisponibles.length === 0} className={CHAMP}>
              <option value="" disabled>Choisir un établissement…</option>
              {sitesDisponibles.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}{s.code ? ` (${s.code})` : ""}</option>
              ))}
            </select>
            <p className={AIDE}>Un même type peut être rattaché à plusieurs établissements.</p>
          </div>

          {/* Aperçu description */}
          <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px]">
            <div className="text-[12px] text-[#5b6472]">Aperçu · description héritée</div>
            <div className="mt-1 text-sm text-[#1f2937]">
              {typeSelectionne?.description || "Sélectionnez un type pour afficher sa description."}
            </div>
          </div>

          <div className={SECTION}>Statut</div>

          <div className="flex items-center gap-3">
            <Toggle checked={actif} onChange={setActif} disabled={enCours} />
            <div>
              <div className="font-bold text-sm text-[#1f2937]">
                {serviceEnEdition ? "Service actif" : "Service actif dès le rattachement"}
              </div>
              <p className="text-[12px] text-[#5b6472]">
                Un service inactif n'est plus proposé à l'aiguillage.
              </p>
            </div>
          </div>

          {serviceEnEdition && onSupprimer && (
            <button type="button" onClick={() => onSupprimer(serviceEnEdition)} disabled={enCours}
              className="mt-2 self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#b42318] hover:bg-rose-50 rounded-[10px] cursor-pointer disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />
              Détacher ce service
            </button>
          )}
        </div>

        {/* Pied */}
        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>Annuler</button>
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            {enCours ? "Enregistrement…" : libelleAction}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default FormulaireServiceModale;