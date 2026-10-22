import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import VerifyClaimForm from "@/components/VerifyClaimForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verificar reclamo",
  robots: { index: false, follow: false },
};

export default async function VerificarReclamoPage({ params }: { params: { slug: string } }) {
  const { data: business } = await createServerClient()
    .from("businesses")
    .select("name, slug, owner_email")
    .eq("slug", params.slug)
    .maybeSingle();

  return (
    <main className="page-shell">
      <section className="section-container py-12">
        <div className="panel mx-auto max-w-md p-6 sm:p-8">
          {!business ? (
            <p className="text-sm" style={{ color: "var(--ink-2)" }}>Negocio no encontrado.</p>
          ) : business.owner_email ? (
            <>
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                {business.name} ya tiene dueño
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>Si es usted, entre a su portal con su correo.</p>
              <Link href="/owner/login" className="btn-primary mt-5 inline-flex">Entrar a mi portal</Link>
            </>
          ) : (
            <VerifyClaimForm slug={business.slug} name={business.name} />
          )}
        </div>
      </section>
    </main>
  );
}
