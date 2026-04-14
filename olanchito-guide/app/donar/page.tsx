import type { Metadata } from "next";
import DonateForm from "./DonateForm";

export const metadata: Metadata = {
  title: { absolute: "Apoyar el Directorio | Olanchito.com" },
  description: "Apoyá el directorio comunitario de Olanchito con el monto que querás. Gratis para todos, sostenido por la comunidad.",
  robots: { index: false },
};

export default function DonarPage() {
  return (
    <main className="page-shell">
      <section className="section-container flex min-h-[70vh] flex-col items-center justify-center py-20">
        <div className="w-full max-w-md">

          {/* Icon */}
          <div
            className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: "#FAEEDA" }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="#BA7517"
              strokeWidth={1.75}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
              <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
              <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
            </svg>
          </div>

          {/* Heading */}
          <h1
            className="text-center text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
          >
            Apoyar el directorio
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Olanchito.com es gratuito para toda la comunidad. Si les fue útil,
            pueden apoyar con cualquier monto en lempiras — desde L.1.
          </p>

          {/* Form */}
          <DonateForm />

          {/* Reassurance */}
          <p className="mt-5 text-center text-[11px]" style={{ color: "var(--ink-3)" }}>
            Pago seguro procesado por Stripe. No guardamos datos de tu tarjeta.
          </p>
        </div>
      </section>
    </main>
  );
}
