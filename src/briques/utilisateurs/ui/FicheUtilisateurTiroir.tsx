/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { LIBELLES_DOMAINE_SERVICE } from "@/briques/services/modele/service.types";
import { affectationsApi } from "@/briques/affectations/api/affectations.api";
import { detecterIncompatibiliteAffectation } from "@/briques/affectations/modele/compatibilite";
import type { AffectationPersonnel } from "@/briques/affectations/modele/affectation.types";
import { UtilisateurCompte } from "../modele/utilisateur.types";
import { useDonneesAffectation } from "../hooks/useDonneesAffectation";
import { TiroirLateral } from "./TiroirLateral";
import {
  ChampsAffectation,
  ValeurAffectation,
  affectationVide,
  aujourdhuiIso,
} from "./ChampsAffectation";
import { BTN, BTN_PRIMAIRE, PUCE } from "./stylesFormulaire";

export interface FicheUtilisateurTiroirProps {
  ouvert: boolean;
  compte: UtilisateurCompte | null;
  onFermer: () => void;
  onModifierCompte: (compte: UtilisateurCompte) => void;
  lectureSeule?: boolean;
}

type Onglet = "profil" | "affectation" | "historique";

const formaterDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

const veille = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

const finAvant = (dateEffet: string, debutAffectation: string): string => {
  const f = veille(dateEffet);
  return f >= debutAffectation ? f : debutAffectation;
};

const Champ: React.FC<{ libelle: string; children: React.ReactNode }> = ({ libelle, children }) => (
  <div>
    <span className="text-[13px] text-[#5b6472]">{libelle}</span>
    <div className="font-bold text-[13px] mt-0.5">{children}</div>
  </div>
);

