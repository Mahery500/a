import React, { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, ClipboardList, FileText, X } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { SectionPiecesJointes } from "./SectionPiecesJointes";
// Contrats API (payloads réseau)
import type { ActeDefinitionApiOutput } from "../api/consultation-active.contrats";

// Types métier
import type {
  NouvelActeExterneInput,
  NouvellePieceJointe,
  TypePieceJointe,
  ObservationResultatInput,
} from "../modele/consultation-active.types";

// Constantes de runtime (NE PAS mettre dans import type)
import {
  LIBELLES_TYPE_PIECE_JOINTE,
  ORDRE_TYPES_PIECE_JOINTE,
} from "../modele/consultation-active.types";

interface ChampMouleApi {
  ordre: number;
  obligatoire: boolean;
  observation: {
    id: number;
    code: string;
    libelle: string;
    typeValeur: "numerique" | "texte";
    uniteCode?: string | null;
    uniteLibelle?: string | null;
  };
}

export interface ModaleActeExterneProps {
  ouvert: boolean;
  catalogueActes: ActeDefinitionApiOutput[];
  onFermer: () => void;
  onEnregistrer: (input: Omit<NouvelActeExterneInput, "encounterId">) => Promise<{ finalise: boolean }>;
  /** Récupère le moule d'observations d'un acte (pour afficher les champs attendus). */
  recupererMoule: (acteDefinitionId: number) => Promise<ChampMouleApi[]>;
}

type Etape = 1 | 2 | 3;

