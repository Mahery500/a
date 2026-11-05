import React, { useEffect, useState } from "react";
import { stockApi } from "./api";
import type { Site } from "./types";

export const SelecteurSite: React.FC<{
  valeur: number | null;
  onChanger: (id: number | null) => void;
}> = ({ valeur, onChanger }) => {
  const [sites, setSites] = useState<Site[]>([]);
  useEffect(() => {
    stockApi
      .sites()
      .then(setSites)
      .catch(() => setSites([]));
  }, []);

  return (
    <select
      value={valeur ?? ""}
      onChange={(e) => onChanger(e.target.value ? Number(e.target.value) : null)}
      className="border rounded-lg px-3 py-2 text-sm"
    >
      <option value="">Tous les sites</option>
      {sites.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
};
