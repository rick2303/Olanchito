import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-jungle-700/25 bg-jungle-600/90 backdrop-blur supports-[backdrop-filter]:bg-jungle-600/75">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Branding */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-sm">
                <Image src="/colibri.png" alt="Olanchito" width={26} height={26} />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
              </span>

              <div className="leading-tight">
                <p className="text-sm font-black tracking-tight text-white">Directorio Olanchito</p>
                <p className="text-xs font-semibold text-white/75">
                  Descubra negocios y servicios locales
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm text-white/80">
              Una guía simple y bonita para encontrar lo mejor de Olanchito.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-white/90">
                Navegación
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-white/80 hover:text-white transition">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="text-white/80 hover:text-white transition">
                    Categorías
                  </Link>
                </li>
                <li>
                  <Link href="/businesses" className="text-white/80 hover:text-white transition">
                    Negocios
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-white/90">
                QALI-T
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/join" className="text-white/80 hover:text-white transition">
                    Únase al directorio
                  </Link>
                </li>
                <li>
                  <a href="mailto:contact@qali-t.com" className="text-white/80 hover:text-white transition">
                    Contacto
                  </a>
                </li>
                <li>
                  <a
                    href="https://qali-t.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition"
                  >
                    Sitio web
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-white/15" />

        {/* Bottom bar */}
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <a
    href="https://qali-t.com"
    target="_blank"
    rel="noopener noreferrer"
    className={[
      "group inline-flex w-fit items-center gap-2 rounded-2xl",
      "bg-white/10 px-3 py-2 ring-1 ring-white/15 shadow-sm",
      "transition hover:bg-white/15 hover:-translate-y-[1px]",
      "self-center sm:self-auto", //en mobile no ocupa todo, y se centra
    ].join(" ")}
  >
    <span className="text-xs font-semibold text-white/80">Powered by</span>

    <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
      <Image src="/logo.png" alt="QALI-T" width={16} height={16} />
    </span>

    {/*flecha solo en desktop para que en mobile no “alargue” */}
    <span
      aria-hidden
      className="ml-1 hidden sm:inline text-white/70 transition-transform duration-200 group-hover:translate-x-0.5"
    >
      →
    </span>
  </a>

  <p className="text-xs text-white/75 text-center sm:text-left">
    © {year} Directorio Olanchito · Todos los derechos reservados ·{" "}
    <span className="font-extrabold text-white">QALI-T</span>
  </p>
</div>

      </div>
    </footer>
  );
}
