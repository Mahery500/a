/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  ClipboardList,
  Filter,
  FlaskConical,
  Pill,
  ShieldAlert,
  Stethoscope,
  Users,
  UserCog,
  LayoutDashboard,
} from "lucide-react";
import { useDashboardAdmin } from "../hooks/useDashboardAdmin";
import type { DashboardFiltres, SectionDashboard } from "../modele/dashboard.types";
import { FiltresDashboard } from "./FiltresDashboard";
import {
  BandeauAlertes,
  CarteKpi,
  CARTE,
  EtatBloc,
  GraphBarres,
  GraphColonnes,
  GraphDonut,
  GrilleKpis,
  Heatmap,
  Section,
} from "./BriquesDashboard";

/* ------------------------------------------------------------------ */

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f9d55]";

interface OngletDef {
  id: SectionDashboard;
  libelle: string;
  icone: React.ComponentType<{ className?: string }>;
  exportPath: string;
}

const ONGLETS: OngletDef[] = [
  { id: "overview",         libelle: "Vue d'ensemble",      icone: LayoutDashboard, exportPath: "overview" },
  { id: "flux",             libelle: "Flux patients",        icone: Users,           exportPath: "flux" },
  { id: "rendez-vous",      libelle: "Rendez-vous",          icone: Calendar,        exportPath: "rendez-vous" },
  { id: "activite-medicale",libelle: "Activité médicale",    icone: Stethoscope,     exportPath: "activite-medicale" },
  { id: "pharmacie",        libelle: "Pharmacie",            icone: Pill,            exportPath: "pharmacie" },
  { id: "prescriptions",    libelle: "Prescriptions",        icone: ClipboardList,   exportPath: "prescriptions" },
  { id: "epidemiologie",    libelle: "Épidémiologie",        icone: FlaskConical,    exportPath: "epidemiologie" },
  { id: "allergies",        libelle: "Allergies",            icone: ShieldAlert,     exportPath: "allergies" },
  { id: "population",       libelle: "Population",           icone: Users,           exportPath: "population" },
  { id: "personnel",        libelle: "Personnel",            icone: UserCog,         exportPath: "personnel" },
  { id: "qualite-donnees",  libelle: "Qualité des données",  icone: Activity,        exportPath: "qualite-donnees" },
];

export interface PanneauDashboardAdminProps {
  ongletInitial?: SectionDashboard;
}

