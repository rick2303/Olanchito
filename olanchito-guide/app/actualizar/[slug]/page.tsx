import Link from "next/link";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { verifyUpdateToken } from "@/lib/updateLink";
import { missingFields } from "@/lib/businessFields";
import UpdateBusinessForm from "@/components/UpdateBusinessForm";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Complete su ficha",
  robots: { index: false, follow: false },
};

type Props = { params: { slug: string }; searchParams?: { t?: string } };

export default async function ActualizarPage({ params, searchParams }: Props) {
  const token = searchParams?.t ?? "";
  const valid = verifyUpdateToken(params.slug, token);

  const { data: business } = valid
    ? await createServerClient()
        .from("businesses")
        .select("name, slug, description, hours, address, whatsapp, phone, location, services")
        .eq("slug", params.slug)
        .maybeSingle()
    : { data: null };

  if (!valid || !business) {
    return (
      <main className="page-shell">
        <section className="section-container py-16">
          <div className="panel mx-auto max-w-lg p-8 text-center">
            <ExclamationTriangleIcon className="mx-auto mb-3 h-10 w-10 text-amber-500" />
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
              Este enlace venció o no es válido
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
              Los enlaces para actualizar una ficha duran 30 días. Escríbanos y le enviamos uno nuevo.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <a href="mailto:contact@olanchito.com" className="btn-primary">Pedir un enlace nuevo</a>
              <Link href="/" className="btn-secondary">Ir al inicio</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const location = business.location as { lat?: number; lng?: number } | null;

  return (
    <main className="page-shell">
      <UpdateBusinessForm
        token={token}
        initial={{
          name: business.name,
          slug: business.slug,
          description: business.description ?? "",
          // El campo es de una línea: los horarios escritos en varias líneas se separan con " | "
          hours: (business.hours ?? "").trim().replace(/\s*\r?\n\s*/g, " | "),
          address: business.address ?? "",
          whatsapp: business.whatsapp ?? "",
          phone: business.phone ?? "",
          location: location?.lat && location?.lng ? { lat: location.lat, lng: location.lng } : null,
          services: Array.isArray(business.services) ? (business.services as string[]).join(", ") : "",
        }}
        missing={missingFields(business)}
      />
    </main>
  );
}
