// ui/FormulaireMedicament.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { refApi } from "@/briques/stock-commun/api";
import { useListe } from "@/briques/stock-commun/useListe";
import type { Option } from "@/briques/stock-commun/types";
import {
  CHAMP,
  Champ,
  Combobox,
  FORCE_VALIDE,
  IC,
  Pastille,
  Tiroir,
  famillesDe,
  libelleDe,
  ligneVide,
  lignesDe,
  listeFamilles,
  listeFormes,
  listePrincipes,
  listeVoies,
  normaliserForce,
  trier,
  useSoumission,
  type LigneComposition,
  type Lien,
} from "./Commun";

export const FormulaireMedicament: React.FC<{
  item: any | null;
  onTermine: () => void;
  onFermer: () => void;
  onAller?: (rubrique: string) => void;
}> = ({ item, onTermine, onFermer, onAller }) => {
  const famillesL = useListe(listeFamilles);
  const principesL = useListe(listePrincipes);
  const formesL = useListe(listeFormes);
  const voiesL = useListe(listeVoies);
  const unitesL = useListe(refApi.unitesMesure.liste);

  const familles = famillesL.items;
  const principes = principesL.items;
  const formes = formesL.items;
  const voies = voiesL.items;
  const unites = unitesL.items;

  const lien = (libelle: string, cible: string): Lien[] | undefined =>
    onAller ? [{ libelle, onClick: () => onAller(cible) }] : undefined;

  const [nom, setNom] = useState<string>(item?.nomNormalise ?? "");
  const [nomManuel, setNomManuel] = useState(!!item);
  const [formeId, setFormeId] = useState<number | "">(item?.formeId ?? "");
  const [voieId, setVoieId] = useState<number | "">(item?.voieId ?? "");
  const [familleIds, setFamilleIds] = useState<number[]>(item ? famillesDe(item) : []);
  const [lignes, setLignes] = useState<LigneComposition[]>(() => {
    const l = item ? lignesDe(item) : [];
    return l.length ? l : [ligneVide()];
  });
  const s = useSoumission();

  const majLigne = (i: number, c: Partial<LigneComposition>) =>
    setLignes((p) => p.map((l, k) => (k === i ? { ...l, ...c } : l)));
  const basculer = (id: number) =>
    setFamilleIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const optionsUnites = useMemo(
    () =>
      trier(
        unites.map(
          (u: any): Option => ({
            id: u.id,
            libelle: u.code ? `${u.code} (${libelleDe(u)})` : libelleDe(u),
          }),
        ),
        (o) => o.libelle,
      ),
    [unites],
  );

  const codeUnite = new Map<number, string>(unites.map((u: any) => [u.id, u.code ?? libelleDe(u)]));
  const nomsPrincipes = new Map(principes.map((o) => [o.id, o.libelle]));
  const nomForme = formes.find((f) => f.id === formeId)?.libelle;

  const texteLigne = (l: LigneComposition) => {
    const force = normaliserForce(l.forceNum);
    const unite = l.uniteNumId ? codeUnite.get(Number(l.uniteNumId)) : "";
    return `${nomsPrincipes.get(Number(l.principeActifId)) ?? "…"}${force ? ` ${force}${unite ? ` ${unite}` : ""}` : ""}`;
  };

  const composition = lignes
    .filter((l) => l.principeActifId && l.role === "actif")
    .map(texteLigne)
    .join(" + ");
  const suggestion = composition ? `${composition}${nomForme ? ` ${nomForme.toLowerCase()}` : ""}` : "";

  useEffect(() => {
    if (!nomManuel && suggestion) setNom(suggestion);
  }, [suggestion, nomManuel]);

  const valider = () => {
    if (!formeId) return s.setErreur("Choisissez la forme du médicament.");
    const valides = lignes.filter((l) => l.principeActifId);
    if (valides.length === 0) return s.setErreur("Ajoutez au moins un principe actif.");
    if (!valides.some((l) => l.role === "actif"))
      return s.setErreur("Au moins un ingrédient doit avoir le rôle « Actif ».");
    if (new Set(valides.map((l) => l.principeActifId)).size !== valides.length)
      return s.setErreur("Un principe actif ne peut apparaître qu’une seule fois.");
    for (const l of valides) {
      const force = normaliserForce(l.forceNum);
      if (force === "") continue;
      const nomPa = nomsPrincipes.get(Number(l.principeActifId)) ?? "ce principe actif";
      if (!FORCE_VALIDE.test(force) || Number(force) <= 0)
        return s.setErreur(`La force de « ${nomPa} » doit être un nombre positif (ex. 500 ou 0.5).`);
      if (!l.uniteNumId) return s.setErreur(`Choisissez l’unité de la force de « ${nomPa} ».`);
    }
    if (!nom.trim()) return s.setErreur("Renseignez le nom du médicament.");

    const payload = {
      nomNormalise: nom.trim(),
      formeId: Number(formeId),
      voieId: voieId ? Number(voieId) : null,
      familleIds,
      ingredients: valides.map((l) => {
        const force = normaliserForce(l.forceNum);
        return {
          principeActifId: Number(l.principeActifId),
          role: l.role,
          forceNum: force === "" ? null : force,
          uniteNumId: force === "" ? null : Number(l.uniteNumId),
        };
      }),
    };
    s.lancer(async () => {
      if (item) await refApi.medicaments.modifier(item.id, payload);
      else await refApi.medicaments.creer(payload);
      onTermine();
    }, "L'enregistrement a échoué.");
  };

  const liensComposition: Lien[] | undefined = onAller
    ? [
        { libelle: "Principes", onClick: () => onAller("principes") },
        { libelle: "Unités", onClick: () => onAller("unites") },
      ]
    : undefined;

  return (
    <Tiroir
      titre={item ? "Modifier le médicament" : "Nouveau médicament"}
      icone={IC.medicaments}
      onFermer={onFermer}
      onValider={valider}
      erreur={s.erreur}
      occupe={s.occupe}
      ok={item ? "Enregistrer" : "Créer"}
    >
      <Combobox
        libelle="Forme"
        requis
        icone={IC.formes}
        options={formes}
        valeur={formeId}
        onChange={setFormeId}
        placeholder="Comprimé, sirop, injectable…"
        liens={lien("Formes", "formes")}
      />

      <Champ libelle="Composition" requis liens={liensComposition}>
        <div className="space-y-2">
          {lignes.map((l, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/40 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Combobox
                    icone={IC.principes}
                    options={principes}
                    valeur={l.principeActifId}
                    onChange={(v) => majLigne(i, { principeActifId: v })}
                    placeholder="Principe actif"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLignes((p) => p.filter((_, k) => k !== i))}
                  disabled={lignes.length === 1}
                  aria-label="Retirer ce principe actif"
                  className="mt-0.5 rounded p-2 text-gray-500 transition hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  aria-label="Force"
                  inputMode="decimal"
                  value={l.forceNum}
                  onChange={(e) => majLigne(i, { forceNum: e.target.value })}
                  placeholder="Force"
                  className={CHAMP}
                />
                <Combobox
                  icone={IC.unites}
                  options={optionsUnites}
                  valeur={l.uniteNumId}
                  onChange={(v) => majLigne(i, { uniteNumId: v })}
                  placeholder="Unité"
                />
                <select
                  aria-label="Rôle"
                  value={l.role}
                  onChange={(e) => majLigne(i, { role: e.target.value === "adjuvant" ? "adjuvant" : "actif" })}
                  className={CHAMP}
                >
                  <option value="actif">Actif</option>
                  <option value="adjuvant">Adjuvant</option>
                </select>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLignes((p) => [...p, ligneVide()])}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-2 text-sm text-gray-600 transition hover:border-teal-600 hover:bg-teal-50/50 hover:text-teal-800"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </Champ>

      <Champ libelle="Nom" requis>
        <input
          value={nom}
          placeholder="Paracétamol 500 mg comprimé"
          onChange={(e) => {
            setNom(e.target.value);
            setNomManuel(e.target.value !== "");
          }}
          className={CHAMP}
        />
        {suggestion && nom !== suggestion && (
          <button
            type="button"
            onClick={() => {
              setNom(suggestion);
              setNomManuel(false);
            }}
            className="mt-1.5 text-xs text-teal-700 hover:underline"
          >
            Utiliser « {suggestion} »
          </button>
        )}
      </Champ>

      <Combobox
        libelle="Voie d’administration"
        icone={IC.voies}
        options={voies}
        valeur={voieId}
        onChange={setVoieId}
        placeholder="Voie orale, injectable…"
        effacable
        liens={lien("Voies", "voies")}
      />

      <Champ libelle="Familles" liens={lien("Familles", "familles")}>
        <div className="flex flex-wrap gap-2">
          {familles.map((f) => (
            <Pastille key={f.id} actif={familleIds.includes(f.id)} onClick={() => basculer(f.id)}>
              {f.libelle}
            </Pastille>
          ))}
          {familles.length === 0 && <span className="text-sm text-gray-400">Aucune famille.</span>}
        </div>
      </Champ>
    </Tiroir>
  );
};