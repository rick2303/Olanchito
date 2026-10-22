import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { ClaimVerification } from "@/lib/businessFields";

// Verificación de reclamos: el admin manda un código al número que YA está publicado en la
// ficha. Solo quien tiene ese teléfono puede saberlo. Se guarda la huella, nunca el código.

export const CODE_VALID_HOURS = 48;
export const MAX_ATTEMPTS = 5;

function secret(): string {
  const s = process.env.UPDATE_LINK_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta UPDATE_LINK_SECRET");
  return s;
}

function hash(claimId: string, code: string): string {
  return createHmac("sha256", secret()).update(`claim:${claimId}:${code}`).digest("base64url");
}

export function newVerification(claimId: string, now = Date.now()): { code: string; verification: ClaimVerification } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return {
    code,
    verification: {
      code_hash: hash(claimId, code),
      sent_at: new Date(now).toISOString(),
      expires_at: new Date(now + CODE_VALID_HOURS * 3_600_000).toISOString(),
      attempts: 0,
      verified_at: null,
    },
  };
}

export type CheckResult = "ok" | "wrong" | "expired" | "locked" | "missing";

export function checkCode(claimId: string, v: ClaimVerification | undefined, code: string, now = Date.now()): CheckResult {
  if (!v) return "missing";
  if (v.verified_at) return "ok";
  if (v.attempts >= MAX_ATTEMPTS) return "locked";
  if (new Date(v.expires_at).getTime() < now) return "expired";
  const expected = Buffer.from(v.code_hash);
  const given = Buffer.from(hash(claimId, code.replace(/\D/g, "")));
  return expected.length === given.length && timingSafeEqual(expected, given) ? "ok" : "wrong";
}

// Números hondureños: los que empiezan con 2 son fijos (no tienen WhatsApp)
export function isMobile(phone: string | null | undefined): boolean {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^504(?=\d{8}$)/, "");
  return /^[3789]\d{7}$/.test(digits);
}

export function cleanNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^504(?=\d{8}$)/, "");
  return /^\d{8}$/.test(digits) ? digits : null;
}
