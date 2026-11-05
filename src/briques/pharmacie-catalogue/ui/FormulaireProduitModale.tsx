// ui/FormulaireProduitModale.tsx
import React, { useState } from "react";
import { stockApi, refApi } from "@/briques/stock-commun/api";
import { useListe } from "@/briques/stock-commun/useListe";
import type { Option, Produit } from "@/briques/stock-commun/types";
import {
  Alerte,
  Apercu,
  CHAMP,
  Champ,
  Combobox,
  IC,
  Tiroir,
  UNITES_BASE,
  compositionDe,
  detailCond,
  enOption,
  libelleDe,
  nomUnite,
  trier,
  useSoumission,
  type Lien,
} from "./Commun";

export const FormulaireProduitModale: React.FC<{
  produit: Produit | null;
  onTermine: () => void;
  onFermer: () => void;
  onAller?: (rubrique: string) => void;
}> = ({ produit, onTermine, onFermer, onAller }) => {
  const medsBrut = useListe(refApi.medicaments.liste);
  const condsL = useListe(refApi.conditionnements.liste);
  const presL = useListe(refApi.presentations.liste);

  const condsBrut = condsL.items;
  const presBrut = presL.items;

  const lien = (libelle: string, cible: string): Lien[] | undefined =>
    onAller ? [{ libelle, onClick: () => onAller(cible) }] : undefined;

  const [nom, setNom] = useState(produit?.nomCommercial ?? "");
  const [medId, setMedId] = useState<number | "">(produit?.medicamentId ?? "");
  const [condId, setCondId] = useState<number | "">(produit?.conditionnementId ?? "");
  const [presId, setPresId] = useState<number | "">(produit?.presentationId ?? "");
  const [titulaire, setTitulaire] = useState(produit?.titulaire ?? "");
  const [statutAmm, setStatutAmm] = useState(produit?.statutAmm ?? "");
  const s = useSoumission();

  const meds = trier(
    medsBrut.items.map((x: any): Option => ({ id: x.id, libelle: compositionDe(x) })),
    (o) => o.libelle,
  );
  const conds = trier(condsBrut.map(enOption), (o) => o.libelle);
  const press = trier(presBrut.map(enOption), (o) => o.libelle);
  const cond = condsBrut.find((c: any) => c.id === condId);
  const pres = presBrut.find((p: any) => p.id === presId);
  const uniteAvecPlaquette = UNITES_BASE.find((u) => u.valeur === pres?.uniteBase)?.plaquette ?? true;
  const incoherent = !!cond && !!pres && Number(cond.nbUnitesParPlaquette) > 0 && !uniteAvecPlaquette;

  const valider = () => {
    if (!nom.trim()) return s.setErreur("Saisissez le nom commercial.");
    if (!medId) return s.setErreur("Choisissez un médicament.");
    if (!condId) return s.setErreur("Choisissez un conditionnement.");
    const payload = {
      nomCommercial: nom.trim(),
      medicamentId: Number(medId),
      conditionnementId: Number(condId),
      presentationId: presId ? Number(presId) : null,
      titulaire: titulaire.trim() || null,
      statutAmm: statutAmm.trim() || null,
    };
    s.lancer(async () => {
      if (produit) await stockApi.modifierProduit(produit.id, payload);
      else await stockApi.creerProduit(payload);
      onTermine();
    }, "Le produit n'a pas pu être enregistré.");
  };

  return (
    <Tiroir
      titre={produit ? "Modifier le produit" : "Nouveau produit"}
      icone={IC.produits}
      onFermer={onFermer}
      onValider={valider}
      erreur={s.erreur}
      occupe={s.occupe}
      ok={produit ? "Enregistrer" : "Créer"}
    >
      <Champ libelle="Nom commercial" requis>
        <input
          autoFocus={!produit}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Doliprane"
          className={CHAMP}
        />
      </Champ>

      <Combobox
        libelle="Médicament"
        requis
        icone={IC.medicaments}
        options={meds}
        valeur={medId}
        onChange={setMedId}
        placeholder="Rechercher un médicament"
        liens={lien("Médicaments", "medicaments")}
      />

      <Combobox
        libelle="Conditionnement"
        requis
        icone={IC.conditionnements}
        options={conds}
        valeur={condId}
        onChange={setCondId}
        placeholder="Boîte de 3 plaquettes de 10…"
        liens={lien("Conditionnements", "conditionnements")}
      />

      <Combobox
        libelle="Présentation"
        icone={IC.presentations}
        options={press}
        valeur={presId}
        onChange={setPresId}
        placeholder="Comprimé, sirop, injectable…"
        effacable
        liens={lien("Présentations", "presentations")}
      />

      {cond && <Apercu>{detailCond(cond, pres)}</Apercu>}
      {incoherent && (
        <Alerte>
          Conditionnement en plaquettes, mais « {libelleDe(pres)} » se compte en {nomUnite(pres.uniteBase, 2)}.
        </Alerte>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Champ libelle="Titulaire AMM">
          <input
            value={titulaire}
            onChange={(e) => setTitulaire(e.target.value)}
            placeholder="Sanofi"
            className={CHAMP}
          />
        </Champ>
        <Champ libelle="Statut AMM">
          <input
            value={statutAmm}
            onChange={(e) => setStatutAmm(e.target.value)}
            placeholder="Autorisé"
            className={CHAMP}
          />
        </Champ>
      </div>
    </Tiroir>
  );
};
