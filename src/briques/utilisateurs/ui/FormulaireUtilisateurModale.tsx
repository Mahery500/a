/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from "react";
import { useReferentielsHabilitations } from "@/noyau/referentiels/habilitations";
import { detecterIncompatibiliteAffectation } from "@/briques/affectations/modele/compatibilite";
import {
  NouveauCompteAdminInput,
  NouveauComptePersonnelInput,
  AffectationInitiale,
  ROLES_PERSONNEL,
  ROLES_MEDICALES,
  CORPS_PAR_ROLE,
} from "../modele/utilisateur.types";
import { useDonneesAffectation } from "../hooks/useDonneesAffectation";
import { TiroirLateral } from "./TiroirLateral";
import {
  ChampsAffectation,
  ValeurAffectation,
  affectationVide,
} from "./ChampsAffectation";
import { LABEL, CHAMP, AIDE, BTN, BTN_PRIMAIRE, PUCE, Requis } from "./stylesFormulaire";

export interface FormulaireUtilisateurModaleProps {
  ouvert: boolean;
  onFermer: () => void;
  onCreerAdmin: (saisie: NouveauCompteAdminInput) => Promise<boolean>;
  onCreerPersonnel: (saisie: NouveauComptePersonnelInput) => Promise<boolean>;
}

// Regex exacte imposée par le backend Symfony (CreateStaffRequest / ResetPasswordRequest)
const REGEX_MDP_SYMFONY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Etape = 1 | 2 | 3 | 4;

const ETAPES: { numero: Etape; libelle: string }[] = [
  { numero: 1, libelle: "Type de compte" },
  { numero: 2, libelle: "Identité et accès" },
  { numero: 3, libelle: "Fonction et profil" },
  { numero: 4, libelle: "Affectation" },
];

