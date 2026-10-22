import type { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// Valida que la petición venga del admin. Los dueños también tienen sesión de Supabase
// (role "owner" en user_metadata), así que tener sesión no basta.
// ADMIN_EMAILS (separados por coma) restringe aún más; si no está, basta con no ser dueño.
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data, error } = await createServerClient().auth.getUser(token);
  const user = data?.user;
  if (error || !user) return false;
  if (user.user_metadata?.role === "owner") return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.length === 0 || allowed.includes((user.email ?? "").toLowerCase());
}
