import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: { absolute: "¡Gracias por apoyar Olanchito! | Directorio Olanchito" },
  robots: { index: false },
};

export default function GraciasPage() {
  return (
    <main className="page-shell">
      <section className="section-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div
          className="mx-auto w-16 h-16 rounded-2xl grid place-items-center mb-6"
          style={{ background: "#FAEEDA" }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
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

        <h1
          className="text-3xl font-bold sm:text-4xl"
          style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
        >
          ¡Gracias por apoyar Olanchito!
        </h1>

        <p
          className="mt-4 max-w-md text-base leading-relaxed"
          style={{ color: "var(--ink-2)" }}
        >
          Tu apoyo ayuda a mantener el directorio gratuito para toda la comunidad de la Ciudad Cívica. Significa mucho.
        </p>

        <Link
          href="/"
          className="btn-primary mt-8"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al directorio
        </Link>
      </section>
    </main>
  );
}
