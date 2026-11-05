/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { Stethoscope, FileText, User } from "lucide-react";
import { useReferentielsHabilitations } from "@/noyau/referentiels/habilitations";
import type { ActeMedical } from "@/briques/catalogue-actes/modele/catalogue-actes.types";
import type { DiagnosticDefinition } from "@/briques/diagnostic-definitions/modele/diagnostic-definition.types";

const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472]/60 disabled:cursor-not-allowed";
const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";

type StatutHabilitation = "actives" | "inactives" | "toutes";

interface ItemAffiche {
  code: string;
  libelle: string;
  categorieLibelle?: string | null;
  sousTitreSpecialite: string;
}

const correspond = (
  h: { corpsMedicalCode: string; specialiteCode: string | null; actif?: boolean },
  corpsCode: string,
  specCode: string,
  statut: StatutHabilitation,
): boolean => {
  if (h.corpsMedicalCode !== corpsCode) return false;
  if (specCode) {
    if (h.specialiteCode !== null && h.specialiteCode !== specCode) return false;
  }
  if (statut === "actives" && h.actif === false) return false;
  if (statut === "inactives" && h.actif !== false) return false;
  return true;
};

const libelleSpecialite = (
  habilitations: { specialiteCode: string | null; specialiteLibelle?: string }[],
  specialites: { code: string; libelle: string }[],
): string => {
  if (habilitations.length === 0) return "toutes spécialités";
  if (habilitations.every((h) => h.specialiteCode === null)) {
    return "toutes spécialités";
  }
  const labels = Array.from(
    new Set(
      habilitations
        .filter((h) => h.specialiteCode !== null)
        .map(
          (h) =>
            h.specialiteLibelle ??
            specialites.find((s) => s.code === h.specialiteCode)?.libelle ??
            h.specialiteCode ??
            "",
        ),
    ),
  );
  return labels.length ? labels.join(", ") : "toutes spécialités";
};

/** Filtre une liste d'actes ou de diagnostics pour le couple corps/spécialité. */
function filtrerActes(
  actes: ActeMedical[],
  corpsCode: string,
  specCode: string,
  statut: StatutHabilitation,
  specialites: { code: string; libelle: string }[],
): ItemAffiche[] {
  if (!corpsCode) return [];
  const resultat: ItemAffiche[] = [];
  for (const a of actes) {
    const matching = (a.habilitations ?? []).filter((h) =>
      correspond(h, corpsCode, specCode, statut),
    );
    if (matching.length === 0) continue;
    resultat.push({
      code: a.code,
      libelle: a.libelle,
      categorieLibelle: a.categorie?.libelle ?? null,
      sousTitreSpecialite: libelleSpecialite(matching, specialites),
    });
  }
  return resultat.sort((x, y) => x.libelle.localeCompare(y.libelle, "fr"));
}

function filtrerDiagnostics(
  diagnostics: DiagnosticDefinition[],
  corpsCode: string,
  specCode: string,
  statut: StatutHabilitation,
  specialites: { code: string; libelle: string }[],
): ItemAffiche[] {
  if (!corpsCode) return [];
  const resultat: ItemAffiche[] = [];
  for (const d of diagnostics) {
    const matching = (d.habilitations ?? []).filter((h) =>
      correspond(h, corpsCode, specCode, statut),
    );
    if (matching.length === 0) continue;
    resultat.push({
      code: d.code,
      libelle: d.libelle,
      categorieLibelle: d.chapitre,
      sousTitreSpecialite: libelleSpecialite(matching, specialites),
    });
  }
  return resultat.sort((x, y) => x.libelle.localeCompare(y.libelle, "fr"));
}

