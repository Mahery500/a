
import React, { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  MoreHorizontal,
  Edit2,
  Power,
  Eye,
} from "lucide-react";
import { ModeAffichage } from "@/cerveau/permissions/types";
import { ModaleConfirmationSuppression } from "@/noyau/ui/ModaleConfirmationSuppression";
import {
  UtilisateurCompte,
  ROLES_SYMFONY_DISPONIBLES,
} from "../modele/utilisateur.types";
import { useUtilisateurs } from "../hooks/useUtilisateurs";
import { FormulaireUtilisateurModale } from "./FormulaireUtilisateurModale";
import { FormulaireEditionUtilisateurModale } from "./FormulaireEditionUtilisateurModale";
import { FicheUtilisateurTiroir } from "./FicheUtilisateurTiroir";

export interface PanneauUtilisateursProps {
  mode?: ModeAffichage;
}

const CARTE = "bg-white border border-[#e5e7eb] rounded-[14px]";

const CHAMP =
  "h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] focus:outline-hidden focus:border-[#1f9d55]";

const PUCE = "inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ml-1.5";

// ------------------------------------------------------------------
// Tokens visuels mobile
// ------------------------------------------------------------------

const MOBILE_CHIP_NAVY = "bg-[#0f1b3d] text-white";
const MOBILE_CHIP_GREEN = "bg-[#e7f6ed] text-[#14703c]";

const MOBILE_MONO =
  "font-mono text-[12px] font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px]";

const MOBILE_SWITCH_ON =
  "relative w-[34px] h-5 rounded-full bg-[#1f9d55] shrink-0";

const MOBILE_SWITCH_OFF =
  "relative w-[34px] h-5 rounded-full bg-[#d1d5db] shrink-0";

interface MenuActions {
  compte: UtilisateurCompte;
  top: number;
  right: number;
}

/** Identité composite pour retrouver un compte sans ambiguïté. */
type CleFiche = {
  typeCompte: "admin" | "personnel";
  id: number;
};

// ------------------------------------------------------------------
// Carte utilisateur mobile
// ------------------------------------------------------------------

