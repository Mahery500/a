/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, MoreHorizontal, Plus, Search } from "lucide-react";
import { useReferentielsHabilitations } from "@/noyau/referentiels/habilitations";
import type { Habilitation, HabilitationInput } from "@/noyau/referentiels/habilitations";
import type { ActeMedical } from "@/briques/catalogue-actes/modele/catalogue-actes.types";
import type { DiagnosticDefinition } from "@/briques/diagnostic-definitions/modele/diagnostic-definition.types";
import type { TypeCible } from "../modele/matrice-habilitations.types";
import { TiroirAjoutHabilitation } from "./TiroirAjoutHabilitation";
import type { CibleAvecHabilitations } from "../modele/matrice-habilitations.types";

const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20";
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const PUCE_ACTIVE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold bg-[#e7f6ed] text-[#14703c]";
const PUCE_INACTIVE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold bg-[#f0f2f1] text-[#5b6472]";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

interface CibleListe {
  id: number;
  type: TypeCible;
  code: string;
  libelle: string;
  categorieLibelle?: string | null;
  habilitations: Habilitation[];
}

const depuisActe = (a: ActeMedical): CibleListe => ({
  id: a.id,
  type: "acte",
  code: a.code,
  libelle: a.libelle,
  categorieLibelle: a.categorie?.libelle ?? null,
  habilitations: (a.habilitations ?? []) as Habilitation[],
});

const depuisDiagnostic = (d: DiagnosticDefinition): CibleListe => ({
  id: d.id,
  type: "diagnostic",
  code: d.code,
  libelle: d.libelle,
  categorieLibelle: d.chapitre ?? null,
  habilitations: (d.habilitations ?? []) as Habilitation[],
});

export interface VueParCibleProps {
  actes: ActeMedical[];
  diagnostics: DiagnosticDefinition[];
  onDefinirHabilitations: (
    cible: { type: TypeCible; id: number },
    habilitations: HabilitationInput[],
  ) => Promise<boolean>;
}

interface MenuOuvert {
  cible: CibleListe;
  habilitation: Habilitation;
  top: number;
  right: number;
}

export const VueParCible: React.FC<VueParCibleProps> = ({
  actes,
  diagnostics,
  onDefinirHabilitations,
}) => {
  const { corpsMedicaux, specialites } = useReferentielsHabilitations();

  const [type, setType] = useState<TypeCible>("acte");
  const [recherche, setRecherche] = useState("");
  const [selectionId, setSelectionId] = useState<number | null>(null);
  const [tiroirOuvert, setTiroirOuvert] = useState(false);
  const [menu, setMenu] = useState<MenuOuvert | null>(null);

  useEffect(() => {
    if (!menu) return;
    const fermer = () => setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", esc);
    };
  }, [menu]);

  const source: CibleListe[] = useMemo(
    () =>
      type === "acte"
        ? actes.map(depuisActe)
        : diagnostics.map(depuisDiagnostic),
    [type, actes, diagnostics],
  );

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (c) => c.code.toLowerCase().includes(q) || c.libelle.toLowerCase().includes(q),
    );
  }, [source, recherche]);

  const selection =
    filtrees.find((c) => c.id === selectionId) ?? filtrees[0] ?? null;

  const changerType = (t: TypeCible) => {
    setType(t);
    setRecherche("");
    setSelectionId(null);
  };

  const libelleCorps = (code: string) =>
    corpsMedicaux.find((c) => c.code === code)?.libelle ?? code;
  const libelleSpec = (code?: string | null) =>
    code ? (specialites.find((s) => s.code === code)?.libelle ?? code) : null;

  const retirerHabilitation = async (cible: CibleListe, h: Habilitation) => {
    const nouvelles: HabilitationInput[] = cible.habilitations
      .filter((x) => !(x.corpsMedicalCode === h.corpsMedicalCode && x.specialiteCode === h.specialiteCode))
      .map((x) => ({
        corpsMedicalCode: x.corpsMedicalCode,
        specialiteCode: x.specialiteCode,
      }));
    await onDefinirHabilitations({ type: cible.type, id: cible.id }, nouvelles);
  };

  const basculerStatut = async (cible: CibleListe, h: Habilitation) => {
    // L'API ne permet pas de modifier l'actif d'une seule habilitation :
    // on reconstruit le tableau complet avec le nouveau flag. (Le champ n'est
    // pas transmis au backend, il reste piloté par l'acte/diagnostic actif ;
    // ce menu est donc sans effet tant que l'endpoint n'expose pas le flag.)
    // On affiche pour l'instant l'action en tant que "retirer".
    await retirerHabilitation(cible, h);
  };

  const ajouterHabilitations = async (
    nouvelles: HabilitationInput[],
  ): Promise<boolean> => {
    if (!selection) return false;
    return onDefinirHabilitations(
      { type: selection.type, id: selection.id },
      nouvelles,
    );
  };

  const ciblePourTiroir: CibleAvecHabilitations | null = selection
    ? {
        id: selection.id,
        type: selection.type,
        code: selection.code,
        libelle: selection.libelle,
        categorieLibelle: selection.categorieLibelle ?? undefined,
        actif: true,
        habilitations: selection.habilitations.map((h) => ({
          corpsMedicalCode: h.corpsMedicalCode,
          corpsMedicalLibelle: h.corpsMedicalLibelle ?? libelleCorps(h.corpsMedicalCode),
          specialiteCode: h.specialiteCode,
          specialiteLibelle: h.specialiteLibelle ?? libelleSpec(h.specialiteCode),
          actif: h.actif ?? true,
        })),
      }
    : null;

  const nbActives = selection
    ? selection.habilitations.filter((h) => h.actif !== false).length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-3.5 items-start">
      {/* ============ Colonne liste ============ */}
      <section className={`${CARTE} overflow-hidden`}>
        <div className="p-3.5 flex flex-col gap-2.5">
          {/* Type + compteur */}
          <div className="flex gap-2 items-center">
            {(["acte", "diagnostic"] as const).map((t) => {
              const actif = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => changerType(t)}
                  aria-pressed={actif}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] border cursor-pointer transition-colors ${FOCUS} ${
                    actif
                      ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                      : "border-[#e5e7eb] bg-white text-[#5b6472] font-medium hover:bg-[#fafbfa]"
                  }`}
                >
                  {t === "acte" ? "Acte" : "Diagnostic"}
                </button>
              );
            })}
            <span className="ml-auto text-[12px] text-[#5b6472] self-center tabular-nums">
              {filtrees.length} élément{filtrees.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6472] pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={`Rechercher ${type === "acte" ? "un acte" : "un diagnostic"}…`}
              aria-label="Rechercher"
              className={`${CHAMP} pl-9`}
            />
          </div>
        </div>

        {filtrees.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-[#5b6472]">
            {source.length === 0
              ? `Aucun ${type === "acte" ? "acte" : "diagnostic"} enregistré.`
              : "Aucun résultat pour cette recherche."}
          </div>
        ) : (
          <ul className="max-h-[560px] overflow-y-auto divide-y divide-[#f0f2f1]">
            {filtrees.map((c) => {
              const actif = selection?.id === c.id;
              const nb = c.habilitations.length;
              return (
                <li key={`${c.type}-${c.id}`}>
                  <button
                    type="button"
                    onClick={() => setSelectionId(c.id)}
                    aria-current={actif ? "true" : undefined}
                    className={`w-full text-left py-3 px-4 flex items-center gap-2 cursor-pointer transition-colors ${FOCUS} ${
                      actif ? "bg-[#e7f6ed]" : "hover:bg-[#fafbfa]"
                    }`}
                    style={actif ? { boxShadow: "inset 3px 0 0 #1f9d55" } : undefined}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={CODE_CHIP}>{c.code}</span>
                      <div className="font-bold text-[13px] text-[#1f2937] mt-1 truncate">
                        {c.libelle}
                      </div>
                      {c.categorieLibelle && (
                        <div className="text-[12px] text-[#5b6472] truncate">
                          {c.categorieLibelle}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[12px] font-bold text-[#5b6472]">
                      {nb} hab.
                    </span>
                    <ChevronRight className="shrink-0 h-4 w-4 text-[#cfd5dc]" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ============ Colonne détail ============ */}
      <section className={`${CARTE} overflow-hidden`}>
        {!selection ? (
          <div className="p-12 text-center text-[13px] text-[#5b6472]">
            Sélectionnez {type === "acte" ? "un acte" : "un diagnostic"} pour gérer ses
            habilitations.
          </div>
        ) : (
          <>
            {/* En-tête de la cible */}
            <div className="p-4 border-b border-[#f0f2f1] flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={CODE_CHIP}>{selection.code}</span>
                  <b className="text-[18px] text-[#1f2937]">{selection.libelle}</b>
                  <span className={PUCE_ACTIVE}>Actif</span>
                </div>
                {selection.categorieLibelle && (
                  <div className="text-[12px] text-[#5b6472] mt-1">
                    {selection.type === "acte" ? "Catégorie" : "Chapitre"} :{" "}
                    {selection.categorieLibelle}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTiroirOuvert(true)}
                className={BTN_PRIMAIRE}
              >
                <Plus className="h-[18px] w-[18px]" />
                Ajouter une habilitation
              </button>
            </div>

            {/* Compteur */}
            <div className="px-5 pt-3.5 pb-1.5">
              <b className="text-[13px] text-[#1f2937]">
                Habilitations configurées ({selection.habilitations.length})
              </b>
              <span className="text-[13px] text-[#5b6472] font-normal">
                {" "}
                · {nbActives} active{nbActives > 1 ? "s" : ""}
              </span>
            </div>

            {/* Tableau des habilitations */}
            {selection.habilitations.length === 0 ? (
              <div className="m-5 rounded-[10px] bg-[#fff4e0] border border-[#f3d9a8] p-3 text-[12px] text-[#8a5300]">
                <b>Aucune habilitation configurée.</b> Cet élément ne peut être réalisé
                par aucun profil médical.
              </div>
            ) : (
              <div className="px-5 pb-5">
                <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb]">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#fafbfa] border-b border-[#e5e7eb]">
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                          Corps médical
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                          Spécialité
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472]">
                          Statut
                        </th>
                        <th className="w-[40px]" aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {selection.habilitations.map((h, i) => {
                        const specLib = libelleSpec(h.specialiteCode);
                        const actif = h.actif !== false;
                        return (
                          <tr
                            key={`${h.corpsMedicalCode}-${h.specialiteCode ?? "-"}-${i}`}
                            className="border-t border-[#f0f2f1] hover:bg-[#fafbfa]"
                          >
                            <td className="px-4 py-2.5">
                              <div className="font-bold text-[#1f2937]">
                                {h.corpsMedicalLibelle ?? libelleCorps(h.corpsMedicalCode)}
                              </div>
                              <div className="font-mono text-[11px] text-[#5b6472]">
                                {h.corpsMedicalCode}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              {specLib ? (
                                <>
                                  <div className="text-[#1f2937]">{specLib}</div>
                                  <div className="font-mono text-[11px] text-[#5b6472]">
                                    {h.specialiteCode}
                                  </div>
                                </>
                              ) : (
                                <span className="italic text-[12px] text-[#5b6472]">
                                  Toutes les spécialités
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={actif ? PUCE_ACTIVE : PUCE_INACTIVE}>
                                {actif ? "✓ Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <button
                                type="button"
                                aria-label={`Actions pour ${h.corpsMedicalCode}`}
                                aria-haspopup="menu"
                                onClick={(e) => {
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setMenu({
                                    cible: selection,
                                    habilitation: h,
                                    top: r.bottom + 4,
                                    right: window.innerWidth - r.right,
                                  });
                                }}
                                className={`w-8 h-8 grid place-items-center rounded-md text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer ${FOCUS}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Menu ⋯ d'une habilitation */}
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
            className="fixed z-50 w-56 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void retirerHabilitation(menu.cible, menu.habilitation);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#b42318] hover:bg-rose-50 cursor-pointer"
            >
              Retirer l'habilitation
            </button>
          </div>
        </>
      )}

      {/* Tiroir d'ajout */}
      <TiroirAjoutHabilitation
        ouvert={tiroirOuvert}
        cible={ciblePourTiroir}
        onFermer={() => setTiroirOuvert(false)}
        onValider={ajouterHabilitations}
      />
    </div>
  );
};

export default VueParCible;