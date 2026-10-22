import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import ClaimBusinessForm from "@/components/ClaimBusinessForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reclamar este negocio",
  robots: { index: false, follow: true },
};

export default async function ReclamarPage({ params }: { params: { slug: string } }) {
  const { data: business } = await createServerClient()
    .from("businesses")
    .select("name, slug, owner_email")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!business) {
    return (
      <main className="page-shell">
        <section className="section-container py-16 text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>Negocio no encontrado</h1>
          <Link href="/negocios" className="btn-primary mt-6 inline-flex">Ver negocios</Link>
        </section>
      </main>
    );
  }

  if (business.owner_email) {
    return (
      <main className="page-shell">
        <section className="section-container py-16">
          <div className="panel mx-auto max-w-lg p-8 text-center">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
              {business.name} ya tiene un dueño registrado
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
              Si es usted, entre a su portal con su correo. Si cree que es un error, escríbanos a contact@olanchito.com.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/owner/login" className="btn-primary">Entrar a mi portal</Link>
              <Link href={`/negocios/${business.slug}`} className="btn-secondary">Volver a la ficha</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <ClaimBusinessForm name={business.name} slug={business.slug} />
    </main>
  );
}
