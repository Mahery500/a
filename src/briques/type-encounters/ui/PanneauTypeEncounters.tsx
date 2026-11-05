/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MoreHorizontal, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useServices } from "@/briques/services";
import {
  TypeEncounter,
  NouveauTypeEncounterInput,
  ModificationTypeEncounterInput,
} from "../modele/type-encounter.types";
import { useTypeEncounters } from "../hooks/useTypeEncounters";
import { FormulaireTypeEncounterModale } from "./FormulaireTypeEncounterModale";

const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const BOUTON_BASE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BOUTON_SECONDAIRE = `${BOUTON_BASE} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;
const BOUTON_PRIMAIRE = `${BOUTON_BASE} bg-[#1f9d55] hover:bg-[#14703c] text-white border border-[#1f9d55]`;
const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const EXT_CHIP =
  "inline-block bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const PUCE_NON_AFFECTE =
  "inline-block px-2.5 py-0.5 rounded-full text-[12px] font-bold whitespace-nowrap bg-[#fff4e0] text-[#8a5300]";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

type FiltreAffichage = "tous" | "actifs" | "inactifs" | "non_affectes";

export interface PanneauTypeEncountersProps {
  mode?: ModeAffichage;
}

export const PanneauTypeEncounters: React.FC<PanneauTypeEncountersProps> = ({
  mode = "edition",
}) => {
  const estLectureSeule = mode === "lecture";

  const {
    types,
    typesTous,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    filtreActif,
    setFiltreActif,
    setFiltreAffectation,
    recharger,
    creer,
    modifier,
    basculerActivation,
    definirTypesService,
  } = useTypeEncounters();

  const { types: typesServices } = useServices();
  const typesServicesDisponibles = typesServices.map((t) => ({
    id: t.id,
    nom: t.nom,
    code: t.code,
  }));

  const [modalOuverte, setModalOuverte] = useState(false);
  const [typeEnEdition, setTypeEnEdition] = useState<TypeEncounter | null>(null);

  /**
   * En création : on crée le type puis on sauvegarde les services
   * (l'API exige un id existant pour PUT /type_encounters/{id}/types_service).
   * En édition : modification puis mise à jour systématique des services.
   */
  const handleEnregistrer = async (
    saisie: NouveauTypeEncounterInput | ModificationTypeEncounterInput,
    id?: number,
    typeServiceIds?: number[],
  ): Promise<boolean> => {
    if (id) {
      const ok = await modifier(id, saisie as ModificationTypeEncounterInput);
      if (ok) await definirTypesService(id, typeServiceIds ?? []);
      return ok;
    }
    const cree = await creer(saisie as NouveauTypeEncounterInput);
    if (!cree) return false;
    if (typeServiceIds && typeServiceIds.length > 0) {
      await definirTypesService(cree.id, typeServiceIds);
    }
    return true;
  };

  if (mode === "masque") return null;

  /** Filtre "affichage" unique pour que les pilules soient mutuellement exclusives. */
  const filtreAffichage: FiltreAffichage =
    filtreActif === "actifs"
      ? "actifs"
      : filtreActif === "inactifs"
        ? "inactifs"
        : stats.actifs < stats.total
          ? "actifs"
          : "tous";

  // On dérive le filtre "affichage" à partir de filtreActif + filtreAffectation
  // (source de vérité côté hook). Simplifié pour l'UI :
  const [filtreUi, setFiltreUi] = useState<FiltreAffichage>("tous");

  const appliquerFiltre = (f: FiltreAffichage) => {
    setFiltreUi(f);
    if (f === "actifs") {
      setFiltreActif("actifs");
      setFiltreAffectation("tous");
    } else if (f === "inactifs") {
      setFiltreActif("inactifs");
      setFiltreAffectation("tous");
    } else if (f === "non_affectes") {
      setFiltreActif("tous");
      setFiltreAffectation("non_affectes");
    } else {
      setFiltreActif("tous");
      setFiltreAffectation("tous");
    }
  };

  const libelleService = (id: number) => {
    const ts = typesServices.find((s) => s.id === id);
    return ts?.code ?? ts?.nom ?? `#${id}`;
  };

  const pilules: { cle: FiltreAffichage; libelle: string; n: number }[] = [
    { cle: "tous", libelle: "Tous", n: stats.total },
    { cle: "actifs", libelle: "Actifs", n: stats.actifs },
  ];
  if (stats.inactifs > 0) {
    pilules.push({ cle: "inactifs", libelle: "Désactivés", n: stats.inactifs });
  }
  pilules.push({
    cle: "non_affectes",
    libelle: "Non affectés",
    n: stats.sansAffectation,
  });

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">Types de prise en charge</h1>
          <p className="text-[13px] text-[#5b6472] mt-0.5">
            Nature des rencontres cliniques : consultation, hospitalisation, vaccination,
            téléconsultation…
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={recharger}
            disabled={chargement}
            className={`${BOUTON_SECONDAIRE} !px-2.5`}
            title="Rafraîchir"
            aria-label="Rafraîchir"
          >
            <RefreshCw
              className={`h-4 w-4 ${chargement ? "animate-spin text-[#1f9d55]" : ""}`}
            />
          </button>
          {!estLectureSeule && (
            <button
              type="button"
              onClick={() => {
                setTypeEnEdition(null);
                setModalOuverte(true);
              }}
              className={BOUTON_PRIMAIRE}
            >
              <Plus className="h-[18px] w-[18px]" />
              Nouveau type
            </button>
          )}
        </div>
      </div>

      {/* Barre de statistiques */}
      <div className={`${CARTE} flex flex-wrap items-center gap-x-7 gap-y-2 px-5 h-14`}>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{stats.total}</b> types
        </span>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{stats.actifs}</b> actifs
        </span>
        <span className="text-[13px] text-[#1f2937]">
          <b className="text-[15px]">{stats.inactifs}</b> désactivés
        </span>
        {stats.sansAffectation > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fff4e0] text-[#8a5300] text-[13px] font-bold whitespace-nowrap">
            <AlertTriangle className="h-3.5 w-3.5" />
            {stats.sansAffectation} type{stats.sansAffectation > 1 ? "s" : ""} non affecté
            {stats.sansAffectation > 1 ? "s" : ""} à un service
          </span>
        )}
      </div>

      {/* Recherche + pilules */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par code, libellé ou description…"
          aria-label="Rechercher un type de prise en charge"
          className={`${CHAMP} flex-1`}
        />
        <div className="flex flex-wrap items-center gap-2">
          {pilules.map((p) => {
            const actif = filtreUi === p.cle;
            return (
              <button
                key={p.cle}
                type="button"
                onClick={() => appliquerFiltre(p.cle)}
                aria-pressed={actif}
                className={`rounded-full px-3.5 py-1.5 text-[13px] border cursor-pointer transition-colors ${FOCUS} ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
                }`}
              >
                {p.libelle} · {p.n}
              </button>
            );
          })}
        </div>
      </div>

      {erreur && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[14px] text-rose-700 text-xs flex items-center justify-between">
          <span>{erreur}</span>
          <button type="button" onClick={recharger} className="font-bold underline cursor-pointer">
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau */}
      <div className={`${CARTE} overflow-hidden`}>
        {chargement ? (
          <div className="p-12 text-center text-[#5b6472]">
            <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55] mx-auto mb-2" />
            <span className="text-xs">Chargement des types de prise en charge…</span>
          </div>
        ) : types.length === 0 ? (
          <div className="p-12 text-center text-[#5b6472] text-[13px]">
            {typesTous.length === 0
              ? "Aucun type de prise en charge enregistré."
              : "Aucun résultat pour les critères sélectionnés."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {[
                    { label: "Code", w: "w-[212px]" },
                    { label: "Type de prise en charge", w: "w-auto" },
                    { label: "Services autorisés", w: "w-[172px]" },
                    { label: "Statut", w: "w-[122px]" },
                    { label: "", w: "w-[40px]" },
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
                {types.map((t) => {
                  const sansAffectation = (t.typeServiceIds ?? []).length === 0;
                  return (
                    <tr
                      key={t.id}
                      className="h-[54px] border-t border-[#f0f2f1] hover:bg-[#fafbfa] transition-colors"
                    >
                      <td className="px-4 py-2">
                        <span className={CODE_CHIP}>{t.code}</span>
                      </td>
                      <td className="px-4 py-2 min-w-0">
                        <div className="font-bold text-[#1f2937] truncate">{t.libelle}</div>
                        <div className="text-[12px] text-[#5b6472] truncate max-w-[480px]">
                          {t.description || (
                            <span className="italic">Aucune description</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {sansAffectation ? (
                          <span className={PUCE_NON_AFFECTE}>Non affecté</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(t.typeServiceIds ?? []).slice(0, 2).map((id) => (
                              <span
                                key={id}
                                className={EXT_CHIP}
                                title={`Type de service #${id}`}
                              >
                                {libelleService(id)}
                              </span>
                            ))}
                            {(t.typeServiceIds ?? []).length > 2 && (
                              <span className="text-[10px] font-bold text-[#3730a3]">
                                +{(t.typeServiceIds ?? []).length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {estLectureSeule ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-bold ${
                              t.actif
                                ? "bg-[#e7f6ed] text-[#14703c]"
                                : "bg-[#f0f2f1] text-[#5b6472]"
                            }`}
                          >
                            {t.actif ? "Actif" : "Inactif"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={t.actif}
                            aria-label={`${t.actif ? "Désactiver" : "Activer"} ${t.libelle}`}
                            onClick={() => basculerActivation(t)}
                            className={`inline-flex items-center gap-2 cursor-pointer ${FOCUS}`}
                          >
                            <span
                              className={`relative w-[34px] h-5 rounded-full transition-colors ${
                                t.actif ? "bg-[#1f9d55]" : "bg-[#d1d5db]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                  t.actif ? "left-4" : "left-0.5"
                                }`}
                              />
                            </span>
                            <span
                              className={`text-[12px] font-bold ${
                                t.actif ? "text-[#14703c]" : "text-[#5b6472]"
                              }`}
                            >
                              {t.actif ? "Actif" : "Inactif"}
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {!estLectureSeule && (
                          <button
                            type="button"
                            onClick={() => {
                              setTypeEnEdition(t);
                              setModalOuverte(true);
                            }}
                            aria-label={`Modifier ${t.libelle}`}
                            className={`w-9 h-9 grid place-items-center rounded-[10px] text-[#5b6472] hover:bg-[#fafbfa] hover:text-[#1f2937] cursor-pointer transition-colors ${FOCUS}`}
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!chargement && types.length > 0 && (
          <div className="border-t border-[#f0f2f1] bg-[#fafbfa] px-4 py-2.5 text-[11px] text-[#5b6472]">
            <strong className="font-bold text-[#1f2937]">{types.length}</strong> type
            {types.length > 1 ? "s" : ""} affiché{types.length > 1 ? "s" : ""}
            {types.length !== typesTous.length && (
              <> · sur {typesTous.length} au total</>
            )}
          </div>
        )}
      </div>

      <FormulaireTypeEncounterModale
        ouvert={modalOuverte}
        typeEnEdition={typeEnEdition}
        typesServicesDisponibles={typesServicesDisponibles}
        onFermer={() => setModalOuverte(false)}
        onEnregistrer={handleEnregistrer}
      />
    </div>
  );
};

export default PanneauTypeEncounters;