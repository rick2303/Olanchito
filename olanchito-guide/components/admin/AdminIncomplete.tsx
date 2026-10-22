"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatBubbleLeftRightIcon, LinkIcon, CheckIcon, EyeIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { MISSING_LABELS, missingFields, type MissingField } from "@/lib/businessFields";
import { adminPost, openAfter, waLink } from "./adminApi";

type Row = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  phone: string | null;
  view_count: number | null;
  missing: MissingField[];
};

const SENT_KEY = "olanchito_update_requests";

function readSent(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days === 0 ? "hoy" : days === 1 ? "ayer" : `hace ${days} días`;
}

// Fichas a las que les falta información, de la más vista a la menos vista:
// completar primero las que más gente abre es lo que más mejora el directorio.
export default function AdminIncomplete({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MissingField | "all">("all");
  const [sent, setSent] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSent(readSent());
    supabase
      .from("businesses")
      .select("id, name, slug, whatsapp, phone, view_count, location, hours, description, services")
      .order("view_count", { ascending: false })
      .then(({ data }) => {
        const all = (data ?? []).map((b) => ({ ...b, missing: missingFields(b) }));
        const incomplete = all.filter((b) => b.missing.length > 0);
        setTotal(all.length);
        setRows(incomplete);
        onCountChange?.(incomplete.length);
        setLoading(false);
      });
  }, [onCountChange]);

  const counts = useMemo(() => {
    const c = {} as Record<MissingField, number>;
    for (const r of rows) for (const m of r.missing) c[m] = (c[m] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = filter === "all" ? rows : rows.filter((r) => r.missing.includes(filter));

  const markSent = (slug: string) => {
    const next = { ...readSent(), [slug]: new Date().toISOString() };
    localStorage.setItem(SENT_KEY, JSON.stringify(next));
    setSent(next);
  };

  const getUrl = async (slug: string) => (await adminPost<{ url: string }>("/api/admin/update-link", { slug })).url;

  const message = (r: Row, url: string) => {
    const missing = r.missing.map((m) => MISSING_LABELS[m].toLowerCase()).join(", ");
    const views = (r.view_count ?? 0) >= 10 ? ` ${r.view_count} personas ya han visto su ficha.` : "";
    return `¡Hola! Le saluda el equipo de olanchito.com, el directorio de negocios de Olanchito. ${r.name} ya aparece en el directorio.${views} Le falta: ${missing}. Si lo completa, más clientes le van a encontrar (por ejemplo en "Cerca de mí" y "Abierto ahora"). Toma 2 minutos y no necesita crear cuenta: ${url}`;
  };

  const sendWhatsApp = async (r: Row) => {
    setError("");
    setBusy(r.slug);
    try {
      await openAfter(async () => waLink(r.whatsapp || r.phone, message(r, await getUrl(r.slug))));
      markSent(r.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el enlace");
    } finally {
      setBusy("");
    }
  };

  const copyLink = async (r: Row) => {
    setError("");
    try {
      await navigator.clipboard.writeText(await getUrl(r.slug));
      setCopied(r.slug);
      markSent(r.slug);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo copiar");
    }
  };

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />;

  const complete = total - rows.length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="flex items-center justify-between text-xs font-semibold text-jungle-700">
          <span>{complete} de {total} fichas completas</span>
          <span>{total ? Math.round((complete / total) * 100) : 0}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-jungle-100">
          <div className="h-full rounded-full bg-jungle-500" style={{ width: `${total ? (complete / total) * 100 : 0}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-jungle-500">
          El enlace que se envía dura 30 días y deja al dueño completar ubicación, horario, WhatsApp, descripción y servicios sin crear cuenta.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "location", "hours", "description", "whatsapp", "services"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={
              filter === f
                ? { background: "var(--primary)", color: "white" }
                : { background: "white", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            {f === "all" ? `Todas (${rows.length})` : `Sin ${MISSING_LABELS[f].toLowerCase()} (${counts[f] ?? 0})`}
          </button>
        ))}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>}

      {visible.map((r) => {
        const contact = r.whatsapp || r.phone;
        return (
          <div key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`/negocios/${r.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-jungle-950 hover:underline">
                    {r.name}
                  </a>
                  <span className="inline-flex items-center gap-1 text-[11px] text-jungle-500">
                    <EyeIcon className="h-3.5 w-3.5" />
                    {r.view_count ?? 0}
                  </span>
                  {sent[r.slug] && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200">
                      Pedido {daysAgo(sent[r.slug])}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.missing.map((m) => (
                    <span key={m} className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                      {MISSING_LABELS[m]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                {contact ? (
                  <button
                    onClick={() => sendWhatsApp(r)}
                    disabled={busy === r.slug}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    Pedir por WhatsApp
                  </button>
                ) : (
                  <span className="self-center text-[11px] text-jungle-400">Sin número</span>
                )}
                <button
                  onClick={() => copyLink(r)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50"
                >
                  {copied === r.slug ? <CheckIcon className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
                  {copied === r.slug ? "Copiado" : "Enlace"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
