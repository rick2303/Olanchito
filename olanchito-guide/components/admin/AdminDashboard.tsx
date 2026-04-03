"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  BuildingStorefrontIcon,
  StarIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  PlusCircleIcon,
  TrashIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import AdminAddBusiness from "./AdminAddBusiness";
import AdminBusinessList from "./AdminBusinessList";

type TopBusiness = {
  name: string;
  slug: string;
  view_count: number;
};

type Submission = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
};

type Review = {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  business_slug: string;
  is_visible: boolean;
  created_at: string;
};

type Suggestion = {
  id: string;
  business_name: string;
  business_slug: string;
  field: string;
  description: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:      { label: "Nuevo",     color: "bg-amber-50 text-amber-700 ring-amber-200" },
  reviewed: { label: "Revisado",  color: "bg-blue-50 text-blue-700 ring-blue-200" },
  approved: { label: "Aprobado",  color: "bg-green-50 text-green-700 ring-green-200" },
  rejected: { label: "Rechazado", color: "bg-red-50 text-red-700 ring-red-200" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked]     = useState(false);
  const [submissions, setSubmissions]     = useState<Submission[]>([]);
  const [reviews, setReviews]             = useState<Review[]>([]);
  const [topBusinesses, setTopBusinesses] = useState<TopBusiness[]>([]);
  const [totalViews, setTotalViews]       = useState(0);
  const [suggestions, setSuggestions]     = useState<Suggestion[]>([]);
  const [tab, setTab]                     = useState<"submissions" | "reviews" | "add" | "businesses" | "suggestions">("submissions");
  const [loadingData, setLoadingData]     = useState(true);
  const [loadingId, setLoadingId]         = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    const [{ data: subs }, { data: revs }, { data: top }, { data: views }, { data: suggs }] =
      await Promise.all([
        supabase
          .from("business_submissions")
          .select("id, business_name, contact_name, email, phone, status, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select("id, author_name, rating, comment, business_slug, is_visible, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("businesses")
          .select("name, slug, view_count")
          .order("view_count", { ascending: false })
          .gt("view_count", 0)
          .limit(5),
        supabase.from("businesses").select("view_count"),
        supabase
          .from("correction_suggestions")
          .select("id, business_name, business_slug, field, description, created_at")
          .order("created_at", { ascending: false }),
      ]);
    setSubmissions(subs ?? []);
    setReviews(revs ?? []);
    setSuggestions(suggs ?? []);
    setTopBusinesses(top ?? []);
    setTotalViews((views ?? []).reduce((s, b) => s + (b.view_count ?? 0), 0));
    setLoadingData(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/admin/login"); return; }
      setAuthChecked(true);
      fetchData();
    });
  }, [router, fetchData]);

  const updateSubmission = async (id: string, status: string) => {
    setLoadingId(id);
    await supabase.from("business_submissions").update({ status }).eq("id", id);
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    setLoadingId(null);
  };

  const deleteSuggestion = async (id: string) => {
    await supabase.from("correction_suggestions").delete().eq("id", id);
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteReview = async (id: string) => {
    setLoadingId(id);
    await supabase.from("reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
    setLoadingId(null);
  };

  const toggleReview = async (id: string, current: boolean) => {
    setLoadingId(id);
    await supabase.from("reviews").update({ is_visible: !current }).eq("id", id);
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_visible: !current } : r));
    setLoadingId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  if (!authChecked) return null;

  const pendingCount     = submissions.filter((s) => s.status === "new").length;
  const hiddenCount      = reviews.filter((r) => !r.is_visible).length;
  const suggestionsCount = suggestions.length;

  return (
    <main className="min-h-screen bg-jungle-50">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(10,30,20,0.08)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl border"
              style={{
                background: "linear-gradient(180deg,#FFFFFF 0%,#F4F7F4 100%)",
                borderColor: "rgba(10,30,20,0.13)",
              }}
            >
              <Image src="/colibri.webp" alt="Olanchito" width={16} height={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
                Panel Admin
              </p>
              <p className="text-[10px] text-jungle-500">Directorio Olanchito</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50 active:bg-jungle-100"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Stats ── */}
        {/* Vistas totales ocupa el ancho completo en móvil */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 flex items-center gap-4 rounded-2xl bg-jungle-600 p-4 sm:col-span-3 lg:col-span-1 lg:flex-col lg:items-start lg:gap-0">
            <ChartBarIcon className="h-6 w-6 flex-shrink-0 text-white/70 lg:mb-1.5 lg:h-5 lg:w-5" />
            <div>
              <p className="text-2xl font-bold text-white lg:text-xl" style={{ fontFamily: "var(--font-syne)" }}>
                {totalViews.toLocaleString("es-HN")}
              </p>
              <p className="text-xs text-white/70">Vistas totales</p>
            </div>
          </div>

          {[
            { label: "Solicitudes", value: submissions.length, Icon: BuildingStorefrontIcon },
            { label: "Pendientes",  value: pendingCount,       Icon: ClockIcon },
            { label: "Reseñas",     value: reviews.length,     Icon: StarIcon },
            { label: "Ocultas",     value: hiddenCount,        Icon: EyeSlashIcon },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <Icon className="mb-1.5 h-5 w-5 text-jungle-500" />
              <p className="text-xl font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
                {value}
              </p>
              <p className="text-xs text-jungle-500">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Top 5 ── */}
        {topBusinesses.length > 0 && (
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <p className="mb-4 text-sm font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
              Top 5 — Negocios más vistos
            </p>
            <div className="space-y-3">
              {topBusinesses.map((b, i) => {
                const max = topBusinesses[0].view_count;
                const pct = max > 0 ? Math.round((b.view_count / max) * 100) : 0;
                return (
                  <div key={b.slug} className="flex items-center gap-3">
                    <span className="w-4 flex-shrink-0 text-right text-xs font-bold text-jungle-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <a
                          href={`/negocios/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-xs font-semibold text-jungle-900 hover:underline"
                        >
                          {b.name}
                        </a>
                        <span className="flex-shrink-0 text-xs font-bold text-jungle-600">
                          {b.view_count.toLocaleString("es-HN")}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-jungle-100">
                        <div
                          className="h-full rounded-full bg-jungle-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTab("submissions")}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            style={
              tab === "submissions"
                ? { background: "var(--primary)", color: "white" }
                : { background: "white", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            <BuildingStorefrontIcon className="h-3.5 w-3.5" />
            Solicitudes
            {pendingCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("reviews")}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            style={
              tab === "reviews"
                ? { background: "var(--primary)", color: "white" }
                : { background: "white", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            <StarIcon className="h-3.5 w-3.5" />
            Reseñas
            {hiddenCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                {hiddenCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("businesses")}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            style={
              tab === "businesses"
                ? { background: "var(--primary)", color: "white" }
                : { background: "white", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            <BuildingStorefrontIcon className="h-3.5 w-3.5" />
            Negocios
          </button>

          <button
            onClick={() => setTab("add")}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            style={
              tab === "add"
                ? { background: "#16a34a", color: "white" }
                : { background: "white", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            <PlusCircleIcon className="h-3.5 w-3.5" />
            Agregar
          </button>

          <button
            onClick={() => setTab("suggestions")}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
            style={
              tab === "suggestions"
                ? { background: "var(--primary)", color: "white" }
                : { background: "white", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            <FlagIcon className="h-3.5 w-3.5" />
            Sugerencias
            {suggestionsCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                {suggestionsCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Content ── */}
        {loadingData ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />
            ))}
          </div>
        ) : (
          <>
            {/* Submissions */}
            {tab === "submissions" && (
              <div className="space-y-3">
                {submissions.length === 0 && (
                  <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
                    <p className="text-sm text-jungle-600">No hay solicitudes.</p>
                  </div>
                )}
                {submissions.map((s) => {
                  const st   = STATUS_LABELS[s.status] ?? STATUS_LABELS.new;
                  const busy = loadingId === s.id;
                  return (
                    <div key={s.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:p-5">
                      {/* Name + badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-jungle-950 sm:text-base">
                          {s.business_name}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>

                      {/* Contact info */}
                      <div className="mt-2 flex flex-col gap-1 text-xs text-jungle-600 sm:flex-row sm:flex-wrap sm:gap-3">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{s.contact_name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <EnvelopeIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </span>
                        {s.phone && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            {s.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          {formatDate(s.created_at)}
                        </span>
                      </div>

                      {/* Actions — full width on mobile, inline on desktop */}
                      <div className="mt-3 flex gap-2 sm:mt-0 sm:justify-end">
                        {s.status !== "approved" && (
                          <button
                            onClick={() => updateSubmission(s.id, "approved")}
                            disabled={busy}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 sm:flex-none sm:py-1.5"
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            {busy ? "..." : "Aprobar"}
                          </button>
                        )}
                        {s.status !== "rejected" && (
                          <button
                            onClick={() => updateSubmission(s.id, "rejected")}
                            disabled={busy}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50 sm:flex-none sm:py-1.5"
                          >
                            <XCircleIcon className="h-3.5 w-3.5" />
                            {busy ? "..." : "Rechazar"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Businesses list */}
            {tab === "businesses" && <AdminBusinessList />}

            {/* Suggestions */}
            {tab === "suggestions" && (
              <div className="space-y-3">
                {suggestions.length === 0 && (
                  <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
                    <p className="text-sm text-jungle-600">No hay sugerencias pendientes.</p>
                  </div>
                )}
                {suggestions.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-jungle-950">{s.business_name}</p>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                            {s.field}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-jungle-400">
                          {s.business_slug} · {formatDate(s.created_at)}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-jungle-700">{s.description}</p>
                      </div>
                      <button
                        onClick={() => deleteSuggestion(s.id)}
                        className="flex-shrink-0 rounded-xl bg-white p-2 text-jungle-400 ring-1 ring-black/10 hover:bg-red-50 hover:text-red-600"
                        title="Marcar como revisado"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <a
                      href={`/negocios/${s.business_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-jungle-600 hover:underline"
                    >
                      Ver negocio →
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Add Business */}
            {tab === "add" && <AdminAddBusiness />}

            {/* Reviews */}
            {tab === "reviews" && (
              <div className="space-y-3">
                {reviews.length === 0 && (
                  <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
                    <p className="text-sm text-jungle-600">No hay reseñas.</p>
                  </div>
                )}
                {reviews.map((r) => {
                  const busy = loadingId === r.id;
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl bg-white p-4 ring-1 ring-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] sm:p-5"
                      style={!r.is_visible ? { opacity: 0.55 } : {}}
                    >
                      {/* Author + stars */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-jungle-950">{r.author_name}</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <StarSolid
                                key={n}
                                className={`h-3.5 w-3.5 ${n <= r.rating ? "text-amber-400" : "text-jungle-100"}`}
                              />
                            ))}
                          </div>
                          {!r.is_visible && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                              Oculta
                            </span>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 gap-1.5">
                          {/* Toggle */}
                          <button
                            onClick={() => { setConfirmDeleteId(null); toggleReview(r.id, r.is_visible); }}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold ring-1 ring-black/10 hover:bg-jungle-50 disabled:opacity-50"
                            style={{ color: "var(--ink-2)" }}
                            title={r.is_visible ? "Ocultar reseña" : "Mostrar reseña"}
                          >
                            {r.is_visible
                              ? <><EyeSlashIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{busy ? "..." : "Ocultar"}</span></>
                              : <><EyeIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{busy ? "..." : "Mostrar"}</span></>
                            }
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDeleteId(confirmDeleteId === r.id ? null : r.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                            title="Eliminar reseña"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      </div>

                      {/* Slug + date */}
                      <p className="mt-1 text-[11px] text-jungle-500">
                        {r.business_slug} · {formatDate(r.created_at)}
                      </p>

                      {/* Comment */}
                      <p className="mt-2 text-sm leading-relaxed text-jungle-700 line-clamp-3">
                        {r.comment}
                      </p>

                      {/* Delete confirmation */}
                      {confirmDeleteId === r.id && (
                        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs font-semibold text-red-700">¿Eliminar esta reseña permanentemente?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => deleteReview(r.id)}
                              disabled={busy}
                              className="flex-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:flex-none"
                            >
                              {busy ? "Eliminando…" : "Sí, eliminar"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={busy}
                              className="flex-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50 sm:flex-none"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
