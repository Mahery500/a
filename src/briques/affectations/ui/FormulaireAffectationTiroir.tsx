/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { LIBELLES_DOMAINE_SERVICE } from "@/briques/services/modele/service.types";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import {
  AffectationPersonnel,
  OptionPersonnel,
  OptionServiceSite,
  OptionSite,
  NouvelleAffectationInput,
  ModificationAffectationInput,
} from "../modele/affectation.types";
import { LABEL, CHAMP, AIDE, BTN, BTN_PRIMAIRE, Requis } from "./stylesFormulaire";

export interface FormulaireAffectationTiroirProps {
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

export const FormulaireAffectationTiroir: React.FC<FormulaireAffectationTiroirProps> = ({
  ouvert,
  affectationEnEdition,
  optionsPersonnel,
  optionsServices,
  optionsSites,
  affectationsExistantes = [],
  onFermer,
  onEnregistrer,
}) => {
  const [staffId, setStaffId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const [estPrincipal, setEstPrincipal] = useState<boolean>(true);
  const [actif, setActif] = useState<boolean>(true);
  const [enCours, setEnCours] = useState<boolean>(false);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  const servicesDuSite = useMemo(() => {
    if (!siteId) return optionsServices;
    const duSite = optionsServices.filter(
      (s) => s.siteId === Number(siteId) || s.siteId === 0,
    );
    return duSite.length > 0 ? duSite : optionsServices;
  }, [optionsServices, siteId]);

  const personnelSelectionne = useMemo(
    () => optionsPersonnel.find((p) => String(p.id) === staffId) ?? null,
    [optionsPersonnel, staffId],
  );

  const serviceSelectionne = useMemo(
    () => optionsServices.find((s) => String(s.serviceId) === serviceId) ?? null,
    [optionsServices, serviceId],
  );

  const incompatibilite = useMemo<string | null>(() => {
    if (!personnelSelectionne || !serviceSelectionne) return null;

    const nomStaff =
      `${personnelSelectionne.prenom} ${personnelSelectionne.nom}`.trim();
    const domaine = serviceSelectionne.domaine;

    if (domaine == null) {
      return (
        `Le service « ${serviceSelectionne.nomService} » pointe vers un type de service ` +
        "introuvable ou inactif. Choisissez un autre service."
      );
    }

    const serviceEstMedical =
      domaine === "MEDICAL" || domaine === "MEDICO_TECHNIQUE";
    const personnelEstMedical = personnelSelectionne.estMedical;

    if (personnelEstMedical && !serviceEstMedical) {
      const corps = personnelSelectionne.corpsMedicalLibelle
        ? ` (${personnelSelectionne.corpsMedicalLibelle})`
        : "";
      return (
        `« ${nomStaff} » a un profil médical${corps}. Un personnel médical ne peut être ` +
        `affecté qu'à un service médical ou médico-technique, pas au service ` +
        `« ${serviceSelectionne.nomService} » (domaine ${LIBELLES_DOMAINE_SERVICE[domaine]}).`
      );
    }

    if (!personnelEstMedical && serviceEstMedical) {
      return (
        `Le service « ${serviceSelectionne.nomService} » est de domaine ` +
        `${LIBELLES_DOMAINE_SERVICE[domaine]}. Un service médical ou médico-technique ` +
        `ne peut accueillir que du personnel médical : « ${nomStaff} » n'a pas de profil médical.`
      );
    }

    return null;
  }, [personnelSelectionne, serviceSelectionne]);

  useEffect(() => {
    if (!ouvert) return;

    if (affectationEnEdition) {
      setStaffId(String(affectationEnEdition.staffId || ""));
      setSiteId(String(affectationEnEdition.siteId || ""));
      setServiceId(String(affectationEnEdition.serviceId || ""));
      setDateDebut(affectationEnEdition.dateDebut || "");
      setDateFin(affectationEnEdition.dateFin || "");
      setEstPrincipal(affectationEnEdition.estPrincipal);
      setActif(affectationEnEdition.actif);
    } else {
      setStaffId(optionsPersonnel.length > 0 ? String(optionsPersonnel[0].id) : "");
      const premierSite = optionsSites.length > 0 ? String(optionsSites[0].id) : "";
      setSiteId(premierSite);
      const servicesInitiaux = premierSite
        ? optionsServices.filter((s) => s.siteId === Number(premierSite) || s.siteId === 0)
        : optionsServices;
      setServiceId(
        servicesInitiaux.length > 0 ? String(servicesInitiaux[0].serviceId) : "",
      );
      setDateDebut(new Date().toISOString().split("T")[0]);
      setDateFin("");
      setEstPrincipal(true);
      setActif(true);
    }
    setErreurValidation(null);
  }, [ouvert, affectationEnEdition, optionsPersonnel, optionsSites, optionsServices]);

  const handleChangementSite = (nouveauSiteId: string) => {
    setSiteId(nouveauSiteId);
    const servicesDispos = nouveauSiteId
      ? optionsServices.filter((s) => s.siteId === Number(nouveauSiteId) || s.siteId === 0)
      : optionsServices;
    setServiceId(
      servicesDispos.length > 0 ? String(servicesDispos[0].serviceId) : "",
    );
    setErreurValidation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurValidation(null);

    if (incompatibilite) {
      setErreurValidation(incompatibilite);
      return;
    }
    if (!staffId) return setErreurValidation("Veuillez sélectionner un membre du personnel.");
    if (!serviceId) return setErreurValidation("Veuillez sélectionner un service.");
    if (!dateDebut) return setErreurValidation("La date de prise de fonction est obligatoire.");
    if (dateFin && dateFin < dateDebut) {
      return setErreurValidation("La date de fin ne peut pas être antérieure à la date de début.");
    }

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

      const succes = await onEnregistrer(payload, affectationEnEdition?.id);
      if (succes) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  const affectationActiveExistante =
    !affectationEnEdition && staffId
      ? affectationsExistantes.find(
          (a) => a.staffId === Number(staffId) && a.actif,
        )
      : null;

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={enCours}
      libelle={affectationEnEdition ? "Modifier l'affectation" : "Nouvelle affectation"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
        {/* En-tête */}
        <div className="px-6 pt-5 pb-4 border-b border-[#f0f2f1]">
          <h2 className="m-0 text-[19px] font-bold">
            {affectationEnEdition ? "Modifier l'affectation" : "Nouvelle affectation"}
          </h2>
          <p className="mt-0.5 mb-0 text-[13px] text-[#5b6472]">
            Rattache un collaborateur à un service, avec ses dates et son caractère principal.
          </p>
        </div>

        {/* Corps */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-3.5">
          {erreurValidation && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs"
            >
              {erreurValidation}
            </div>
          )}

          {affectationActiveExistante && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-[10px] text-xs flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <b className="block">Affectation active existante</b>
                Cet agent est déjà affecté à{" "}
                <b>
                  {affectationActiveExistante.nomService} ({affectationActiveExistante.nomSite})
                </b>
                . Un collaborateur ne peut avoir qu'une seule affectation active à la fois.
                Clôturez d'abord son affectation actuelle.
              </div>
            </div>
          )}

          {optionsPersonnel.length === 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-[10px] text-xs">
              Aucun profil de personnel (hors administrateurs) n'est disponible. Créez d'abord
              des comptes personnel dans <b>Comptes Utilisateurs</b>.
            </div>
          )}

          {optionsServices.length === 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-[10px] text-xs">
              Aucun service médical disponible. Configurez vos services dans{" "}
              <b>Services Médicaux</b>.
            </div>
          )}

          <label className={LABEL}>
            Collaborateur <Requis />
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setErreurValidation(null);
              }}
              disabled={Boolean(affectationEnEdition) || enCours || optionsPersonnel.length === 0}
              className={CHAMP}
            >
              <option value="" disabled>
                — Sélectionner —
              </option>
              {optionsPersonnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.prenom} — {p.role} (Réf. #{p.id})
                </option>
              ))}
            </select>
            {affectationEnEdition && (
              <span className={AIDE}>Le collaborateur est figé en modification.</span>
            )}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className={LABEL}>
              Site d'implantation <Requis />
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

            <label className={LABEL}>
              Service <Requis />
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setErreurValidation(null);
                }}
                disabled={enCours || servicesDuSite.length === 0}
                aria-invalid={Boolean(incompatibilite)}
                className={`${CHAMP} ${incompatibilite ? "border-[#b42318]" : ""}`}
              >
                <option value="" disabled>
                  — Choisir le service —
                </option>
                {servicesDuSite.map((srv) => {
                  const suffixe = srv.domaine
                    ? ` — ${LIBELLES_DOMAINE_SERVICE[srv.domaine]}`
                    : "";
                  return (
                    <option key={srv.serviceId} value={srv.serviceId}>
                      {srv.nomService}
                      {srv.siteId > 0 && !siteId ? ` (${srv.nomSite})` : ""}
                      {suffixe}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          {incompatibilite && (
            <div
              role="alert"
              className="bg-[#fef3f2] border border-[#fda29b] text-[#912018] rounded-[10px] px-3 py-2.5 text-xs flex items-start gap-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#b42318]" />
              <span>{incompatibilite}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className={LABEL}>
              Date de prise de fonction <Requis />
              <input
                type="date"
                required
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                disabled={enCours}
                className={CHAMP}
              />
            </label>
            <label className={LABEL}>
              Date de fin (optionnelle)
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                disabled={enCours}
                className={CHAMP}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1f2937] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={estPrincipal}
                onChange={(e) => setEstPrincipal(e.target.checked)}
                disabled={enCours}
                className="h-4 w-4 accent-[#1f9d55]"
              />
              Affectation principale de l'agent
            </label>

            {affectationEnEdition && (
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1f2937] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={actif}
                  onChange={(e) => setActif(e.target.checked)}
                  disabled={enCours}
                  className="h-4 w-4 accent-[#1f9d55]"
                />
                Affectation active
              </label>
            )}
          </div>
        </div>

        {/* Pied */}
        <div className="px-6 py-3.5 border-t border-[#e5e7eb] flex justify-end gap-2">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={enCours || Boolean(incompatibilite)}
            className={BTN_PRIMAIRE}
          >
            {enCours
              ? "Enregistrement…"
              : affectationEnEdition
                ? "Enregistrer"
                : "Créer l'affectation"}
          </button>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default FormulaireAffectationTiroir;