"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
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

  useEffect(() => { setTerm(q); }, [q]);

  const buildUrl = useMemo(() => {
    return (next: { category?: string; q?: string }) => {
      const params = new URLSearchParams(sp.toString());
      if (next.category !== undefined) {
        if (next.category) params.set("category", next.category);
        else params.delete("category");
        params.set("page", "1");
      }
      if (next.q !== undefined) {
        if (next.q) params.set("q", next.q);
        else params.delete("q");
        params.set("page", "1");
      }
      if (!params.get("page")) params.set("page", "1");
      return `/businesses?${params.toString()}`;
    };
  }, [sp]);

  const pushWith = (next: { category?: string; q?: string }) => router.push(buildUrl(next));
  const doSearch = () => pushWith({ q: term.trim() });
  const clearSearch = () => { setTerm(""); pushWith({ q: "" }); };
  const clearAll = () => router.push("/businesses?page=1");

  const hasActive = Boolean(category || q);

  return (
    <div className="w-full space-y-3">
      {/* Search bar */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--ink-3)" }} />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Buscar negocios por nombre..."
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal"
          style={{ color: "var(--ink)" }}
        />
        {term ? (
          <button
            type="button"
            onClick={clearSearch}
            className="rounded-lg p-1 transition-colors"
            style={{ color: "var(--ink-3)" }}
            aria-label="Limpiar búsqueda"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={doSearch}
          className="btn-primary !px-3 !py-1.5 !text-xs flex-shrink-0"
        >
          <span className="hidden sm:block">Buscar</span>
          <ArrowRightIcon className="h-3.5 w-3.5 sm:hidden" />
          <ArrowRightIcon className="h-3.5 w-3.5 hidden sm:block" />
        </button>
      </div>

      {/* Category pills row */}
      <div className="scroll-row">
        <button
          type="button"
          onClick={() => pushWith({ category: "" })}
          className={`filter-pill ${!category ? "active" : ""}`}
        >
          Todos
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => pushWith({ category: cat.slug === category ? "" : cat.slug })}
            className={`filter-pill ${cat.slug === category ? "active" : ""}`}
          >
            {cat.name}
          </button>
        ))}

        {hasActive ? (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
            style={{
              background: "rgba(239,68,68,0.08)",
              color: "rgb(220,38,38)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <XMarkIcon className="h-3 w-3" />
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