export const FormulaireUtilisateurModale: React.FC<FormulaireUtilisateurModaleProps> = ({
  ouvert,
  onFermer,
  onCreerAdmin,
  onCreerPersonnel,
}) => {
  const [etape, setEtape] = useState<Etape>(1);
  const [typeCompte, setTypeCompte] = useState<"personnel" | "admin">("personnel");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState<string>("ROLE_MEDECIN");
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  // Profil médical (visible uniquement pour les rôles médicaux)
  const [corpsMedicalId, setCorpsMedicalId] = useState<string>("");
  const [specialiteId, setSpecialiteId] = useState<string>("");
  const [dateDebutExercice, setDateDebutExercice] = useState<string>("");
  const [dateEnErreur, setDateEnErreur] = useState(false);

  // Affectation (étape 4, personnel uniquement)
  const [aff, setAff] = useState<ValeurAffectation>(affectationVide());

  const { corpsMedicaux, specialites, chargement, erreur } = useReferentielsHabilitations();

  const estMedical = useMemo(
    () => typeCompte === "personnel" && ROLES_MEDICALES.includes(role),
    [typeCompte, role],
  );

  // Les référentiels d'affectation sont préchargés dès l'étape 3
  const donnees = useDonneesAffectation(ouvert && typeCompte === "personnel" && etape >= 3);

  const etapesAffichees = typeCompte === "personnel" ? ETAPES : ETAPES.slice(0, 3);
  const derniereEtape: Etape = typeCompte === "personnel" ? 4 : 3;

  /* ------------------------------------------------------------------ *
   * Incompatibilité profil médical / domaine du service
   * ------------------------------------------------------------------ */
  const serviceChoisi = useMemo(
    () => donnees.optionsServices.find((s) => String(s.serviceId) === aff.serviceId) ?? null,
    [donnees.optionsServices, aff.serviceId],
  );

  const incompatibilite = useMemo(() => {
    if (typeCompte !== "personnel") return null;
    const corps = corpsMedicaux.find((c) => String(c.id) === corpsMedicalId);
    return detecterIncompatibiliteAffectation(
      {
        nomComplet: `${prenom.trim()} ${nom.trim().toUpperCase()}`.trim(),
        estMedical,
        corpsMedicalLibelle: corps?.libelle ?? null,
      },
      serviceChoisi,
    );
  }, [typeCompte, prenom, nom, estMedical, corpsMedicaux, corpsMedicalId, serviceChoisi]);

  /* ------------------------------------------------------------------ *
   * Remise à zéro à chaque ouverture du tiroir
   * ------------------------------------------------------------------ */
  const reinitialiser = () => {
    setEtape(1);
    setTypeCompte("personnel");
    setPrenom("");
    setNom("");
    setLogin("");
    setEmail("");
    setTelephone("");
    setMotDePasse("");
    setAfficherMdp(false);
    setRole("ROLE_MEDECIN");
    setCorpsMedicalId("");
    setSpecialiteId("");
    setDateDebutExercice("");
    setDateEnErreur(false);
    setAff(affectationVide());
    setErreurValidation(null);
  };

  useEffect(() => {
    if (ouvert) reinitialiser();
  }, [ouvert]);

  /* ------------------------------------------------------------------ *
   * Pré-sélection intelligente du corps médical selon le rôle choisi.
   * Ne touche pas à la spécialité (choix explicite de l'utilisateur).
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!estMedical) {
      setCorpsMedicalId("");
      return;
    }

    const codeAttendu = CORPS_PAR_ROLE[role];
    if (!codeAttendu) return;

    const corps = corpsMedicaux.find((c) => c.code === codeAttendu);
    setCorpsMedicalId(corps ? String(corps.id) : "");
  }, [role, estMedical, corpsMedicaux, ouvert]);

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  const normaliser = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const suggererLogin = (nouveauPrenom: string, nouveauNom: string) => {
    const p = normaliser(nouveauPrenom);
    const n = normaliser(nouveauNom);
    if (p && n) {
      setLogin(`${p}.${n}`);
    } else if (p) {
      setLogin(p);
    } else if (n) {
      setLogin(n);
    }
  };

  const genererMotDePasseConforme = () => {
    const minuscules = "abcdefghjkmnpqrstuvwxyz";
    const majuscules = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const chiffres = "23456789";
    const speciaux = "@$!%*?&";

    let mdp = "";
    mdp += majuscules.charAt(Math.floor(Math.random() * majuscules.length));
    mdp += minuscules.charAt(Math.floor(Math.random() * minuscules.length));
    mdp += minuscules.charAt(Math.floor(Math.random() * minuscules.length));
    mdp += minuscules.charAt(Math.floor(Math.random() * minuscules.length));
    mdp += speciaux.charAt(Math.floor(Math.random() * speciaux.length));
    mdp += chiffres.charAt(Math.floor(Math.random() * chiffres.length));
    mdp += chiffres.charAt(Math.floor(Math.random() * chiffres.length));
    mdp += chiffres.charAt(Math.floor(Math.random() * chiffres.length));
    mdp += speciaux.charAt(Math.floor(Math.random() * speciaux.length));

    setMotDePasse(mdp);
    setAfficherMdp(true);
    setErreurValidation(null);
  };

  const handlePrenomChange = (val: string) => {
    setPrenom(val);
    if (!login || login.includes(".")) {
      suggererLogin(val, nom);
    }
  };

  const handleNomChange = (val: string) => {
    setNom(val);
    if (!login || login.includes(".")) {
      suggererLogin(prenom, val);
    }
  };

  const majAffectation = (maj: Partial<ValeurAffectation>) => {
    setAff((prev) => ({ ...prev, ...maj }));
    setErreurValidation(null);
  };

  /* ------------------------------------------------------------------ *
   * Validations par étape
   * ------------------------------------------------------------------ */
  const validerEtape2 = (): string | null => {
    if (typeCompte === "personnel" && (!prenom.trim() || !nom.trim())) {
      return "Le prénom et le nom sont requis pour le personnel.";
    }
    if (!login.trim()) {
      return "L'identifiant de connexion est obligatoire.";
    }
    const mdp = motDePasse.trim();
    if (mdp.length < 8) {
      return "Le mot de passe doit comporter au moins 8 caractères.";
    }
    if (!REGEX_MDP_SYMFONY.test(mdp)) {
      return "Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial parmi @$!%*?&.";
    }
    const emailNettoye = email.trim();
    if (typeCompte === "admin" && !emailNettoye) {
      return "L'adresse email est requise pour un administrateur.";
    }
    if (emailNettoye && !REGEX_EMAIL.test(emailNettoye)) {
      return "L'adresse email est invalide.";
    }
    return null;
  };

  const validerEtape3 = (): string | null => {
    if (estMedical) {
      if (!corpsMedicalId) {
        return "Le corps médical est obligatoire pour un compte médecin ou infirmier.";
      }
      if (!dateDebutExercice) {
        setDateEnErreur(true);
        return "La date de début d'exercice est obligatoire.";
      }
    }
    return null;
  };

  const validerEtape4 = (): string | null => {
    if (!aff.siteId) return "Veuillez choisir un établissement.";
    if (!aff.serviceId) return "Veuillez choisir un service.";
    if (!aff.dateDebut) return "La date de prise de fonction est obligatoire.";
    if (aff.dateFin && aff.dateFin < aff.dateDebut) {
      return "La date de fin ne peut pas être antérieure à la date de début.";
    }
    if (incompatibilite) return `Affectation impossible. ${incompatibilite}`;
    return null;
  };

  /* ------------------------------------------------------------------ *
   * Navigation et soumission
   * ------------------------------------------------------------------ */
  const allerA = (cible: Etape) => {
    setErreurValidation(null);
    setEtape(cible);
  };

  const soumettre = async (affectation: AffectationInitiale | null) => {
    const loginNettoye = login.trim().toLowerCase();
    const mdpNettoye = motDePasse.trim();
    const emailNettoye = email.trim();

    setEnCours(true);
    try {
      let succes = false;

      if (typeCompte === "admin") {
        succes = await onCreerAdmin({
          type: "admin",
          login: loginNettoye,
          email: emailNettoye,
          motDePasse: mdpNettoye,
        });
      } else {
        succes = await onCreerPersonnel({
          type: "personnel",
          prenom: prenom.trim(),
          nom: nom.trim(),
          login: loginNettoye,
          motDePasse: mdpNettoye,
          role,
          email: emailNettoye || undefined,
          telephone: telephone.trim() || undefined,
          corpsMedicalId: estMedical ? Number(corpsMedicalId) : null,
          specialiteId: estMedical && specialiteId ? Number(specialiteId) : null,
          dateDebutExercice: estMedical ? dateDebutExercice : null,
          affectation,
        });
      }

      if (succes) {
        reinitialiser();
        onFermer();
      }
    } finally {
      setEnCours(false);
    }
  };

  /** Revalide les étapes précédentes : renvoie l'étape fautive, le cas échéant. */
  const revaliderAvant = (jusqua: Etape): boolean => {
    const msg2 = validerEtape2();
    if (msg2) {
      setErreurValidation(msg2);
      setEtape(2);
      return false;
    }
    if (jusqua >= 4) {
      const msg3 = validerEtape3();
      if (msg3) {
        setErreurValidation(msg3);
        setEtape(3);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurValidation(null);

    if (etape === 1) {
      setEtape(2);
      return;
    }

    if (etape === 2) {
      const msg = validerEtape2();
      if (msg) {
        setErreurValidation(msg);
        return;
      }
      setEtape(3);
      return;
    }

    if (etape === 3) {
      const msg = validerEtape3();
      if (msg) {
        setErreurValidation(msg);
        return;
      }
      if (typeCompte === "personnel") {
        setEtape(4);
        return;
      }
      // Administrateur : dernière étape, on crée directement
      if (!revaliderAvant(3)) return;
      await soumettre(null);
      return;
    }

    // Étape 4 : « Créer et affecter »
    if (!revaliderAvant(4)) return;
    const msg4 = validerEtape4();
    if (msg4) {
      setErreurValidation(msg4);
      return;
    }
    await soumettre({
      serviceId: Number(aff.serviceId),
      dateDebut: aff.dateDebut,
      dateFin: aff.dateFin || null,
      estPrincipal: aff.estPrincipal,
    });
  };

  const handleSansAffectation = async () => {
    setErreurValidation(null);
    if (!revaliderAvant(4)) return;
    await soumettre(null);
  };

  const handleRetour = () => {
    if (etape === 1) {
      onFermer();
    } else {
      allerA((etape - 1) as Etape);
    }
  };

  if (!ouvert) return null;

  const roleDef = ROLES_PERSONNEL.find((r) => r.code === role);

  const desactiveEtape3 =
    etape === 3 && estMedical && (!corpsMedicalId || corpsMedicaux.length === 0);
  const desactiveEtape4 = etape === 4 && Boolean(incompatibilite);
  const submitDesactive = enCours || desactiveEtape3 || desactiveEtape4;

  const libelleValider =
    etape < derniereEtape
      ? "Continuer"
      : enCours
        ? "Création…"
        : typeCompte === "admin"
          ? "Créer l'administrateur"
          : "Créer et affecter";

  /* ------------------------------------------------------------------ *
   * Rendu
   * ------------------------------------------------------------------ */
  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={enCours}
      libelle="Nouveau compte"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full min-h-0">
        {/* En-tête + stepper */}
        <div className="px-6 pt-5 pb-4 border-b border-[#f0f2f1]">
          <h2 className="m-0 mb-4 text-[19px] font-bold">Nouveau compte</h2>

          <ol className="flex gap-2 m-0 p-0 list-none">
            {etapesAffichees.map((s) => {
              const fait = s.numero < etape;
              const ouverte = s.numero === etape;
              return (
                <li
                  key={s.numero}
                  aria-current={ouverte ? "step" : undefined}
                  className={`flex-1 min-w-0 flex items-center gap-2 text-[13px] ${
                    ouverte ? "text-[#14703c] font-bold" : "text-[#5b6472]"
                  }`}
                >
                  <button
                    type="button"
                    disabled={!fait || enCours}
                    onClick={() => allerA(s.numero)}
                    className={`flex items-center gap-2 text-left min-w-0 ${
                      fait ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`h-6 w-6 shrink-0 rounded-full border grid place-items-center text-xs font-bold not-italic ${
                        fait || ouverte
                          ? "bg-[#1f9d55] border-[#1f9d55] text-white"
                          : "border-[#e5e7eb] bg-white"
                      }`}
                    >
                      {fait ? "✓" : s.numero}
                    </span>
                    <span className="truncate">{s.libelle}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Corps */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-3.5">
          {erreurValidation && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-[10px] text-xs"
            >
              {erreurValidation}
            </div>
          )}

          {/* ============ ÉTAPE 1 : type de compte ============ */}
          {etape === 1 && (
            <>
              <p className="m-0 text-[13px] text-[#5b6472]">Choisis le type de compte à créer.</p>

              <button
                type="button"
                aria-pressed={typeCompte === "personnel"}
                onClick={() => setTypeCompte("personnel")}
                className={`flex gap-3 p-4 rounded-[14px] border text-left text-xs text-[#5b6472] cursor-pointer transition ${
                  typeCompte === "personnel"
                    ? "border-[#1f9d55] bg-[#e7f6ed]"
                    : "border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 rounded-[10px] bg-[#e7f6ed] text-[#14703c] grid place-items-center text-xs font-bold"
                >
                  PS
                </div>
                <div>
                  <b className="block text-sm text-[#1f2937] mb-0.5">
                    Personnel soignant
                    {typeCompte === "personnel" && (
                      <span className={`${PUCE} ml-1.5 bg-[#e7f6ed] text-[#14703c]`}>
                        Sélectionné
                      </span>
                    )}
                  </b>
                  Médecin, infirmier, accueil, dispensateur, gestionnaire de stock… Rattaché à une
                  fiche personnel.
                </div>
              </button>

              <button
                type="button"
                aria-pressed={typeCompte === "admin"}
                onClick={() => setTypeCompte("admin")}
                className={`flex gap-3 p-4 rounded-[14px] border text-left text-xs text-[#5b6472] cursor-pointer transition ${
                  typeCompte === "admin"
                    ? "border-[#1f9d55] bg-[#e7f6ed]"
                    : "border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 rounded-[10px] bg-[#f3e8ff] text-[#6b21a8] grid place-items-center text-xs font-bold"
                >
                  AD
                </div>
                <div>
                  <b className="block text-sm text-[#1f2937] mb-0.5">
                    Administrateur
                    {typeCompte === "admin" && (
                      <span className={`${PUCE} ml-1.5 bg-[#e7f6ed] text-[#14703c]`}>
                        Sélectionné
                      </span>
                    )}
                  </b>
                  Accès illimité à la configuration. Aucune fiche personnel liée.
                </div>
              </button>
            </>
          )}

          {/* ============ ÉTAPE 2 : identité et accès ============ */}
          {etape === 2 && (
            <>
              {typeCompte === "personnel" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className={LABEL}>
                    Prénom <Requis />
                    <input
                      type="text"
                      placeholder="Ex. Jean"
                      value={prenom}
                      onChange={(e) => handlePrenomChange(e.target.value)}
                      className={CHAMP}
                    />
                  </label>
                  <label className={LABEL}>
                    Nom <Requis />
                    <input
                      type="text"
                      placeholder="Ex. Rakoto"
                      value={nom}
                      onChange={(e) => handleNomChange(e.target.value)}
                      className={CHAMP}
                    />
                  </label>
                </div>
              )}

              <label className={LABEL}>
                Identifiant de connexion (login) <Requis />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="ex. u.rakoto"
                  value={login}
                  onChange={(e) => setLogin(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  className={`${CHAMP} font-mono`}
                />
                <span className={AIDE}>Sans espace. Sert uniquement à se connecter.</span>
              </label>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="champ-mdp" className={LABEL}>
                    Mot de passe temporaire <Requis />
                  </label>
                  <span className="flex items-center gap-3 text-xs font-bold text-[#14703c]">
                    <button
                      type="button"
                      onClick={genererMotDePasseConforme}
                      className="cursor-pointer hover:underline"
                    >
                      Générer
                    </button>
                    <button
                      type="button"
                      onClick={() => setAfficherMdp((v) => !v)}
                      className="cursor-pointer hover:underline"
                    >
                      {afficherMdp ? "Masquer" : "Afficher"}
                    </button>
                  </span>
                </div>
                <input
                  id="champ-mdp"
                  type={afficherMdp ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className={`${CHAMP} ${afficherMdp ? "font-mono" : ""}`}
                />
                <span className={AIDE}>
                  L’utilisateur devra le changer à sa première connexion.
                </span>
              </div>

              {typeCompte === "personnel" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className={LABEL}>
                    Email professionnel
                    <input
                      type="email"
                      placeholder="jean.rakoto@asina.mg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={CHAMP}
                    />
                  </label>
                  <label className={LABEL}>
                    Téléphone
                    <input
                      type="tel"
                      placeholder="+261 34 00 000 00"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className={CHAMP}
                    />
                  </label>
                </div>
              ) : (
                <label className={LABEL}>
                  Adresse email officielle <Requis />
                  <input
                    type="email"
                    placeholder="admin@asina-medical.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={CHAMP}
                  />
                </label>
              )}
            </>
          )}

          {/* ============ ÉTAPE 3 : fonction et profil ============ */}
          {etape === 3 && typeCompte === "personnel" && (
            <>
              <label className={LABEL}>
                Fonction / Rôle <Requis />
                <select value={role} onChange={(e) => setRole(e.target.value)} className={CHAMP}>
                  {ROLES_PERSONNEL.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.libelle} ({r.code})
                    </option>
                  ))}
                </select>
              </label>

              {estMedical && (
                <div className="bg-[#e7f6ed] border border-[#b9e3c9] rounded-[14px] p-3.5 flex flex-col gap-3.5">
                  <h3 className="m-0 text-sm font-bold text-[#14703c]">
                    Profil médical (obligatoire pour ce rôle)
                  </h3>

                  {erreur && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                      {erreur}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label className={LABEL}>
                      Corps médical <Requis />
                      <select
                        value={corpsMedicalId}
                        onChange={(e) => setCorpsMedicalId(e.target.value)}
                        disabled={chargement || corpsMedicaux.length === 0}
                        className={CHAMP}
                      >
                        <option value="">{chargement ? "Chargement…" : "— Sélectionner —"}</option>
                        {corpsMedicaux.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.libelle} ({c.code})
                          </option>
                        ))}
                      </select>
                      {!chargement && corpsMedicaux.length === 0 && (
                        <span className="block mt-1 text-xs font-normal text-[#b42318]">
                          Aucun corps médical actif. Créez-en un dans « Compétences &amp;
                          Habilitations ».
                        </span>
                      )}
                    </label>

                    <label className={LABEL}>
                      Spécialité (optionnelle)
                      <select
                        value={specialiteId}
                        onChange={(e) => setSpecialiteId(e.target.value)}
                        disabled={chargement || specialites.length === 0}
                        className={CHAMP}
                      >
                        <option value="">{chargement ? "Chargement…" : "Aucune"}</option>
                        {specialites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.libelle} ({s.code})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className={LABEL}>
                    Date de début d’exercice <Requis />
                    <input
                      type="date"
                      value={dateDebutExercice}
                      onChange={(e) => {
                        setDateDebutExercice(e.target.value);
                        if (e.target.value) setDateEnErreur(false);
                      }}
                      aria-invalid={dateEnErreur}
                      className={`${CHAMP} ${dateEnErreur ? "border-[#b42318]" : ""}`}
                    />
                    <span className={`${AIDE} ${dateEnErreur ? "text-[#b42318]" : ""}`}>
                      Obligatoire : saisis la date réelle de début d’exercice.
                    </span>
                  </label>
                </div>
              )}

              <div className="rounded-[10px] px-3 py-2.5 text-xs bg-[#f6f8f7] text-[#5b6472]">
                Les services de rattachement se règlent ensuite dans la fiche personnel. Sans
                service coché, le personnel est disponible dans tous les services.
              </div>
            </>
          )}

          {etape === 3 && typeCompte === "admin" && (
            <div className="rounded-[10px] px-3 py-2.5 text-xs bg-[#f3e8ff] text-[#6b21a8]">
              Le rôle <code className="font-bold">ROLE_ADMIN</code> sera attribué automatiquement,
              avec un accès illimité à la configuration. Aucune fiche personnel n’est liée à ce
              compte.
            </div>
          )}

          {/* ============ ÉTAPE 4 : affectation (personnel) ============ */}
          {etape === 4 && typeCompte === "personnel" && (
            <>
              <div className="rounded-[10px] px-3 py-2.5 text-xs bg-[#f6f8f7] text-[#1f2937] border border-[#e5e7eb]">
                <b>
                  {prenom.trim()} {nom.trim().toUpperCase()}
                </b>{" "}
                · {roleDef?.libelle ?? role} ({role})
                {estMedical && (
                  <span className={`${PUCE} ml-1.5 bg-[#e7f6ed] text-[#14703c]`}>
                    Profil médical
                  </span>
                )}
              </div>

              <p className="m-0 text-[13px] text-[#5b6472]">
                Étape optionnelle : le compte peut être créé sans affectation. Un agent n’a qu’une
                seule affectation active à la fois.
              </p>

              <ChampsAffectation
                valeur={aff}
                onChange={majAffectation}
                optionsSites={donnees.optionsSites}
                optionsServices={donnees.optionsServices}
                chargement={donnees.chargement}
                erreurChargement={donnees.erreur}
                incompatibilite={incompatibilite}
                conseil="Choisis un autre service, ou crée le compte sans affectation."
                desactive={enCours}
              />
            </>
          )}
        </div>

        {/* Pied */}
        <div className="px-6 py-3.5 border-t border-[#e5e7eb] flex justify-between">
          <button type="button" onClick={handleRetour} disabled={enCours} className={BTN}>
            {etape === 1 ? "Annuler" : "Retour"}
          </button>

          <span className="flex gap-2">
            {etape === 4 && typeCompte === "personnel" && (
              <button
                type="button"
                onClick={handleSansAffectation}
                disabled={enCours}
                className={BTN}
              >
                Créer sans affectation
              </button>
            )}
            <button type="submit" disabled={submitDesactive} className={BTN_PRIMAIRE}>
              {libelleValider}
            </button>
          </span>
        </div>
      </form>
    </TiroirLateral>
  );
};

export default FormulaireUtilisateurModale;
