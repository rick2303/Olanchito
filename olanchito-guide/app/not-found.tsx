import Link from "next/link";
import { MagnifyingGlassIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="section-container py-16 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="section-label mb-3">Error 404</p>
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
          >
            Esta página no existe
          </h1>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--ink-2)" }}>
            Puede que el negocio haya cambiado de nombre o que el enlace esté incompleto. Búsquelo directamente:
          </p>

          <form action="/negocios" method="GET" className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-2xl p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--line-strong)" }}>
            <input
              name="q"
              type="search"
              aria-label="Buscar negocios"
              placeholder="Farmacia, hotel, mecánico..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              style={{ color: "var(--ink)" }}
            />
            <button type="submit" className="btn-primary !py-2 !px-4 !text-xs">
              <MagnifyingGlassIcon className="h-4 w-4" />
              Buscar
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/" className="btn-secondary !text-xs">Ir al inicio</Link>
            <Link href="/categorias" className="btn-secondary !text-xs">
              Ver categorías
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
