// stock-dispensation/PanneauStockDispensation.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  X,
  Search,
  Pill,
  Clock,
  UserRound,
  CalendarDays,
  Hash,
  AlertTriangle,
  Info,
  Package,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Hourglass,
  ListFilter,
} from "lucide-react";
import type { ModeAffichage } from "@/cerveau/permissions";
import { stockApi, messageErreur } from "@/briques/stock-commun/api";
import { useListe } from "@/briques/stock-commun/useListe";
import { Badge, Erreur, formatDate } from "@/briques/stock-commun/ui";
import type { Prescription, StatutPrescription } from "@/briques/stock-commun/types";

const libelles: Record<StatutPrescription, { t: string; ton: "orange" | "vert" | "rouge" }> = {
  en_attente: { t: "En attente", ton: "orange" },
  dispensee: { t: "Dispensée", ton: "vert" },
  annulee: { t: "Annulée", ton: "rouge" },
};

// Classes complètes (pas de concaténation) pour que Tailwind les détecte
const barreStatut: Record<StatutPrescription, string> = {
  en_attente: "bg-orange-500",
  dispensee: "bg-emerald-500",
  annulee: "bg-rose-400",
};

const iconeOnglet = {
  en_attente: Hourglass,
  dispensee: CheckCircle2,
  annulee: XCircle,
  tous: ListFilter,
} as const;

// Pastille de compteur de l'onglet actif, selon le filtre
const badgeOngletActif = {
  en_attente: "bg-orange-100 text-orange-700",
  dispensee: "bg-emerald-100 text-emerald-700",
  annulee: "bg-rose-100 text-rose-700",
  tous: "bg-orange-100 text-orange-700",
} as const;

// Avatars multicolores (couleur stable par patient)
const palette = [
  "bg-sky-50 text-sky-700 border-sky-200/70",
  "bg-violet-50 text-violet-700 border-violet-200/70",
  "bg-teal-50 text-teal-700 border-teal-200/70",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/70",
  "bg-indigo-50 text-indigo-700 border-indigo-200/70",
  "bg-orange-50 text-orange-700 border-orange-200/70",
  "bg-lime-50 text-lime-700 border-lime-200/70",
  "bg-cyan-50 text-cyan-700 border-cyan-200/70",
];

