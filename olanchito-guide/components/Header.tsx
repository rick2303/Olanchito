"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightIcon,
  HomeIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/categorias", label: "Categorías", icon: Squares2X2Icon },
  { href: "/negocios", label: "Negocios", icon: BuildingStorefrontIcon },
  { href: "/favoritos", label: "Favoritos", icon: HeartIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onEsc);
      setTimeout(() => firstLinkRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50">
      <div
        className="transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${scrolled ? "rgba(10,30,20,0.09)" : "rgba(10,30,20,0.06)"}`,
          boxShadow: scrolled ? "0 4px 20px rgba(10,30,20,0.07)" : "none",
        }}
      >
        {/* Contenedor Principal: justify-between asegura los extremos en móvil */}
        <div className="section-container flex h-[3.75rem] items-center justify-between">

          {/* 1. LOGO (Siempre a la izquierda) */}
          <Link
            href="/"
            onClick={close}
            className="group flex items-center gap-2.5 outline-none flex-shrink-0"
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.04]"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7F4 100%)",
                borderColor: "rgba(10,30,20,0.13)",
                boxShadow: "0 3px 10px rgba(10,30,20,0.16), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <Image src="/colibri.webp" alt="Olanchito" width={20} height={20} priority />
            </span>
            <span className="leading-none">
              <span
                className="block text-base font-bold"
                style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.02em" }}
              >
                Olanchito
              </span>
              <span className="block text-[10px] font-medium" style={{ color: "var(--ink-3)" }}>
                Guía empresarial local
              </span>
            </span>
          </Link>

          {/* 2. DESKTOP NAV (Centro - Solo visible en MD) */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Navegación principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${active ? "active" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 3. ACCIONES / HAMBURGUESA (Derecha) */}
          <div className="flex items-center justify-end gap-2">
            {/* Botones Desktop */}
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/owner/login"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
                style={{ background: "var(--surface-2)", color: "var(--ink-2)", border: "1px solid var(--line-strong)" }}
              >
                <BuildingStorefrontIcon className="h-3.5 w-3.5" />
                Mi negocio
              </Link>
              <Link href="/registrar" className="btn-primary !py-2 !text-xs">
                Registrar negocio
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Hamburguesa (Solo móvil - Alineada a la derecha) */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-95 md:hidden"
              style={{
                background: open ? "var(--surface-2)" : "white",
                borderColor: "rgba(10,30,20,0.1)",
                color: "var(--ink)",
              }}
            >
              {open ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40"
            style={{ background: "rgba(10,20,15,0.45)", backdropFilter: "blur(2px)" }}
            aria-label="Cerrar menú"
            onClick={close}
          />

          <aside
            className="fixed right-0 top-0 z-50 h-[100dvh] w-[82%] max-w-xs flex flex-col"
            style={{
              background: "var(--surface)",
              borderLeft: "1px solid var(--line)",
              boxShadow: "-8px 0 40px rgba(10,30,20,0.18)",
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg border"
                  style={{
                    background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7F4 100%)",
                    borderColor: "rgba(10,30,20,0.13)",
                    boxShadow: "0 2px 8px rgba(10,30,20,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <Image src="/colibri.webp" alt="Olanchito" width={16} height={16} />
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
                >
                  Olanchito
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{ background: "var(--surface-2)", color: "var(--ink)" }}
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    ref={idx === 0 ? firstLinkRef : undefined}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                    style={
                      active
                        ? { background: "var(--accent-soft)", color: "var(--primary)" }
                        : { background: "var(--surface-2)", color: "var(--ink-2)" }
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ArrowRightIcon className="h-3.5 w-3.5 opacity-50" />
                  </Link>
                );
              })}
            </nav>

            {/* Drawer CTA */}
            <div className="p-4 space-y-2" style={{ borderTop: "1px solid var(--line)" }}>
              <Link
                href="/owner/login"
                onClick={close}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--ink-2)",
                  border: "1px solid var(--line-strong)",
                }}
              >
                <BuildingStorefrontIcon className="h-4 w-4" />
                Mi negocio
              </Link>
              <Link href="/registrar" onClick={close} className="btn-primary w-full">
                Registrar negocio
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
