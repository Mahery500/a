/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import {
  UtilisateurCompte,
  ModificationCompteInput,
  ROLES_SYMFONY_DISPONIBLES,
  ROLES_PERSONNEL,
} from "../modele/utilisateur.types";

export interface FormulaireEditionUtilisateurModaleProps {
  ouvert: boolean;
  compte: UtilisateurCompte | null;
  onFermer: () => void;
  /** Reçoit le compte complet — le hook utilise `compte.idApi` en interne. */
  onModifier: (compte: UtilisateurCompte, saisie: ModificationCompteInput) => Promise<boolean>;
}

export const FormulaireEditionUtilisateurModale: React.FC<
  FormulaireEditionUtilisateurModaleProps
> = ({ ouvert, compte, onFermer, onModifier }) => {
  const [email, setEmail] = useState("");
  const [roleSelectionne, setRoleSelectionne] = useState("ROLE_USER");
  const [actif, setActif] = useState(true);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (compte) {
      setEmail(compte.email || "");
      setRoleSelectionne(compte.rolePrincipal || "ROLE_USER");
      setActif(compte.actif);
    }
    setErreur(null);
  }, [compte, ouvert]);

  if (!compte) return null;

  const estAdmin = compte.typeCompte === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    setEnCours(true);
    try {
      const payload: ModificationCompteInput = {
        email: email.trim() || undefined,
        roles: estAdmin ? ["ROLE_ADMIN"] : [roleSelectionne],
        actif,
      };
      const succes = await onModifier(compte, payload);
      if (succes) onFermer();
    } finally {
      setEnCours(false);
    }
  };

  const listeRoles = estAdmin ? ROLES_SYMFONY_DISPONIBLES : ROLES_PERSONNEL;

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre={`Modifier le compte « ${compte.login} »`}
      largeurMax="md"
      enfants={
        <form id="form-edition-utilisateur" onSubmit={handleSubmit} className="space-y-4 text-xs">
          {erreur && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {erreur}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {compte.prenom} {compte.nom}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Identifiant système : <span className="font-bold text-slate-800">{compte.login}</span>{" "}
              (utilisateur #{compte.id}
              {compte.typeCompte === "personnel" ? `, profil #${compte.idApi}` : ""})
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Adresse email {estAdmin && "*"}
            </label>
            <input
              type="email"
              required={estAdmin}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adresse@domaine.mg"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500"
            />
          </div>

          {!estAdmin ? (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Rôle applicatif</label>
              <select
                value={roleSelectionne}
                onChange={(e) => setRoleSelectionne(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-asina-500 font-medium text-slate-800"
              >
                {listeRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.libelle} ({r.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900 font-semibold">
              Rôle permanent : Administrateur (ROLE_ADMIN)
            </div>
          )}

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={actif}
                onChange={(e) => setActif(e.target.checked)}
                className="rounded border-slate-300 text-asina-600 focus:ring-asina-500"
              />
              <span className="font-semibold text-slate-800 text-xs">
                Compte utilisateur actif et autorisé à se connecter
              </span>
            </label>
          </div>
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-edition-utilisateur"
            onAnnuler={onFermer}
            enCours={enCours}
            desactive={enCours}
            labelValider="Enregistrer les modifications"
          />
        </div>
      }
    />
  );
};