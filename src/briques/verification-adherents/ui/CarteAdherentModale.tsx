/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Printer,
  Shield,
  Building2,
  Heart,
  QrCode,
  User,
  Sparkles,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { AdherentComplet } from "../modele/verification-adherent.types";

export interface CarteAdherentModaleProps {
  ouvert: boolean;
  adherent: AdherentComplet | null;
  onFermer: () => void;
}

export const CarteAdherentModale: React.FC<CarteAdherentModaleProps> = ({
  ouvert,
  adherent,
  onFermer,
}) => {
  const [themeCouleur, setThemeCouleur] = useState<"teal" | "navy" | "emerald">("teal");
  const [faceVisible, setFaceVisible] = useState<"recto" | "verso">("recto");

  if (!adherent) return null;

  const { patient, affiliation } = adherent;

  const dateDelivrance = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const dateExpiration = new Date(
    new Date().setFullYear(new Date().getFullYear() + 2),
  ).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const classesThemes = {
    teal: {
      fond: "from-cyan-900 via-teal-900 to-slate-950",
      accent: "text-cyan-400",
      badge: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
      bordure: "border-cyan-500/30",
    },
    navy: {
      fond: "from-blue-950 via-slate-900 to-slate-950",
      accent: "text-blue-400",
      badge: "bg-blue-500/20 text-blue-200 border-blue-400/30",
      bordure: "border-blue-500/30",
    },
    emerald: {
      fond: "from-emerald-950 via-teal-950 to-slate-950",
      accent: "text-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
      bordure: "border-emerald-500/30",
    },
  };

  const theme = classesThemes[themeCouleur];

  const imprimerCarte = () => {
    window.print();
  };

  return (
    <Modale
      ouvert={ouvert}
      onFermer={onFermer}
      titre={`Carte d'Adhérent Santé au Travail — ${patient.nom} ${patient.prenom}`}
      icone={<Shield className="h-4 w-4" />}
      largeurMax="2xl"
      enfants={
        <div className="space-y-5">
          {/* Barres d'options et bascule recto/verso */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Face :</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setFaceVisible("recto")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    faceVisible === "recto"
                      ? "bg-asina-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Recto (Identité)
                </button>
                <button
                  type="button"
                  onClick={() => setFaceVisible("verso")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    faceVisible === "verso"
                      ? "bg-asina-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Verso (Médical & Urgence)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Thème :</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setThemeCouleur("teal")}
                  className={`h-5 w-5 rounded-full bg-teal-600 border-2 transition cursor-pointer ${
                    themeCouleur === "teal" ? "border-slate-800 scale-110" : "border-white"
                  }`}
                  aria-label="Thème Teal"
                />
                <button
                  type="button"
                  onClick={() => setThemeCouleur("navy")}
                  className={`h-5 w-5 rounded-full bg-blue-900 border-2 transition cursor-pointer ${
                    themeCouleur === "navy" ? "border-slate-800 scale-110" : "border-white"
                  }`}
                  aria-label="Thème Navy"
                />
                <button
                  type="button"
                  onClick={() => setThemeCouleur("emerald")}
                  className={`h-5 w-5 rounded-full bg-emerald-700 border-2 transition cursor-pointer ${
                    themeCouleur === "emerald" ? "border-slate-800 scale-110" : "border-white"
                  }`}
                  aria-label="Thème Emerald"
                />
              </div>
            </div>
          </div>

          {/* Affichage visuel de la carte format badge ISO */}
          <div className="flex justify-center p-2">
            <div
              id="carte-adherent-impression"
              className={`w-full max-w-lg aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${theme.fond} text-white p-5 shadow-xl border ${theme.bordure} flex flex-col justify-between relative overflow-hidden select-none`}
            >
              {/* Motifs de fond filigrane */}
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />

              {faceVisible === "recto" ? (
                /* RECTO */
                <>
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                        <Shield className={`h-5 w-5 ${theme.accent}`} />
                      </div>
                      <div>
                        <div className="text-[13px] font-black tracking-wider uppercase font-sans">
                          ASINA SIH
                        </div>
                        <div className="text-[9px] text-slate-300 font-medium tracking-wide">
                          SERVICE DE SANTÉ AU TRAVAIL
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${theme.badge}`}
                    >
                      {affiliation.statut}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 items-center my-auto relative z-10">
                    {/* Avatar */}
                    <div className="col-span-1 flex flex-col items-center">
                      <div className="h-20 w-20 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                        <User className="h-10 w-10 text-white/70" />
                      </div>
                      <span className="text-[9px] font-mono font-bold mt-1.5 text-slate-300 tracking-wider">
                        {patient.matricule || `PAT-${patient.id}`}
                      </span>
                    </div>

                    {/* Données de l'adhérent */}
                    <div className="col-span-3 space-y-1.5 pl-1">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                          Adhérent(e)
                        </div>
                        <div className="text-base font-black tracking-wide leading-tight truncate">
                          {patient.nom} {patient.prenom}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">
                            Entreprise
                          </span>
                          <span className="font-semibold truncate block">
                            {affiliation.nomEntreprise || "Indépendant"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[8px] uppercase">
                            N° CNAPS
                          </span>
                          <span className="font-mono font-bold truncate block">
                            {affiliation.cnaps || patient.nir || "Non renseigné"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pied recto */}
                  <div className="flex items-end justify-between border-t border-white/10 pt-2 text-[8px] text-slate-300 relative z-10">
                    <div>
                      <span>Délivrée le : </span>
                      <span className="font-semibold text-white">{dateDelivrance}</span>
                    </div>
                    <div>
                      <span>Expire fin : </span>
                      <span className="font-semibold text-white">{dateExpiration}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-white/90">
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      <span>OFFICIEL</span>
                    </div>
                  </div>
                </>
              ) : (
                /* VERSO */
                <>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 relative z-10">
                    <span className="text-[10px] font-bold tracking-wide uppercase text-slate-300">
                      Informations Médicales & Urgence
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">ID-{patient.id}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 my-auto relative z-10 items-center">
                    <div className="col-span-2 space-y-2 text-[10px]">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-400 shrink-0" />
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 block">
                            Groupe Sanguin
                          </span>
                          <span className="font-bold text-white">
                            {patient.groupeSanguin || "Non spécifié"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-cyan-400 shrink-0" />
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 block">
                            Contact Patient
                          </span>
                          <span className="font-semibold text-white font-mono">
                            {patient.telephone || "Non renseigné"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 block">
                            Couverture Médecine du Travail
                          </span>
                          <span className="font-medium text-emerald-300 text-[9px]">
                            Visites périodiques & aptitude couvertes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code vectoriel */}
                    <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-inner">
                      <QrCode className="h-16 w-16 text-slate-900" />
                      <span className="text-[8px] font-mono text-slate-600 font-bold mt-0.5">
                        SCAN CHECK
                      </span>
                    </div>
                  </div>

                  {/* Pied verso */}
                  <div className="border-t border-white/10 pt-2 text-[8px] text-slate-400 flex items-center justify-between relative z-10">
                    <p className="truncate">
                      Cette carte est strictement personnelle et atteste des droits médicaux.
                    </p>
                    <span className="font-mono font-bold text-slate-300 shrink-0 ml-2">
                      SIH-ASINA-v1
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Prêt pour impression sur carte PVC 85.60 × 53.98 mm ou papier badge standard.
              </span>
            </div>
            <button
              type="button"
              onClick={imprimerCarte}
              className="btn-primary py-1.5 px-3.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer la carte</span>
            </button>
          </div>
        </div>
      }
      pied={
        <button
          type="button"
          onClick={onFermer}
          className="btn-secondary py-1.5 px-4 text-xs font-semibold rounded-lg cursor-pointer"
        >
          Fermer
        </button>
      }
    />
  );
};
