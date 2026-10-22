import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { verifyToken } from "@/lib/updateLink";
import UnsubscribeButton from "./UnsubscribeButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dejar de recibir el resumen mensual",
  robots: { index: false, follow: false },
};

// Página de confirmación: la baja se hace con un botón (POST) para que los antivirus que
// abren los enlaces de los correos no den de baja a nadie sin querer.
export default async function BajaPage({ params, searchParams }: { params: { slug: string }; searchParams?: { t?: string } }) {
  const token = searchParams?.t ?? "";
  const valid = verifyToken("report-unsubscribe", params.slug, token);
  const { data: business } = valid
    ? await createServerClient().from("businesses").select("name").eq("slug", params.slug).maybeSingle()
    : { data: null };

  return (
    <main className="page-shell">
      <section className="section-container py-16">
        <div className="panel mx-auto max-w-lg p-8 text-center">
          {valid && business ? (
            <>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                ¿Dejar de recibir el resumen de {business.name}?
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
                Su negocio sigue en el directorio igual que siempre. Solo dejará de llegarle el correo mensual con sus números.
              </p>
              <UnsubscribeButton slug={params.slug} token={token} />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                Enlace no válido
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
                Escríbanos a contact@olanchito.com y le quitamos de la lista.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
