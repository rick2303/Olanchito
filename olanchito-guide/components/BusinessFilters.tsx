"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

type Category = { id: string; name: string; slug: string };
type Suggestion = { name: string; slug: string; category: string };

export default function BusinessFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const category = sp.get("category") ?? "";
  const q = sp.get("q") ?? "";
  const nuevo = sp.get("nuevo") === "1";

  const [term, setTerm] = useState(q);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setTerm(q); }, [q]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      const { data } = await supabase
        .from("businesses")
        .select("name, slug, categories(name)")
        .ilike("name", `%${trimmed}%`)
        .limit(6);

      const results: Suggestion[] = (data ?? []).map((b: any) => ({
        name: b.name,
        slug: b.slug,
        category: b.categories?.name ?? "",
      }));

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setLoadingSuggestions(false);
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [term]);

  const buildUrl = useMemo(() => {
    return (next: { category?: string; q?: string; nuevo?: boolean }) => {
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
      if (next.nuevo !== undefined) {
        if (next.nuevo) params.set("nuevo", "1");
        else params.delete("nuevo");
        params.set("page", "1");
      }
      if (!params.get("page")) params.set("page", "1");
      return `/businesses?${params.toString()}`;
    };
  }, [sp]);

  const pushWith = (next: { category?: string; q?: string; nuevo?: boolean }) =>
    router.push(buildUrl(next));

  const doSearch = () => {
    setShowSuggestions(false);
    pushWith({ q: term.trim() });
  };

  const clearSearch = () => {
    setTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    pushWith({ q: "" });
  };

  const clearAll = () => router.push("/businesses?page=1");

  const pickSuggestion = (s: Suggestion) => {
    setShowSuggestions(false);
    setTerm(s.name);
    router.push(`/negocios/${s.slug}`);
  };

  const hasActive = Boolean(category || q || nuevo);

  return (
    <div className="w-full space-y-3">
      {/* Search bar with autocomplete */}
      <div ref={wrapperRef} className="relative">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line-strong)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <MagnifyingGlassIcon
            className="h-4 w-4 flex-shrink-0"
            style={{ color: loadingSuggestions ? "var(--primary)" : "var(--ink-3)" }}
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Buscar negocios por nombre..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-normal"
            style={{ color: "var(--ink)" }}
            autoComplete="off"
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

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl py-1"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line-strong)",
              boxShadow: "0 8px 24px rgba(10,30,20,0.12)",
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s.slug}
                type="button"
                onMouseDown={() => pickSuggestion(s)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
              >
                <BuildingStorefrontIcon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: "var(--ink-3)" }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {s.name}
                  </p>
                  {s.category && (
                    <p className="text-xs" style={{ color: "var(--ink-3)" }}>
                      {s.category}
                    </p>
                  )}
                </div>
                <ArrowRightIcon className="ml-auto h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--ink-3)" }} />
              </button>
            ))}

            {/* Search all results option */}
            <div style={{ borderTop: "1px solid var(--line)" }}>
              <button
                type="button"
                onMouseDown={doSearch}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: "var(--primary-mid)" }}
              >
                <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                Ver todos los resultados de "{term}"
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category pills row */}
      <div className="scroll-row">
        <button
          type="button"
          onClick={() => pushWith({ category: "" })}
          className={`filter-pill ${!category && !nuevo ? "active" : ""}`}
        >
          Todos
        </button>

        <button
          type="button"
          onClick={() => pushWith({ nuevo: !nuevo, category: "" })}
          className={`filter-pill ${nuevo ? "active" : ""}`}
        >
          ✨ Nuevo
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
