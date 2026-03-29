import Image from "next/image";
import Link from "next/link";
import { MapPinIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/categories", label: "Categorías" },
  { href: "/businesses", label: "Negocios" },
  { href: "/join", label: "Registrar negocio" },
];

const companyLinks = [
  { href: "mailto:contact@qali-t.com", label: "Contacto", external: false },
  { href: "https://qali-t.com", label: "qali-t.com", external: true },
  { href: "https://vennq.com", label: "VennQ", external: true },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "var(--primary)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="section-container py-14">
        {/* Top grid */}
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl border"
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #ECF2EE 100%)",
                  borderColor: "rgba(255,255,255,0.25)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.85)",
                }}
              >
                <Image src="/colibri.png" alt="Olanchito" width={22} height={22} />
              </span>
              <div>
                <p
                  className="text-base font-bold text-white"
                  style={{ fontFamily: "var(--font-syne)", letterSpacing: "-0.02em" }}
                >
                  Directorio Olanchito
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Negocios y servicios locales
                </p>
              </div>
            </div>

            <p
              className="mt-5 max-w-sm text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Plataforma comunitaria para conectar a personas con los negocios
              y servicios reales de Olanchito, Honduras.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <span
                className="inline-flex w-fit items-center gap-1.5 text-xs"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <MapPinIcon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                Olanchito, Yoro, Honduras
              </span>
              <a
                href="mailto:contact@olanchito.com"
                className="inline-flex w-fit items-center gap-1.5 text-xs transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <EnvelopeIcon className="h-3.5 w-3.5" />
                contact@olanchito.com
              </a>
            </div>
          </div>

          {/* Nav links */}
          <div>
            <p
              className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Directorio
            </p>
            <ul className="space-y-2.5">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <p
              className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              QALI-T
            </p>
            <ul className="space-y-2.5">
              {companyLinks.map(({ href, label, external }) => (
                <li key={href}>
                  <a
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10" style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

        {/* Bottom row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="https://qali-t.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Powered by

              <Image src="/logo_blanco.png" alt="QALI-T" width={24} height={24} />
          </a>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            © {year} Directorio Olanchito · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
