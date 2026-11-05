// ui/FormulaireConditionnement.tsx
import React, { useEffect, useState } from "react";
import {
  Apercu,
  CHAMP,
  Champ,
  Choix,
  Exemples,
  Tiroir,
  useSoumission,
  type Exemple,
  type FormProps,
} from "./Commun";

export const EXEMPLES_COND: Exemple[] = [
  {
    titre: "3 plaquettes de 10",
    detail: "30 unités · BT30",
    groupe: "En plaquettes",
    valeurs: { mode: "plaquettes", nbPlaq: "3", uPlaq: "10", code: "BT30" },
  },
  {
    titre: "2 plaquettes de 10",
    detail: "20 unités · BT20",
    groupe: "En plaquettes",
    valeurs: { mode: "plaquettes", nbPlaq: "2", uPlaq: "10", code: "BT20" },
  },
  {
    titre: "10 plaquettes de 10",
    detail: "100 unités · BT100",
    groupe: "En plaquettes",
    valeurs: { mode: "plaquettes", nbPlaq: "10", uPlaq: "10", code: "BT100" },
  },
  {
    titre: "2 plaquettes de 8",
    detail: "16 unités · BT16",
    groupe: "En plaquettes",
    valeurs: { mode: "plaquettes", nbPlaq: "2", uPlaq: "8", code: "BT16" },
  },
  {
    titre: "Boîte de 1",
    detail: "Flacon, tube · BT1",
    groupe: "À l’unité",
    valeurs: { mode: "direct", uBoite: "1", code: "BT1" },
  },
  {
    titre: "Boîte de 5",
    detail: "Ampoules · BT5",
    groupe: "À l’unité",
    valeurs: { mode: "direct", uBoite: "5", code: "BT5" },
  },
  {
    titre: "Boîte de 10",
    detail: "Ampoules, sachets · BT10",
    groupe: "À l’unité",
    valeurs: { mode: "direct", uBoite: "10", code: "BT10" },
  },
  {
    titre: "Boîte de 100",
    detail: "Vrac · BT100U",
    groupe: "À l’unité",
    valeurs: { mode: "direct", uBoite: "100", code: "BT100U" },
  },
];

