import { createHmac, timingSafeEqual } from "node:crypto";

// Enlaces firmados: prueban que los generó el sitio sin necesitar una tabla.
// Formato del token: "<expira_en_segundos>.<firma>". "purpose" separa usos para que
// un enlace de baja del reporte no sirva para editar la ficha (y al revés).

type Purpose = "update" | "report-unsubscribe";

const VALID_DAYS: Record<Purpose, number> = { update: 30, "report-unsubscribe": 400 };

function secret(): string {
  const s = process.env.UPDATE_LINK_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta UPDATE_LINK_SECRET");
  return s;
}

function sign(purpose: Purpose, slug: string, exp: number): string {
  const payload = purpose === "update" ? `${slug}.${exp}` : `${purpose}:${slug}.${exp}`;
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createToken(purpose: Purpose, slug: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + VALID_DAYS[purpose] * 24 * 60 * 60;
  return `${exp}.${sign(purpose, slug, exp)}`;
}

export function verifyToken(purpose: Purpose, slug: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || !sig || exp * 1000 < Date.now()) return false;
  const expected = Buffer.from(sign(purpose, slug, exp));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const createUpdateToken = (slug: string, now = Date.now()) => createToken("update", slug, now);
export const verifyUpdateToken = (slug: string, token: string | null | undefined) => verifyToken("update", slug, token);

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "https://olanchito.com";
}

export function updateUrl(slug: string): string {
  return `${baseUrl()}/actualizar/${slug}?t=${createUpdateToken(slug)}`;
}

export function unsubscribeUrl(slug: string): string {
  return `${baseUrl()}/reporte/baja/${slug}?t=${createToken("report-unsubscribe", slug)}`;
}
