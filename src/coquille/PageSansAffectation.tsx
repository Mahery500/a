import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  Check,
  Copy,
  LogOut,
  RefreshCw,
  UserX,
} from "lucide-react";
import { useSession } from "@/cerveau/session";

/* ------------------------------------------------------------------ *
 * Contrat exposé au shell
 * ------------------------------------------------------------------ */

export interface AffectationAVenir {
  serviceNom: string;
  siteNom: string;
  /** ISO YYYY-MM-DD : date à laquelle l'affectation prend effet. */
  dateDebut: string;
}

export interface PageSansAffectationProps {
  /**
   * Renseigné par le shell quand `/me` indique qu'une affectation existe
   * mais démarre dans le futur. `null`/`undefined` = aucune affectation.
   */
  affectationAVenir?: AffectationAVenir | null;
  /** Libellé du site à afficher dans le bloc "À transmettre". */
  nomEtablissement?: string;
  /**
   * Nombre de secondes entre deux vérifications automatiques.
   * `0` désactive complètement le polling.
   * @default 30
   */
  intervalleRecheckSecondes?: number;
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const formaterDateLongue = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return iso;
  const s = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const joursAvant = (iso: string): number => {
  const cible = new Date(`${iso}T00:00:00`).getTime();
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((cible - auj.getTime()) / 86_400_000));
};

const libelleDelai = (jours: number): string => {
  if (jours === 0) return "aujourd’hui";
  if (jours === 1) return "demain";
  return `dans ${jours} jours`;
};

const heure = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/* ------------------------------------------------------------------ *
 * Composant principal
 * ------------------------------------------------------------------ */

