import React, { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, ScanLine, Paperclip, Trash2, Download, Upload, Loader2, X } from "lucide-react";
import { useNotifier } from "@/noyau/notifications";
import { extraireMessageErreur } from "@/noyau/utils/erreur";
import { formaterDateHeure } from "@/noyau/utils/dates";
import type { PieceJointeItem, TypePieceJointe } from "../modele/consultation-active.types";

const ICONES: Record<TypePieceJointe, React.ReactNode> = {
  compte_rendu: <FileText className="h-4 w-4 text-sky-600" />,
  image: <ImageIcon className="h-4 w-4 text-emerald-600" />,
  scan: <ScanLine className="h-4 w-4 text-violet-600" />,
  autre: <Paperclip className="h-4 w-4 text-slate-500" />,
};

const LIBELLES: Record<TypePieceJointe, string> = {
  compte_rendu: "Compte-rendu",
  image: "Image",
  scan: "Scan",
  autre: "Autre",
};

const formaterTaille = (n: number): string => {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
};

export interface SectionPiecesJointesProps {
  resultatId: number;
  estModifiable: boolean;
  lister: (resultatId: number) => Promise<PieceJointeItem[]>;
  uploader: (resultatId: number, pj: { fichier: File; typePieceJointe: TypePieceJointe }) => Promise<PieceJointeItem>;
  changerStatut: (id: number, statut: "actif" | "saisi_par_erreur") => Promise<PieceJointeItem>;
  telecharger: (id: number) => Promise<Blob>;
}

export const SectionPiecesJointes: React.FC<SectionPiecesJointesProps> = ({
  resultatId,
  estModifiable,
  lister,
  uploader,
  changerStatut,
  telecharger,
}) => {
  const { notifierSucces, notifierErreur } = useNotifier();
  const [pieces, setPieces] = useState<PieceJointeItem[]>([]);
  const [chargement, setChargement] = useState(false);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [typeChoisi, setTypeChoisi] = useState<TypePieceJointe>("compte_rendu");

  const recharger = async () => {
    setChargement(true);
    try {
      setPieces(await lister(resultatId));
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    void recharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultatId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    setUploadEnCours(true);
    try {
      await uploader(resultatId, { fichier, typePieceJointe: typeChoisi });
      notifierSucces(`Pièce jointe « ${fichier.name} » ajoutée.`);
      await recharger();
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    } finally {
      setUploadEnCours(false);
    }
  };

  const handleTelecharger = async (pj: PieceJointeItem) => {
    try {
      const blob = await telecharger(pj.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pj.nomFichier;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  const handleMarquerErreur = async (pj: PieceJointeItem) => {
    if (!window.confirm(`Marquer « ${pj.nomFichier} » comme saisi par erreur ?`)) return;
    try {
      await changerStatut(pj.id, "saisi_par_erreur");
      notifierSucces("Pièce jointe archivée.");
      await recharger();
    } catch (err) {
      notifierErreur(extraireMessageErreur(err));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-slate-500" />
          Pièces jointes ({pieces.filter((p) => p.statut === "actif").length})
        </h4>

        {estModifiable && (
          <div className="flex items-center gap-2">
            <select
              value={typeChoisi}
              onChange={(e) => setTypeChoisi(e.target.value as TypePieceJointe)}
              disabled={uploadEnCours}
              className="text-[11px] bg-white border border-slate-300 rounded-lg px-2 py-1 focus:outline-none"
            >
              {(Object.keys(LIBELLES) as TypePieceJointe[]).map((t) => (
                <option key={t} value={t}>{LIBELLES[t]}</option>
              ))}
            </select>
            <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition ${
              uploadEnCours
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-asina-600 hover:bg-asina-700 text-white"
            }`}>
              {uploadEnCours ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Téléverser
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                hidden
                disabled={uploadEnCours}
                onChange={handleUpload}
              />
            </label>
          </div>
        )}
      </div>

      {chargement && pieces.length === 0 && (
        <p className="text-[11px] text-slate-400 italic">Chargement des pièces jointes…</p>
      )}

      {!chargement && pieces.length === 0 && (
        <p className="text-[11px] text-slate-400 italic">Aucune pièce jointe pour ce résultat.</p>
      )}

      <ul className="space-y-1.5">
        {pieces.map((pj) => {
          const inactif = pj.statut === "saisi_par_erreur";
          return (
            <li
              key={pj.id}
              className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                inactif ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"
              }`}
            >
              {ICONES[pj.typePieceJointe] ?? ICONES.autre}
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${inactif ? "line-through" : "text-slate-900"}`}>
                  {pj.nomFichier}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {LIBELLES[pj.typePieceJointe]} · {formaterTaille(pj.taille)} · {formaterDateHeure(pj.dateUpload)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTelecharger(pj)}
                title="Télécharger"
                className="p-1.5 text-slate-400 hover:text-asina-700 hover:bg-asina-50 rounded cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              {estModifiable && !inactif && (
                <button
                  type="button"
                  onClick={() => handleMarquerErreur(pj)}
                  title="Marquer comme saisi par erreur"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};