import { ErreurApi } from "./erreurApi";

export function estActesEnSuspens(err: unknown): err is ErreurApi {
  return err instanceof ErreurApi && err.statut === 422;
}

export function estConflitActesDemandes(err: unknown): err is ErreurApi {
  return err instanceof ErreurApi && err.statut === 409;
}

export function extraireCodesActes(message: string): string[] {
  const m = message.match(/:\s*([^.]+)\./);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
