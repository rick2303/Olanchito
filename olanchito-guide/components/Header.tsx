"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightIcon,
  HomeIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  MapPinIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/categories", label: "Categorías", icon: Squares2X2Icon },
  { href: "/businesses", label: "Negocios", icon: BuildingStorefrontIcon },
];

const vennqHref = "https://vennq.com"; // o "/vennq"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    if (menuOpen) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
      setTimeout(() => firstMobileLinkRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-jungle-950 text-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs sm:px-6">
          <span className="hidden sm:block">
            Descubra negocios, comida y servicios en Olanchito
          </span>

          <span className="ml-auto inline-flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-jungle-200" />
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-jungle-400" />
              Guía local
            </span>
          </span>
        </div>
      </div>

      {/* Navbar principal */}
      <div className="border-b border-jungle-700/25 bg-jungle-600/90 backdrop-blur supports-[backdrop-filter]:bg-jungle-600/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
              <Image
                src="/colibri.png"
                alt="Colibrí Olanchito"
                width={28}
                height={28}
                priority
              />
              <span className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
            </span>

            <div className="leading-tight">
              <span className="block text-lg font-black tracking-tight text-white">
                Olanchito
              </span>
              <span className="block text-[11px] font-semibold text-white/75">
                Encuentre lo mejor cerca
              </span>
            </div>
          </Link>

          {/* Links escritorio */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <Icon className="h-5 w-5 text-white/85" />
                  {item.label}
                  <span className="absolute bottom-1 left-3 right-3 h-[2px] origin-left scale-x-0 rounded-full bg-white/80 transition-transform duration-200 group-hover:scale-x-100" />
                </Link>
              );
            })}

            {/* CTA */}
            <Link
              href="/join"
              className="ml-2 group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-4 py-2 text-sm font-extrabold text-jungle-950 ring-1 ring-white/20"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-jungle-100 via-white to-jungle-100 opacity-95" />
              <span className="absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/60 blur-md transition-transform duration-500 group-hover:translate-x-[250%]" />
              <span className="relative inline-flex items-center gap-2">
                Únete
                <ArrowRightIcon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </nav>

          {/* Botón móvil */}
          <button
            type="button"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {menuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {menuOpen && (
        <div className="sm:hidden">
          {/* overlay */}
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-black/45"
            onClick={closeMenu}
          />

          {/* panel */}
          <aside className="fixed right-0 top-0 z-50 h-[100dvh] w-[86%] max-w-sm bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
            {/* header interno */}
            <div className="sticky top-0 z-10 border-b border-black/5 bg-white/95 backdrop-blur">
              <div className="flex items-center justify-between p-4">
                <div className="leading-tight">
                  <p className="text-sm font-black text-jungle-950">Olanchito</p>
                  <p className="text-xs font-semibold text-jungle-700/70">Menú</p>
                </div>

                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={closeMenu}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-jungle-50 text-jungle-800 ring-1 ring-jungle-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* body con scroll */}
            <div className="h-[calc(100dvh-73px)] overflow-y-auto p-4 pb-6">
              <nav className="space-y-2">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      ref={idx === 0 ? firstMobileLinkRef : undefined}
                      onClick={closeMenu}
                      className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-jungle-950 ring-1 ring-black/5 transition hover:bg-jungle-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                          <Icon className="h-5 w-5 text-jungle-700" />
                        </span>
                        {item.label}
                      </span>
                      <ArrowRightIcon className="h-5 w-5 text-jungle-700" />
                    </Link>
                  );
                })}

                {/* CTA Únete (primero) */}
                <Link
                  href="/join"
                  onClick={closeMenu}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-jungle-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-jungle-700 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 focus-visible:ring-offset-2"
                >
                  Únete
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>

                {/*VennQ promo (mobile) AL FINAL, más pequeña y suave */}
                <Link
                  href={vennqHref}
                  target={vennqHref.startsWith("http") ? "_blank" : undefined}
                  rel={vennqHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  onClick={closeMenu}
                  className="mt-4 block rounded-3xl bg-jungle-50 px-4 py-3 ring-1 ring-jungle-200/60 transition hover:bg-jungle-100/60"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-black/5">
                      <SparklesIcon className="h-5 w-5 text-jungle-700" />
                    </span>

                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 text-[10px] font-extrabold text-jungle-700 ring-1 ring-black/5">
                        Coming soon
                      </div>

                      <p className="mt-2 text-sm font-black text-jungle-950">
                        VennQ ERP
                        <span className="font-semibold text-jungle-700"> · para negocios</span>
                      </p>

                      <p className="mt-1 text-xs font-semibold text-jungle-700/80">
                        POS, inventario y reportes — por industria.
                      </p>

                      <div className="mt-2 inline-flex items-center gap-2 text-xs font-extrabold text-jungle-700">
                        Conocer
                        <ArrowRightIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </nav>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
