// ui/FormulaireUnite.tsx
import React, { useState } from "react";
import {
  CHAMP,
  Champ,
  Choix,
  Tiroir,
  UCUM_CATEGORIES,
  UCUM_COURANTS,
  useSoumission,
  type FormProps,
} from "./Commun";

export const FormulaireUnite: React.FC<FormProps> = ({ config, item, onTermine, onFermer }) => {
  const codeInitial = item?.code ?? "";
  const estUcum = UCUM_COURANTS.some((u) => u.code === codeInitial);
  const [libre, setLibre] = useState<boolean>(!!item && !estUcum);
  const [libelle, setLibelle] = useState<string>(item?.libelle ?? "");
  const [code, setCode] = useState<string>(codeInitial);
  const [libelleAuto, setLibelleAuto] = useState<boolean>(!item);
  const s = useSoumission();

  const choisirCode = (nouveau: string) => {
    setCode(nouveau);
    const u = UCUM_COURANTS.find((x) => x.code === nouveau);
    if (u && libelleAuto) setLibelle(u.libelle);
  };

  const choisirMode = (m: "ucum" | "libre") => {
    if ((m === "libre") === libre) return;
    setLibre(m === "libre");
    setCode("");
    setLibelle("");
    setLibelleAuto(true);
  };

  const valider = () => {
    if (!libelle.trim()) return s.setErreur("Renseignez le libellé.");
    if (!code.trim()) return s.setErreur(libre ? "Saisissez un code." : "Choisissez un code UCUM.");
    const payload = { libelle: libelle.trim(), code: code.trim() };
    s.lancer(async () => {
      if (item) await config.api.modifier(item.id, payload);
      else await config.api.creer(payload);
      onTermine();
    }, "L'enregistrement a échoué.");
  };

  const ucumChoisi = UCUM_COURANTS.find((u) => u.code === code);

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
      <Choix
        valeur={libre ? "libre" : "ucum"}
        onChange={choisirMode}
        options={[
          { valeur: "ucum", titre: "Code UCUM", detail: "mg, mL, [iU]…" },
          { valeur: "libre", titre: "Code libre", detail: "comprimé, boîte…" },
        ]}
      />

      {!libre ? (
        <div className="space-y-3">
          {UCUM_CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{cat.titre}</div>
              <div className="grid grid-cols-2 gap-2">
                {UCUM_COURANTS.filter((u) => u.categorie === cat.id).map((u) => {
                  const actif = code === u.code;
                  return (
                    <button
                      key={u.code}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => choisirCode(u.code)}
                      className={`rounded-lg border px-3 py-2 text-left transition ${
                        actif
                          ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                          : "border-gray-200 bg-white hover:border-teal-500"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{u.libelle}</div>
                      <div className="font-mono text-xs text-gray-500">{u.code}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Champ libelle="Code" requis>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="comprimé, boîte, flacon"
            className={CHAMP}
          />
        </Champ>
      )}

      <Champ libelle="Libellé" requis>
        <input
          value={libelle}
          onChange={(e) => {
            setLibelle(e.target.value);
            setLibelleAuto(false);
          }}
          placeholder="Milligramme"
          className={CHAMP}
        />
        {!libre && ucumChoisi && libelle !== ucumChoisi.libelle && (
          <button
            type="button"
            onClick={() => {
              setLibelle(ucumChoisi.libelle);
              setLibelleAuto(true);
            }}
            className="mt-1.5 text-xs text-teal-700 hover:underline"
          >
            Utiliser « {ucumChoisi.libelle} »
          </button>
        )}
      </Champ>
    </Tiroir>
  );
};