export const PageSansAffectation: React.FC<PageSansAffectationProps> = ({
  affectationAVenir = null,
  nomEtablissement,
  intervalleRecheckSecondes = 30,
}) => {
  const { utilisateur, rafraichirProfil, deconnecter } = useSession();

  const [verification, setVerification] = useState(false);
  const [derniereVerif, setDerniereVerif] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [compteARebours, setCompteARebours] = useState(intervalleRecheckSecondes);

  // Évite les doubles déclenchements pendant un re-check en cours.
  const verifEnCours = useRef(false);
  // Référence stable pour que le setInterval appelle toujours la version courante.
  const verifierRef = useRef<(auto?: boolean) => Promise<void>>();
  // Empêche les re-checks auto quand l'onglet est caché.
  const pageVisible = useRef(true);

  const nomComplet = [utilisateur?.prenom, utilisateur?.nom]
    .filter(Boolean)
    .join(" ")
    .trim();
  const compte = utilisateur?.identifiant || nomComplet || "Utilisateur";
  const etablissement =
    nomEtablissement ||
    (utilisateur?.siteId ? `Site #${utilisateur.siteId}` : "ASINA");

  /* ---------------- Vérifier ---------------- */

  const verifier = useCallback(
    async (auto = false) => {
      if (verifEnCours.current) return;
      verifEnCours.current = true;
      setVerification(true);
      if (!auto) setMessage(null);
      try {
        await rafraichirProfil();
        setDerniereVerif(new Date());
        // Pas besoin d'écrire "aucun changement" : la maquette Aff3 s'affiche
        // dès que derniereVerif n'est plus null.
      } catch {
        setMessage("Impossible de vérifier pour le moment. Réessayez dans un instant.");
      } finally {
        verifEnCours.current = false;
        setVerification(false);
        setCompteARebours(intervalleRecheckSecondes);
      }
    },
    [rafraichirProfil, intervalleRecheckSecondes],
  );

  // Maintient la référence à jour sans recréer le setInterval.
  useEffect(() => {
    verifierRef.current = (auto) => verifier(auto);
  }, [verifier]);

  /* ---------------- Polling automatique ---------------- */

  useEffect(() => {
    if (intervalleRecheckSecondes <= 0) return;

    const onVisibility = () => {
      pageVisible.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();

    const timer = window.setInterval(() => {
      if (!pageVisible.current) return;
      setCompteARebours((n) => {
        if (n <= 1) {
          void verifierRef.current?.(true);
          return intervalleRecheckSecondes;
        }
        return n - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalleRecheckSecondes]);

  /* ---------------- Copier ---------------- */

  const copier = async () => {
    const texte = `Compte : ${compte}\nÉtablissement : ${etablissement}`;
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 1800);
    } catch {
      setMessage("Copie impossible : sélectionnez le texte manuellement.");
    }
  };

  /* ---------------- Rendu ---------------- */

  const aVenir = affectationAVenir !== null;
  const dejaVerifie = derniereVerif !== null;

  return (
    <div className="min-h-screen bg-[#f6f8f7] flex items-center justify-center p-6">
      <div
        role="region"
        aria-label="Statut de l’affectation"
        className="w-full max-w-[520px] bg-white border border-[#e5e7eb] rounded-[14px] p-8 flex flex-col items-center text-center gap-3.5"
      >
        {/* Icône */}
        <div className="w-[60px] h-[60px] rounded-full bg-[#fff4e0] flex items-center justify-center">
          {aVenir ? (
            <CalendarClock className="h-7 w-7 text-[#8a5300]" aria-hidden="true" />
          ) : (
            <UserX className="h-7 w-7 text-[#8a5300]" aria-hidden="true" />
          )}
        </div>

        {/* Pastille de statut */}
        <span className="bg-[#fff4e0] text-[#8a5300] rounded-full font-bold text-xs px-2.5 py-0.5 tracking-wide">
          {aVenir ? "AFFECTATION À VENIR" : "ACCÈS SUSPENDU"}
        </span>

        {/* Titre */}
        <h1 className="text-[22px] font-bold leading-tight text-[#1f2937]">
          {aVenir ? "Votre accès s’ouvrira bientôt" : "Aucune affectation active"}
        </h1>

        {/* Description */}
        <p className="text-sm text-[#5b6472] leading-[1.5]">
          {aVenir
            ? `${nomComplet ? `${nomComplet}, ` : ""}une affectation est enregistrée mais n’a pas encore commencé.`
            : `${nomComplet ? `${nomComplet}, ` : ""}votre compte n’est rattaché à aucun service pour le moment : l’accès à l’application est suspendu.`}
        </p>

        {/* Contenu principal */}
        {aVenir ? (
          <BlocAffectationAVenir affectation={affectationAVenir} />
        ) : (
          <BlocSansAffectation
            dejaVerifie={dejaVerifie}
            derniereVerif={derniereVerif}
            compte={compte}
            etablissement={etablissement}
            copie={copie}
            onCopier={copier}
          />
        )}

        {/* Message d'erreur de vérification */}
        {message && (
          <p role="status" className="text-xs font-medium text-[#8a5300]">
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
          <button
            type="button"
            onClick={() => verifier(false)}
            disabled={verification}
            className="h-10 px-4 rounded-[10px] bg-[#1f9d55] border border-[#1f9d55] text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#14703c] disabled:opacity-60 disabled:cursor-wait cursor-pointer transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${verification ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {verification ? "Vérification en cours…" : "Vérifier à nouveau"}
          </button>

          <button
            type="button"
            onClick={deconnecter}
            className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-[#fafbfa] cursor-pointer transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Se déconnecter
          </button>
        </div>

        {/* Pied */}
        <p className="text-xs text-[#5b6472]" aria-live="polite">
          {dejaVerifie
            ? intervalleRecheckSecondes > 0
              ? `Prochaine vérification automatique dans ${compteARebours} s`
              : `Dernière vérification : ${heure(derniereVerif!)}`
            : "Vérification automatique toutes les 30 s."}
        </p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ *
 * Blocs extraits
 * ------------------------------------------------------------------ */

const BlocAffectationAVenir: React.FC<{ affectation: AffectationAVenir }> = ({
  affectation,
}) => {
  const jours = joursAvant(affectation.dateDebut);
  return (
    <div className="w-full text-left space-y-3">
      <div className="bg-white border border-[#e5e7eb] rounded-[10px] px-4 py-1">
        <Ligne libelle="Service">{affectation.serviceNom}</Ligne>
        <Ligne libelle="Établissement">{affectation.siteNom}</Ligne>
        <Ligne libelle="Début de l’accès">
          <b className="text-[#1f2937]">{formaterDateLongue(affectation.dateDebut)}</b>
          <span className="text-[#5b6472] font-normal"> · {libelleDelai(jours)}</span>
        </Ligne>
      </div>

      <div className="rounded-[10px] border border-[#1f9d55] bg-[#e7f6ed] px-4 py-3 text-[#14703c] text-[13px] font-semibold">
        Aucune action requise : l’accès s’ouvrira automatiquement à cette date.
      </div>
    </div>
  );
};

interface BlocSansAffectationProps {
  dejaVerifie: boolean;
  derniereVerif: Date | null;
  compte: string;
  etablissement: string;
  copie: boolean;
  onCopier: () => void;
}

const BlocSansAffectation: React.FC<BlocSansAffectationProps> = ({
  dejaVerifie,
  derniereVerif,
  compte,
  etablissement,
  copie,
  onCopier,
}) => (
  <div className="w-full text-left space-y-3">
    {/* Aff3 : bandeau "aucun changement" */}
    {dejaVerifie && derniereVerif && (
      <div className="bg-[#fff4e0] border border-[#f3d9a8] text-[#8a5300] rounded-[10px] px-4 py-3 text-[13px] font-semibold">
        Aucun changement : toujours aucune affectation active. Vérifié à{" "}
        {heure(derniereVerif)}.
      </div>
    )}

    {/* Aff1 : "Que faire ?" */}
    <div className="bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px] px-4 py-3.5">
      <div className="font-bold text-[13px] text-[#1f2937] mb-1">Que faire ?</div>
      <Etape n={1}>
        Contactez un administrateur pour qu’il vous affecte à un service.
      </Etape>
      <Etape n={2}>Revenez ici et cliquez sur « Vérifier à nouveau ».</Etape>
    </div>

    {/* Aff1 : bloc "À transmettre" */}
    <div className="bg-white border border-[#e5e7eb] rounded-[10px] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#5b6472] uppercase tracking-wide">
          À transmettre à l’administrateur
        </span>
        <button
          type="button"
          onClick={onCopier}
          className="inline-flex items-center gap-1.5 text-[#14703c] text-[13px] font-bold cursor-pointer transition-colors hover:text-[#0f5a30]"
        >
          {copie ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Copié
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copier
            </>
          )}
        </button>
      </div>
      <Ligne libelle="Compte">{compte}</Ligne>
      <Ligne libelle="Établissement">{etablissement}</Ligne>
    </div>
  </div>
);

/* ------------------------------------------------------------------ *
 * Petits atomes
 * ------------------------------------------------------------------ */

const Ligne: React.FC<{ libelle: string; children: React.ReactNode }> = ({
  libelle,
  children,
}) => (
  <div className="flex gap-3 py-2 border-t border-[#f0f2f1] first:border-t-0">
    <span className="w-[130px] shrink-0 text-[12px] font-bold text-[#5b6472]">
      {libelle}
    </span>
    <span className="flex-1 text-[13px] text-[#1f2937] min-w-0">{children}</span>
  </div>
);

const Etape: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <div className="flex gap-2.5 py-1.5 text-[13px] text-[#1f2937]">
    <span className="w-[22px] h-[22px] rounded-full bg-[#1f9d55] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
    <span>{children}</span>
  </div>
);

export default PageSansAffectation;