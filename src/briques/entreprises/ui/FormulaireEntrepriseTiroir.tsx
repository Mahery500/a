// src/briques/entreprises/ui/FormulaireEntrepriseTiroir.tsx
import React, { useEffect, useRef, useState } from "react";
import { X, Check, FileSpreadsheet, AlertTriangle, Loader2 } from "lucide-react";
import { TiroirLateral } from "@/noyau/ui/TiroirLateral";
import { useNotifier } from "@/noyau/notifications";
import { messageErreur } from "@/noyau/utils/erreur";
import { patientsApi } from "@/briques/patients";
import {
  EntreprisePartenaire,
  NouvelleEntrepriseInput,
  ModificationEntrepriseInput,
  Smie,
} from "../modele/entreprise.types";

const LABEL = "block text-[12px] font-bold text-[#5b6472] mb-1.5";
const CHAMP =
  "w-full h-10 px-3 border border-[#e5e7eb] rounded-[10px] text-sm bg-white text-[#1f2937] " +
  "placeholder:text-[#5b6472]/60 focus:outline-none focus:border-[#1f9d55] focus:ring-1 focus:ring-[#1f9d55]/20 " +
  "disabled:bg-[#fafbfa] disabled:text-[#5b6472] disabled:cursor-not-allowed";
const AIDE = "text-[12px] text-[#5b6472] mt-1.5";
const SECTION =
  "text-[12px] font-bold uppercase tracking-[0.05em] text-[#5b6472] border-b border-[#f0f2f1] pb-1.5";
const BTN =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 border border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer transition disabled:opacity-50";
const BTN_PRIMAIRE =
  "h-10 px-4 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 bg-[#1f9d55] hover:bg-[#14703c] text-white cursor-pointer transition disabled:opacity-50";
const CODE_CHIP =
  "inline-block bg-[#e7f6ed] text-[#14703c] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const EXT_CHIP =
  "inline-block bg-[#eef2ff] text-[#3730a3] rounded-md px-[7px] py-[3px] font-mono text-[12px] font-bold whitespace-nowrap";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

export const OPTIONS_SMIE: { valeur: Smie; label: string; description: string }[] = [
  { valeur: "serenite", label: "La Sérénité", description: "Carte La Sérénité" },
  { valeur: "asina", label: "ASINA", description: "Carte ASINA" },
];
export const libelleSmie = (s?: Smie | null) =>
  OPTIONS_SMIE.find((o) => o.valeur === s)?.label ?? "—";

type Etape = 1 | 2 | 3;
const ETAPES: { numero: Etape; libelle: string }[] = [
  { numero: 1, libelle: "Identité" },
  { numero: 2, libelle: "Affiliation et SMIE" },
  { numero: 3, libelle: "Import des salariés" },
];

