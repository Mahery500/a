/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clientHttp } from "@/noyau/http/clientHttp";
import { extraireElementsCollection } from "@/noyau/http/collection";
import type { CorpsMedicalOption, SpecialiteOption } from "./habilitations.types";

function mapperReferentiel<T extends { id: number; code: string; libelle: string; actif: boolean }>(
  brut: unknown,
): T | null {
  if (!brut || typeof brut !== "object") return null;
  const o = brut as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    code: String(o.code ?? "").trim().toUpperCase(),
    libelle: String(o.libelle ?? "").trim(),
    actif: typeof o.actif === "boolean" ? o.actif : true,
  } as T;
}

export const habilitationsApi = {
  async listerCorpsMedicaux(): Promise<CorpsMedicalOption[]> {
    const raw = await clientHttp<unknown>("/corps_medicaux");
    return extraireElementsCollection<unknown>(raw)
      .map(mapperReferentiel<CorpsMedicalOption>)
      .filter((c): c is CorpsMedicalOption => c !== null && c.actif)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },

  async listerSpecialites(): Promise<SpecialiteOption[]> {
    const raw = await clientHttp<unknown>("/specialites");
    return extraireElementsCollection<unknown>(raw)
      .map(mapperReferentiel<SpecialiteOption>)
      .filter((s): s is SpecialiteOption => s !== null && s.actif)
      .sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
  },
};