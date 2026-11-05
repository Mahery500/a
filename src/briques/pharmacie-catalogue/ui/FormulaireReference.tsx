// ui/FormulaireReference.tsx
import React, { useState } from "react";
import { CHAMP, Champ, Exemples, Pastille, Tiroir, useSoumission, type FormProps } from "./Commun";

export const FormulaireReference: React.FC<FormProps> = ({ config, item, onTermine, onFermer }) => {
  const [v, setV] = useState<Record<string, any>>(() =>
    Object.fromEntries(config.champs.map((c) => [c.cle, item ? (item[c.cle] ?? "") : (c.defaut ?? "")])),
  );
  const s = useSoumission();
  const set = (cle: string, val: any) => setV((p) => ({ ...p, [cle]: val }));

  const valider = () => {
    for (const c of config.champs) {
      if (c.requis && (v[c.cle] === "" || v[c.cle] == null)) return s.setErreur(`Renseignez « ${c.libelle} ».`);
    }
    const payload = Object.fromEntries(
      config.champs.map((c) => [c.cle, typeof v[c.cle] === "string" ? v[c.cle].trim() || null : v[c.cle]]),
    );
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
      {!item && config.exemples && (
        <Exemples
          exemples={config.exemples}
          courant={v}
          onChoisir={(e) => setV((p) => ({ ...p, ...e.valeurs }))}
        />
      )}

      {config.champs.map((c, i) => (
        <Champ key={c.cle} libelle={c.libelle} requis={c.requis} aide={c.aide}>
          {c.type === "pastilles" ? (
            <div className="flex flex-wrap gap-2">
              {c.choix!.map((f) => (
                <Pastille key={f.valeur} actif={v[c.cle] === f.valeur} onClick={() => set(c.cle, f.valeur)}>
                  {f.libelle}
                </Pastille>
              ))}
            </div>
          ) : (
            <input
              autoFocus={i === 0 && !config.exemples}
              value={v[c.cle] ?? ""}
              placeholder={c.placeholder}
              onChange={(e) => set(c.cle, e.target.value)}
              className={CHAMP}
            />
          )}
        </Champ>
      ))}
    </Tiroir>
  );
};