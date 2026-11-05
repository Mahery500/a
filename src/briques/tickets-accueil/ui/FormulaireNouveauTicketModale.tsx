/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Ticket, User, Building } from "lucide-react";
import { Modale } from "@/noyau/ui/Modale";
import { ActionsFormulaire } from "@/noyau/ui/ActionsFormulaire";
import { PatientOption, ServiceOption } from "../modele/tickets-accueil.types";

export interface FormulaireNouveauTicketModaleProps {
  ouvert: boolean;
  patients: PatientOption[];
  services: ServiceOption[];
  onFermer: () => void;
  onEnregistrer: (patientId: number, serviceId: number) => Promise<boolean>;
}

export const FormulaireNouveauTicketModale: React.FC<FormulaireNouveauTicketModaleProps> = ({
  ouvert,
  patients,
  services,
  onFermer,
  onEnregistrer,
}) => {
  const [patientId, setPatientId] = useState<number | "">(
    patients.length > 0 ? patients[0].id : "",
  );
  const [serviceId, setServiceId] = useState<number | "">(
    services.length > 0 ? services[0].id : "",
  );
  const [enCours, setEnCours] = useState(false);

  React.useEffect(() => {
    if (patientId === "" && patients.length > 0) {
      setPatientId(patients[0].id);
    }
  }, [patients, patientId]);

  React.useEffect(() => {
    if (serviceId === "" && services.length > 0) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !serviceId) return;

    setEnCours(true);
    try {
      const succes = await onEnregistrer(Number(patientId), Number(serviceId));
      if (succes) {
        onFermer();
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modale
      ouvert={ouvert}
      onFermer={enCours ? () => {} : onFermer}
      titre="Émettre un Ticket de File d'Attente"
      icone={<Ticket className="h-4 w-4 text-asina-600" />}
      largeurMax="md"
      enfants={
        <form id="form-nouveau-ticket" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Patient adhérent *</span>
            </label>
            <select
              value={patientId}
              disabled={enCours}
              onChange={(e) => setPatientId(Number(e.target.value))}
              required
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-hidden focus:border-asina-500"
            >
              <option value="" disabled>
                — Sélectionner le patient —
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.matricule}] {p.nomComplet}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span>Service médical d'orientation initiale *</span>
            </label>
            <select
              value={serviceId}
              disabled={enCours}
              onChange={(e) => setServiceId(Number(e.target.value))}
              required
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-hidden focus:border-asina-500"
            >
              <option value="" disabled>
                — Choisir le service d'aiguillage —
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>
        </form>
      }
      pied={
        <div className="w-full">
          <ActionsFormulaire
            idFormulaire="form-nouveau-ticket"
            onAnnuler={onFermer}
            enCours={enCours}
            desactive={enCours || !patientId || !serviceId}
            labelValider="Émettre le Ticket"
          />
        </div>
      }
    />
  );
};
