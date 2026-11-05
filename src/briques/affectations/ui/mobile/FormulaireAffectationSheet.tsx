import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { BottomSheet } from "@/noyau/ui/mobile";
import { LIBELLES_DOMAINE_SERVICE } from "@/briques/services/modele/service.types";
import {
  AffectationPersonnel,
  OptionPersonnel,
  OptionServiceSite,
  OptionSite,
  NouvelleAffectationInput,
  ModificationAffectationInput,
} from "../../modele/affectation.types";

/* ------------------------------------------------------------------ *
 * Contrat
 * ------------------------------------------------------------------ */
export interface FormulaireAffectationSheetProps {
  ouvert: boolean;
  affectationEnEdition: AffectationPersonnel | null;
  optionsPersonnel: OptionPersonnel[];
  optionsServices: OptionServiceSite[];
  optionsSites: OptionSite[];
  affectationsExistantes?: AffectationPersonnel[];
  onFermer: () => void;
  onEnregistrer: (
    saisie: NouvelleAffectationInput | ModificationAffectationInput,
    id?: number,
  ) => Promise<boolean>;
}

/* ------------------------------------------------------------------ *
 * Tokens visuels (maquettes Cat/Affect)
 * ------------------------------------------------------------------ */
type Etape = 1 | 2 | 3;
const TOTAL_ETAPES = 3;

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "h-12 w-full px-3.5 rounded-[10px] border border-[#e5e7eb] bg-white text-[15px] text-[#1f2937] " +
  "focus:outline-none focus:border-[#1f9d55] disabled:bg-[#fafbfa] disabled:text-[#5b6472]";
const HINT = "block mt-1.5 text-[12px] text-[#5b6472]";
const RECAP = "bg-[#f0f2f1] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1f2937] mb-3.5";
const REQUIS = <span className="text-[#b42318] ml-0.5">*</span>;

/* ------------------------------------------------------------------ *
 * Stepper
 * ------------------------------------------------------------------ */