const couleurAvatar = (p: Prescription) => {
  const s = `${p.patientNom ?? ""}${p.patientPrenom ?? ""}${p.patientMatricule ?? ""}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

const onglets = ["en_attente", "dispensee", "annulee", "tous"] as const;

const initiales = (p: Prescription) =>
  `${p.patientPrenom?.[0] ?? ""}${p.patientNom?.[0] ?? ""}`.toUpperCase() || "?";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export const PanneauStockDispensation: React.FC<{ mode: ModeAffichage; siteActifId?: number }> = ({
  mode,
  siteActifId,
}) => {
  const { items, erreur, recharger } = useListe<Prescription>(stockApi.prescriptions);
  const [filtre, setFiltre] = useState<StatutPrescription | "tous">("en_attente");
  const [recherche, setRecherche] = useState("");
  const [selId, setSelId] = useState<number | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmAnnul, setConfirmAnnul] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const champRef = useRef<HTMLInputElement>(null);
  const editable = mode === "edition";

  const compteurs = useMemo(() => {
    const c: Record<string, number> = {
      tous: items.length,
      en_attente: 0,
      dispensee: 0,
      annulee: 0,
    };
    items.forEach((p) => {
      c[p.statut] = (c[p.statut] ?? 0) + 1;
    });
    return c;
  }, [items]);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return items.filter((p) => {
      if (filtre !== "tous" && p.statut !== filtre) return false;
      if (!q) return true;
      return `${p.patientNom} ${p.patientPrenom} ${p.patientMatricule}`.toLowerCase().includes(q);
    });
  }, [items, filtre, recherche]);

  const selection = items.find((p) => p.id === selId) ?? null;

  const totalUnites = useMemo(
    () => (selection ? selection.details.reduce((s, d) => s + (Number(d.qtePrescrite) || 0), 0) : 0),
    [selection]
  );

  // Raccourci "/" pour focaliser la recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      const saisie =
        cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA" || cible.isContentEditable);
      if (e.key === "/" && !saisie) {
        e.preventDefault();
        champRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fermeture de la modale avec Échap
  useEffect(() => {
    if (!confirmAnnul) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !occupe && setConfirmAnnul(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmAnnul, occupe]);

  const choisir = (id: number) => {
    setSelId(id);
    setMessage(null);
    // Sur mobile, le détail est sous la liste : on y amène l'utilisateur
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const agir = async (action: "dispenser" | "annuler") => {
    if (!selection) return;
    if (action === "dispenser" && !siteActifId)
      return setMessage("Sélectionnez un site avant de dispenser.");
    setOccupe(true);
    setMessage(null);
    try {
      if (action === "dispenser") await stockApi.dispenser(selection.id, siteActifId!);
      else await stockApi.annulerPrescription(selection.id);
      await recharger();
      setConfirmAnnul(false);
    } catch (e) {
      setMessage(messageErreur(e));
      setConfirmAnnul(false);
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ───────── Barre d'outils : filtres (gauche) + recherche (droite) ───────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Filtres (contrôle segmenté) */}
        <div className="-mx-1 overflow-x-auto px-1">
          <div
            role="tablist"
            aria-label="Filtrer par statut"
            className="inline-flex gap-1 rounded-xl border border-orange-200 bg-orange-50 p-1"
          >
            {onglets.map((f) => {
              const actif = filtre === f;
              const Icone = iconeOnglet[f];
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={actif}
                  onClick={() => setFiltre(f)}
                  className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                    actif
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-orange-800/70 hover:bg-white/70 hover:text-orange-800"
                  }`}
                >
                  <Icone className={`h-4 w-4 ${actif ? "text-white" : "text-orange-400"}`} />
                  {f === "tous" ? "Toutes" : libelles[f].t}
                  <span
                    className={`min-w-[1.5rem] rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums ${
                      actif ? "bg-white text-orange-700" : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {compteurs[f] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recherche */}
        <div className="group relative w-full lg:w-96">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400 transition group-focus-within:text-orange-600" />
          <input
            ref={champRef}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setRecherche("")}
            placeholder="Rechercher par patient ou matricule…"
            aria-label="Rechercher une prescription"
            className="h-10 w-full rounded-xl border border-orange-300 bg-white pl-10 pr-14 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
          <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center">
            {recherche ? (
              <button
                type="button"
                onClick={() => {
                  setRecherche("");
                  champRef.current?.focus();
                }}
                aria-label="Effacer la recherche"
                className="rounded-lg p-1.5 text-orange-400 transition hover:bg-orange-50 hover:text-orange-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-500 sm:inline-block">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      <Erreur message={erreur} />

      <div className="grid items-start gap-5 lg:grid-cols-5">
        {/* ───────── Liste ───────── */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-500">
              {pluriel(visibles.length, "prescription")}
            </p>
            {recherche && (
              <button
                onClick={() => setRecherche("")}
                className="text-[11px] font-semibold text-orange-700 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <ul className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
            {visibles.map((p) => {
              const actif = selId === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choisir(p.id)}
                    aria-pressed={actif}
                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3 pl-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                      actif
                        ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-900/10"
                        : "border-orange-100 bg-white hover:border-orange-300 hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-1 ${barreStatut[p.statut] ?? "bg-orange-300"}`}
                      aria-hidden
                    />
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${couleurAvatar(p)}`}
                    >
                      {initiales(p)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {p.patientNom} {p.patientPrenom}
                        </span>
                        <Badge
                          texte={libelles[p.statut]?.t ?? p.statut}
                          ton={libelles[p.statut]?.ton}
                        />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-0.5 truncate">
                          <Hash className="h-3 w-3 text-orange-400" />
                          {p.patientMatricule}
                        </span>
                        <span className="text-orange-200">•</span>
                        <span className="whitespace-nowrap">{formatDate(p.datePrescription)}</span>
                        <span className="text-orange-200">•</span>
                        <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                          <Pill className="h-3 w-3 text-orange-400" />
                          {p.details.length}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        actif
                          ? "translate-x-0.5 text-orange-600"
                          : "text-orange-200 group-hover:text-orange-400"
                      }`}
                    />
                  </button>
                </li>
              );
            })}

            {visibles.length === 0 && (
              <li className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/60 px-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-100 bg-white shadow-sm">
                  <Pill className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Aucune prescription</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {recherche ? "Essayez une autre recherche." : "Rien à afficher pour ce filtre."}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* ───────── Détail ───────── */}
        <div ref={detailRef} className="scroll-mt-4 lg:sticky lg:top-4 lg:col-span-3">
          {!selection ? (
            <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-orange-300 bg-orange-50/60 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-orange-100 bg-white shadow-sm">
                <UserRound className="h-7 w-7 text-orange-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Aucune prescription sélectionnée</p>
                <p className="mx-auto mt-0.5 max-w-xs text-xs text-slate-500">
                  Choisissez une prescription dans la liste pour voir son détail et la dispenser.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm">
              {/* En-tête patient (sans contour) */}
              <div className="flex items-center gap-3.5 bg-orange-50 p-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-base font-bold ${couleurAvatar(selection)}`}
                >
                  {initiales(selection)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold leading-tight text-slate-900">
                    {selection.patientNom} {selection.patientPrenom}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-2 py-0.5">
                      <Hash className="h-3 w-3 text-orange-400" />
                      {selection.patientMatricule}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-2 py-0.5">
                      <CalendarDays className="h-3 w-3 text-orange-400" />
                      {formatDate(selection.datePrescription)}
                    </span>
                  </div>
                </div>
                <Badge
                  texte={libelles[selection.statut]?.t ?? selection.statut}
                  ton={libelles[selection.statut]?.ton}
                />
              </div>

              {/* Médicaments */}
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <Package className="h-3.5 w-3.5" />
                    </span>
                    Médicaments prescrits
                  </h4>
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
                    {pluriel(selection.details.length, "ligne")}
                  </span>
                </div>

                <ul className="space-y-2">
                  {selection.details.map((d, i) => (
                    <li
                      key={d.id ?? i}
                      className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white p-3 transition hover:border-orange-300 hover:bg-orange-50/40"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">{d.produitNom}</div>
                        {(d.posologie || d.dureeJours) && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                            <span>
                              {d.posologie}
                              {d.posologie && d.dureeJours ? " · " : ""}
                              {d.dureeJours ? `${d.dureeJours} j` : ""}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="rounded-lg bg-orange-600 px-2.5 py-1 text-sm font-bold tabular-nums text-white shadow-sm">
                        × {d.qtePrescrite}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Récapitulatif */}
                <div className="mt-3 flex items-center justify-between rounded-xl border border-orange-200/70 bg-orange-50 px-4 py-2.5 text-xs">
                  <span className="font-medium text-orange-800/70">Total à dispenser</span>
                  <span className="text-sm font-bold tabular-nums text-orange-700">
                    {pluriel(totalUnites, "unité")}
                  </span>
                </div>

                {/* Alertes */}
                {editable && selection.statut === "en_attente" && !siteActifId && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Sélectionnez un site actif pour pouvoir dispenser cette prescription.</p>
                  </div>
                )}
                {message && (
                  <div className="mt-3">
                    <Erreur message={message} />
                  </div>
                )}
              </div>

              {/* Actions */}
              {editable && selection.statut === "en_attente" && (
                <div className="flex flex-col-reverse gap-2 border-t border-orange-100 bg-orange-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    disabled={occupe}
                    onClick={() => setConfirmAnnul(true)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Annuler la prescription
                  </button>
                  <button
                    type="button"
                    disabled={occupe || !siteActifId}
                    onClick={() => agir("dispenser")}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-600/25 transition hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {occupe ? "Traitement…" : "Dispenser"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ───────── Modale de confirmation d'annulation ───────── */}
      {confirmAnnul && selection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !occupe && setConfirmAnnul(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="titre-annulation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="titre-annulation" className="text-base font-bold text-slate-900">
                  Annuler cette prescription ?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  La prescription de{" "}
                  <span className="font-semibold text-slate-800">
                    {selection.patientNom} {selection.patientPrenom}
                  </span>{" "}
                  sera marquée comme annulée. Cette action est définitive.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={occupe}
                onClick={() => setConfirmAnnul(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={occupe}
                onClick={() => agir("annuler")}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {occupe ? "Annulation…" : "Oui, annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PanneauStockDispensation;
