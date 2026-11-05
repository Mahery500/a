// src/briques/services/ui/FormulaireTypeServiceModale.tsx
import React, { useEffect, useState } from "react";
import { X, Check, Trash2 } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import {
  TypeServiceMedical, NouveauTypeServiceInput, ModificationTypeServiceInput,
  DomaineService, DOMAINES_SERVICE, LIBELLES_DOMAINE_SERVICE, DESCRIPTIONS_DOMAINE_SERVICE,
} from "../modele/service.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP = "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const SECTION = "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN = "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE = "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-[34px] h-5 rounded-full transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed ${checked ? "bg-[#1f9d55]" : "bg-[#d1d5db]"} ${FOCUS}`}>
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-4" : "left-0.5"}`} />
  </button>
);

const COULEURS_DOMAINE: Record<DomaineService, { bg: string; color: string; border: string }> = {
  MEDICAL: { bg: "#e7f6ed", color: "#14703c", border: "#1f9d55" },
  MEDICO_TECHNIQUE: { bg: "#e0f2fe", color: "#0369a1", border: "#0ea5e9" },
  ADMINISTRATIF: { bg: "#f0f2f1", color: "#5b6472", border: "#9aa3af" },
  LOGISTIQUE: { bg: "#fff4e0", color: "#8a5300", border: "#f3d9a8" },
};

export interface FormulaireTypeServiceModaleProps {
  ouvert: boolean;
  typeEnEdition: TypeServiceMedical | null;
  onFermer: () => void;
  onEnregistrer: (saisie: NouveauTypeServiceInput | ModificationTypeServiceInput, id?: number) => Promise<boolean>;
  onSupprimer?: (type: TypeServiceMedical) => void;
}

export const FormulaireTypeServiceModale: React.FC<FormulaireTypeServiceModaleProps> = ({
  ouvert, typeEnEdition, onFermer, onEnregistrer, onSupprimer,
}) => {
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [domaine, setDomaine] = useState<DomaineService>("MEDICAL");
  const [supporteAiguillage, setSupporteAiguillage] = useState(true);
  const [actif, setActif] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    if (typeEnEdition) {
      setCode(typeEnEdition.code);
      setNom(typeEnEdition.nom);
      setDescription(typeEnEdition.description || "");
      setDomaine(typeEnEdition.domaine);
      setSupporteAiguillage(typeEnEdition.supporteAiguillage);
      setActif(typeEnEdition.actif);
    } else {
      setCode("");
      setNom("");
      setDescription("");
      setDomaine("MEDICAL");
      setSupporteAiguillage(true);
      setActif(true);
    }
    setErreur(null);
  }, [ouvert, typeEnEdition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (!code.trim()) return setErreur("Le code est obligatoire.");
    if (!nom.trim()) return setErreur("Le libellé est obligatoire.");

    setEnCours(true);
    try {
      const payload: NouveauTypeServiceInput | ModificationTypeServiceInput = {
        code: code.trim().toUpperCase(),
        nom: nom.trim(),
        description: description.trim() || undefined,
        supporteAiguillage,
        domaine,
        ...(typeEnEdition ? { actif } : {}),
      };
      const ok = await onEnregistrer(payload, typeEnEdition?.id);
      if (ok) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  const titre = typeEnEdition ? `Modifier le type « ${typeEnEdition.nom} »` : "Nouveau type de service";
  const libelleAction = typeEnEdition ? "Enregistrer" : "Créer le type";

  return (
    <TiroirLateral ouvert={ouvert} onFermer={onFermer} fermetureBloquee={enCours} libelle={titre}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        {/* En-tête */}
        <div className="h-[72px] px-6 flex items-center justify-between border-b border-[#e5e7eb] shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">{titre}</h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">Les champs marqués d'une étoile sont obligatoires.</p>
          </div>
          <button type="button" onClick={enCours ? undefined : onFermer} disabled={enCours}
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
            aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {erreur && (
            <div role="alert" className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs">
              {erreur}
            </div>
          )}

          <div className={SECTION}>Identité</div>

          {/* Code + Libellé */}
          <div className="flex gap-3.5">
            <div className="w-[190px] shrink-0">
              <label htmlFor="type-code" className={LABEL}>Code <span className="text-[#b42318]">*</span></label>
              <input id="type-code" type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX : RADIOLOGIE" disabled={enCours || Boolean(typeEnEdition)}
                className={`${CHAMP} font-mono uppercase`} />
              <p className={AIDE}>{typeEnEdition ? "Immuable après création." : "Unique, en majuscules."}</p>
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="type-nom" className={LABEL}>Libellé <span className="text-[#b42318]">*</span></label>
              <input id="type-nom" type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                placeholder="ex : Radiologie" disabled={enCours} className={CHAMP} />
            </div>
          </div>

          {/* Domaine */}
          <div>
            <div className={LABEL}>Domaine <span className="text-[#b42318]">*</span></div>
            <div className="grid grid-cols-2 gap-2.5">
              {DOMAINES_SERVICE.map((d) => {
                const sel = domaine === d;
                const c = COULEURS_DOMAINE[d];
                return (
                  <button key={d} type="button" role="radio" aria-checked={sel}
                    onClick={() => setDomaine(d)} disabled={enCours}
                    className={`text-left rounded-[10px] px-3.5 py-3 flex items-center justify-between gap-2 cursor-pointer transition ${FOCUS} disabled:opacity-50`}
                    style={{
                      border: `2px solid ${sel ? c.border : "#e5e7eb"}`,
                      background: sel ? c.bg : "#fff",
                    }}>
                    <div>
                      <div className="text-sm font-bold" style={{ color: sel ? c.color : "#1f2937" }}>
                        {LIBELLES_DOMAINE_SERVICE[d]}
                      </div>
                      <div className="text-[11px] text-[#5b6472]">{DESCRIPTIONS_DOMAINE_SERVICE[d]}</div>
                    </div>
                    {sel && <Check className="h-4 w-4 shrink-0" style={{ color: c.color }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="type-desc" className={LABEL}>Description <span className="font-normal">(facultatif)</span></label>
            <textarea id="type-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Rôle du service dans le parcours patient…" disabled={enCours}
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] resize-none focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 disabled:bg-[#fafbfa]" />
          </div>

          <div className={SECTION}>Options</div>

          <div className="flex items-center gap-3">
            <Toggle checked={supporteAiguillage} onChange={setSupporteAiguillage} disabled={enCours} />
            <div>
              <div className="font-bold text-sm text-[#1f2937]">Aiguillable</div>
              <p className="text-[12px] text-[#5b6472]">Les patients peuvent être orientés vers ce service.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Toggle checked={actif} onChange={setActif} disabled={enCours} />
            <div>
              <div className="font-bold text-sm text-[#1f2937]">
                {typeEnEdition ? "Type actif" : "Actif dès la création"}
              </div>
              <p className="text-[12px] text-[#5b6472]">
                {typeEnEdition ? "Un type inactif n'apparaît plus dans les sélecteurs." : "Sinon, il pourra être activé plus tard depuis la liste."}
              </p>
            </div>
          </div>

          {typeEnEdition && onSupprimer && (
            <button type="button" onClick={() => onSupprimer(typeEnEdition)} disabled={enCours}
              className="mt-2 self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#b42318] hover:bg-rose-50 rounded-[10px] cursor-pointer disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer ce type
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

export default FormulaireTypeServiceModale;