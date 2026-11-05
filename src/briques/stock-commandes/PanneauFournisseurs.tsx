// stock-commandes/PanneauFournisseurs.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { stockApi, messageErreur } from "../stock-commun/api";
import { useListe } from "../stock-commun/useListe";
import { Erreur, Modal } from "../stock-commun/ui";
import type { Fournisseur } from "../stock-commun/types";

type FournisseurComplet = Fournisseur & {
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
};

/* ---------- Styles (charte ASINA Médical) ---------- */
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f9d55]/40";

const BTN_PRIMAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-[#1f9d55] px-4 text-sm font-bold text-white transition hover:bg-[#14703c] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_SECONDAIRE = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;
const BTN_DANGER = `inline-flex h-12 items-center justify-center gap-1.5 rounded-[10px] bg-[#b42318] px-4 text-sm font-bold text-white transition hover:bg-[#912018] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 ${FOCUS}`;

const CHAMP_BASE =
  "w-full rounded-[10px] border bg-white pl-10 pr-3 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 disabled:bg-[#fafbfa] disabled:opacity-60";
const CHAMP = `${CHAMP_BASE} h-12 md:h-10`;
const BORDURE_OK = "border-[#e5e7eb] focus:border-[#1f9d55]";
const BORDURE_ERR = "border-[#b42318] focus:border-[#b42318]";

const TH =
  "sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#fafbfa] p-3 text-left text-[11px] font-bold uppercase tracking-[.05em] text-[#5b6472]";

const TEL = /^\+?[\d\s().-]{6,}$/;
const MAIL = /^\S+@\S+\.\S+$/;

const sansAccent = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/* ================================================================== *
 * Composants partagés (aussi utilisés par PanneauStockCommandes)
 * ================================================================== */
export interface ActionMenu {
  libelle: string;
  icone?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

/** Menu « ⋯ ». Positionné en `fixed` pour ne jamais être coupé par un tableau qui défile. */
export const MenuActions: React.FC<{ label: string; actions: ActionMenu[] }> = ({
  label,
  actions,
}) => {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const declencheur = useRef<HTMLButtonElement>(null);

  const fermer = () => setPos(null);

  const ouvrir = () => {
    const r = declencheur.current?.getBoundingClientRect();
    if (!r) return;
    const hauteur = actions.length * 48 + 8;
    const placeEnBas = window.innerHeight - r.bottom;
    setPos({
      top: placeEnBas < hauteur + 8 ? Math.max(8, r.top - hauteur - 4) : r.bottom + 4,
      right: Math.max(8, window.innerWidth - r.right),
    });
  };

  useEffect(() => {
    if (!pos) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPos(null);
        declencheur.current?.focus();
      }
    };
    const ferme = () => setPos(null);
    window.addEventListener("keydown", touche);
    window.addEventListener("scroll", ferme, true);
    window.addEventListener("resize", ferme);
    return () => {
      window.removeEventListener("keydown", touche);
      window.removeEventListener("scroll", ferme, true);
      window.removeEventListener("resize", ferme);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={declencheur}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={pos !== null}
        onClick={() => (pos ? fermer() : ouvrir())}
        className={`inline-flex h-12 w-12 items-center justify-center rounded-[10px] text-[#5b6472] transition hover:bg-[#f0f2f1] hover:text-[#1f2937] md:h-10 md:w-10 ${FOCUS}`}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>

      {pos && (
        <>
          <div className="fixed inset-0 z-30" onClick={fermer} />
          <div
            role="menu"
            aria-label={label}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-40 min-w-[210px] overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white py-1 shadow-lg"
          >
            {actions.map((a) => (
              <button
                key={a.libelle}
                type="button"
                role="menuitem"
                disabled={a.disabled}
                onClick={() => {
                  fermer();
                  a.onClick();
                }}
                className={`flex h-12 w-full items-center gap-2.5 px-3.5 text-left text-sm transition disabled:opacity-40 md:h-11 ${FOCUS} ${
                  a.danger
                    ? "font-semibold text-[#b42318] hover:bg-[#fef3f2]"
                    : "text-[#1f2937] hover:bg-[#fafbfa]"
                }`}
              >
                {a.icone}
                {a.libelle}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};

/** Barre de pagination : « 1–10 sur 23 » + précédent / suivant. */
export const Pagination: React.FC<{
  page: number;
  parPage: number;
  total: number;
  onChange: (p: number) => void;
}> = ({ page, parPage, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / parPage));
  const debut = total === 0 ? 0 : (page - 1) * parPage + 1;
  const fin = Math.min(page * parPage, total);
  const btn = `inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white text-[#1f2937] transition hover:bg-[#fafbfa] disabled:cursor-not-allowed disabled:opacity-40 md:h-10 md:w-10 ${FOCUS}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-3">
      <p className="text-xs text-[#5b6472]" aria-live="polite">
        <span className="font-bold tabular-nums text-[#1f2937]">
          {debut}–{fin}
        </span>{" "}
        sur <span className="tabular-nums">{total}</span>
      </p>
      {totalPages > 1 && (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(page - 1, 1))}
            disabled={page === 1}
            aria-label="Page précédente"
            className={btn}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4.5rem] text-center text-xs text-[#5b6472]">
            Page <strong className="tabular-nums text-[#1f2937]">{page}</strong> / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            aria-label="Page suivante"
            className={btn}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ================================================================== *
 * Formulaire fournisseur
 * ================================================================== */
const Champ: React.FC<{
  id: string;
  libelle: string;
  icone: React.ReactNode;
  requis?: boolean;
  erreur?: string | null;
  haut?: boolean;
  children: React.ReactNode;
}> = ({ id, libelle, icone, requis, erreur, haut, children }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-xs font-bold text-[#5b6472]">
      {libelle}
      {requis && (
        <span className="ml-0.5 text-[#b42318]" aria-hidden="true">
          *
        </span>
      )}
    </label>
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-3 text-[#14703c] [&>svg]:h-4 [&>svg]:w-4 ${
          haut ? "top-3" : "top-1/2 -translate-y-1/2"
        }`}
        aria-hidden="true"
      >
        {icone}
      </span>
      {children}
    </div>
    {erreur && (
      <p id={`${id}-err`} role="alert" className="text-xs font-medium text-[#b42318]">
        {erreur}
      </p>
    )}
  </div>
);

const FormulaireFournisseur: React.FC<{
  item: FournisseurComplet | null;
  /** Noms (sans accent, en minuscules) des AUTRES fournisseurs, pour éviter les doublons. */
  existants: string[];
  onAnnuler: () => void;
  onTermine: () => void;
}> = ({ item, existants, onAnnuler, onTermine }) => {
  const [nom, setNom] = useState(item?.nom ?? "");
  const [telephone, setTelephone] = useState(item?.telephone ?? "");
  const [email, setEmail] = useState(item?.email ?? "");
  const [adresse, setAdresse] = useState(item?.adresse ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentative, setTentative] = useState(false);
  const [occupe, setOccupe] = useState(false);

  const erreurs = {
    nom: !nom.trim()
      ? "Le nom du fournisseur est obligatoire."
      : existants.includes(sansAccent(nom))
        ? "Un fournisseur porte déjà ce nom."
        : null,
    telephone:
      telephone.trim() && !TEL.test(telephone.trim())
        ? "Numéro invalide (chiffres, espaces et + - . ( ) uniquement)."
        : null,
    email: email.trim() && !MAIL.test(email.trim()) ? "L'adresse e-mail n'est pas valide." : null,
  };
  const invalide = Object.values(erreurs).some(Boolean);
  const voir = (cle: keyof typeof erreurs) => (tentative ? erreurs[cle] : null);

  const valider = async () => {
    if (occupe) return;
    setTentative(true);
    if (invalide) return;
    const payload = {
      nom: nom.trim(),
      telephone: telephone.trim() || null,
      email: email.trim() || null,
      adresse: adresse.trim() || null,
    };
    setOccupe(true);
    setErreur(null);
    try {
      if (item) await stockApi.modifierFournisseur(item.id, payload);
      else await stockApi.creerFournisseur(payload);
      onTermine();
    } catch (e) {
      setErreur(messageErreur(e, "Le fournisseur n'a pas pu être enregistré."));
    } finally {
      setOccupe(false);
    }
  };

  const touche = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      void valider();
    }
  };

  const classe = (cle: keyof typeof erreurs) =>
    `${CHAMP} ${voir(cle) ? BORDURE_ERR : BORDURE_OK}`;

  return (
    <div className="space-y-4 text-sm text-[#1f2937]" onKeyDown={touche}>
      <Champ id="four-nom" libelle="Nom du fournisseur" icone={<Truck />} requis erreur={voir("nom")}>
        <input
          id="four-nom"
          autoFocus
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Pharmalagasy"
          disabled={occupe}
          aria-invalid={!!voir("nom")}
          aria-describedby={voir("nom") ? "four-nom-err" : undefined}
          className={`${classe("nom")} font-bold`}
        />
      </Champ>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Champ id="four-tel" libelle="Téléphone" icone={<Phone />} erreur={voir("telephone")}>
          <input
            id="four-tel"
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="Ex. 034 12 345 67"
            disabled={occupe}
            aria-invalid={!!voir("telephone")}
            aria-describedby={voir("telephone") ? "four-tel-err" : undefined}
            className={classe("telephone")}
          />
        </Champ>
        <Champ id="four-mail" libelle="E-mail" icone={<Mail />} erreur={voir("email")}>
          <input
            id="four-mail"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex. contact@fournisseur.mg"
            disabled={occupe}
            aria-invalid={!!voir("email")}
            aria-describedby={voir("email") ? "four-mail-err" : undefined}
            className={classe("email")}
          />
        </Champ>
      </div>

      <Champ id="four-adr" libelle="Adresse" icone={<MapPin />} haut>
        <textarea
          id="four-adr"
          rows={2}
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Adresse complète"
          disabled={occupe}
          className={`${CHAMP_BASE} ${BORDURE_OK} min-h-[72px] resize-none py-2.5`}
        />
      </Champ>

      <Erreur message={erreur} />

      <div className="flex flex-col-reverse gap-2 border-t border-[#f0f2f1] pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onAnnuler} disabled={occupe} className={BTN_SECONDAIRE}>
          Annuler
        </button>
        <button type="button" onClick={valider} disabled={occupe} className={BTN_PRIMAIRE}>
          {occupe && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {occupe ? "Enregistrement…" : item ? "Enregistrer les modifications" : "Créer le fournisseur"}
        </button>
      </div>
    </div>
  );
};

/* ================================================================== *
 * Liste
 * ================================================================== */
const Cellule: React.FC<{ valeur?: string | null; href?: string }> = ({ valeur, href }) => {
  if (!valeur) return <span className="text-[#5b6472]">—</span>;
  if (!href) return <span className="block max-w-[260px] truncate text-[#1f2937]">{valeur}</span>;
  return (
    <a
      href={href}
      className={`block max-w-[260px] truncate rounded text-[#1f2937] hover:text-[#14703c] hover:underline ${FOCUS}`}
    >
      {valeur}
    </a>
  );
};

export const PanneauFournisseurs: React.FC<{ editable: boolean }> = ({ editable }) => {
  const { items, chargement, erreur, recharger } = useListe(stockApi.fournisseurs);
  const fournisseurs = items as FournisseurComplet[];
  const [recherche, setRecherche] = useState("");
  const [edition, setEdition] = useState<FournisseurComplet | "nouveau" | null>(null);
  const [aSupprimer, setASupprimer] = useState<FournisseurComplet | null>(null);
  const [suppressionId, setSuppressionId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [pageCourante, setPageCourante] = useState(1);
  const elementsParPage = 8;

  useEffect(() => setPageCourante(1), [recherche]);

  const visibles = useMemo(() => {
    const q = sansAccent(recherche);
    return fournisseurs
      .filter((f) => !q || sansAccent([f.nom, f.telephone, f.email, f.adresse].join(" ")).includes(q))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [fournisseurs, recherche]);

  const totalPages = Math.ceil(visibles.length / elementsParPage) || 1;
  const pageActuelleSecurisee = Math.min(pageCourante, totalPages);
  const elementsPagines = useMemo(() => {
    const debut = (pageActuelleSecurisee - 1) * elementsParPage;
    return visibles.slice(debut, debut + elementsParPage);
  }, [visibles, pageActuelleSecurisee]);

  const existants = useMemo(
    () =>
      fournisseurs
        .filter((f) => edition === "nouveau" || edition === null || f.id !== edition.id)
        .map((f) => sansAccent(f.nom)),
    [fournisseurs, edition],
  );

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    setMessage(null);
    setSuppressionId(aSupprimer.id);
    try {
      await stockApi.supprimerFournisseur(aSupprimer.id);
      await recharger();
    } catch (e) {
      setMessage(
        messageErreur(e, "Suppression impossible (fournisseur utilisé par des commandes ?)."),
      );
    } finally {
      setSuppressionId(null);
      setASupprimer(null);
    }
  };

  const actionsDe = (f: FournisseurComplet): ActionMenu[] => [
    { libelle: "Modifier", icone: <Pencil className="h-4 w-4" />, onClick: () => setEdition(f) },
    {
      libelle: "Supprimer",
      icone: <Trash2 className="h-4 w-4" />,
      danger: true,
      disabled: suppressionId === f.id,
      onClick: () => setASupprimer(f),
    },
  ];

  const lienTel = (t: string) => `tel:${t.replace(/\s+/g, "")}`;

  return (
    <div className="space-y-[14px] text-sm text-[#1f2937]">
      {/* Barre d'outils */}
      <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, téléphone, e-mail, adresse…"
              aria-label="Rechercher un fournisseur"
              className={`h-12 w-full rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-9 text-sm text-[#1f2937] placeholder:text-[#5b6472] transition focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 md:h-10 [&::-webkit-search-cancel-button]:hidden`}
            />
            {recherche && (
              <button
                type="button"
                onClick={() => setRecherche("")}
                aria-label="Effacer la recherche"
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5b6472] hover:bg-[#f0f2f1] hover:text-[#1f2937] ${FOCUS}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <span
            className="inline-flex items-center rounded-full border border-[#e5e7eb] bg-[#f6f8f7] px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#5b6472]"
            aria-live="polite"
          >
            {chargement
              ? "Chargement…"
              : recherche
                ? `${visibles.length} sur ${fournisseurs.length}`
                : `${fournisseurs.length} fournisseur${fournisseurs.length > 1 ? "s" : ""}`}
          </span>

          {editable && (
            <button type="button" onClick={() => setEdition("nouveau")} className={`${BTN_PRIMAIRE} ml-auto`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouveau fournisseur
            </button>
          )}
        </div>
      </div>

      <Erreur message={erreur ?? message} />

      {/* État vide */}
      {!chargement && visibles.length === 0 && (
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6f8f7]">
            <Truck className="h-6 w-6 text-[#5b6472]" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-[#1f2937]">
            {recherche ? "Aucun fournisseur ne correspond à cette recherche." : "Aucun fournisseur enregistré."}
          </p>
          {recherche ? (
            <button type="button" onClick={() => setRecherche("")} className={`${BTN_SECONDAIRE} mt-3`}>
              Effacer la recherche
            </button>
          ) : (
            <>
              <p className="mt-1 text-xs text-[#5b6472]">
                Ajoutez un fournisseur pour pouvoir passer des commandes.
              </p>
              {editable && (
                <button type="button" onClick={() => setEdition("nouveau")} className={`${BTN_PRIMAIRE} mt-3`}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Ajouter un fournisseur
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Tableau (desktop) */}
      {(chargement || visibles.length > 0) && (
        <div className="hidden overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white md:block">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr>
                  <th scope="col" className={TH}>Fournisseur</th>
                  <th scope="col" className={TH}>Téléphone</th>
                  <th scope="col" className={TH}>E-mail</th>
                  {editable && (
                    <th scope="col" className={`${TH} w-16`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f1]">
                {chargement &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={`sk-${i}`} aria-hidden="true" className="h-[54px]">
                      <td className="p-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-[#f0f2f1]" />
                        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-[#f0f2f1]" />
                      </td>
                      <td className="p-3">
                        <div className="h-4 w-28 animate-pulse rounded bg-[#f0f2f1]" />
                      </td>
                      <td className="p-3">
                        <div className="h-4 w-40 animate-pulse rounded bg-[#f0f2f1]" />
                      </td>
                      {editable && <td />}
                    </tr>
                  ))}

                {!chargement &&
                  elementsPagines.map((f) => (
                    <tr key={f.id} className="h-[54px] transition-colors hover:bg-[#fafbfa]">
                      <td className="p-3">
                        <div className="truncate font-bold text-[#1f2937]" title={f.nom}>
                          {f.nom}
                        </div>
                        {f.adresse && (
                          <div className="max-w-[320px] truncate text-xs text-[#5b6472]" title={f.adresse}>
                            {f.adresse}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Cellule valeur={f.telephone} href={f.telephone ? lienTel(f.telephone) : undefined} />
                      </td>
                      <td className="p-3">
                        <Cellule valeur={f.email} href={f.email ? `mailto:${f.email}` : undefined} />
                      </td>
                      {editable && (
                        <td className="p-3">
                          <div className="flex justify-end">
                            <MenuActions label={`Actions pour ${f.nom}`} actions={actionsDe(f)} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cartes (mobile) */}
      {(chargement || visibles.length > 0) && (
        <ul className="space-y-3 md:hidden">
          {chargement &&
            Array.from({ length: 3 }).map((_, i) => (
              <li key={`skm-${i}`} aria-hidden="true" className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
                <div className="h-4 w-40 animate-pulse rounded bg-[#f0f2f1]" />
                <div className="mt-3 h-3 w-28 animate-pulse rounded bg-[#f0f2f1]" />
                <div className="mt-2 h-3 w-48 animate-pulse rounded bg-[#f0f2f1]" />
              </li>
            ))}

          {!chargement &&
            elementsPagines.map((f) => (
              <li key={f.id} className="rounded-[14px] border border-[#e5e7eb] bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[#1f2937]">{f.nom}</div>
                    {f.adresse && (
                      <div className="mt-0.5 flex items-start gap-1.5 text-xs text-[#5b6472]">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{f.adresse}</span>
                      </div>
                    )}
                  </div>
                  {editable && <MenuActions label={`Actions pour ${f.nom}`} actions={actionsDe(f)} />}
                </div>

                {(f.telephone || f.email) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.telephone && (
                      <a
                        href={lienTel(f.telephone)}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm font-semibold text-[#1f2937] ${FOCUS}`}
                      >
                        <Phone className="h-4 w-4 text-[#14703c]" aria-hidden="true" />
                        {f.telephone}
                      </a>
                    )}
                    {f.email && (
                      <a
                        href={`mailto:${f.email}`}
                        className={`inline-flex min-h-[44px] min-w-0 items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-3 text-sm font-semibold text-[#1f2937] ${FOCUS}`}
                      >
                        <Mail className="h-4 w-4 shrink-0 text-[#14703c]" aria-hidden="true" />
                        <span className="truncate">{f.email}</span>
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}

      {!chargement && visibles.length > 0 && (
        <Pagination
          page={pageActuelleSecurisee}
          parPage={elementsParPage}
          total={visibles.length}
          onChange={setPageCourante}
        />
      )}

      {/* Création / modification */}
      {edition && (
        <Modal
          titre={edition === "nouveau" ? "Nouveau fournisseur" : "Modifier le fournisseur"}
          onFermer={() => setEdition(null)}
        >
          <FormulaireFournisseur
            item={edition === "nouveau" ? null : edition}
            existants={existants}
            onAnnuler={() => setEdition(null)}
            onTermine={() => {
              setEdition(null);
              recharger();
            }}
          />
        </Modal>
      )}

      {/* Confirmation de suppression */}
      {aSupprimer && (
        <Modal
          titre="Supprimer le fournisseur"
          onFermer={() => suppressionId === null && setASupprimer(null)}
        >
          <div className="space-y-4 text-sm text-[#1f2937]">
            <p>
              Supprimer <strong>{aSupprimer.nom}</strong> ? Cette action est définitive. Un fournisseur
              déjà utilisé par des commandes ne peut pas être supprimé.
            </p>
            <div className="flex flex-col-reverse gap-2 border-t border-[#f0f2f1] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setASupprimer(null)}
                disabled={suppressionId !== null}
                className={BTN_SECONDAIRE}
              >
                Garder le fournisseur
              </button>
              <button
                type="button"
                onClick={confirmerSuppression}
                disabled={suppressionId !== null}
                className={BTN_DANGER}
              >
                {suppressionId !== null && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default PanneauFournisseurs;