interface CarteUtilisateurMobileProps {
  u: UtilisateurCompte;
  lectureSeule: boolean;
  onOuvrirFiche: () => void;
  onBasculer: () => void;
  onOuvrirMenu: (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => void;
}

const CarteUtilisateurMobile: React.FC<CarteUtilisateurMobileProps> = ({
  u,
  lectureSeule,
  onOuvrirFiche,
  onBasculer,
  onOuvrirMenu,
}) => {
  const estAdmin = u.typeCompte === "admin";
  const pm = u.personnelMedical;

  const initiales =
    u.prenom || u.nom
      ? `${u.prenom?.charAt(0) ?? ""}${u.nom?.charAt(0) ?? ""}`.toUpperCase()
      : u.login.slice(0, 2).toUpperCase();

  return (
    <div
      className={`bg-white border border-[#e5e7eb] rounded-[14px] p-3 px-3.5 flex gap-3 items-center ${
        u.actif ? "" : "opacity-60"
      }`}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        className={`w-9 h-9 shrink-0 rounded-[10px] grid place-items-center text-xs font-bold ${
          estAdmin
            ? "bg-[#0f1b3d] text-white"
            : "bg-[#e7f6ed] text-[#14703c]"
        }`}
      >
        {initiales}
      </div>

      {/* Informations utilisateur */}
      <button
        type="button"
        onClick={onOuvrirFiche}
        className="flex-1 min-w-0 text-left cursor-pointer"
        title="Voir la fiche"
      >
        <div className="text-sm font-bold truncate">
          {u.prenom || u.nom
            ? `${u.prenom ?? ""} ${u.nom ?? ""}`.trim()
            : u.login}
        </div>

        <div className="text-xs text-[#5b6472] mt-px mb-1.5 truncate">
          {u.email || "Sans email"}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Rôle */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
              estAdmin ? MOBILE_CHIP_NAVY : MOBILE_CHIP_GREEN
            }`}
          >
            {u.libelleRole}
          </span>

          {/* Corps médical */}
          {pm && (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-bold ${MOBILE_CHIP_GREEN}`}
            >
              {pm.corpsMedicalLibelle || pm.corpsMedicalCode}
            </span>
          )}

          {/* Identifiant */}
          <span className={MOBILE_MONO}>
            {u.login}
          </span>
        </div>
      </button>

      {/* Statut et actions */}
      <div className="flex flex-col items-center shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={u.actif}
          aria-label={`${
            u.actif ? "Désactiver" : "Activer"
          } le compte ${u.login}`}
          disabled={lectureSeule}
          onClick={onBasculer}
          className={`${
            u.actif ? MOBILE_SWITCH_ON : MOBILE_SWITCH_OFF
          } ${
            lectureSeule ? "cursor-default" : "cursor-pointer"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
              u.actif ? "left-4" : "left-0.5"
            }`}
          />
        </button>

        <span
          className={`text-[11px] font-bold mt-0.5 ${
            u.actif ? "text-[#14703c]" : "text-[#5b6472]"
          }`}
        >
          {u.actif ? "Actif" : "Inactif"}
        </span>

        {!lectureSeule && (
          <button
            type="button"
            onClick={onOuvrirMenu}
            aria-label={`Actions pour ${u.login}`}
            aria-haspopup="menu"
            className="w-9 h-9 grid place-items-center rounded-[10px] text-[#5b6472] hover:bg-[#f0f2f1] cursor-pointer"
          >
            <MoreHorizontal
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Panneau utilisateurs
// ------------------------------------------------------------------

export const PanneauUtilisateurs: React.FC<PanneauUtilisateursProps> = ({
  mode = "edition",
}) => {
  const estModeLectureSeule = mode === "lecture";

  const {
    comptes,
    comptesTous,
    chargement,
    erreur,
    stats,
    recherche,
    setRecherche,
    filtreType,
    setFiltreType,
    filtreStatut,
    setFiltreStatut,
    filtreRole,
    setFiltreRole,
    recharger,
    creerAdmin,
    creerPersonnel,
    modifierCompte,
    basculerStatut,
    supprimerCompte,
  } = useUtilisateurs();

  const [modalCreationOuverte, setModalCreationOuverte] =
    useState(false);

  const [compteEnEdition, setCompteEnEdition] =
    useState<UtilisateurCompte | null>(null);

  const [compteASupprimer, setCompteASupprimer] =
    useState<UtilisateurCompte | null>(null);

  const [suppressionEnCours, setSuppressionEnCours] =
    useState(false);

  const [menu, setMenu] = useState<MenuActions | null>(null);

  const [ficheSelection, setFicheSelection] =
    useState<CleFiche | null>(null);

  const compteFiche = ficheSelection
    ? comptesTous.find(
        (c) =>
          c.typeCompte === ficheSelection.typeCompte &&
          c.id === ficheSelection.id,
      ) ?? null
    : null;

  // Fermeture automatique du menu contextuel
  useEffect(() => {
    if (!menu) return;

    const fermer = () => setMenu(null);

    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };

    window.addEventListener("scroll", fermer, true);
    window.addEventListener("resize", fermer);
    window.addEventListener("keydown", surTouche);

    return () => {
      window.removeEventListener("scroll", fermer, true);
      window.removeEventListener("resize", fermer);
      window.removeEventListener("keydown", surTouche);
    };
  }, [menu]);

  if (mode === "masque") return null;

  const initialesUtilisateur = (u: UtilisateurCompte) => {
    if (u.prenom && u.nom) {
      return `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();
    }

    if (u.login) {
      return u.login.substring(0, 2).toUpperCase();
    }

    return "US";
  };

  const handleConfirmerSuppression = async () => {
    if (!compteASupprimer) return;

    setSuppressionEnCours(true);

    try {
      if (await supprimerCompte(compteASupprimer)) {
        setCompteASupprimer(null);
      }
    } finally {
      setSuppressionEnCours(false);
    }
  };

  const ouvrirMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    u: UtilisateurCompte,
  ) => {
    const r = e.currentTarget.getBoundingClientRect();

    setMenu({
      compte: u,
      top: r.bottom + 4,
      right: window.innerWidth - r.right,
    });
  };

  const pilulesFiltre: {
    cle: "tous" | "personnel" | "admin";
    libelle: string;
    n: number;
  }[] = [
    { cle: "tous", libelle: "Tous", n: stats.total },
    { cle: "personnel", libelle: "Personnel", n: stats.personnel },
    { cle: "admin", libelle: "Admins", n: stats.admins },
  ];

  const statistiques = [
    { valeur: stats.total, libelle: "Utilisateurs" },
    { valeur: stats.personnel, libelle: "Personnel soignant" },
    { valeur: stats.admins, libelle: "Administrateurs" },
    { valeur: stats.actifs, libelle: "Comptes actifs" },
  ];

  return (
    <div className="space-y-3.5 text-[#1f2937]">
      {/* En-tête */}
      <section className={CARTE}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
          <div>
            <h1 className="m-0 text-[22px] font-bold leading-tight">
              Comptes utilisateurs
            </h1>

            <p className="mt-0.5 mb-0 text-[13px] text-[#5b6472]">
              Accès applicatifs, rôles cliniques et habilitations de sécurité.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recharger}
              disabled={chargement}
              title="Rafraîchir"
              aria-label="Rafraîchir la liste"
              className="h-10 w-10 grid place-items-center border border-[#e5e7eb] rounded-[10px] bg-white text-[#5b6472] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  chargement ? "animate-spin text-[#1f9d55]" : ""
                }`}
              />
            </button>

            {!estModeLectureSeule && (
              <button
                type="button"
                onClick={() => setModalCreationOuverte(true)}
                className="h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#1f9d55] bg-[#1f9d55] text-white hover:bg-[#14703c] hover:border-[#14703c] cursor-pointer transition"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau compte</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="flex flex-wrap border-t border-[#f0f2f1]">
          {statistiques.map((s) => (
            <div
              key={s.libelle}
              className="flex-1 min-w-[140px] px-5 py-3 text-xs text-[#5b6472] border-r border-[#f0f2f1] last:border-r-0"
            >
              <b className="block text-[19px] text-[#1f2937]">
                {s.valeur}
              </b>
              {s.libelle}
            </div>
          ))}
        </div>
      </section>

      {/* Filtres + liste des comptes */}
      <section className={`${CARTE} overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
          {pilulesFiltre.map((p) => {
            const actif = filtreType === p.cle;

            return (
              <button
                key={p.cle}
                type="button"
                onClick={() => setFiltreType(p.cle)}
                className={`px-3.5 py-1.5 text-[13px] rounded-full border cursor-pointer transition ${
                  actif
                    ? "border-[#1f9d55] bg-[#e7f6ed] text-[#14703c] font-bold"
                    : "border-[#e5e7eb] bg-white text-[#5b6472] hover:bg-[#fafbfa]"
                }`}
              >
                {p.libelle} ({p.n})
              </button>
            );
          })}

          <input
            type="search"
            aria-label="Rechercher"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par identifiant, nom, prénom ou email…"
            className={`${CHAMP} flex-1 min-w-[220px]`}
          />

          <select
            aria-label="Filtrer par rôle"
            value={filtreRole}
            onChange={(e) => setFiltreRole(e.target.value)}
            className={CHAMP}
          >
            <option value="tous">Tous les rôles</option>

            {ROLES_SYMFONY_DISPONIBLES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.libelle}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrer par statut"
            value={filtreStatut}
            onChange={(e) =>
              setFiltreStatut(
                e.target.value as "tous" | "actifs" | "inactifs",
              )
            }
            className={CHAMP}
          >
            <option value="tous">Tous les statuts</option>
            <option value="actifs">Actifs uniquement</option>
            <option value="inactifs">Inactifs uniquement</option>
          </select>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="mx-5 mb-3.5 p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-rose-700 text-xs flex items-center justify-between">
            <span>{erreur}</span>

            <button
              type="button"
              onClick={recharger}
              className="font-bold underline cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Chargement */}
        {chargement ? (
          <div className="p-12 text-center text-[#5b6472] border-t border-[#e5e7eb]">
            <div className="flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-[#1f9d55]" />
              <span className="text-[13px]">
                Chargement des comptes utilisateurs...
              </span>
            </div>
          </div>
        ) : comptes.length === 0 ? (
          /* État vide */
          <div className="p-12 text-center text-[#5b6472] text-[13px] border-t border-[#e5e7eb]">
            {comptesTous.length === 0
              ? "Aucun utilisateur répertorié dans la base."
              : "Aucun utilisateur ne correspond aux filtres appliqués."}
          </div>
        ) : (
          <>
            {/* ------------------------------------------------ */}
            {/* Vue TABLEAU : desktop et tablette >= md */}
            {/* ------------------------------------------------ */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {[
                      "Utilisateur",
                      "Identifiant",
                      "Rôle et spécialité",
                      "Statut",
                    ].map((t) => (
                      <th
                        key={t}
                        className="bg-[#fafbfa] text-left px-5 h-10 text-[11px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-t border-[#e5e7eb] whitespace-nowrap"
                      >
                        {t}
                      </th>
                    ))}

                    {!estModeLectureSeule && (
                      <th className="bg-[#fafbfa] w-14 px-5 h-10 border-b border-t border-[#e5e7eb]">
                        <span className="sr-only">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {comptes.map((u) => {
                    const estAdmin = u.typeCompte === "admin";
                    const pm = u.personnelMedical;
                    const attenue = u.actif ? "" : "opacity-60";

                    return (
                      <tr
                        key={`${u.typeCompte}-${u.id}`}
                        className="hover:bg-[#fafbfa] transition-colors"
                      >
                        {/* Utilisateur */}
                        <td
                          className={`h-[54px] px-5 border-b border-[#f0f2f1] ${attenue}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setFicheSelection({
                                typeCompte: u.typeCompte,
                                id: u.id,
                              })
                            }
                            title="Voir la fiche"
                            className="group flex items-center gap-3 text-left cursor-pointer"
                          >
                            <div
                              aria-hidden="true"
                              className="h-9 w-9 shrink-0 rounded-[10px] bg-[#e7f6ed] text-[#14703c] grid place-items-center text-xs font-bold select-none"
                            >
                              {initialesUtilisateur(u)}
                            </div>

                            <div className="min-w-0">
                              <b className="block font-bold group-hover:underline">
                                {u.prenom || u.nom
                                  ? `${u.prenom} ${u.nom}`
                                  : u.login}
                              </b>

                              <small className="text-xs text-[#5b6472]">
                                {u.email || "Sans email"}
                              </small>
                            </div>
                          </button>
                        </td>

                        {/* Identifiant */}
                        <td
                          className={`h-[54px] px-5 border-b border-[#f0f2f1] ${attenue}`}
                        >
                          <span className="font-mono text-xs font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px]">
                            {u.login}
                          </span>
                        </td>

                        {/* Rôle et spécialité */}
                        <td
                          className={`h-[54px] px-5 border-b border-[#f0f2f1] whitespace-nowrap ${attenue}`}
                        >
                          {u.libelleRole}

                          <span
                            className={`${PUCE} ${
                              estAdmin
                                ? "bg-[#f3e8ff] text-[#6b21a8]"
                                : "bg-[#e7f6ed] text-[#14703c]"
                            }`}
                          >
                            {estAdmin ? "Admin" : "Personnel"}
                          </span>

                          {pm && (
                            <span
                              className={`${PUCE} bg-[#e7f6ed] text-[#14703c]`}
                              title={`${pm.corpsMedicalLibelle}${
                                pm.specialiteLibelle
                                  ? " · " + pm.specialiteLibelle
                                  : ""
                              }`}
                            >
                              {pm.corpsMedicalLibelle || pm.corpsMedicalCode}
                              {pm.specialiteLibelle
                                ? ` · ${pm.specialiteLibelle}`
                                : pm.specialiteCode
                                  ? ` · ${pm.specialiteCode}`
                                  : ""}
                            </span>
                          )}
                        </td>

                        {/* Statut */}
                        <td className="h-[54px] px-5 border-b border-[#f0f2f1]">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={u.actif}
                            aria-label={`${
                              u.actif ? "Désactiver" : "Activer"
                            } le compte ${u.login}`}
                            disabled={estModeLectureSeule}
                            onClick={() => basculerStatut(u)}
                            className={`inline-flex items-center gap-2.5 text-xs font-bold ${
                              u.actif
                                ? "text-[#14703c]"
                                : "text-[#5b6472]"
                            } ${
                              estModeLectureSeule
                                ? "cursor-default"
                                : "cursor-pointer"
                            }`}
                          >
                            <span
                              className={`relative h-5 w-[34px] rounded-full transition-colors ${
                                u.actif
                                  ? "bg-[#1f9d55]"
                                  : "bg-[#d1d5db]"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                                  u.actif ? "left-4" : "left-0.5"
                                }`}
                              />
                            </span>

                            {u.actif ? "Actif" : "Inactif"}
                          </button>
                        </td>

                        {/* Actions */}
                        {!estModeLectureSeule && (
                          <td className="h-[54px] px-5 border-b border-[#f0f2f1]">
                            <button
                              type="button"
                              aria-label={`Actions pour ${u.login}`}
                              aria-haspopup="menu"
                              onClick={(e) => ouvrirMenu(e, u)}
                              className="h-9 w-9 grid place-items-center border border-[#e5e7eb] rounded-[10px] text-[#5b6472] bg-white hover:bg-[#fafbfa] cursor-pointer transition"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ------------------------------------------------ */}
            {/* Vue CARTES : mobile < md */}
            {/* ------------------------------------------------ */}
            <div className="md:hidden flex flex-col gap-3 px-4 pb-24 pt-3">
              {comptes.map((u) => (
                <CarteUtilisateurMobile
                  key={`${u.typeCompte}-${u.id}`}
                  u={u}
                  lectureSeule={estModeLectureSeule}
                  onOuvrirFiche={() =>
                    setFicheSelection({
                      typeCompte: u.typeCompte,
                      id: u.id,
                    })
                  }
                  onBasculer={() => basculerStatut(u)}
                  onOuvrirMenu={(e) => ouvrirMenu(e, u)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ------------------------------------------------ */}
      {/* FAB mobile : Nouveau compte */}
      {/* ------------------------------------------------ */}
      {!estModeLectureSeule && (
        <button
          type="button"
          onClick={() => setModalCreationOuverte(true)}
          className="md:hidden fixed right-4 bottom-20 z-30 h-[52px] pl-5 pr-5 rounded-full bg-[#1f9d55] text-white text-sm font-bold inline-flex items-center gap-2 shadow-[0_6px_16px_rgba(31,157,85,.35)] cursor-pointer"
        >
          <Plus
            className="w-[18px] h-[18px]"
            aria-hidden="true"
          />
          Nouveau compte
        </button>
      )}

      {/* ------------------------------------------------ */}
      {/* Menu contextuel */}
      {/* ------------------------------------------------ */}
      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
          />

          <div
            role="menu"
            style={{
              top: menu.top,
              right: menu.right,
            }}
            className="fixed z-50 w-52 bg-white border border-[#e5e7eb] rounded-xl shadow-lg py-1.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setFicheSelection({
                  typeCompte: menu.compte.typeCompte,
                  id: menu.compte.id,
                });
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-[#5b6472]" />
              Voir la fiche
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setCompteEnEdition(menu.compte);
                setMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-[#5b6472]" />
              Modifier
            </button>

            {menu.compte.actif ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setCompteASupprimer(menu.compte);
                  setMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#b42318] hover:bg-rose-50 cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" />
                Désactiver le compte
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  basculerStatut(menu.compte);
                  setMenu(null);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-[#14703c] hover:bg-[#e7f6ed] cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" />
                Réactiver le compte
              </button>
            )}
          </div>
        </>
      )}

      {/* Fiche utilisateur */}
      <FicheUtilisateurTiroir
        ouvert={compteFiche !== null}
        compte={compteFiche}
        onFermer={() => setFicheSelection(null)}
        onModifierCompte={(c) => {
          setFicheSelection(null);
          setCompteEnEdition(c);
        }}
        lectureSeule={estModeLectureSeule}
      />

      {/* Création utilisateur */}
      <FormulaireUtilisateurModale
        ouvert={modalCreationOuverte}
        onFermer={() => setModalCreationOuverte(false)}
        onCreerAdmin={creerAdmin}
        onCreerPersonnel={creerPersonnel}
      />

      {/* Modification utilisateur */}
      <FormulaireEditionUtilisateurModale
        ouvert={compteEnEdition !== null}
        compte={compteEnEdition}
        onFermer={() => setCompteEnEdition(null)}
        onModifier={modifierCompte}
      />

      {/* Confirmation désactivation */}
      <ModaleConfirmationSuppression
        ouvert={compteASupprimer !== null}
        onFermer={() => setCompteASupprimer(null)}
        onConfirmer={handleConfirmerSuppression}
        enCours={suppressionEnCours}
        titre="Désactiver le compte"
        message="Voulez-vous désactiver ce compte ? Le collaborateur ne pourra plus se connecter, mais son dossier et son historique seront conservés."
        nomElement={compteASupprimer?.login}
      />
    </div>
  );
};

export default PanneauUtilisateurs;
