// stock-commun/FormulaireFournisseur.tsx
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Loader2, Mail, MapPin, Phone, Truck } from "lucide-react";
import { stockApi, messageErreur } from "../stock-commun/api";
import type * as T from "../stock-commun/types";

type Props = {
  onCree: (f: T.Fournisseur) => void; // pour recharger la liste / sélectionner le nouveau
  onAnnuler: () => void;
};

const CHAMP =
  "w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/40 disabled:bg-gray-50 disabled:opacity-60";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40";

/** Champ avec icône à gauche ; le placeholder tient lieu de libellé. */
const Champ: React.FC<{ icone: ReactNode; children: ReactNode }> = ({ icone, children }) => (
  <div className="relative">
    <span
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-700 [&>svg]:h-4 [&>svg]:w-4"
      aria-hidden="true"
    >
      {icone}
    </span>
    {children}
  </div>
);

export function FormulaireFournisseur({ onCree, onAnnuler }: Props) {
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const valider = async (e?: FormEvent) => {
    e?.preventDefault();
    if (enCours) return;
    if (!nom.trim()) {
      setErreur("Le nom est obligatoire.");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur("Email invalide.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const cree = await stockApi.creerFournisseur({
        nom: nom.trim(),
        telephone: telephone.trim() || null,
        email: email.trim() || null,
        adresse: adresse.trim() || null,
      });
      onCree(cree as T.Fournisseur);
    } catch (err) {
      setErreur(messageErreur(err, "Impossible de créer le fournisseur."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <form
      onSubmit={valider}
      onKeyDown={(e) => e.key === "Escape" && !enCours && onAnnuler()}
      className="space-y-3"
      noValidate
    >
      <Champ icone={<Truck />}>
        <input
          autoFocus
          required
          value={nom}
          onChange={(e) => {
            setNom(e.target.value);
            if (erreur) setErreur(null);
          }}
          placeholder="Nom du fournisseur *"
          aria-label="Nom du fournisseur"
          aria-invalid={erreur === "Le nom est obligatoire."}
          disabled={enCours}
          className={`${CHAMP} font-medium`}
        />
      </Champ>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Champ icone={<Phone />}>
          <input
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="Téléphone"
            aria-label="Téléphone"
            disabled={enCours}
            className={CHAMP}
          />
        </Champ>
        <Champ icone={<Mail />}>
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (erreur) setErreur(null);
            }}
            placeholder="Email"
            aria-label="Email"
            disabled={enCours}
            className={CHAMP}
          />
        </Champ>
      </div>

      <Champ icone={<MapPin />}>
        <input
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Adresse"
          aria-label="Adresse"
          disabled={enCours}
          className={CHAMP}
        />
      </Champ>

      {erreur && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {erreur}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={onAnnuler}
          disabled={enCours}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 ${FOCUS}`}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={enCours || !nom.trim()}
          className={`inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
        >
          {enCours && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
