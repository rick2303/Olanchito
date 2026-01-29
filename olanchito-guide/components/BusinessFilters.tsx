// components/BusinessFilters.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

type Category = { id: string; name: string; slug: string };

export default function BusinessFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const category = sp.get("category") ?? "";
  const q = sp.get("q") ?? "";

  const [term, setTerm] = useState(q);
  const [open, setOpen] = useState(false); // mobile: mostrar/ocultar barra

  // Sync input con back/forward
  useEffect(() => {
    setTerm(q);
  }, [q]);

  // Construye URL preservando params y reseteando page cuando cambia filtro/búsqueda
  const buildUrl = useMemo(() => {
    return (next: { category?: string; q?: string }) => {
      const params = new URLSearchParams(sp.toString());

      if (next.category !== undefined) {
        next.category ? params.set("category", next.category) : params.delete("category");
        params.set("page", "1");
      }

      if (next.q !== undefined) {
        next.q ? params.set("q", next.q) : params.delete("q");
        params.set("page", "1");
      }

      if (!params.get("page")) params.set("page", "1");
      return `/businesses?${params.toString()}`;
    };
  }, [sp]);

  const pushWith = (next: { category?: string; q?: string }) => router.push(buildUrl(next));

  const doSearch = () => pushWith({ q: term.trim() });

  const clearSearch = () => {
    setTerm("");
    pushWith({ q: "" });
  };

  const hasActive = Boolean(category || q);

  return (
    <div className="w-full">
      {/* Compact header (mobile): se esconde/expande, NO fixed */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/70 p-2 ring-1 ring-black/5 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-jungle-950 ring-1 ring-black/5 hover:bg-jungle-50"
          aria-expanded={open}
        >
          <FunnelIcon className="h-4 w-4 text-jungle-700" />
          Filtros
          {hasActive ? (
            <span className="ml-1 inline-flex items-center rounded-full bg-jungle-50 px-2 py-0.5 text-[10px] font-black text-jungle-800 ring-1 ring-jungle-200">
              Activos
            </span>
          ) : null}
        </button>

        {/* mini search quick */}
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-jungle-300">
          <MagnifyingGlassIcon className="h-4 w-4 text-jungle-700" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar…"
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch();
            }}
            className="w-full bg-transparent text-xs font-semibold text-jungle-950 placeholder:text-jungle-700/60 focus:outline-none"
          />
          {term ? (
            <button
              type="button"
              onClick={clearSearch}
              className="grid h-8 w-8 place-items-center rounded-lg text-jungle-700 hover:bg-jungle-50"
              aria-label="Limpiar"
              title="Limpiar"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={doSearch}
            className="inline-flex items-center justify-center rounded-lg bg-jungle-600 px-2.5 py-2 text-[11px] font-extrabold text-white hover:bg-jungle-700 active:translate-y-[1px]"
            aria-label="Buscar"
            title="Buscar"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Panel (mobile): colapsable */}
      <div
        className={[
          "mt-2 overflow-hidden rounded-2xl bg-white/70 ring-1 ring-black/5 backdrop-blur md:hidden",
          "transition-[max-height,opacity] duration-300",
          open ? "max-h-[340px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="p-3">
          <div className="relative">
            <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jungle-700" />
            <select
              value={category}
              onChange={(e) => pushWith({ category: e.target.value })}
              className="w-full appearance-none rounded-xl bg-white pl-9 pr-10 py-2 text-xs font-extrabold text-jungle-950 ring-1 ring-black/5 hover:bg-jungle-50 focus:outline-none focus:ring-2 focus:ring-jungle-300"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-jungle-700">
              ▾
            </span>
          </div>

          {(category || q) && (
            <button
              type="button"
              onClick={() => router.push("/businesses?page=1")}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-jungle-950 ring-1 ring-black/5 hover:bg-jungle-50"
            >
              Limpiar filtros
              <XMarkIcon className="h-4 w-4 text-jungle-700" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop (compacto, una sola barra) */}
      <div className="mt-3 hidden w-full items-center justify-end gap-3 rounded-2xl bg-white/70 p-2 ring-1 ring-black/5 backdrop-blur md:flex">
        {/* Search */}
        <div className="flex w-[360px] items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-jungle-300">
          <MagnifyingGlassIcon className="h-5 w-5 text-jungle-700" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por nombre…"
            onKeyDown={(e) => {
              if (e.key === "Enter") doSearch();
            }}
            className="w-full bg-transparent text-sm font-semibold text-jungle-950 placeholder:text-jungle-700/60 focus:outline-none"
          />
          {term ? (
            <button
              type="button"
              onClick={clearSearch}
              className="grid h-9 w-9 place-items-center rounded-xl text-jungle-700 hover:bg-jungle-50"
              aria-label="Limpiar búsqueda"
              title="Limpiar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={doSearch}
            className="inline-flex items-center gap-2 rounded-xl bg-jungle-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-jungle-700 active:translate-y-[1px]"
          >
            Buscar
            <span aria-hidden>→</span>
          </button>
        </div>

        {/* Category */}
        <div className="relative w-[260px]">
          <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jungle-700" />
          <select
            value={category}
            onChange={(e) => pushWith({ category: e.target.value })}
            className="w-full appearance-none rounded-2xl bg-white pl-9 pr-10 py-2 text-xs font-extrabold text-jungle-950 ring-1 ring-black/5 hover:bg-jungle-50 focus:outline-none focus:ring-2 focus:ring-jungle-300"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-jungle-700">
            ▾
          </span>
        </div>

        {(category || q) && (
          <button
            type="button"
            onClick={() => router.push("/businesses?page=1")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-jungle-950 ring-1 ring-black/5 hover:bg-jungle-50"
            title="Limpiar filtros"
          >
            Limpiar
            <XMarkIcon className="h-4 w-4 text-jungle-700" />
          </button>
        )}
      </div>
    </div>
  );
}
