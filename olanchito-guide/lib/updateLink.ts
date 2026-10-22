import { createHmac, timingSafeEqual } from "node:crypto";

// Enlace firmado para que el dueño complete su ficha sin crear cuenta.
// Formato del token: "<expira_en_segundos>.<firma>". No necesita tabla: la firma prueba que lo generó el admin.

const VALID_DAYS = 30;

function secret(): string {
  const s = process.env.UPDATE_LINK_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta UPDATE_LINK_SECRET");
  return s;
}

function sign(slug: string, exp: number): string {
  return createHmac("sha256", secret()).update(`${slug}.${exp}`).digest("base64url");
}

export function createUpdateToken(slug: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + VALID_DAYS * 24 * 60 * 60;
  return `${exp}.${sign(slug, exp)}`;
}

export function verifyUpdateToken(slug: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || !sig || exp * 1000 < Date.now()) return false;
  const expected = Buffer.from(sign(slug, exp));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function updateUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "https://olanchito.com";
  return `${base}/actualizar/${slug}?t=${createUpdateToken(slug)}`;
}
