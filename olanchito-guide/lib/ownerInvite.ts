import { createServerClient } from "@/lib/supabase-server";

export type InviteResult = { sent: boolean; type: "invite" | "existing_user" };

// Invita al dueño a su portal (correo de Supabase para crear contraseña).
// Si ya tiene cuenta no se manda nada: entra con su contraseña de siempre.
export async function inviteOwner(businessId: string, email: string): Promise<InviteResult> {
  const supabase = createServerClient();

  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return { sent: false, type: "existing_user" };

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { business_id: businessId, role: "owner" },
    redirectTo: `${baseUrl}/owner/setup`,
  });
  if (error) throw new Error(error.message);
  return { sent: true, type: "invite" };
}