export const PanneauDashboardAdmin: React.FC<PanneauDashboardAdminProps> = ({
  ongletInitial = "overview",
}) => {
  const [onglet, setOnglet] = useState<SectionDashboard>(ongletInitial);
  const dash = useDashboardAdmin();

  const ongletActif = useMemo(
    () => ONGLETS.find((o) => o.id === onglet) ?? ONGLETS[0],
    [onglet],
  );

  const chargementGlobal =
    dash.overview.chargement ||
    dash.flux.chargement ||
    dash.rdv.chargement ||
    dash.activite.chargement;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold text-[#1f2937]">Tableau de bord administrateur</h1>
        <p className="text-[13px] text-[#5b6472]">
          Indicateurs consolidés sur l'activité de la structure, la qualité des données et les flux patients.
        </p>
      </div>

      {/* Barre de filtres */}
      <FiltresDashboard
        filtres={dash.filtres}
        onChange={(f) => dash.setFiltres(f)}
        onRafraichir={() => dash.charger()}
        chargement={chargementGlobal}
        exportPath={ongletActif.exportPath}
      />

      {/* Alertes globales (toujours visibles) */}
      {dash.alertes.data && (
        <BandeauAlertes alertes={dash.alertes.data.alertes} />
      )}

      {/* Onglets + contenu */}
      <div className={`${CARTE} overflow-hidden`}>
        <div
          role="tablist"
          aria-label="Sections du tableau de bord"
          className="flex overflow-x-auto border-b border-[#e5e7eb] scrollbar-none"
        >
          {ONGLETS.map((o) => {
            const actif = o.id === onglet;
            const Icone = o.icone;
            return (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => setOnglet(o.id)}
                className={`h-12 shrink-0 px-4 flex items-center gap-2 text-sm whitespace-nowrap border-b-2 transition-colors cursor-pointer ${FOCUS} ${
                  actif
                    ? "border-[#1f9d55] font-bold text-[#14703c]"
                    : "border-transparent font-semibold text-[#5b6472] hover:text-[#1f2937]"
                }`}
              >
                <Icone className="h-4 w-4" />
                {o.libelle}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {onglet === "overview" && <VueOverview dash={dash} />}
          {onglet === "flux" && <VueFlux dash={dash} />}
          {onglet === "rendez-vous" && <VueRdv dash={dash} />}
          {onglet === "activite-medicale" && <VueActivite dash={dash} />}
          {onglet === "pharmacie" && <VuePharmacie dash={dash} />}
          {onglet === "prescriptions" && <VuePrescriptions dash={dash} />}
          {onglet === "epidemiologie" && <VueEpidemio dash={dash} />}
          {onglet === "allergies" && <VueAllergies dash={dash} />}
          {onglet === "population" && <VuePopulation dash={dash} />}
          {onglet === "personnel" && <VuePersonnel dash={dash} />}
          {onglet === "qualite-donnees" && <VueQualite dash={dash} />}
        </div>
      </div>
    </div>
  );
};

/* ================================================================ */
/* Vues par section                                                  */
/* ================================================================ */

type Dash = ReturnType<typeof useDashboardAdmin>;

function VueOverview({ dash }: { dash: Dash }) {
  const d = dash.overview.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc
        chargement={dash.overview.chargement}
        erreur={dash.overview.erreur}
        messageVide="Aucune donnée sur la période."
      />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi
              libelle="Patients"
              valeur={d.kpis.patients ?? 0}
              comparaison={comp?.patients ?? null}
            />
            <CarteKpi
              libelle="Passages"
              valeur={d.kpis.passages ?? 0}
              comparaison={comp?.passages ?? null}
            />
            <CarteKpi
              libelle="Rendez-vous"
              valeur={d.kpis.rendezVous ?? 0}
              comparaison={comp?.rendezVous ?? null}
            />
            <CarteKpi
              libelle="Consultations"
              valeur={d.kpis.consultations ?? 0}
              comparaison={comp?.consultations ?? null}
            />
            <CarteKpi
              libelle="Ordonnances"
              valeur={d.kpis.ordonnances ?? 0}
              comparaison={comp?.ordonnances ?? null}
            />
            <CarteKpi
              libelle="Taux de présence"
              valeur={d.kpis.tauxPresence ?? 0}
              suffixe="%"
              comparaison={comp?.tauxPresence ?? null}
            />
            <CarteKpi
              libelle="Attente moyenne"
              valeur={d.kpis.attenteMoyenneMin ?? 0}
              suffixe="min"
              comparaison={comp?.attenteMoyenneMin ?? null}
            />
          </GrilleKpis>

          <Section titre="Évolution sur la période" aide="Patients, RDV, consultations et ordonnances">
            <GraphColonnes
              donnees={d.evolution}
              cleLibelle="jour"
              resume="Évolution quotidienne des patients, RDV, consultations et ordonnances"
              series={[
                { cle: "patients",      libelle: "Patients",      couleur: "#1f9d55" },
                { cle: "rdv",           libelle: "RDV",            couleur: "#3730a3" },
                { cle: "consultations", libelle: "Consultations", couleur: "#e8a317" },
                { cle: "ordonnances",   libelle: "Ordonnances",   couleur: "#b42318" },
              ]}
            />
          </Section>
        </>
      )}
    </div>
  );
}

