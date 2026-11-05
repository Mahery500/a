/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PanneauTableauBordAccueil.tsx - ASINA Médical
 * Emplacement : briques/tableau-bord-accueil/ui/PanneauTableauBordAccueil.tsx
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Ticket,
  UserCheck,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useStatsAccueil } from '../hooks/useStatsAccueil';
import { FiltreDates, plageAujourdhui, type PlageDates } from './Filtredates';
import { CHARTE, CLASSE_FOCUS, COULEUR_STATUT } from './charte';
import { BandeauStats } from './BandeauStats';
import { Carte, Colonnes } from './CarteGraphique';
import {
  BarreHorizontale,
  Repartition,
  Squelette,
  Vide,
  nombre,
} from './BriquesTableauBord';

const MAX_ENTREPRISES = 8;

export interface PanneauTableauBordAccueilProps {
  siteId?: number | null;
  onNaviguerVersTickets?: () => void;
  onNaviguerVersEntreprises?: () => void;
}

export const PanneauTableauBordAccueil: React.FC<PanneauTableauBordAccueilProps> = ({
  siteId,
  onNaviguerVersTickets,
  onNaviguerVersEntreprises,
}) => {
  const [plage, setPlage] = useState<PlageDates>(plageAujourdhui);
  const { data, chargement, erreur, recharger } = useStatsAccueil(siteId, plage);

  const entreprises = data?.patientsParEntreprise ?? [];
  const topEntreprises = entreprises.slice(0, MAX_ENTREPRISES);
  const autresEntreprises = entreprises.length - topEntreprises.length;
  const maxPatients = Math.max(0, ...entreprises.map((e) => e.patients));
  const totalPatientsEntreprises = entreprises.reduce((s, e) => s + e.patients, 0);

  const maxService = Math.max(0, ...(data?.ticketsParService ?? []).map((s) => s.valeur));

  return (
    <div className="mx-auto max-w-[1400px] space-y-[14px]" style={{ padding: '20px 24px', color: CHARTE.encre }}>
      {/* En-tête : titre 22 px gras, sous-titre 13 px gris */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold" style={{ color: CHARTE.encre }}>
            Tableau de bord
          </h2>
          <p className="text-[13px]" style={{ color: CHARTE.secondaire }}>
            Activité de l'accueil : affluence, attente et rendez-vous
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <FiltreDates valeur={plage} onChange={setPlage} />
          {/* Bouton secondaire : blanc, bordure grise, 40 px (48 px mobile), rayon 10 px */}
          <button
            type="button"
            onClick={recharger}
            className={`inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-[10px] border px-4 text-[14px] font-bold md:min-h-[40px] ${CLASSE_FOCUS}`}
            style={{ background: CHARTE.surface, borderColor: CHARTE.bordure, color: CHARTE.encre }}
          >
            <RefreshCw className={`h-4 w-4 ${chargement ? 'animate-spin text-[#1f9d55]' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {chargement && (
        <div
          role="status"
          className="rounded-[14px] border p-4"
          style={{ background: CHARTE.surface, borderColor: CHARTE.bordure }}
        >
          <p className="mb-3 text-[14px]" style={{ color: CHARTE.secondaire }}>
            Chargement des statistiques…
          </p>
          <Squelette />
        </div>
      )}

      {erreur && !chargement && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[14px] border p-4 text-[14px]"
          style={{ background: CHARTE.erreurFond, borderColor: CHARTE.erreurBord, color: CHARTE.erreur }}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Impossible de charger les statistiques</p>
            <p className="mt-1">{erreur}</p>
          </div>
        </div>
      )}

      {data && !chargement && (
        <>
          {/* Bandeau de stats : une seule ligne blanche */}
          <BandeauStats
            items={[
              {
                libelle: 'Patients',
                valeur: data.repertoire?.total ?? 0,
                detail: `${nombre(data.repertoire?.salaries ?? 0)} salariés · ${nombre(data.repertoire?.ayantsDroit ?? 0)} ayants droit`,
                ton: 'indigo',
                Icone: Users,
              },
              {
                libelle: 'Rendez-vous',
                valeur: data.kpis.rendezVous,
                detail: 'Sur la période',
                ton: 'indigo',
                Icone: CalendarCheck,
              },
              {
                libelle: 'Tickets en attente',
                valeur: data.kpis.ticketsEnAttente,
                detail: 'À prendre en charge',
                ton: data.kpis.ticketsEnAttente > 0 ? 'ambre' : 'vert',
                Icone: Ticket,
              },
              {
                libelle: 'Attente moyenne',
                valeur: `${data.kpis.tempsAttenteMoyenMin} min`,
                detail: 'Par ticket',
                ton: 'indigo',
                Icone: Clock,
              },
              {
                libelle: 'Taux de présence',
                valeur: `${data.kpis.tauxPresence} %`,
                detail: 'Rendez-vous honorés',
                ton: 'vert',
                Icone: UserCheck,
              },
              {
                libelle: 'Rendez-vous honorés',
                valeur: data.rdvParStatut.find((s) => s.nom === 'Honoré')?.valeur ?? 0,
                detail: 'Patients venus',
                ton: 'vert',
                Icone: CheckCircle2,
              },
            ]}
          />

          {/* Alerte ambre : icône + texte */}
          {data.kpis.ticketsAttenteLongue > 0 && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-[10px] px-4 py-3 text-[14px] font-bold border"
              style={{ background: CHARTE.alerteFond, borderColor: '#fed7aa', color: CHARTE.alerteTexte }}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>
                  {data.kpis.ticketsAttenteLongue} ticket{data.kpis.ticketsAttenteLongue > 1 ? 's' : ''} en attente depuis plus de 30 minutes
                </span>
              </div>
              {onNaviguerVersTickets && (
                <button
                  type="button"
                  onClick={onNaviguerVersTickets}
                  className={`inline-flex items-center gap-1 text-[13px] font-bold underline hover:no-underline cursor-pointer ${CLASSE_FOCUS}`}
                >
                  <span>Gérer la file</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <div className="grid gap-[14px] lg:grid-cols-2">
            <Carte titre="Affluence par heure" aide="Tickets et rendez-vous">
              {data.affluenceParHeure.length === 0 ? (
                <Vide message="Aucune affluence enregistrée." />
              ) : (
                <Colonnes
                  donnees={data.affluenceParHeure}
                  cleLibelle="heure"
                  resume="Nombre de tickets et de rendez-vous par heure"
                  series={[
                    { cle: 'tickets', libelle: 'Tickets', couleur: CHARTE.primaire },
                    { cle: 'rdv', libelle: 'Rendez-vous', couleur: CHARTE.serie2 },
                  ]}
                />
              )}
            </Carte>

            <Carte titre="Temps d'attente moyen par heure" aide="En minutes">
              {data.tempsAttenteParHeure.length === 0 ? (
                <Vide message="Aucun temps d'attente enregistré." />
              ) : (
                <Colonnes
                  donnees={data.tempsAttenteParHeure}
                  cleLibelle="heure"
                  resume="Temps d'attente moyen en minutes par heure"
                  series={[{ cle: 'minutes', libelle: 'Minutes', couleur: CHARTE.alerteTexte }]}
                />
              )}
            </Carte>

            <Carte
              titre="Évolution de l'activité"
              aide="Patients et rendez-vous sur la période"
              className="lg:col-span-2"
            >
              {data.evolution.length === 0 ? (
                <Vide message="Aucune activité sur la période." />
              ) : (
                <Colonnes
                  donnees={data.evolution}
                  cleLibelle="jour"
                  resume="Nombre de patients et de rendez-vous par jour"
                  series={[
                    { cle: 'patients', libelle: 'Patients', couleur: CHARTE.primaire },
                    { cle: 'rdv', libelle: 'Rendez-vous', couleur: CHARTE.serie2 },
                  ]}
                />
              )}
            </Carte>

            <Carte
              titre="Rendez-vous par statut"
              aide={`${nombre(data.rdvParStatut.reduce((s, r) => s + r.valeur, 0))} rendez-vous`}
            >
              {data.rdvParStatut.every((s) => s.valeur === 0) ? (
                <Vide message="Aucun rendez-vous sur la période." />
              ) : (
                <Repartition
                  resume="Répartition des rendez-vous par statut"
                  parts={data.rdvParStatut.map((s) => ({
                    libelle: s.nom,
                    valeur: s.valeur,
                    couleur: COULEUR_STATUT[s.nom] ?? CHARTE.serie2,
                  }))}
                />
              )}
            </Carte>

            <Carte titre="Tickets par service" aide="Nombre de tickets sur la période">
              {data.ticketsParService.length === 0 ? (
                <Vide message="Aucun ticket sur la période." />
              ) : (
                <ul className="space-y-2.5 pt-1">
                  {data.ticketsParService.map((s) => (
                    <BarreHorizontale key={s.nom} libelle={s.nom} valeur={s.valeur} max={maxService} ton="indigo" />
                  ))}
                </ul>
              )}
            </Carte>

            {/* Patients par entreprise */}
            <Carte
              titre="Patients par entreprise"
              aide={`${nombre(totalPatientsEntreprises)} patients · ${nombre(entreprises.length)} entreprises · tout le répertoire`}
              action={
                onNaviguerVersEntreprises ? (
                  <button
                    type="button"
                    onClick={onNaviguerVersEntreprises}
                    className={`inline-flex items-center gap-1 text-[12px] font-bold hover:underline cursor-pointer ${CLASSE_FOCUS}`}
                    style={{ color: CHARTE.primaireFonce }}
                  >
                    <span>Voir l'annuaire</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : undefined
              }
            >
              {entreprises.length === 0 ? (
                <Vide message="Aucun patient rattaché à une entreprise." />
              ) : (
                <>
                  <ul className="space-y-2.5 pt-1">
                    {topEntreprises.map((e) => (
                      <BarreHorizontale key={e.id} libelle={e.entreprise} valeur={e.patients} max={maxPatients} ton="vert" />
                    ))}
                  </ul>
                  {autresEntreprises > 0 && (
                    <p className="mt-3 text-[12px]" style={{ color: CHARTE.secondaire }}>
                      + {nombre(autresEntreprises)} autre{autresEntreprises > 1 ? 's' : ''} entreprise{autresEntreprises > 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </Carte>
          </div>
        </>
      )}
    </div>
  );
};