const CarteListe: React.FC<{
  titre: string;
  icone: React.ReactNode;
  items: ItemAffiche[];
  vide: string;
  type: "acte" | "diagnostic";
}> = ({ titre, icone, items, vide, type }) => (
  <section className={`${CARTE} overflow-hidden flex flex-col min-h-[200px]`}>
    <div className="px-4 py-3.5 flex items-center gap-2 border-b border-[#f0f2f1]">
      <span className="text-[#14703c]">{icone}</span>
      <h3 className="text-[16px] font-bold text-[#1f2937]">{titre}</h3>
      <span className="ml-auto inline-block px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#f0f2f1] text-[#5b6472]">
        {items.length}
      </span>
    </div>
    {items.length === 0 ? (
      <p className="m-auto px-5 py-8 text-center text-[13px] text-[#5b6472]">
        {vide}
      </p>
    ) : (
      <ul className="divide-y divide-[#f0f2f1] max-h-[520px] overflow-y-auto">
        {items.map((it, i) => (
          <li key={`${type}-${it.code}-${i}`} className="px-4 py-3">
            <div className="flex items-start gap-2 flex-wrap">
              <span className={CODE_CHIP}>{it.code}</span>
              <b className="text-[14px] text-[#1f2937] flex-1 min-w-0">
                {it.libelle}
              </b>
            </div>
            <div className="text-[12px] text-[#5b6472] mt-0.5">
              {type === "acte"
                ? `${it.categorieLibelle ?? "Sans catégorie"} · ${it.sousTitreSpecialite}`
                : it.sousTitreSpecialite}
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export interface VueParHabilitationProps {
  actes: ActeMedical[];
  diagnostics: DiagnosticDefinition[];
}

export const VueParHabilitation: React.FC<VueParHabilitationProps> = ({
  actes,
  diagnostics,
}) => {
  const { corpsMedicaux, specialites } = useReferentielsHabilitations();

  const [corpsCode, setCorpsCode] = useState("");
  const [specCode, setSpecCode] = useState("");
  const [statut, setStatut] = useState<StatutHabilitation>("actives");

  const corpsSelectionne = corpsMedicaux.find((c) => c.code === corpsCode);
  const specSelectionnee = specialites.find((s) => s.code === specCode);

  const actesAffiches = useMemo(
    () => filtrerActes(actes, corpsCode, specCode, statut, specialites),
    [actes, corpsCode, specCode, statut, specialites],
  );
  const diagnosticsAffiches = useMemo(
    () => filtrerDiagnostics(diagnostics, corpsCode, specCode, statut, specialites),
    [diagnostics, corpsCode, specCode, statut, specialites],
  );

  const statutLabel =
    statut === "actives"
      ? "habilitations actives"
      : statut === "inactives"
        ? "habilitations inactives"
        : "toutes habilitations";

  const specialiteLabel = specSelectionnee
    ? specSelectionnee.libelle
    : "toutes spécialités";

  return (
    <div className="space-y-3.5">
      {/* Carte filtres */}
      <section className={`${CARTE} p-4 flex flex-col gap-3`}>
        <div className="flex flex-col md:flex-row md:items-start gap-3.5">
          {/* Corps médical */}
          <div className="flex-1">
            <label htmlFor="hab-corps-filtre" className={LABEL}>
              Corps médical <span className="text-[#b42318]">*</span>
            </label>
            <select
              id="hab-corps-filtre"
              value={corpsCode}
              onChange={(e) => {
                setCorpsCode(e.target.value);
                setSpecCode("");
              }}
              className={`${CHAMP} cursor-pointer`}
            >
              <option value="">— Sélectionner —</option>
              {corpsMedicaux.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.libelle} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Spécialité */}
          <div className="flex-1">
            <label htmlFor="hab-spec-filtre" className={LABEL}>
              Spécialité <span className="font-normal">(facultatif)</span>
            </label>
            <select
              id="hab-spec-filtre"
              value={specCode}
              onChange={(e) => setSpecCode(e.target.value)}
              disabled={!corpsCode}
              className={`${CHAMP} cursor-pointer`}
            >
              <option value="">Toutes les spécialités</option>
              {specialites.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.libelle} ({s.code})
                </option>
              ))}
            </select>
            {!corpsCode && (
              <p className="text-[12px] text-[#5b6472] mt-1.5">
                Disponible après le choix du corps médical.
              </p>
            )}
          </div>

          {/* Statut */}
          <div>
            <div className={LABEL}>Statut</div>
            <div className="flex gap-2 h-10 items-center" role="group">
              {(["actives", "inactives", "toutes"] as const).map((s) => {
                const actif = statut === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={actif}
                    onClick={() => setStatut(s)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] border cursor-pointer transition-colors ${
                      actif
                        ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                        : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
                    }`}
                  >
                    {s === "actives" ? "Actives" : s === "inactives" ? "Inactives" : "Toutes"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ligne résumé */}
        <div className="pt-2.5 border-t border-[#f0f2f1] text-[13px] text-[#5b6472]">
          {!corpsCode ? (
            "Choisissez un corps médical pour afficher ses habilitations."
          ) : (
            <>
              {actesAffiches.length} acte{actesAffiches.length > 1 ? "s" : ""} et{" "}
              {diagnosticsAffiches.length} diagnostic
              {diagnosticsAffiches.length > 1 ? "s" : ""} autorisés pour{" "}
              <b className="text-[#1f2937]">{corpsSelectionne?.libelle ?? corpsCode}</b> ·{" "}
              {specialiteLabel} · {statutLabel}
            </>
          )}
        </div>
      </section>

      {/* Contenu */}
      {!corpsCode ? (
        <div className="border-2 border-dashed border-[#cfd5dc] rounded-[14px] py-14 px-6 text-center bg-white">
          <User
            className="w-9 h-9 mx-auto mb-2 text-[#5b6472]"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <b className="block text-[16px] text-[#1f2937] mb-1.5">
            Sélectionnez un corps médical
          </b>
          <p className="text-[13px] text-[#5b6472] max-w-[520px] mx-auto">
            Les actes et diagnostics pour lesquels cette habilitation est configurée
            s'afficheront ici. Vous pouvez affiner par spécialité.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <CarteListe
            titre="Actes médicaux autorisés"
            icone={<Stethoscope className="h-4 w-4" />}
            items={actesAffiches}
            vide="Aucun acte n'est autorisé pour cette habilitation."
            type="acte"
          />
          <CarteListe
            titre="Diagnostics autorisés"
            icone={<FileText className="h-4 w-4" />}
            items={diagnosticsAffiches}
            vide="Aucun diagnostic n'est autorisé pour cette habilitation."
            type="diagnostic"
          />
        </div>
      )}
    </div>
  );
};

export default VueParHabilitation;