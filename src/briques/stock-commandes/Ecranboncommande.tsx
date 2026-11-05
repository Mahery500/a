import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText, Mail } from "lucide-react";
import { messageErreur } from "../stock-commun/api";
import { lienGmail, telechargerBonCommande } from "./Boncommande";

const BTN =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-bold transition md:h-10 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40 disabled:cursor-not-allowed disabled:opacity-50";
const BTN_PRIMAIRE = `${BTN} border border-[#1f9d55] bg-[#1f9d55] text-white hover:bg-[#14703c]`;
const BTN_SECONDAIRE = `${BTN} border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa]`;

export interface EcranBonCommandeProps {
  commandeId: number;
  numero: string;
  fournisseurNom: string;
  fournisseurEmail?: string | null;
  fournisseurContact?: string | null;
  onTerminer: () => void;
}

export const EcranBonCommande: React.FC<EcranBonCommandeProps> = ({
  commandeId,
  numero,
  fournisseurNom,
  fournisseurEmail,
  fournisseurContact,
  onTerminer,
}) => {
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const urlGmail = lienGmail({
    email: fournisseurEmail,
    numero,
    fournisseur: fournisseurNom,
    contact: fournisseurContact,
  });

  const telecharger = async () => {
    setOccupe(true);
    setErreur(null);
    try {
      await telechargerBonCommande(commandeId, numero);
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de générer le bon de commande."));
    } finally {
      setOccupe(false);
    }
  };

  /** Ouvre Gmail tout de suite (geste utilisateur, sinon bloqué), puis télécharge le PDF. */
  const telechargerEtOuvrirGmail = async () => {
    window.open(urlGmail, "_blank", "noopener");
    await telecharger();
  };

  return (
    <div className="space-y-4 text-sm text-[#1f2937]">
      <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#1f9d55]" aria-hidden="true" />
        <h3 className="mt-2 text-base font-bold">Commande enregistrée</h3>
        <p className="mt-1 text-[#5b6472]">
          Bon de commande <strong className="text-[#1f2937]">{numero}</strong> · {fournisseurNom}
        </p>
      </section>

      {!fournisseurEmail && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-[10px] bg-[#fff4e0] px-3 py-2 text-xs font-medium text-[#8a5300]"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Ce fournisseur n'a pas d'adresse email enregistrée : Gmail s'ouvrira sans destinataire.
            Vous pourrez la saisir à la main.
          </span>
        </div>
      )}

      <section className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-[.05em] text-[#5b6472]">
          Envoyer le bon au fournisseur
        </h4>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={telechargerEtOuvrirGmail} disabled={occupe} className={BTN_PRIMAIRE}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Télécharger le PDF et ouvrir Gmail
          </button>
          <button type="button" onClick={telecharger} disabled={occupe} className={BTN_SECONDAIRE}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Télécharger le bon (PDF)
          </button>
        </div>

        <p className="mt-3 flex items-start gap-2 text-xs text-[#5b6472]">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Gmail s'ouvre avec le destinataire, l'objet et le message déjà remplis. Glissez le PDF
            téléchargé dans le mail (Gmail ne permet pas de le joindre automatiquement), puis envoyez.
          </span>
        </p>

        {erreur && (
          <p role="alert" className="mt-2 text-xs font-medium text-[#b42318]">
            {erreur}
          </p>
        )}
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={onTerminer} className={BTN_SECONDAIRE}>
          Terminer
        </button>
      </div>
    </div>
  );
};

export default EcranBonCommande;