function VueFlux({ dash }: { dash: Dash }) {
  const d = dash.flux.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.flux.chargement} erreur={dash.flux.erreur} messageVide="Aucun flux." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Tickets émis" valeur={d.kpis.tickets ?? 0} comparaison={comp?.tickets ?? null} />
            <CarteKpi libelle="Attente moyenne" valeur={d.kpis.attenteMoyenneMin ?? 0} suffixe="min" comparaison={comp?.attenteMoyenneMin ?? null} />
            <CarteKpi libelle="Attente P90" valeur={d.kpis.attenteP90Min ?? 0} suffixe="min" comparaison={comp?.attenteP90Min ?? null} />
            <CarteKpi libelle="Attentes > 30 min" valeur={d.kpis.attenteLongue ?? 0} comparaison={comp?.attenteLongue ?? null} />
            <CarteKpi libelle="Appels expirés" valeur={d.kpis.appelsExpires ?? 0} comparaison={comp?.appelsExpires ?? null} />
          </GrilleKpis>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section titre="Affluence par heure" aide="Tickets et rendez-vous">
              <GraphColonnes
                donnees={d.affluenceParHeure}
                cleLibelle="heure"
                resume="Affluence par heure"
                series={[
                  { cle: "tickets", libelle: "Tickets", couleur: "#1f9d55" },
                  { cle: "rdv",     libelle: "RDV",     couleur: "#3730a3" },
                ]}
              />
            </Section>
            <Section titre="Répartition RDV vs walk-in">
              <GraphDonut items={d.repartition} resume="Répartition des passages" />
            </Section>
            <Section titre="Heatmap hebdomadaire" aide="Tickets par jour et par heure" className="lg:col-span-2">
              <Heatmap points={d.heatmap} />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function VueRdv({ dash }: { dash: Dash }) {
  const d = dash.rdv.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.rdv.chargement} erreur={dash.rdv.erreur} messageVide="Aucun RDV." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Total RDV" valeur={d.kpis.total ?? 0} comparaison={comp?.total ?? null} />
            <CarteKpi libelle="Honorés" valeur={d.kpis.honores ?? 0} comparaison={comp?.honores ?? null} />
            <CarteKpi libelle="Absents" valeur={d.kpis.absents ?? 0} comparaison={comp?.absents ?? null} />
            <CarteKpi libelle="Taux de présence" valeur={d.kpis.tauxPresence ?? 0} suffixe="%" comparaison={comp?.tauxPresence ?? null} />
            <CarteKpi libelle="Absentéisme" valeur={d.kpis.tauxAbsenteisme ?? 0} suffixe="%" comparaison={comp?.tauxAbsenteisme ?? null} />
            <CarteKpi libelle="Remplissage agendas" valeur={d.kpis.remplissagePct ?? 0} suffixe="%" comparaison={comp?.remplissagePct ?? null} />
            <CarteKpi libelle="Demandes en attente" valeur={d.kpis.demandesEnAttente ?? 0} comparaison={comp?.demandesEnAttente ?? null} />
            <CarteKpi libelle="Demandes urgentes" valeur={d.kpis.demandesUrgentes ?? 0} comparaison={comp?.demandesUrgentes ?? null} />
          </GrilleKpis>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section titre="RDV par statut">
              <GraphDonut items={d.rdvParStatut} resume="Répartition des RDV par statut" />
            </Section>
            <Section titre="Demandes en attente par spécialité">
              <GraphBarres items={d.demandesEnAttenteParSpecialite} ton="rouge" vide="Aucune demande en attente." />
            </Section>
            <Section titre="Délai demande → RDV (moy. en heures)" className="lg:col-span-2">
              <GraphColonnes
                donnees={d.delaiDemandeRdvParJour.map((x) => ({ jour: x.jour, heures: x.delaiMoyenHeures }))}
                cleLibelle="jour"
                resume="Délai moyen entre demande et RDV par jour"
                series={[{ cle: "heures", libelle: "Heures", couleur: "#e8a317" }]}
              />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function VueActivite({ dash }: { dash: Dash }) {
  const d = dash.activite.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.activite.chargement} erreur={dash.activite.erreur} messageVide="Aucune activité." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Encounters" valeur={d.kpis.encounters ?? 0} comparaison={comp?.encounters ?? null} />
            <CarteKpi libelle="Durée moyenne" valeur={d.kpis.dureeMoyenneMin ?? 0} suffixe="min" comparaison={comp?.dureeMoyenneMin ?? null} />
            <CarteKpi libelle="Actes réalisés" valeur={d.kpis.actesRealises ?? 0} comparaison={comp?.actesRealises ?? null} />
            <CarteKpi libelle="Actes saisis par erreur" valeur={d.kpis.actesSaisisParErreur ?? 0} comparaison={comp?.actesSaisisParErreur ?? null} />
          </GrilleKpis>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section titre="Top 10 des actes réalisés">
              <GraphBarres items={d.topActes} vide="Aucun acte sur la période." />
            </Section>
            <Section titre="Top 10 activité par médecin">
              <GraphBarres items={d.activiteParMedecin} vide="Aucune activité médicale." />
            </Section>
            <Section titre="Évolution quotidienne" className="lg:col-span-2">
              <GraphColonnes
                donnees={d.evolution}
                cleLibelle="jour"
                resume="Évolution des encounters et des actes"
                series={[
                  { cle: "encounters", libelle: "Encounters", couleur: "#1f9d55" },
                  { cle: "actes",      libelle: "Actes",       couleur: "#3730a3" },
                ]}
              />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function VuePharmacie({ dash }: { dash: Dash }) {
  const d = dash.pharmacie.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.pharmacie.chargement} erreur={dash.pharmacie.erreur} messageVide="Aucune donnée pharmacie." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Valeur du stock" valeur={d.kpis.valeurStock ?? 0} suffixe="Ar" comparaison={comp?.valeurStock ?? null} />
            <CarteKpi libelle="Ruptures" valeur={d.kpis.ruptures ?? 0} comparaison={comp?.ruptures ?? null} />
            <CarteKpi libelle="Péremptions < 90j" valeur={d.kpis.peremptionsProches ?? 0} comparaison={comp?.peremptionsProches ?? null} />
            <CarteKpi libelle="Commandes en attente" valeur={d.kpis.commandesEnAttente ?? 0} comparaison={comp?.commandesEnAttente ?? null} />
            <CarteKpi libelle="Transferts" valeur={d.kpis.transfertsPeriode ?? 0} comparaison={comp?.transfertsPeriode ?? null} />
          </GrilleKpis>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section titre="Top 10 médicaments dispensés">
              <GraphBarres items={d.topMedicaments} vide="Aucune dispensation." />
            </Section>
            <Section titre="Lots proches de la péremption" aide="<= 90 jours">
              {d.peremptionsProches.length === 0 ? (
                <p className="text-sm text-[#5b6472] py-4 text-center italic">Aucun lot à surveiller.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-[#5b6472] border-b border-[#f0f2f1]">
                        <th className="py-2 pr-2">Lot</th>
                        <th className="py-2 pr-2">Produit</th>
                        <th className="py-2 pr-2">Péremption</th>
                        <th className="py-2 pr-2 text-right">Stock</th>
                        <th className="py-2 text-right">Jours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.peremptionsProches.map((p) => (
                        <tr key={p.numLot + p.produit} className="border-b border-[#f0f2f1]">
                          <td className="py-2 pr-2 font-mono text-xs font-bold text-[#1f2937]">{p.numLot}</td>
                          <td className="py-2 pr-2 truncate max-w-[160px]">{p.produit}</td>
                          <td className="py-2 pr-2 text-xs">{p.datePeremption}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{p.stock}</td>
                          <td className="py-2 text-right">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${p.joursRestants <= 30 ? "bg-[#b42318]/10 text-[#b42318]" : "bg-[#fff4e0] text-[#8a5300]"}`}>
                              {p.joursRestants}j
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function VuePrescriptions({ dash }: { dash: Dash }) {
  const d = dash.prescriptions.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.prescriptions.chargement} erreur={dash.prescriptions.erreur} messageVide="Aucune prescription." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Créées" valeur={d.kpis.creees ?? 0} comparaison={comp?.creees ?? null} />
            <CarteKpi libelle="Dispensées" valeur={d.kpis.dispensees ?? 0} comparaison={comp?.dispensees ?? null} />
            <CarteKpi libelle="Annulées" valeur={d.kpis.annulees ?? 0} comparaison={comp?.annulees ?? null} />
            <CarteKpi libelle="En attente > 24h" valeur={d.kpis.enAttente24h ?? 0} comparaison={comp?.enAttente24h ?? null} />
            <CarteKpi libelle="Délai moyen" valeur={d.kpis.delaiMoyenHeures ?? 0} suffixe="h" comparaison={comp?.delaiMoyenHeures ?? null} />
          </GrilleKpis>

          <Section titre="Évolution quotidienne">
            <GraphColonnes
              donnees={d.evolution}
              cleLibelle="jour"
              resume="Créées / dispensées / annulées par jour"
              series={[
                { cle: "creees",      libelle: "Créées",      couleur: "#1f9d55" },
                { cle: "dispensees",  libelle: "Dispensées",  couleur: "#3730a3" },
                { cle: "annulees",    libelle: "Annulées",    couleur: "#b42318" },
              ]}
            />
          </Section>
        </>
      )}
    </div>
  );
}

function VueEpidemio({ dash }: { dash: Dash }) {
  const d = dash.epidemio.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.epidemio.chargement} erreur={dash.epidemio.erreur} messageVide="Aucune donnée." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Diagnostics posés" valeur={d.kpis.diagnosticsPoses ?? 0} comparaison={comp?.diagnosticsPoses ?? null} />
            <CarteKpi libelle="Confirmés" valeur={d.kpis.confirmes ?? 0} comparaison={comp?.confirmes ?? null} />
            <CarteKpi libelle="Infirmés" valeur={d.kpis.infirmes ?? 0} comparaison={comp?.infirmes ?? null} />
            <CarteKpi libelle="Provisoires" valeur={d.kpis.provisoires ?? 0} comparaison={comp?.provisoires ?? null} />
            <CarteKpi libelle="Taux de confirmation" valeur={d.kpis.tauxConfirmation ?? 0} suffixe="%" comparaison={comp?.tauxConfirmation ?? null} />
          </GrilleKpis>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section titre="Top 10 CIM-10">
              {d.topCim10.length === 0 ? (
                <p className="text-sm text-[#5b6472] py-4 text-center italic">Aucun diagnostic codé.</p>
              ) : (
                <ul className="space-y-2 pt-1">
                  {d.topCim10.map((c) => (
                    <li key={c.codeCim10 + c.libelle} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-xs font-bold bg-[#e7f6ed] text-[#14703c] rounded px-2 py-0.5 shrink-0">{c.codeCim10}</span>
                      <span className="flex-1 truncate text-[#1f2937]" title={c.libelle}>{c.libelle}</span>
                      <span className="font-bold tabular-nums text-[#1f2937]">{c.valeur}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section titre="Par tranche d'âge">
              <GraphBarres items={d.parTrancheAge} vide="Aucun patient renseigné." />
            </Section>
            <Section titre="Par sexe" className="lg:col-span-2">
              <GraphDonut items={d.parSexe} resume="Répartition par sexe" />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function VueAllergies({ dash }: { dash: Dash }) {
  const d = dash.allergies.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.allergies.chargement} erreur={dash.allergies.erreur} messageVide="Aucune allergie." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Actives" valeur={d.kpis.actives ?? 0} comparaison={comp?.actives ?? null} />
            <CarteKpi libelle="Criticité élevée" valeur={d.kpis.criticiteElevee ?? 0} comparaison={comp?.criticiteElevee ?? null} />
            <CarteKpi libelle="Nouvelles sur la période" valeur={d.kpis.nouvellesPeriode ?? 0} comparaison={comp?.nouvellesPeriode ?? null} />
            <CarteKpi libelle="Réactions sévères" valeur={d.kpis.reactionsSeveres ?? 0} comparaison={comp?.reactionsSeveres ?? null} />
          </GrilleKpis>

          <Section titre="Répartition par catégorie">
            <GraphDonut items={d.parCategorie} resume="Allergies par catégorie" />
          </Section>
        </>
      )}
    </div>
  );
}

function VuePopulation({ dash }: { dash: Dash }) {
  const d = dash.population.data;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.population.chargement} erreur={dash.population.erreur} messageVide="Aucune population." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Patients" valeur={d.kpis.patients ?? 0} />
            <CarteKpi libelle="Agents" valeur={d.kpis.agents ?? 0} />
            <CarteKpi libelle="Ayants droit" valeur={d.kpis.ayantsDroit ?? 0} />
            <CarteKpi libelle="Entreprises" valeur={d.kpis.entreprises ?? 0} />
          </GrilleKpis>

          <Section titre="Pyramide des âges">
            {d.pyramideAges.length === 0 ? (
              <p className="text-sm text-[#5b6472] py-4 text-center italic">Aucune donnée.</p>
            ) : (
              <ul className="space-y-1.5 pt-1">
                {d.pyramideAges.map((t) => {
                  const total = t.hommes + t.femmes + t.nonRenseigne;
                  const maxTotal = Math.max(1, ...d.pyramideAges.map((x) => x.hommes + x.femmes + x.nonRenseigne));
                  return (
                    <li key={t.tranche} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-[#5b6472]">{t.tranche}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#f0f2f1] flex">
                        <span style={{ width: `${(t.hommes / maxTotal) * 100}%`, background: "#1f9d55" }} />
                        <span style={{ width: `${(t.femmes / maxTotal) * 100}%`, background: "#3730a3" }} />
                        <span style={{ width: `${(t.nonRenseigne / maxTotal) * 100}%`, background: "#cbd5e1" }} />
                      </span>
                      <span className="w-14 text-right font-bold tabular-nums text-[#1f2937]">{total}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section titre="Par sexe">
              <GraphDonut items={d.parSexe} resume="Population par sexe" />
            </Section>
            <Section titre="Par groupe sanguin">
              <GraphBarres items={d.parGroupeSanguin} vide="Aucun groupe renseigné." />
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function VuePersonnel({ dash }: { dash: Dash }) {
  const d = dash.personnel.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.personnel.chargement} erreur={dash.personnel.erreur} messageVide="Aucun personnel." />
      {d && (
        <>
          <GrilleKpis>
            <CarteKpi libelle="Comptes actifs" valeur={d.kpis.comptesActifs ?? 0} comparaison={comp?.comptesActifs ?? null} />
            <CarteKpi libelle="Comptes inactifs" valeur={d.kpis.comptesInactifs ?? 0} comparaison={comp?.comptesInactifs ?? null} />
            <CarteKpi libelle="Staff sans affectation" valeur={d.kpis.staffSansAffectation ?? 0} comparaison={comp?.staffSansAffectation ?? null} />
            <CarteKpi libelle="Personnel médical en exercice" valeur={d.kpis.personnelMedicalEnExercice ?? 0} comparaison={comp?.personnelMedicalEnExercice ?? null} />
          </GrilleKpis>

          <Section titre="Top 10 de la charge" aide="Actes réalisés par staff sur la période">
            <GraphBarres items={d.chargeParStaff} vide="Aucune activité sur la période." />
          </Section>
        </>
      )}
    </div>
  );
}

function VueQualite({ dash }: { dash: Dash }) {
  const d = dash.qualite.data;
  const comp = d?.comparaison;
  return (
    <div className="space-y-4">
      <EtatBloc chargement={dash.qualite.chargement} erreur={dash.qualite.erreur} messageVide="Aucune donnée." />
      {d && (
        <GrilleKpis>
          <CarteKpi libelle="Patients total" valeur={d.kpis.patientsTotal ?? 0} comparaison={comp?.patientsTotal ?? null} />
          <CarteKpi libelle="% sans date de naissance" valeur={d.kpis.pctSansDob ?? 0} suffixe="%" comparaison={comp?.pctSansDob ?? null} />
          <CarteKpi libelle="% sans sexe" valeur={d.kpis.pctSansSexe ?? 0} suffixe="%" comparaison={comp?.pctSansSexe ?? null} />
          <CarteKpi libelle="% sans matricule" valeur={d.kpis.pctSansMatricule ?? 0} suffixe="%" comparaison={comp?.pctSansMatricule ?? null} />
          <CarteKpi libelle="Actes sans moule" valeur={d.kpis.actesSansMoule ?? 0} comparaison={comp?.actesSansMoule ?? null} />
          <CarteKpi libelle="Actes incomplets" valeur={d.kpis.actesIncomplets ?? 0} comparaison={comp?.actesIncomplets ?? null} />
        </GrilleKpis>
      )}
    </div>
  );
}

/* Export par défaut */
export default PanneauDashboardAdmin;