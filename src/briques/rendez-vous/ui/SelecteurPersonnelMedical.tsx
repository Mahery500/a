import { ChevronDown, UserRound } from 'lucide-react';
import { usePersonnelMedical } from '../hooks/usePersonnelMedical';

const CHAMP =
  'h-12 w-full appearance-none rounded-[10px] border border-[#e5e7eb] bg-white pl-9 pr-9 text-sm text-[#1f2937] transition ' +
  'focus:border-[#1f9d55] focus:outline-none focus:ring-2 focus:ring-[#1f9d55]/30 ' +
  'disabled:cursor-not-allowed disabled:bg-[#fafbfa] disabled:text-[#5b6472] md:h-10';

interface Props {
  valeur: number | undefined;
  changer: (id: number) => void;
  siteId: number;
  /** true en modification : le propriétaire de l'agenda ne change pas. */
  verrouille?: boolean;
}

export function SelecteurPersonnelMedical({ valeur, changer, siteId, verrouille = false }: Props) {
  // Création : personnel médical du site sans agenda. Modification : tout le personnel médical du site.
  const { data, isLoading, isError } = usePersonnelMedical(siteId, !verrouille);
  const personnel = Array.isArray(data) ? data : [];

  return (
    <div>
      <label htmlFor="agenda-staff" className="mb-1.5 block text-xs font-bold text-[#5b6472]">
        Membre du personnel <span className="text-[#b42318]">*</span>
      </label>

      <div className="relative">
        <UserRound
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
          aria-hidden="true"
        />
        <select
          id="agenda-staff"
          className={CHAMP}
          value={valeur ?? ''}
          disabled={isLoading || verrouille}
          onChange={(e) => changer(Number(e.target.value))}
        >
          <option value="" disabled>
            {isLoading ? 'Chargement…' : 'Choisir un membre du personnel'}
          </option>
          {personnel.map((p) => (
            <option key={p.id} value={p.id}>
              {p.corps}
              {p.specialite ? ` · ${p.specialite}` : ''} — {p.prenom} {p.nom}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6472]"
          aria-hidden="true"
        />
      </div>

      {isError && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-[#b42318]">
          Impossible de charger la liste du personnel.
        </p>
      )}
      {!verrouille && !isLoading && !isError && personnel.length === 0 && (
        <p className="mt-1.5 text-xs text-[#5b6472]">
          Aucun membre du personnel médical affecté à ce site n'est disponible pour un nouvel agenda.
        </p>
      )}
    </div>
  );
}