const Stepper: React.FC<{ etapeCourante: Etape; etapesAffichees: typeof ETAPES }> = ({
  etapeCourante,
  etapesAffichees,
}) => (
  <div className="flex items-center px-6 py-4 border-b border-[#e5e7eb] shrink-0">
    {etapesAffichees.map((e, idx) => {
      const fait = e.numero < etapeCourante;
      const active = e.numero === etapeCourante;
      const vert = fait || active;
      return (
        <React.Fragment key={e.numero}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                vert ? "bg-[#1f9d55] text-white" : "border-2 border-[#e5e7eb] bg-white text-[#5b6472]"
              }`}
            >
              {fait ? <Check className="w-4 h-4" strokeWidth={3} /> : e.numero}
            </div>
            <span
              className={`text-[13px] whitespace-nowrap ${
                active ? "font-bold text-[#14703c]" : "font-semibold text-[#5b6472]"
              }`}
            >
              {e.libelle}
            </span>
          </div>
          {idx < etapesAffichees.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2.5 ${fait ? "bg-[#1f9d55]" : "bg-[#e5e7eb]"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const Rappel: React.FC<{
  nom: string;
  raison?: string;
  sigle?: string;
  smie?: Smie | null;
}> = ({ nom, raison, sigle, smie }) => (
  <div className="p-3 bg-[#fafbfa] border border-[#e5e7eb] rounded-[10px]">
    <div className="text-[12px] text-[#5b6472]">Rappel</div>
    <div className="mt-1 flex items-center gap-2 flex-wrap">
      <span className="font-bold text-[#1f2937] text-sm truncate">{nom}</span>
      {raison && raison !== nom && (
        <span className="text-[12px] text-[#5b6472]">· {raison}</span>
      )}
      {smie && <span className={`${CODE_CHIP} ml-1`}>{libelleSmie(smie)}</span>}
      {sigle && <span className={EXT_CHIP}>{sigle}</span>}
    </div>
  </div>
);

export interface FormulaireEntrepriseTiroirProps {
  ouvert: boolean;
  entrepriseEnEdition: EntreprisePartenaire | null;
  onFermer: () => void;
  onEnregistrer: (
    saisie: NouvelleEntrepriseInput | ModificationEntrepriseInput,
    id?: number,
  ) => Promise<EntreprisePartenaire | null>;
}

export const FormulaireEntrepriseTiroir: React.FC<FormulaireEntrepriseTiroirProps> = ({
  ouvert,
  entrepriseEnEdition,
  onFermer,
  onEnregistrer,
}) => {
  const notif = useNotifier();
  const estEdition = entrepriseEnEdition !== null;
  const etapesAffichees = estEdition ? ETAPES.slice(0, 2) : ETAPES;

  const [etape, setEtape] = useState<Etape>(1);

  // Étape 1 — Identité
  const [nom, setNom] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [adresse, setAdresse] = useState("");
  const [contact, setContact] = useState("");

  // Étape 2 — Affiliation et SMIE
  const [matriculeAsina, setMatriculeAsina] = useState("");
  const [numeroCnaps, setNumeroCnaps] = useState("");
  const [smie, setSmie] = useState<Smie | "">("");

  // Étape 3 — Import
  const [fichier, setFichier] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!ouvert) return;
    setEtape(1);
    setErreur(null);
    setFichier(null);
    if (entrepriseEnEdition) {
      setNom(entrepriseEnEdition.nom);
      setRaisonSociale(entrepriseEnEdition.raisonSociale || "");
      setAdresse(entrepriseEnEdition.adresse || "");
      setContact(entrepriseEnEdition.contact || "");
      setMatriculeAsina(entrepriseEnEdition.matriculeAsina || "");
      setNumeroCnaps(entrepriseEnEdition.numeroCnaps || "");
      setSmie(entrepriseEnEdition.smie ?? "");
    } else {
      setNom("");
      setRaisonSociale("");
      setAdresse("");
      setContact("");
      setMatriculeAsina("");
      setNumeroCnaps("");
      setSmie("");
    }
  }, [ouvert, entrepriseEnEdition]);

  const validerEtape1 = (): string | null => {
    if (!nom.trim()) return "Le nom commercial est obligatoire.";
    if (!raisonSociale.trim()) return "La raison sociale officielle est obligatoire.";
    return null;
  };

  const validerEtape2 = (): string | null => {
    if (!matriculeAsina.trim()) return "Le sigle / préfixe matricule ASINA est obligatoire.";
    if (!numeroCnaps.trim()) return "Le numéro CNAPS employeur est obligatoire.";
    if (!smie) return "La SMIE est obligatoire.";
    return null;
  };

  const suivant = () => {
    setErreur(null);
    if (etape === 1) {
      const msg = validerEtape1();
      if (msg) return setErreur(msg);
      return setEtape(2);
    }
    if (etape === 2) {
      const msg = validerEtape2();
      if (msg) return setErreur(msg);
      return setEtape(3);
    }
  };

  const precedent = () => {
    setErreur(null);
    if (etape > 1) setEtape((etape - 1) as Etape);
  };

  const enregistrer = async () => {
    setErreur(null);
    const msg1 = validerEtape1();
    if (msg1) {
      setEtape(1);
      return setErreur(msg1);
    }
    const msg2 = validerEtape2();
    if (msg2) {
      setEtape(2);
      return setErreur(msg2);
    }

    setEnCours(true);
    try {
      const base = {
        nom: nom.trim(),
        raisonSociale: raisonSociale.trim(),
        adresse: adresse.trim() || undefined,
        contact: contact.trim() || undefined,
        numeroCnaps: numeroCnaps.trim(),
        matriculeAsina: matriculeAsina.trim().toUpperCase(),
      };

      const resultat = estEdition
        ? await onEnregistrer(base as ModificationEntrepriseInput, entrepriseEnEdition.id)
        : await onEnregistrer(
            { ...base, smie: smie as Smie } as NouvelleEntrepriseInput,
            undefined,
          );

      if (!resultat) {
        setErreur("Impossible d'enregistrer l'entreprise.");
        return;
      }

      // Étape 3 : import Excel facultatif (création uniquement)
      if (!estEdition && fichier) {
        try {
          await patientsApi.importerExcel(fichier, resultat.id);
          notif.succes("Fichier Excel importé.");
        } catch (err) {
          notif.erreur(
            messageErreur(
              err,
              "L'entreprise a été créée mais l'import du fichier a échoué. Réessayez depuis sa fiche.",
            ),
          );
        }
      }

      onFermer();
    } catch (err) {
      setErreur(messageErreur(err, "Échec de l'enregistrement."));
    } finally {
      setEnCours(false);
    }
  };

  const estDerniere = etape === (estEdition ? 2 : 3);
  const libelleAction = estDerniere
    ? enCours
      ? "Enregistrement…"
      : estEdition
        ? "Enregistrer les modifications"
        : "Créer l'entreprise"
    : "Continuer";

  const racine = matriculeAsina.trim().toUpperCase();

  return (
    <TiroirLateral
      ouvert={ouvert}
      onFermer={onFermer}
      fermetureBloquee={enCours}
      libelle={estEdition ? "Modifier l'entreprise" : "Nouvelle entreprise partenaire"}
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="h-[72px] px-6 border-b border-[#e5e7eb] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2937] leading-tight">
              {estEdition ? "Modifier l'entreprise partenaire" : "Nouvelle entreprise partenaire"}
            </h2>
            <p className="text-[12px] text-[#5b6472] mt-0.5">
              Étape {etape} sur {etapesAffichees.length} · champs obligatoires marqués d'une étoile
            </p>
          </div>
          <button
            type="button"
            onClick={enCours ? undefined : onFermer}
            disabled={enCours}
            className="p-1.5 rounded text-[#5b6472] hover:text-[#1f2937] hover:bg-[#fafbfa] cursor-pointer disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Stepper etapeCourante={etape} etapesAffichees={etapesAffichees} />

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {erreur && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-[#b42318] text-[12px] font-medium"
            >
              {erreur}
            </div>
          )}

          {/* ÉTAPE 1 — IDENTITÉ */}
          {etape === 1 && (
            <>
              <div>
                <label htmlFor="ent-nom" className={LABEL}>
                  Nom commercial / nom d'usage <span className="text-[#b42318]">*</span>
                </label>
                <input
                  id="ent-nom"
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex : TOTAL MADAGASCAR"
                  disabled={enCours}
                  className={CHAMP}
                />
                <p className={AIDE}>Nom courant de l'entreprise.</p>
              </div>

              <div>
                <label htmlFor="ent-raison" className={LABEL}>
                  Raison sociale officielle <span className="text-[#b42318]">*</span>
                </label>
                <input
                  id="ent-raison"
                  type="text"
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  placeholder="ex : TotalEnergies Marketing Madagascar"
                  disabled={enCours}
                  className={CHAMP}
                />
                <p className={AIDE}>Telle qu'elle figure au registre.</p>
              </div>

              <div className={SECTION}>Coordonnées</div>

              <div>
                <label htmlFor="ent-adresse" className={LABEL}>
                  Adresse géographique (siège ou antenne)
                </label>
                <input
                  id="ent-adresse"
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="ex : Immeuble Aro, Ampefiloha, Antananarivo"
                  disabled={enCours}
                  className={CHAMP}
                />
              </div>

              <div>
                <label htmlFor="ent-contact" className={LABEL}>
                  Contact RH (téléphone ou e-mail)
                </label>
                <input
                  id="ent-contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="ex : rh@entreprise.mg ou +261 20 22 123 45"
                  disabled={enCours}
                  className={CHAMP}
                />
              </div>
            </>
          )}

          {/* ÉTAPE 2 — AFFILIATION ET SMIE */}
          {etape === 2 && (
            <>
              <Rappel
                nom={nom}
                raison={raisonSociale}
                sigle={matriculeAsina}
                smie={smie || null}
              />

              <div>
                <label htmlFor="ent-sigle" className={LABEL}>
                  Sigle / préfixe matricule ASINA <span className="text-[#b42318]">*</span>
                </label>
                <input
                  id="ent-sigle"
                  type="text"
                  value={matriculeAsina}
                  onChange={(e) => setMatriculeAsina(e.target.value.toUpperCase())}
                  placeholder="ex : TOTAL, SMIE, AXIAN"
                  disabled={enCours}
                  className={`${CHAMP} font-mono`}
                />
                {racine && (
                  <p className={AIDE}>
                    Aperçu : <span className={CODE_CHIP}>{racine}-0001</span>{" "}
                    <span className={CODE_CHIP}>{racine}-0001-C1</span>{" "}
                    <span className={CODE_CHIP}>{racine}-0001-E1</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="ent-cnaps" className={LABEL}>
                  N° d'affiliation CNAPS employeur <span className="text-[#b42318]">*</span>
                </label>
                <input
                  id="ent-cnaps"
                  type="text"
                  value={numeroCnaps}
                  onChange={(e) => setNumeroCnaps(e.target.value)}
                  placeholder="ex : 12345678"
                  disabled={enCours}
                  className={`${CHAMP} font-mono`}
                />
                <p className={AIDE}>Imprimé sur les cartes d'adhérents.</p>
              </div>

              <div>
                <div className={LABEL}>
                  SMIE <span className="text-[#b42318]">*</span>
                </div>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="SMIE">
                  {OPTIONS_SMIE.map((opt) => {
                    const actif = smie === opt.valeur;
                    const desactive = enCours || estEdition;
                    return (
                      <button
                        key={opt.valeur}
                        type="button"
                        role="radio"
                        aria-checked={actif}
                        disabled={desactive}
                        onClick={() => setSmie(opt.valeur)}
                        className={`text-left p-3 rounded-[10px] transition ${FOCUS} ${
                          actif
                            ? "border-2 border-[#1f9d55] bg-[#e7f6ed]"
                            : "border border-[#e5e7eb] bg-white hover:bg-[#fafbfa]"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-[#1f2937] text-sm">{opt.label}</div>
                            <div className="text-[12px] text-[#5b6472]">{opt.description}</div>
                          </div>
                          {actif && <Check className="h-4 w-4 text-[#1f9d55] shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {estEdition ? (
                  <p className={AIDE}>La SMIE ne peut plus être modifiée.</p>
                ) : (
                  <p className="text-[12px] text-[#8a5300] bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] px-3 py-2 mt-1.5">
                    <b>Choix définitif</b> : il détermine le modèle des cartes d'adhérent.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ÉTAPE 3 — IMPORT DES SALARIÉS */}
          {etape === 3 && !estEdition && (
            <>
              <Rappel
                nom={nom}
                raison={raisonSociale}
                sigle={matriculeAsina}
                smie={smie || null}
              />

              <div className="p-3 bg-[#fff4e0] border border-[#f3d9a8] rounded-[10px] text-[#8a5300]">
                <div className="flex items-center gap-2 font-bold text-[13px]">
                  <AlertTriangle className="h-4 w-4" />
                  Règles imposées par le système d'import
                </div>
                <ul className="mt-2 pl-5 list-disc space-y-1 text-[12px]">
                  <li>Chaque salarié (Agent) figure <b>avant</b> ses ayants droit.</li>
                  <li>Colonne « Agent / Conjoint / Enfant » obligatoire pour déterminer le rôle.</li>
                  <li>Import strict en bloc : la moindre erreur annule tout le fichier.</li>
                </ul>
              </div>

              <div>
                <div className={LABEL}>Fichier classeur Excel (.xlsx)</div>
                <div
                  className={`border-2 border-dashed rounded-[14px] h-[160px] flex flex-col items-center justify-center gap-1.5 transition ${
                    fichier ? "border-[#1f9d55] bg-[#e7f6ed]" : "border-[#cbd5e1] bg-white"
                  }`}
                >
                  {fichier ? (
                    <>
                      <FileSpreadsheet className="w-8 h-8 text-[#1f9d55]" />
                      <b className="text-sm text-[#1f2937] truncate max-w-[80%]">{fichier.name}</b>
                      <span className="text-[12px] text-[#5b6472]">
                        {(fichier.size / 1024).toFixed(1)} Ko
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFichier(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        disabled={enCours}
                        className="text-[12px] text-[#b42318] hover:underline cursor-pointer"
                      >
                        Retirer le fichier
                      </button>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-8 h-8 text-[#1f9d55]" />
                      <b className="text-sm text-[#1f2937]">Cliquer ou glisser un fichier .xlsx</b>
                      <span className="text-[12px] text-[#5b6472]">
                        Format Excel standard avec feuilles de salariés
                      </span>
                      <label className="text-[#14703c] font-bold mt-1 cursor-pointer hover:underline">
                        Sélectionner un fichier ↓
                        <input
                          ref={fileRef}
                          type="file"
                          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          hidden
                          disabled={enCours}
                          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </>
                  )}
                </div>
                <p className={AIDE}>
                  Étape facultative : vous pourrez importer plus tard depuis la fiche de
                  l'entreprise.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="h-[72px] px-6 border-t border-[#e5e7eb] bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={precedent}
            disabled={etape === 1 || enCours}
            className={`${BTN} ${etape === 1 ? "invisible" : ""}`}
            aria-hidden={etape === 1}
          >
            Retour
          </button>

          <button
            type="button"
            onClick={estDerniere ? enregistrer : suivant}
            disabled={enCours}
            className={BTN_PRIMAIRE}
          >
            {enCours && <Loader2 className="w-4 h-4 animate-spin" />}
            {libelleAction}
          </button>
        </div>
      </div>
    </TiroirLateral>
  );
};

export default FormulaireEntrepriseTiroir;