const Stepper: React.FC<{ etape: Etape }> = ({ etape }) => (
  <div
    className="flex items-center px-0.5 mb-4"
    aria-label={`Étape ${etape} sur ${TOTAL_ETAPES}`}
  >
    {Array.from({ length: TOTAL_ETAPES }, (_, i) => {
      const n = (i + 1) as Etape;
      const fait = n < etape;
      const actif = n === etape;
      return (
        <React.Fragment key={n}>
          <span
            className={`w-6 h-6 rounded-full grid place-items-center text-[12px] font-bold shrink-0 ${
              fait || actif ? "bg-[#1f9d55] text-white" : "bg-[#cbd5e1] text-[#1f2937]"
            }`}
            aria-current={actif ? "step" : undefined}
          >
            {fait ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : n}
          </span>
          {n < TOTAL_ETAPES && (
            <span
              className={`flex-1 h-0.5 ${n < etape ? "bg-[#1f9d55]" : "bg-[#e5e7eb]"}`}
              aria-hidden="true"
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ *
 * Composant principal
 * ------------------------------------------------------------------ */
export const FormulaireAffectationSheet: React.FC<FormulaireAffectationSheetProps> = ({
  ouvert,
  affectationEnEdition,
  optionsPersonnel,
  optionsServices,
  optionsSites,
  affectationsExistantes = [],
  onFermer,
  onEnregistrer,
}) => {
  const [etape, setEtape] = useState<Etape>(1);
  const [staffId, setStaffId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [estPrincipal, setEstPrincipal] = useState(true);
  const [actif, setActif] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /* --------- Données dérivées --------- */
  const personnel = useMemo(
    () => optionsPersonnel.find((p) => String(p.id) === staffId) ?? null,
    [optionsPersonnel, staffId],
  );
  const service = useMemo(
    () => optionsServices.find((s) => String(s.serviceId) === serviceId) ?? null,
    [optionsServices, serviceId],
  );
  const siteActuel = useMemo(
    () => optionsSites.find((s) => String(s.id) === siteId) ?? null,
    [optionsSites, siteId],
  );

  const servicesDuSite = useMemo(() => {
    if (!siteId) return optionsServices;
    const duSite = optionsServices.filter(
      (s) => s.siteId === Number(siteId) || s.siteId === 0,
    );
    return duSite.length > 0 ? duSite : optionsServices;
  }, [optionsServices, siteId]);

  const incompatibilite = useMemo<string | null>(() => {
    if (!personnel || !service) return null;
    const nom = `${personnel.prenom} ${personnel.nom}`.trim();
    const d = service.domaine;
    if (d == null) {
      return `Le service « ${service.nomService} » pointe vers un type introuvable ou inactif. Choisissez un autre service ou réactivez son type.`;
    }
    const medSvc = d === "MEDICAL" || d === "MEDICO_TECHNIQUE";
    if (personnel.estMedical && !medSvc) {
      const corps = personnel.corpsMedicalLibelle
        ? ` (${personnel.corpsMedicalLibelle})`
        : "";
      return `« ${nom} » a un profil médical${corps}. Un personnel médical ne peut être affecté qu'à un service médical ou médico-technique, pas au service « ${service.nomService} » (domaine ${LIBELLES_DOMAINE_SERVICE[d]}).`;
    }
    if (!personnel.estMedical && medSvc) {
      return `Le service « ${service.nomService} » est de domaine ${LIBELLES_DOMAINE_SERVICE[d]}. Il ne peut accueillir que du personnel médical : « ${nom} » n'a pas de profil médical.`;
    }
    return null;
  }, [personnel, service]);

  const existanteActive = useMemo(
    () =>
      !affectationEnEdition && staffId
        ? affectationsExistantes.find(
            (a) => a.staffId === Number(staffId) && a.actif,
          ) ?? null
        : null,
    [affectationEnEdition, affectationsExistantes, staffId],
  );

  /* --------- Reset à l'ouverture --------- */
  useEffect(() => {
    if (!ouvert) return;
    setEtape(1);
    setErreur(null);

    if (affectationEnEdition) {
      setStaffId(String(affectationEnEdition.staffId || ""));
      setSiteId(String(affectationEnEdition.siteId || ""));
      setServiceId(String(affectationEnEdition.serviceId || ""));
      setDateDebut(affectationEnEdition.dateDebut || "");
      setDateFin(affectationEnEdition.dateFin || "");
      setEstPrincipal(affectationEnEdition.estPrincipal);
      setActif(affectationEnEdition.actif);
    } else {
      setStaffId(optionsPersonnel[0] ? String(optionsPersonnel[0].id) : "");
      const premierSite = optionsSites[0] ? String(optionsSites[0].id) : "";
      setSiteId(premierSite);
      const servicesInit = premierSite
        ? optionsServices.filter(
            (s) => s.siteId === Number(premierSite) || s.siteId === 0,
          )
        : optionsServices;
      setServiceId(servicesInit[0] ? String(servicesInit[0].serviceId) : "");
      setDateDebut(new Date().toISOString().split("T")[0]);
      setDateFin("");
      setEstPrincipal(true);
      setActif(true);
    }
  }, [ouvert, affectationEnEdition, optionsPersonnel, optionsSites, optionsServices]);

  /* --------- Handlers --------- */
  const handleChangementSite = (v: string) => {
    setSiteId(v);
    const dispo = v
      ? optionsServices.filter((s) => s.siteId === Number(v) || s.siteId === 0)
      : optionsServices;
    setServiceId(dispo[0] ? String(dispo[0].serviceId) : "");
    setErreur(null);
  };

  const peutContinuer = (): boolean => {
    if (etape === 1) return Boolean(staffId);
    if (etape === 2) return Boolean(siteId && serviceId) && !incompatibilite;
    if (etape === 3)
      return Boolean(dateDebut) && (!dateFin || dateFin >= dateDebut);
    return false;
  };

  const avancer = async () => {
    setErreur(null);
    if (etape === 1) {
      if (!staffId) return setErreur("Veuillez sélectionner un collaborateur.");
      if (existanteActive)
        return setErreur(
          "Cet agent a déjà une affectation active. Clôturez-la d'abord.",
        );
      setEtape(2);
      return;
    }
    if (etape === 2) {
      if (!siteId) return setErreur("Veuillez sélectionner un établissement.");
      if (!serviceId) return setErreur("Veuillez sélectionner un service.");
      if (incompatibilite) return setErreur(incompatibilite);
      setEtape(3);
      return;
    }
    if (etape === 3) {
      if (!dateDebut)
        return setErreur("La date de prise de fonction est obligatoire.");
      if (dateFin && dateFin < dateDebut)
        return setErreur("La date de fin ne peut pas précéder la date de début.");

      setEnCours(true);
      try {
        const payload = affectationEnEdition
          ? ({
              staffId: Number(staffId),
              serviceId: Number(serviceId),
              dateDebut,
              dateFin: dateFin || null,
              estPrincipal,
              actif,
            } as ModificationAffectationInput)
          : ({
              staffId: Number(staffId),
              serviceId: Number(serviceId),
              dateDebut,
              dateFin: dateFin || null,
              estPrincipal,
            } as NouvelleAffectationInput);

        const ok = await onEnregistrer(payload, affectationEnEdition?.id);
        if (ok) onFermer();
      } finally {
        setEnCours(false);
      }
    }
  };

  const reculer = () => {
    setErreur(null);
    if (etape === 1) return onFermer();
    setEtape((e) => (e - 1) as Etape);
  };

  /* --------- Pied dynamique --------- */
  const pied = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={reculer}
        disabled={enCours}
        className="flex-1 h-12 rounded-[10px] border border-[#e5e7eb] bg-white font-bold text-sm text-[#1f2937] disabled:opacity-50"
      >
        {etape === 1 ? "Annuler" : "Retour"}
      </button>
      <button
        type="button"
        onClick={avancer}
        disabled={enCours || !peutContinuer()}
        className="flex-[2] h-12 rounded-[10px] bg-[#1f9d55] text-white font-bold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {etape === 3 ? (
          <>
            <Check className="w-4 h-4" />
            {enCours
              ? "Enregistrement…"
              : affectationEnEdition
                ? "Enregistrer"
                : "Créer l'affectation"}
          </>
        ) : (
          "Continuer"
        )}
      </button>
    </div>
  );

  /* --------- Rendu --------- */
  return (
    <BottomSheet
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={enCours}
      titre={
        affectationEnEdition ? "Modifier l'affectation" : "Nouvelle affectation"
      }
      sousTitre={
        <>
          Étape {etape} sur {TOTAL_ETAPES} · champs obligatoires marqués d'une{" "}
          <b className="text-[#b42318]">*</b>
        </>
      }
      pied={pied}
    >
      <Stepper etape={etape} />

      {erreur && (
        <div
          role="alert"
          className="mb-3.5 p-3 bg-[#fef3f2] border border-[#fda29b] text-[#912018] rounded-[10px] text-xs flex items-start gap-2"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#b42318]" />
          <span>{erreur}</span>
        </div>
      )}

      {/* ══════════ ÉTAPE 1 · Collaborateur ══════════ */}
      {etape === 1 && (
        <div className="flex flex-col gap-3.5">
          {existanteActive && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-[10px] text-xs">
              <b className="block mb-0.5">Affectation active existante</b>
              Cet agent est déjà affecté à{" "}
              <b>
                {existanteActive.nomService} ({existanteActive.nomSite})
              </b>
              . Un collaborateur ne peut avoir qu'une seule affectation active.
            </div>
          )}

          {optionsPersonnel.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-[10px] text-xs">
              Aucun profil de personnel (hors administrateurs) n'est disponible.
              Créez d'abord des comptes personnel dans{" "}
              <b>Comptes Utilisateurs</b>.
            </div>
          )}

          <label>
            <span className={LABEL}>Collaborateur {REQUIS}</span>
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setErreur(null);
              }}
              disabled={
                Boolean(affectationEnEdition) ||
                enCours ||
                optionsPersonnel.length === 0
              }
              className={CHAMP}
            >
              <option value="" disabled>
                — Sélectionner un membre du personnel —
              </option>
              {optionsPersonnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.prenom} — {p.role}
                </option>
              ))}
            </select>
            {affectationEnEdition && (
              <span className={HINT}>
                Le collaborateur est figé en modification.
              </span>
            )}
          </label>

          {personnel && (
            <div className={RECAP}>
              <b>
                {personnel.nom} {personnel.prenom}
              </b>
              {" · "}
              {personnel.role}
              {personnel.corpsMedicalLibelle && ` · ${personnel.corpsMedicalLibelle}`}
              {" · Réf. #"}
              {personnel.id}
            </div>
          )}
        </div>
      )}

      {/* ══════════ ÉTAPE 2 · Site + Service ══════════ */}
      {etape === 2 && (
        <div className="flex flex-col gap-3.5">
          {personnel && (
            <div className={RECAP}>
              <b>
                {personnel.nom} {personnel.prenom}
              </b>
              {" · "}
              {personnel.role}
              {" · Réf. #"}
              {personnel.id}
            </div>
          )}

          <label>
            <span className={LABEL}>
              Site d'implantation {REQUIS}
            </span>
            <select
              value={siteId}
              onChange={(e) => handleChangementSite(e.target.value)}
              disabled={enCours}
              className={CHAMP}
            >
              <option value="" disabled>
                — Choisir un établissement —
              </option>
              {optionsSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom} ({s.code})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={LABEL}>Service {REQUIS}</span>
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setErreur(null);
              }}
              disabled={enCours || servicesDuSite.length === 0}
              aria-invalid={Boolean(incompatibilite)}
              className={`${CHAMP} ${
                incompatibilite ? "!border-2 !border-[#b42318]" : ""
              }`}
            >
              <option value="" disabled>
                — Choisir le service —
              </option>
              {servicesDuSite.map((s) => (
                <option key={s.serviceId} value={s.serviceId}>
                  {s.nomService}
                  {s.domaine ? ` — ${LIBELLES_DOMAINE_SERVICE[s.domaine]}` : ""}
                </option>
              ))}
            </select>
            {incompatibilite && (
              <div className="mt-1.5 text-[12px] font-bold text-[#b42318] flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{incompatibilite}</span>
              </div>
            )}
            {servicesDuSite.length === 0 && !incompatibilite && (
              <span className={HINT}>
                Aucun service disponible pour cet établissement.
              </span>
            )}
          </label>
        </div>
      )}

      {/* ══════════ ÉTAPE 3 · Dates + Principal ══════════ */}
      {etape === 3 && (
        <div className="flex flex-col gap-3.5">
          <div className={RECAP}>
            <b>
              {personnel?.nom} {personnel?.prenom}
            </b>
            {personnel && ` · ${personnel.role}`}
            {personnel && ` · Réf. #${personnel.id}`}
            {service && ` · ${service.nomService}`}
            {siteActuel && ` · ${siteActuel.nom}`}
          </div>

          <label>
            <span className={LABEL}>
              Date de prise de fonction {REQUIS}
            </span>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              disabled={enCours}
              className={CHAMP}
            />
          </label>

          <label>
            <span className={LABEL}>
              Date de fin{" "}
              <span className="font-normal text-[#5b6472]">(facultatif)</span>
            </span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              disabled={enCours}
              className={CHAMP}
            />
            <span className={HINT}>
              Laisser vide si l'affectation n'a pas de fin prévue.
            </span>
          </label>

          <div className="mt-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={estPrincipal}
                onChange={(e) => setEstPrincipal(e.target.checked)}
                disabled={enCours}
                className="w-5 h-5 accent-[#1f9d55]"
              />
              <b className="text-[14px] text-[#1f2937]">
                Affectation principale
              </b>
            </label>
            <span className={HINT}>
              Service de référence de l'agent. Une seule affectation principale
              à la fois.
            </span>
          </div>

          {affectationEnEdition && (
            <label className="flex items-center gap-3 mt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                disabled={enCours}
                className="w-5 h-5 accent-[#1f9d55]"
              />
              <b className="text-[14px] text-[#1f2937]">Affectation active</b>
            </label>
          )}
        </div>
      )}
    </BottomSheet>
  );
};

export default FormulaireAffectationSheet;