export const FicheUtilisateurTiroir: React.FC<FicheUtilisateurTiroirProps> = ({
  ouvert,
  compte,
  onFermer,
  onModifierCompte,
  lectureSeule = false,
}) => {
  const notif = useNotifier();
  const estAdmin = compte?.typeCompte === "admin";

  const [onglet, setOnglet] = useState<Onglet>("affectation");
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [chg, setChg] = useState<ValeurAffectation>(affectationVide());
  const [enCours, setEnCours] = useState(false);
  const [erreurChg, setErreurChg] = useState<string | null>(null);

  const donnees = useDonneesAffectation(ouvert && !!compte && !estAdmin);

  useEffect(() => {
    if (!ouvert || !compte) return;
    setOnglet(compte.typeCompte === "admin" ? "profil" : "affectation");
    setPanneauOuvert(false);
    setChg(affectationVide());
    setErreurChg(null);
  }, [ouvert, compte?.id, compte?.typeCompte]); // eslint-disable-line react-hooks/exhaustive-deps

  const aujourdhui = aujourdhuiIso();

  /**
   * ⚠️ Les affectations sont indexées par `staffId`, pas par `userId`.
   * On utilise donc `compte.idApi` (staff id) et jamais `compte.id` (user id).
   */
  const staffId = compte?.idApi ?? null;

  const { courante, precedentes } = useMemo(() => {
    if (!staffId) return { courante: null, precedentes: [] as AffectationPersonnel[] };
    const siennes = donnees.affectations
      .filter((a) => a.staffId === staffId)
      .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
    const enCoursOuAVenir = (a: AffectationPersonnel) =>
      a.actif && (!a.dateFin || a.dateFin >= aujourdhui);
    const cour = siennes.find(enCoursOuAVenir) ?? null;
    return { courante: cour, precedentes: siennes.filter((a) => a !== cour) };
  }, [donnees.affectations, staffId, aujourdhui]);

  const serviceCourant = useMemo(
    () =>
      courante
        ? (donnees.optionsServices.find((s) => s.serviceId === courante.serviceId) ?? null)
        : null,
    [courante, donnees.optionsServices],
  );

  const serviceChoisi = useMemo(
    () => donnees.optionsServices.find((s) => String(s.serviceId) === chg.serviceId) ?? null,
    [donnees.optionsServices, chg.serviceId],
  );

  const incompatibilite = useMemo(() => {
    if (!compte || !serviceChoisi) return null;
    return detecterIncompatibiliteAffectation(
      {
        nomComplet: `${compte.prenom} ${compte.nom}`.trim() || compte.login,
        estMedical: !!compte.personnelMedical,
        corpsMedicalLibelle: compte.personnelMedical?.corpsMedicalLibelle ?? null,
      },
      serviceChoisi,
    );
  }, [compte, serviceChoisi]);

  if (!ouvert || !compte) return null;

  const nomAffiche = compte.prenom || compte.nom ? `${compte.prenom} ${compte.nom}`.trim() : compte.login;
  const initiales =
    compte.prenom && compte.nom
      ? `${compte.prenom.charAt(0)}${compte.nom.charAt(0)}`.toUpperCase()
      : compte.login.slice(0, 2).toUpperCase();
  const pm = compte.personnelMedical;

  const onglets: { id: Onglet; libelle: string }[] = [
    { id: "profil", libelle: "Profil" },
    ...(!estAdmin
      ? [
          { id: "affectation" as Onglet, libelle: "Affectation" },
          { id: "historique" as Onglet, libelle: `Historique (${precedentes.length})` },
        ]
      : []),
  ];

  const ouvrirPanneau = () => {
    setChg(affectationVide());
    setErreurChg(null);
    setPanneauOuvert(true);
  };

  const cloturer = async () => {
    if (!courante || !staffId) return;
    if (
      !window.confirm(
        `Clôturer l’affectation de ${nomAffiche} au service « ${courante.nomService} » ?\n\n` +
          "Sans affectation active, le compte n’aura plus accès à l’application.",
      )
    ) {
      return;
    }

    setEnCours(true);
    try {
      await affectationsApi.modifier(courante.id, {
        staffId,
        serviceId: courante.serviceId,
        dateDebut: courante.dateDebut,
        dateFin: finAvant(aujourdhuiIso(), courante.dateDebut),
        estPrincipal: courante.estPrincipal,
        actif: false,
      });
      notif.succes(`Affectation de ${nomAffiche} clôturée.`);
      await donnees.recharger();
    } catch (err) {
      notif.erreur(messageErreur(err, "Échec de la clôture de l’affectation."));
    } finally {
      setEnCours(false);
    }
  };

  const validerChangement = async () => {
    if (!staffId) return;
    setErreurChg(null);

    if (!chg.siteId) return setErreurChg("Veuillez choisir un établissement.");
    if (!chg.serviceId) return setErreurChg("Veuillez choisir un service.");
    if (!chg.dateDebut) return setErreurChg("La date de prise de fonction est obligatoire.");
    if (chg.dateFin && chg.dateFin < chg.dateDebut) {
      return setErreurChg("La date de fin ne peut pas être antérieure à la date de début.");
    }
    if (incompatibilite) return setErreurChg(`Affectation impossible. ${incompatibilite}`);
    if (courante && Number(chg.serviceId) === courante.serviceId) {
      return setErreurChg("Ce service est déjà l’affectation actuelle de cet agent.");
    }

    setEnCours(true);
    let ancienneCloturee = false;
    try {
      if (courante) {
        await affectationsApi.modifier(courante.id, {
          staffId,
          serviceId: courante.serviceId,
          dateDebut: courante.dateDebut,
          dateFin: finAvant(chg.dateDebut, courante.dateDebut),
          estPrincipal: courante.estPrincipal,
          actif: false,
        });
        ancienneCloturee = true;
      }

      try {
        await affectationsApi.creer({
          staffId,
          serviceId: Number(chg.serviceId),
          dateDebut: chg.dateDebut,
          dateFin: chg.dateFin || null,
          estPrincipal: chg.estPrincipal,
        });
      } catch (err) {
        if (courante && ancienneCloturee) {
          try {
            await affectationsApi.modifier(courante.id, {
              staffId,
              serviceId: courante.serviceId,
              dateDebut: courante.dateDebut,
              dateFin: courante.dateFin ?? null,
              estPrincipal: courante.estPrincipal,
              actif: true,
            });
          } catch {
            notif.erreur(
              "La nouvelle affectation a échoué et l’ancienne n’a pas pu être rouverte : vérifiez la fiche.",
            );
          }
        }
        throw err;
      }

      notif.succes(
        courante
          ? `${nomAffiche} est désormais affecté(e) à ce nouveau service.`
          : `${nomAffiche} a été affecté(e).`,
      );
      setPanneauOuvert(false);
      await donnees.recharger();
    } catch (err) {
      setErreurChg(messageErreur(err, "Échec de l’enregistrement de l’affectation."));
    } finally {
      setEnCours(false);
    }
  };

  const puceDomaine = (domaine: string | null | undefined) => {
    if (!domaine) return null;
    const medical = domaine === "MEDICAL" || domaine === "MEDICO_TECHNIQUE";
    return (
      <span
        className={`${PUCE} ml-1.5 ${
          medical ? "bg-[#eef2ff] text-[#3730a3]" : "bg-[#f0f2f1] text-[#5b6472]"
        }`}
      >
        {LIBELLES_DOMAINE_SERVICE[domaine as keyof typeof LIBELLES_DOMAINE_SERVICE]}
      </span>
    );
  };

  const listePrecedentes = (
    <section className="bg-white border border-[#e5e7eb] rounded-[14px] p-4">
      <b className="text-base">Affectations précédentes</b>
      {precedentes.length === 0 ? (
        <p className="m-0 mt-2 text-[13px] text-[#5b6472]">Aucune affectation précédente.</p>
      ) : (
        <ul className="m-0 mt-1 p-0 list-none">
          {precedentes.map((a, i) => (
            <li
              key={a.id}
              className={`py-3 flex justify-between gap-3 text-[13px] ${
                i < precedentes.length - 1 ? "border-b border-[#f0f2f1]" : ""
              }`}
            >
              <span>
                <b>{a.nomService}</b>
                <br />
                <span className="text-[#5b6472]">{a.nomSite}</span>
              </span>
              <span className="text-right text-[#5b6472]">
                {a.dateFin
                  ? `${formaterDate(a.dateDebut)} au ${formaterDate(a.dateFin)}`
                  : `Depuis le ${formaterDate(a.dateDebut)}`}
                <br />
                <span className={`${PUCE} mt-1 bg-[#f0f2f1] text-[#5b6472]`}>Clôturée</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={enCours}
      libelle={`Fiche de ${nomAffiche}`}
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="px-6 pt-5 border-b border-[#f0f2f1]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className={`h-12 w-12 shrink-0 rounded-[10px] grid place-items-center text-[15px] font-bold ${
                  estAdmin ? "bg-[#f3e8ff] text-[#6b21a8]" : "bg-[#e7f6ed] text-[#14703c]"
                }`}
              >
                {initiales}
              </div>
              <div className="min-w-0">
                <h2 className="m-0 text-[19px] font-bold truncate">{nomAffiche}</h2>
                <small className="text-[#5b6472]">
                  {compte.email || "Sans email"} ·{" "}
                  <span className="font-mono text-xs font-bold bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px]">
                    {compte.login}
                  </span>
                </small>
              </div>
            </div>
            <button
              type="button"
              onClick={onFermer}
              disabled={enCours}
              aria-label="Fermer"
              className="h-9 w-9 shrink-0 grid place-items-center border border-[#e5e7eb] rounded-[10px] text-[#5b6472] bg-white hover:bg-[#fafbfa] cursor-pointer transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 mb-1 flex flex-wrap gap-1.5">
            <span
              className={`${PUCE} ${
                estAdmin ? "bg-[#f3e8ff] text-[#6b21a8]" : "bg-[#e7f6ed] text-[#14703c]"
              }`}
            >
              {estAdmin ? "Admin" : "Personnel"}
            </span>
            {pm && (
              <span className={`${PUCE} bg-[#e7f6ed] text-[#14703c]`}>
                {pm.corpsMedicalLibelle || pm.corpsMedicalCode}
              </span>
            )}
            <span className={`${PUCE} bg-[#f0f2f1] text-[#5b6472]`}>
              {compte.actif ? "Compte actif" : "Compte inactif"}
            </span>
          </div>

          <div role="tablist" className="mt-2 flex">
            {onglets.map((o) => {
              const actif = onglet === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="tab"
                  aria-selected={actif}
                  onClick={() => setOnglet(o.id)}
                  className={`px-1 py-3 mr-6 text-sm cursor-pointer border-b-2 transition-colors ${
                    actif
                      ? "text-[#14703c] font-bold border-[#1f9d55]"
                      : "text-[#5b6472] border-transparent hover:text-[#1f2937]"
                  }`}
                >
                  {o.libelle}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-3.5 bg-[#f6f8f7]">
          {/* PROFIL */}
          {onglet === "profil" && (
            <section className="bg-white border border-[#e5e7eb] rounded-[14px] p-4">
              <b className="text-base">Informations du compte</b>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Champ libelle="Prénom">{compte.prenom || "—"}</Champ>
                <Champ libelle="Nom">{compte.nom || "—"}</Champ>
                <Champ libelle="Identifiant">{compte.login}</Champ>
                <Champ libelle="Email">{compte.email || "—"}</Champ>
                <Champ libelle="Rôle">{compte.libelleRole}</Champ>
                <Champ libelle="Type de compte">{estAdmin ? "Administrateur" : "Personnel"}</Champ>
                <Champ libelle="Statut">{compte.actif ? "Actif" : "Inactif"}</Champ>
                <Champ libelle="Créé le">{formaterDate(compte.dateCreation)}</Champ>
              </div>

              {pm && (
                <>
                  <hr className="my-4 border-0 border-t border-[#f0f2f1]" />
                  <b className="text-base">Profil médical</b>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <Champ libelle="Corps médical">{pm.corpsMedicalLibelle || pm.corpsMedicalCode}</Champ>
                    <Champ libelle="Spécialité">{pm.specialiteLibelle || pm.specialiteCode || "Aucune"}</Champ>
                    <Champ libelle="Début d’exercice">{formaterDate(pm.dateDebutExercice)}</Champ>
                    <Champ libelle="Fin d’exercice">
                      {pm.dateFinExercice ? formaterDate(pm.dateFinExercice) : "Non définie"}
                    </Champ>
                  </div>
                </>
              )}
            </section>
          )}

          {/* AFFECTATION */}
          {onglet === "affectation" && !estAdmin && (
            <>
              {donnees.erreur && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs">
                  {donnees.erreur}
                </div>
              )}

              <section className="bg-white border border-[#e5e7eb] rounded-[14px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <b className="text-base">Affectation actuelle</b>
                  {courante && (
                    <span className={`${PUCE} bg-[#e7f6ed] text-[#14703c]`}>
                      {courante.dateDebut > aujourdhui ? "À venir" : "Active"}
                    </span>
                  )}
                </div>

                {donnees.chargement && !courante ? (
                  <p className="m-0 text-[13px] text-[#5b6472]">Chargement de l’affectation…</p>
                ) : courante ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <Champ libelle="Site">{courante.nomSite}</Champ>
                      <Champ libelle="Service">
                        {courante.nomService}
                        {puceDomaine(serviceCourant?.domaine)}
                      </Champ>
                      <Champ libelle="Prise de fonction">{formaterDate(courante.dateDebut)}</Champ>
                      <Champ libelle="Date de fin">
                        {courante.dateFin ? formaterDate(courante.dateFin) : "Non définie"}
                      </Champ>
                    </div>
                    {courante.estPrincipal && (
                      <div className="mt-3.5">
                        <span className={`${PUCE} bg-[#e7f6ed] text-[#14703c]`}>
                          Affectation principale
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="m-0 text-[13px] text-[#5b6472]">
                    Aucune affectation active. Sans affectation, ce compte n’a pas accès à l’application.
                  </p>
                )}

                {!lectureSeule && !panneauOuvert && !donnees.chargement && (
                  <div className="flex gap-2 mt-4">
                    <button type="button" onClick={ouvrirPanneau} disabled={enCours} className={BTN}>
                      {courante ? "Changer de service" : "Affecter à un service"}
                    </button>
                    {courante && (
                      <button
                        type="button"
                        onClick={cloturer}
                        disabled={enCours}
                        className={`${BTN} text-[#b42318]`}
                      >
                        {enCours ? "Clôture…" : "Clôturer l’affectation"}
                      </button>
                    )}
                  </div>
                )}

                {panneauOuvert && (
                  <div className="mt-4 pt-4 border-t border-[#f0f2f1] flex flex-col gap-3.5">
                    <b className="text-sm">{courante ? "Changer de service" : "Affecter à un service"}</b>
                    {courante && (
                      <p className="m-0 text-xs text-[#5b6472]">
                        L’affectation actuelle sera clôturée la veille de la nouvelle prise de fonction.
                      </p>
                    )}

                    {erreurChg && (
                      <div role="alert" className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs">
                        {erreurChg}
                      </div>
                    )}

                    <ChampsAffectation
                      valeur={chg}
                      onChange={(m) => {
                        setChg((p) => ({ ...p, ...m }));
                        setErreurChg(null);
                      }}
                      optionsSites={donnees.optionsSites}
                      optionsServices={donnees.optionsServices}
                      chargement={donnees.chargement}
                      incompatibilite={incompatibilite}
                      desactive={enCours}
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPanneauOuvert(false)}
                        disabled={enCours}
                        className={BTN}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={validerChangement}
                        disabled={enCours || Boolean(incompatibilite)}
                        className={BTN_PRIMAIRE}
                      >
                        {enCours ? "Enregistrement…" : "Valider l’affectation"}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {listePrecedentes}
            </>
          )}

          {onglet === "historique" && !estAdmin && listePrecedentes}
        </div>

        <div className="px-6 py-3.5 border-t border-[#e5e7eb] flex justify-between bg-white">
          <button type="button" onClick={onFermer} disabled={enCours} className={BTN}>
            Fermer
          </button>
          {!lectureSeule && (
            <button
              type="button"
              onClick={() => onModifierCompte(compte)}
              disabled={enCours}
              className={BTN_PRIMAIRE}
            >
              Modifier le compte
            </button>
          )}
        </div>
      </div>
    </TiroirLateral>
  );
};

export default FicheUtilisateurTiroir;