export const ModaleActeExterne: React.FC<ModaleActeExterneProps> = ({
  ouvert,
  catalogueActes,
  onFermer,
  onEnregistrer,
  recupererMoule,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();
  const [etape, setEtape] = useState<Etape>(1);

  // Étape 1 : acte + date
  const [acteId, setActeId] = useState<number | "">("");
  const [dateRealisation, setDateRealisation] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });

  // Étape 2 : résultat + observations
  const [typeResultat, setTypeResultat] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [moule, setMoule] = useState<ChampMouleApi[]>([]);
  const [chargementMoule, setChargementMoule] = useState(false);
  const [valeursObs, setValeursObs] = useState<Record<number, string>>({});
  const [interpObs, setInterpObs] = useState<Record<number, string>>({});

  // Étape 3 : PJ
  const [pieces, setPieces] = useState<NouvellePieceJointe[]>([]);
  const [typeDefaut, setTypeDefaut] = useState<TypePieceJointe>("compte_rendu");

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const acteSelectionne = useMemo(
    () => catalogueActes.find((a) => a.id === acteId) ?? null,
    [catalogueActes, acteId],
  );

  // Reset à l'ouverture
  useEffect(() => {
    if (!ouvert) return;
    setEtape(1);
    setActeId("");
    setTypeResultat("");
    setInterpretation("");
    setConclusion("");
    setValeursObs({});
    setInterpObs({});
    setPieces([]);
    setTypeDefaut("compte_rendu");
    setErreur(null);
    setMoule([]);
    const d = new Date();
    setDateRealisation(d.toISOString().slice(0, 16));
  }, [ouvert]);

  // Charge le moule quand l'acte change
  useEffect(() => {
    if (!acteId) {
      setMoule([]);
      return;
    }
    let actif = true;
    setChargementMoule(true);
    recupererMoule(Number(acteId))
      .then((champs) => {
        if (actif) setMoule(champs);
      })
      .catch(() => {
        if (actif) setMoule([]);
      })
      .finally(() => {
        if (actif) setChargementMoule(false);
      });
    return () => {
      actif = false;
    };
  }, [acteId, recupererMoule]);

  // Observations renseignées (non vides)
  const observations = useMemo<ObservationResultatInput[]>(
    () =>
      moule
        .map((champ) => ({
          observationDefinitionId: champ.observation.id,
          valeur: (valeursObs[champ.observation.id] ?? "").trim(),
          interpretation: (interpObs[champ.observation.id] ?? "").trim() || null,
        }))
        .filter((o) => o.valeur !== ""),
    [moule, valeursObs, interpObs],
  );

  const peutContinuer =
    etape === 1 ? acteId !== "" && dateRealisation !== "" : true;

  const suivant = () => {
    setErreur(null);
    if (etape === 1) {
      if (!acteId) return setErreur("Sélectionnez un acte.");
      if (!dateRealisation) return setErreur("Renseignez la date de réalisation.");
      return setEtape(2);
    }
    if (etape === 2) {
      if (!typeResultat.trim()) return setErreur("Renseignez le type de résultat.");
      return setEtape(3);
    }
  };

  const precedent = () => {
    setErreur(null);
    if (etape > 1) setEtape((etape - 1) as Etape);
  };

  // ─── Handlers PJ (déclarés UNE SEULE FOIS) ────────────────────────────
  const ajouterPiece = (pj: NouvellePieceJointe) =>
    setPieces((p) => [...p, pj]);
  const retirerPiece = (index: number) =>
    setPieces((p) => p.filter((_, i) => i !== index));
  const changerTypePiece = (index: number, type: TypePieceJointe) =>
    setPieces((p) =>
      p.map((pj, i) => (i === index ? { ...pj, typePieceJointe: type } : pj)),
    );

  const valider = async () => {
    setErreur(null);
    if (!acteId) return setErreur("Sélectionnez un acte.");
    if (!typeResultat.trim()) return setErreur("Renseignez le type de résultat.");

    setEnCours(true);
    try {
      const res = await onEnregistrer({
        acteDefinitionId: Number(acteId),
        dateRealisation: new Date(dateRealisation).toISOString(),
        resultat: {
          type: typeResultat.trim(),
          interpretation: interpretation.trim() || null,
          conclusion: conclusion.trim() || null,
        },
        observations,
        piecesJointes: pieces,
      });

      notifierSucces(
        res.finalise
          ? "Acte externe enregistré."
          : "Acte externe enregistré — reste en cours (observations obligatoires manquantes).",
      );
      onFermer();
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
      setErreur(extraireMessageErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  if (!ouvert) return null;

  const libelleEtape = etape === 1 ? "Continuer" : etape === 2 ? "Continuer" : "Enregistrer";

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre={`Enregistrer un acte externe (${etape}/3)`}
      icone={<Activity className="h-4 w-4 text-asina-600" />}
      largeurMax="lg"
      enfants={
        <div className="space-y-4">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {erreur}
            </div>
          )}

          {etape === 1 && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Acte réalisé à l'extérieur *
                </label>
                <select
                  value={acteId}
                  onChange={(e) => setActeId(e.target.value ? Number(e.target.value) : "")}
                  disabled={enCours}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-asina-500"
                >
                  <option value="">— Choisir un acte —</option>
                  {catalogueActes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.libelle} ({a.code})
                    </option>
                  ))}
                </select>
                {catalogueActes.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Aucun acte réalisable dans ce service. Vérifiez le catalogue et les habilitations.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date et heure de réalisation *
                </label>
                <input
                  type="datetime-local"
                  value={dateRealisation}
                  onChange={(e) => setDateRealisation(e.target.value)}
                  disabled={enCours}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-asina-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Date réelle à laquelle l'acte a été effectué à l'extérieur.
                </p>
              </div>
            </>
          )}

          {etape === 2 && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type de résultat *
                </label>
                <input
                  type="text"
                  value={typeResultat}
                  onChange={(e) => setTypeResultat(e.target.value)}
                  placeholder="ex : IRM lombaire, Bilan lipidique…"
                  maxLength={50}
                  disabled={enCours}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-asina-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Interprétation
                </label>
                <input
                  type="text"
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  disabled={enCours}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-asina-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conclusion
                </label>
                <textarea
                  rows={2}
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  disabled={enCours}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-asina-500 resize-y"
                />
              </div>

              {chargementMoule && (
                <p className="text-[11px] text-slate-500">Chargement du moule d'observations…</p>
              )}

              {!chargementMoule && moule.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
                    Observations ({observations.length}/{moule.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {moule.map((champ) => {
                      const obsId = champ.observation.id;
                      const v = valeursObs[obsId] ?? "";
                      const i = interpObs[obsId] ?? "";
                      return (
                        <div
                          key={obsId}
                          className={`p-2 rounded-lg border text-xs ${
                            v.trim() ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-slate-800">
                              {champ.observation.libelle}
                              {champ.obligatoire && <span className="text-rose-600 ml-1">*</span>}
                            </label>
                            {champ.observation.uniteCode && (
                              <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                {champ.observation.uniteCode}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={v}
                            onChange={(e) => setValeursObs((p) => ({ ...p, [obsId]: e.target.value }))}
                            disabled={enCours}
                            placeholder="Valeur"
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-asina-500"
                          />
                          <input
                            type="text"
                            value={i}
                            onChange={(e) => setInterpObs((p) => ({ ...p, [obsId]: e.target.value }))}
                            disabled={enCours}
                            placeholder="Interprétation (facultatif)"
                            className="w-full mt-1 bg-white border border-slate-200 rounded px-2 py-1 text-[11px] italic focus:outline-none focus:border-asina-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!chargementMoule && moule.length === 0 && acteId && (
                <p className="text-[11px] text-slate-500 italic">
                  Aucune observation attendue par le moule de cet acte.
                </p>
              )}
            </>
          )}

          {etape === 3 && (
            <div className="space-y-3">
              <div className="text-xs text-slate-700">
                <b>Acte :</b> {acteSelectionne?.libelle} ({acteSelectionne?.code})
              </div>
              <div className="text-xs text-slate-700">
                <b>Type :</b> {typeResultat}
              </div>
              <div className="text-xs text-slate-700">
                <b>Observations :</b> {observations.length}
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <h4 className="text-xs font-bold text-slate-800">
                  Pièces jointes ({pieces.length})
                </h4>

                {/* ── Liste des PJ ajoutées ─────────────────────────────── */}
                <div className="space-y-1.5">
                  {pieces.map((pj, i) => (
                    <div
                      key={`${pj.fichier.name}-${i}`}
                      className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="flex-1 truncate" title={pj.fichier.name}>
                        {pj.fichier.name}
                      </span>

                      <select
                        value={pj.typePieceJointe}
                        onChange={(e) =>
                          changerTypePiece(i, e.target.value as TypePieceJointe)
                        }
                        disabled={enCours}
                        aria-label={`Type de la pièce ${pj.fichier.name}`}
                        className="text-[10px] bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-asina-500"
                      >
                        {ORDRE_TYPES_PIECE_JOINTE.map((t) => (
                          <option key={t} value={t}>
                            {LIBELLES_TYPE_PIECE_JOINTE[t]}
                          </option>
                        ))}
                      </select>

                      <span className="text-[10px] text-slate-500 font-mono">
                        {(pj.fichier.size / 1024).toFixed(0)} Ko
                      </span>
                      <button
                        type="button"
                        onClick={() => retirerPiece(i)}
                        disabled={enCours}
                        aria-label={`Retirer ${pj.fichier.name}`}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* ── Barre d'ajout ─────────────────────────────────────── */}
                <div className="flex items-center gap-2 pt-1">
                  <label
                    htmlFor="pj-type-defaut"
                    className="text-[11px] font-semibold text-slate-600 shrink-0"
                  >
                    Type par défaut :
                  </label>
                  <select
                    id="pj-type-defaut"
                    value={typeDefaut}
                    onChange={(e) => setTypeDefaut(e.target.value as TypePieceJointe)}
                    disabled={enCours}
                    className="text-[11px] bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-asina-500"
                  >
                    {ORDRE_TYPES_PIECE_JOINTE.map((t) => (
                      <option key={t} value={t}>
                        {LIBELLES_TYPE_PIECE_JOINTE[t]}
                      </option>
                    ))}
                  </select>

                  <label className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-asina-600 hover:bg-asina-700 text-white cursor-pointer transition">
                    + Ajouter un fichier
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      hidden
                      disabled={enCours}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        ajouterPiece({ fichier: f, typePieceJointe: typeDefaut });
                      }}
                    />
                  </label>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  PDF, JPG ou PNG — 10 Mo maximum. Le type de chaque pièce peut être ajusté
                  individuellement après ajout.
                </p>
              </div>
            </div>
          )}
        </div>
      }
      pied={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={precedent}
            disabled={enCours || etape === 1}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 cursor-pointer"
          >
            {etape === 1 ? "" : "Retour"}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFermer}
              disabled={enCours}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            {etape < 3 ? (
              <button
                type="button"
                onClick={suivant}
                disabled={!peutContinuer || enCours}
                className="px-4 py-2 text-xs font-bold text-white bg-asina-600 rounded-lg hover:bg-asina-700 disabled:opacity-50 cursor-pointer"
              >
                {libelleEtape}
              </button>
            ) : (
              <button
                type="button"
                onClick={valider}
                disabled={enCours}
                className="px-4 py-2 text-xs font-bold text-white bg-asina-600 rounded-lg hover:bg-asina-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {enCours && <Calendar className="h-3.5 w-3.5 animate-spin" />}
                {enCours ? "Enregistrement…" : "Enregistrer"}
              </button>
            )}
          </div>
        </div>
      }
    />
  );
};

export default ModaleActeExterne;