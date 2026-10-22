import type { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// Correos con acceso al panel admin. Debe coincidir con la tabla public.admins de la base.
// No se usa user_metadata: cada usuario puede editar el suyo desde el navegador.
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "admin@olanchito.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data, error } = await createServerClient().auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return false;
  return adminEmails().includes(email);
}