export const FormulaireConditionnement: React.FC<FormProps> = ({ config, item, onTermine, onFermer }) => {
  const upp0 = Number(item?.nbUnitesParPlaquette) || 0;
  const b0 = Number(item?.nbUnitesParBoite) || 0;
  const divisible = upp0 > 0 && b0 > 0 && b0 % upp0 === 0;

  const [mode, setMode] = useState<"plaquettes" | "direct">(divisible ? "plaquettes" : "direct");
  const [libelle, setLibelle] = useState<string>(item?.libelle ?? "");
  const [libelleManuel, setLibelleManuel] = useState(!!item);
  const [code, setCode] = useState<string>(item?.code ?? "");
  const [nbPlaq, setNbPlaq] = useState<string>(divisible ? String(b0 / upp0) : "");
  const [uPlaq, setUPlaq] = useState<string>(divisible ? String(upp0) : "");
  const [uBoite, setUBoite] = useState<string>(!divisible && b0 ? String(b0) : "");
  const s = useSoumission();

  const nP = Number(nbPlaq);
  const uP = Number(uPlaq);
  const uB = Number(uBoite);
  const total = mode === "plaquettes" ? nP * uP : uB;
  const valide = mode === "plaquettes" ? nP >= 1 && uP >= 1 : uB >= 1;
  const suggestion = valide
    ? mode === "plaquettes"
      ? `Boîte de ${nP} plaquette${nP > 1 ? "s" : ""} de ${uP}`
      : `Boîte de ${uB}`
    : "";

  useEffect(() => {
    if (!libelleManuel && suggestion) setLibelle(suggestion);
  }, [suggestion, libelleManuel]);

  const apercu = valide
    ? mode === "plaquettes"
      ? `${nP} plaquette${nP > 1 ? "s" : ""} × ${uP} = ${total} unités par boîte`
      : `${total} unité${total > 1 ? "s" : ""} par boîte`
    : "";

  const choisirExemple = (e: Exemple) => {
    const x = e.valeurs;
    setMode(x.mode);
    setNbPlaq(x.nbPlaq ?? "");
    setUPlaq(x.uPlaq ?? "");
    setUBoite(x.uBoite ?? "");
    setCode(x.code ?? "");
    setLibelleManuel(false); // le libellé se régénère automatiquement
  };

  const valider = () => {
    if (!libelle.trim()) return s.setErreur("Renseignez le libellé.");
    if (!valide)
      return s.setErreur(
        mode === "plaquettes"
          ? "Indiquez le nombre de plaquettes et le nombre d’unités par plaquette."
          : "Indiquez le nombre d’unités par boîte.",
      );
    const payload = {
      libelle: libelle.trim(),
      code: code.trim() || null,
      nbUnitesParBoite: total,
      nbUnitesParPlaquette: mode === "plaquettes" ? uP : null,
    };
    s.lancer(async () => {
      if (item) await config.api.modifier(item.id, payload);
      else await config.api.creer(payload);
      onTermine();
    }, "L'enregistrement a échoué.");
  };

  return (
    <Tiroir
      titre={item ? config.modifier : config.nouveau}
      icone={config.icone}
      onFermer={onFermer}
      onValider={valider}
      erreur={s.erreur}
      occupe={s.occupe}
      ok={item ? "Enregistrer" : "Créer"}
    >
      {!item && (
        <Exemples
          exemples={EXEMPLES_COND}
          courant={{ mode, nbPlaq, uPlaq, uBoite, code }}
          onChoisir={choisirExemple}
        />
      )}

      <Choix
        valeur={mode}
        onChange={setMode}
        options={[
          { valeur: "plaquettes", titre: "En plaquettes", detail: "Comprimés, gélules" },
          { valeur: "direct", titre: "À l’unité", detail: "Flacon, ampoule, sachet…" },
        ]}
      />

      {mode === "plaquettes" ? (
        <div className="grid grid-cols-2 gap-3">
          <Champ libelle="Plaquettes par boîte" requis>
            <input
              autoFocus
              type="number"
              min={1}
              inputMode="numeric"
              value={nbPlaq}
              placeholder="3"
              onChange={(e) => setNbPlaq(e.target.value)}
              className={CHAMP}
            />
          </Champ>
          <Champ libelle="Unités par plaquette" requis>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={uPlaq}
              placeholder="10"
              onChange={(e) => setUPlaq(e.target.value)}
              className={CHAMP}
            />
          </Champ>
        </div>
      ) : (
        <Champ libelle="Unités par boîte" requis>
          <input
            autoFocus
            type="number"
            min={1}
            inputMode="numeric"
            value={uBoite}
            placeholder="10"
            onChange={(e) => setUBoite(e.target.value)}
            className={CHAMP}
          />
        </Champ>
      )}

      {apercu && <Apercu>{apercu}</Apercu>}

      <Champ libelle="Libellé" requis>
        <input
          value={libelle}
          placeholder="Boîte de 3 plaquettes de 10"
          onChange={(e) => {
            setLibelle(e.target.value);
            setLibelleManuel(e.target.value !== "");
          }}
          className={CHAMP}
        />
        {suggestion && libelle !== suggestion && (
          <button
            type="button"
            onClick={() => {
              setLibelle(suggestion);
              setLibelleManuel(false);
            }}
            className="mt-1.5 text-xs text-teal-700 hover:underline"
          >
            Utiliser « {suggestion} »
          </button>
        )}
      </Champ>

      <Champ libelle="Code">
        <input value={code} placeholder="BT30" onChange={(e) => setCode(e.target.value)} className={CHAMP} />
      </Champ>
    </Tiroir>
  );
};