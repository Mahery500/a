// src/briques/actes-realisation/ui/SelecteurActe.tsx
import React, { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { useActeRealisation } from "../hooks/useActeRealisation";
import { ActeEnregistre, ChampMoule } from "../modele/acte.types";

export interface SelecteurActeProps {
  mode?: ModeAffichage;
  encounterId?: number | null;
  patientId?: number | null;
  filtreCategorieCodes?: string[];
  onEnregistre?: (acte: ActeEnregistre) => void;
  /**
   * Affiche le panneau latéral « Actes de ce dossier ».
   *
   * - `true` (défaut) → mise en page 2 colonnes. Utilisé en **infirmerie**
   *   via `PanneauActes`, où le panneau fait partie de la maquette.
   * - `false` → formulaire pleine largeur. Utilisé en **consultation**
   *   (`PanneauConsultationActive`), où `ResumeConsultation` occupe déjà
   *   la colonne de droite : le panneau serait redondant.
   */
  afficherPanneauActes?: boolean;
}

const BADGE: Record<string, string> = {
  realise: "bg-[#e7f6ed] text-[#14703c]",
  en_cours: "bg-[#eef2ff] text-[#3730a3]",
  planifie: "bg-[#fff4e0] text-[#8a5300]",
  annule: "bg-[#f0f2f1] text-[#5b6472] line-through",
  saisi_par_erreur: "bg-[#f0f2f1] text-[#5b6472] line-through",
};

const CODE_CHIP =
  "font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] inline-block";
const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5 mt-1";
const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 border border-[#e5e7eb] rounded-[10px] px-3 text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-2 focus:ring-[#e7f6ed]";
const CHAMP_ERREUR =
  "w-full h-10 border border-[#b42318] rounded-[10px] px-3 text-sm bg-white text-[#1f2937] " +
  "focus:outline-none focus:border-[#b42318] focus:ring-2 focus:ring-rose-100";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-bold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

function verifierPlausibilite(champ: ChampMoule, raw: string): string | null {
  if (champ.typeValeur !== "numerique") return null;
  const v = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(v)) return null;

  const texte = `${champ.code} ${champ.libelle}`.toUpperCase();

  if (/SYSTOL|\bPAS\b/.test(texte) && (v < 60 || v > 250))
    return "Valeur improbable : vérifiez la saisie (ex. 120).";
  if (/DIASTOL|\bPAD\b/.test(texte) && (v < 30 || v > 150))
    return "Valeur improbable : vérifiez la saisie (ex. 80).";
  if (/POULS|\bFC\b/.test(texte) && (v < 30 || v > 220))
    return "Valeur improbable : vérifiez la saisie (ex. 75).";
  if (/TEMP/.test(texte) && (v < 34 || v > 43))
    return "Valeur improbable : vérifiez la saisie (ex. 37.0).";
  if (/SPO2|SAT/.test(texte) && (v < 50 || v > 100))
    return "Valeur improbable : vérifiez la saisie (ex. 98).";
  return null;
}

export const SelecteurActe: React.FC<SelecteurActeProps> = ({
  mode = "edition",
  encounterId,
  patientId,
  filtreCategorieCodes,
  onEnregistre,
  afficherPanneauActes = true,
}) => {
  const h = useActeRealisation(encounterId, patientId, filtreCategorieCodes);
  const { notifierSucces, notifierErreur } = useNotifier();
  const modifiable = mode === "edition";

  const avertissements = useMemo(() => {
    const map = new Map<number, string>();
    h.moule.forEach((c) => {
      const v = h.valeurs[c.observationId];
      if (v === undefined) return;
      const warn = verifierPlausibilite(c, v);
      if (warn) map.set(c.observationId, warn);
    });
    return map;
  }, [h.moule, h.valeurs]);

  if (mode === "masque") {
    return (
      <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        Vous n'avez pas les droits pour accéder aux actes.
      </div>
    );
  }

  if (!encounterId) {
    return (
      <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
        Aucun patient en cours de soins.
      </div>
    );
  }

  const statutDe = (acteDefinitionId: number) =>
    h.actes.find(
      (a) =>
        a.acteDefinitionId === acteDefinitionId &&
        a.statut !== "annule" &&
        a.statut !== "saisi_par_erreur",
    )?.statut;

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifiable) return;
    try {
      const acte = await h.enregistrer();
      notifierSucces(
        acte.statut === "realise"
          ? "Acte enregistré et terminé."
          : "Acte enregistré (en cours : il reste des obligatoires).",
      );
      onEnregistre?.(acte);
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  const libelleBouton = h.acteExistant ? "Compléter l'acte" : "Enregistrer l'acte";
  const peutEnvoyer =
    modifiable &&
    !!h.selectionId &&
    !h.enCours &&
    !h.chargementMoule &&
    (h.moule.length === 0
      ? !h.acteExistant
      : h.nombreSaisis > 0 || (!!h.acteExistant && h.obligatoiresManquantes.length === 0));

  const optionsActes = (() => {
    const d = h.demandeActive;
    if (d && !h.realisables.some((a) => a.id === d.acteDefinitionId)) {
      return [{ id: d.acteDefinitionId, code: d.code, libelle: d.libelle }, ...h.realisables];
    }
    return h.realisables;
  })();

  /* ------------------------------------------------------------------ */
  /*  Formulaire (isolé pour être réutilisé avec ou sans panneau latéral) */
  /* ------------------------------------------------------------------ */
  const formulaire = (
    <form
      onSubmit={soumettre}
      className={`${
        afficherPanneauActes ? "flex-1 min-w-0" : "w-full"
      } bg-white rounded-[14px] border border-[#e5e7eb] p-5 space-y-4 flex flex-col`}
    >
      <div className={SECTION}>Acte</div>

      <div>
        <label htmlFor="acte-select" className={LABEL}>
          Acte à enregistrer <span className="text-[#b42318]">*</span>
        </label>
        <select
          id="acte-select"
          value={h.selectionId ?? ""}
          disabled={!modifiable || h.enCours || h.chargement}
          onChange={(e) => h.choisirActe(e.target.value ? Number(e.target.value) : null)}
          className={CHAMP}
        >
          <option value="">{h.chargement ? "Chargement…" : "— Choisir un acte —"}</option>
          {optionsActes.map((a) => {
            const st = statutDe(a.id);
            return (
              <option key={a.id} value={a.id} disabled={st === "realise"}>
                {a.libelle} ({a.code})
                {st === "realise"
                  ? " — déjà réalisé"
                  : st === "en_cours"
                    ? " — à compléter"
                    : ""}
              </option>
            );
          })}
        </select>
        <p className="text-[12px] text-[#5b6472] mt-1.5">
          Choisissez l'acte réalisé parmi le catalogue du service.
        </p>
        {h.demandeActive && (
          <p className="text-[11px] text-[#5b6472] mt-1">
            Répond à la prescription n° <span className="font-mono">{h.demandeActive.id}</span>
          </p>
        )}
        {!h.chargement && h.realisables.length === 0 && (
          <p className="text-[11px] text-[#8a5300] mt-1">
            Aucun acte réalisable pour votre profil dans ce service.
          </p>
        )}
      </div>

      {h.erreur && (
        <div className="p-3 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{h.erreur}</span>
        </div>
      )}

      {h.selectionId && h.chargementMoule && (
        <div className="p-4 text-center text-[#5b6472] text-xs flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Chargement des champs…</span>
        </div>
      )}

      {h.selectionId && !h.chargementMoule && (
        <>
          <div className={SECTION}>Résultats</div>

          {h.moule.length === 0 ? (
            <div className="p-3 rounded-[10px] bg-[#e7f6ed] border border-[#1f9d55]/30 text-[#14703c] text-xs flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Cet acte n'attend aucune observation : il sera marqué <b>« Réalisé »</b>{" "}
                directement.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {h.moule.map((c) => {
                const dejaValeur = h.dejaSaisies.get(c.observationId);
                const val = h.valeurs[c.observationId] ?? "";
                const alerte = avertissements.get(c.observationId);
                const manquant =
                  c.obligatoire && dejaValeur === undefined && val.trim() === "" && !alerte;

                return (
                  <div key={c.observationId}>
                    <label htmlFor={`obs-${c.observationId}`} className={LABEL}>
                      {c.libelle}
                      {c.obligatoire && <span className="text-[#b42318]"> *</span>}
                    </label>

                    {dejaValeur !== undefined ? (
                      <div className="h-10 flex items-center justify-between px-3 rounded-[10px] bg-[#e7f6ed] border border-[#1f9d55]/30 text-sm font-bold font-mono text-[#1f2937]">
                        <span>{dejaValeur}</span>
                        <span className="text-[11px] font-semibold text-[#14703c]">
                          déjà saisi
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <input
                          id={`obs-${c.observationId}`}
                          type="text"
                          inputMode={c.typeValeur === "numerique" ? "decimal" : "text"}
                          disabled={!modifiable || h.enCours}
                          value={val}
                          onChange={(e) => h.setValeur(c.observationId, e.target.value)}
                          placeholder={c.unite ? `Valeur en ${c.unite}` : "Valeur"}
                          className={`${alerte || manquant ? CHAMP_ERREUR : CHAMP} ${
                            c.unite ? "rounded-r-none" : ""
                          }`}
                        />
                        {c.unite && (
                          <span className="h-10 px-3 flex items-center text-[12px] font-mono text-[#5b6472] bg-[#fafbfa] border border-l-0 border-[#e5e7eb] rounded-r-[10px]">
                            {c.unite}
                          </span>
                        )}
                      </div>
                    )}

                    {alerte ? (
                      <p className="text-[12px] font-bold text-[#b42318] mt-1.5">{alerte}</p>
                    ) : manquant ? (
                      <p className="text-[12px] font-bold text-[#b42318] mt-1.5">
                        Champ obligatoire.
                      </p>
                    ) : (
                      dejaValeur === undefined && (
                        <input
                          type="text"
                          disabled={!modifiable || h.enCours}
                          value={h.interpretations[c.observationId] ?? ""}
                          onChange={(e) =>
                            h.setInterpretation(c.observationId, e.target.value)
                          }
                          placeholder="Interprétation (facultatif)"
                          className="w-full mt-1 bg-transparent border border-[#f0f2f1] rounded-md px-2 py-1 text-[11px] italic text-[#5b6472] focus:outline-none focus:border-[#1f9d55]"
                        />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {h.obligatoiresManquantes.length > 0 && (
            <p className="text-[11px] text-[#8a5300] bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] p-2.5 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {h.obligatoiresManquantes.length} champ(s) obligatoire(s) vide(s) : l'acte
                restera <b>« En cours »</b> et pourra être complété plus tard.
              </span>
            </p>
          )}

          <input
            type="text"
            disabled={!modifiable || h.enCours || !!h.acteExistant}
            value={h.commentaire}
            onChange={(e) => h.setCommentaire(e.target.value)}
            placeholder="Commentaire (optionnel)"
            className={CHAMP}
          />
        </>
      )}

      <div className="flex-1" />

      {modifiable && h.selectionId && (
        <button
          type="submit"
          disabled={!peutEnvoyer}
          className={`${BTN_PRIMAIRE} w-full justify-center`}
        >
          {h.enCours ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Enregistrement…</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>{libelleBouton}</span>
            </>
          )}
        </button>
      )}
    </form>
  );

  /* ------------------------------------------------------------------ */
  /*  Panneau latéral « Actes de ce dossier » (infirmerie uniquement)   */
  /* ------------------------------------------------------------------ */
  const panneauActes = afficherPanneauActes ? (
    <aside className="w-full lg:max-w-[380px] lg:shrink-0 bg-white rounded-[14px] border border-[#e5e7eb] flex flex-col">
      <div className="px-5 py-4 border-b border-[#f0f2f1]">
        <b className="text-[16px] font-bold text-[#1f2937] block">
          Actes de ce dossier · {h.actes.length}
        </b>
        <span className="text-[12px] text-[#5b6472]">
          {h.actes.filter((a) => a.statut === "realise").length} acte
          {h.actes.filter((a) => a.statut === "realise").length > 1 ? "s" : ""} enregistré
          {h.actes.filter((a) => a.statut === "realise").length > 1 ? "s" : ""}
        </span>
      </div>

      {h.actes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center px-5">
          <Activity className="h-7 w-7 text-[#5b6472]" strokeWidth={1.6} />
          <b className="text-sm text-[#1f2937]">Aucun acte enregistré</b>
          <p className="text-[12px] text-[#5b6472] max-w-[240px]">
            Les actes saisis pour ce dossier apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#f0f2f1] max-h-[560px] overflow-y-auto">
          {h.actes.map((a) => {
            const aUneValeurImprobable = a.observations.some((o) => {
              const v = parseFloat(o.valeur.replace(",", "."));
              if (!Number.isFinite(v)) return false;
              const texte = `${o.code} ${o.libelle ?? ""}`.toUpperCase();
              if (/SYSTOL|\bPAS\b/.test(texte)) return v < 60 || v > 250;
              if (/DIASTOL|\bPAD\b/.test(texte)) return v < 30 || v > 150;
              return false;
            });
            const badgeClass = BADGE[a.statut] ?? BADGE.en_cours;
            const badgeLabel =
              a.statut === "realise"
                ? "Réalisé"
                : a.statut === "en_cours"
                  ? "En cours"
                  : a.statut.replace("_", " ");

            return (
              <li key={a.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <b className="text-sm text-[#1f2937] truncate">{a.libelle}</b>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${badgeClass}`}
                  >
                    {a.statut === "realise" && <CheckCircle2 className="h-3 w-3" />}
                    {badgeLabel}
                  </span>
                </div>

                <div className="mt-1">
                  <span className={CODE_CHIP}>{a.code}</span>
                </div>

                {a.observations.length > 0 && (
                  <div className="font-mono text-[12px] text-[#5b6472] mt-2 leading-[1.7]">
                    {a.observations.map((o) => (
                      <div key={o.id}>
                        {o.libelle || o.code} :{" "}
                        <b className="text-[#1f2937]">
                          {o.valeur} {o.unite ?? ""}
                        </b>
                        {o.interpretation && (
                          <span className="italic"> ({o.interpretation})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {aUneValeurImprobable && (
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff4e0] text-[#8a5300]">
                      <AlertTriangle className="h-3 w-3" /> Valeurs à vérifier
                    </span>
                  </div>
                )}

                {modifiable && a.statut === "en_cours" && (
                  <button
                    type="button"
                    onClick={() => h.choisirActe(a.acteDefinitionId)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#b42318] hover:underline cursor-pointer"
                  >
                    Compléter →
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  ) : null;

  /* ------------------------------------------------------------------ */
  /*  Rendu final : 2 cols (infirmerie) ou 1 col (consultation)         */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-3.5">
      {h.demandes.length > 0 && (
        <div className="p-4 bg-white rounded-[14px] border border-[#e5e7eb] space-y-2.5">
          <div className="border-b border-[#f0f2f1] pb-2">
            <h3 className="text-sm font-bold text-[#1f2937]">
              Actes prescrits à exécuter ({h.demandes.length})
            </h3>
            <p className="text-[12px] text-[#5b6472]">Demandes en attente pour ce patient</p>
          </div>
          {h.demandes.map((d) => (
            <div
              key={d.id}
              className={`p-3 rounded-[10px] border text-xs flex flex-wrap items-center justify-between gap-2 ${
                h.ligneDemandeId === d.id
                  ? "border-[#b42318] bg-rose-50/40"
                  : "border-[#e5e7eb] bg-[#fafbfa]"
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="text-[#1f2937] text-sm">{d.libelle}</strong>
                  <span className="font-mono text-[10px] text-[#5b6472]">({d.code})</span>
                  {d.urgente && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                      URGENT
                    </span>
                  )}
                </div>
                {d.commentaire && (
                  <p className="text-[#5b6472] italic">Instruction : « {d.commentaire} »</p>
                )}
              </div>
              {modifiable && (
                <button
                  type="button"
                  disabled={h.enCours}
                  onClick={() => h.choisirDemande(d)}
                  className="px-3.5 py-1.5 bg-[#b42318] hover:bg-[#912018] text-white rounded-[10px] font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Réaliser
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className={
          afficherPanneauActes
            ? "flex flex-col lg:flex-row gap-3.5 items-start"
            : "flex flex-col"
        }
      >
        {formulaire}
        {panneauActes}
      </div>
    </div>
  );
};

export default SelecteurActe;