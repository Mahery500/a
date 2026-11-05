import React from "react";
import { Users, Syringe, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import { useTableauBordInfirmerie } from "../hooks/useTableauBordInfirmerie";

interface Props {
  siteActifId?: number;
  onNaviguer: (ecranId: "file" | "soins" | "historique") => void;
}

const Carte: React.FC<{
  icone: React.ReactNode;
  valeur: number | string;
  libelle: string;
  onClick?: () => void;
}> = ({ icone, valeur, libelle, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-teal-400"
  >
    <div className="rounded-lg bg-teal-50 p-3 text-teal-600">{icone}</div>
    <div>
      <div className="text-2xl font-bold text-slate-900">{valeur}</div>
      <div className="text-sm text-slate-500">{libelle}</div>
    </div>
  </button>
);

export const PanneauInfirmerieTableauBord: React.FC<Props> = ({ siteActifId, onNaviguer }) => {
  const { stats, chargement, erreur } = useTableauBordInfirmerie(siteActifId);

  if (chargement) return <div className="p-6 text-slate-500">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="text-sm text-slate-500">Activité de soins du jour</p>
      </div>

      {erreur && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {erreur}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Carte icone={<Users size={22} />} valeur={stats.enAttente} libelle="Patients en attente" onClick={() => onNaviguer("file")} />
        <Carte icone={<Syringe size={22} />} valeur={stats.patientEnCours ? 1 : 0} libelle="Prise en charge en cours" onClick={() => onNaviguer("soins")} />
        <Carte icone={<CheckCircle2 size={22} />} valeur={stats.realisesAujourdhui} libelle="Actes réalisés aujourd'hui" onClick={() => onNaviguer("historique")} />
        <Carte icone={<XCircle size={22} />} valeur={stats.annulesAujourdhui} libelle="Actes annulés aujourd'hui" onClick={() => onNaviguer("historique")} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-900">Patient en cours</h3>
        {stats.patientEnCours ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{stats.patientEnCours.nom}</div>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Clock size={14} /> {stats.patientEnCours.dureeMinutes} min
                {stats.patientEnCours.numTicket && ` · Ticket ${stats.patientEnCours.numTicket}`}
              </div>
            </div>
            <button
              onClick={() => onNaviguer("soins")}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
            >
              Reprendre les soins <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun patient en cours. Le poste est libre.</p>
        )}
      </div>
    </div>
  );
};

export default PanneauInfirmerieTableauBord;