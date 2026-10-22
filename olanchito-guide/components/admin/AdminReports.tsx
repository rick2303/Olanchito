"use client";

import { useEffect, useState } from "react";
import { ChatBubbleLeftRightIcon, EnvelopeIcon, EyeIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { adminPost, waLink } from "./adminApi";

type Row = {
  id: string;
  name: string;
  slug: string;
  hasEmail: boolean;
  whatsapp: string | null;
  tier: string;
  optedOut: boolean;
  contacts: number;
  totalViews: number;
  reviewCount: number;
  missing: number;
};
type ListResponse = { period: string; enabled: boolean; sent: boolean; recipients: number; reports: Row[] };
type Preview = { subject: string; html: string; text: string };

// Mes anterior en formato "AAAA-MM" (el reporte siempre es del mes que ya terminó)
function lastMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminReports() {
  const [mes, setMes] = useState(lastMonth());
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<(Preview & { slug: string }) | null>(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    adminPost<ListResponse>("/api/admin/reportes", { action: "list", mes })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [mes]);

  const open = async (slug: string) => {
    setBusy(slug);
    try {
      setPreview({ slug, ...(await adminPost<Preview>("/api/admin/reportes", { action: "preview", slug, mes })) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
    }
  };

  const sendTest = async (slug: string) => {
    setBusy(slug);
    setNotice("");
    try {
      const res = await adminPost<{ to: string }>("/api/admin/reportes", { action: "test", slug, mes });
      setNotice(`Prueba enviada a ${res.to}. Revise también la carpeta de spam.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-jungle-950">Resumen mensual para dueños</p>
            <p className="mt-0.5 text-xs text-jungle-600">
              Se envía solo el día 1 de cada mes a las 9:00 a. m. (hora de Honduras) a los negocios con correo de dueño.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-jungle-700">
            Mes
            <input
              type="month"
              value={mes}
              onChange={(e) => e.target.value && setMes(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-xs ring-1 ring-jungle-200"
            />
          </label>
        </div>
        {data && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className={`rounded-full px-2.5 py-1 ring-1 ${data.enabled ? "bg-green-50 text-green-700 ring-green-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
              Envío automático {data.enabled ? "activado" : "desactivado (MONTHLY_REPORTS_ENABLED)"}
            </span>
            <span className="rounded-full bg-jungle-50 px-2.5 py-1 text-jungle-700 ring-1 ring-jungle-200">
              {data.recipients} destinatarios para {data.period}
            </span>
            {data.sent && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-200">Ya enviado</span>
            )}
          </div>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-green-50 px-4 py-2 text-xs font-semibold text-green-800">{notice}</p>}
      {!data && !error && <div className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />}

      {data?.reports.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-jungle-950">{r.name}</p>
            <p className="mt-1 text-xs text-jungle-600">
              {r.contacts} contacto{r.contacts !== 1 ? "s" : ""} · {r.totalViews} visitas · {r.reviewCount} reseña{r.reviewCount !== 1 ? "s" : ""}
              {r.missing > 0 && ` · ${r.missing} dato${r.missing !== 1 ? "s" : ""} faltante${r.missing !== 1 ? "s" : ""}`}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
              {r.hasEmail ? (
                r.optedOut ? (
                  <span className="rounded-full bg-jungle-50 px-2 py-0.5 text-jungle-700">Se dio de baja</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-green-700"><EnvelopeIcon className="h-3 w-3" />Recibe correo</span>
                )
              ) : (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Sin correo de dueño</span>
              )}
              {r.tier !== "free" && <span className="rounded-full bg-jungle-50 px-2 py-0.5 capitalize text-jungle-700">{r.tier}</span>}
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            <button onClick={() => open(r.slug)} disabled={busy === r.slug} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50">
              <EyeIcon className="h-4 w-4" />
              Ver correo
            </button>
            <button onClick={() => sendTest(r.slug)} disabled={busy === r.slug} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50">
              <PaperAirplaneIcon className="h-4 w-4" />
              Probar en mi correo
            </button>
          </div>
        </div>
      ))}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" role="dialog" aria-modal="true" aria-label="Vista previa del correo">
          <div className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-jungle-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-jungle-950">{preview.subject}</p>
              <button onClick={() => setPreview(null)} aria-label="Cerrar" className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl hover:bg-jungle-50">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <iframe title="Correo" srcDoc={preview.html} className="h-[70vh] w-full" sandbox="" />
            <div className="flex flex-wrap gap-2 border-t border-jungle-100 px-4 py-3">
              {data?.reports.find((x) => x.slug === preview.slug)?.whatsapp && (
                <a
                  href={waLink(data.reports.find((x) => x.slug === preview.slug)!.whatsapp, preview.text)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Enviar este resumen por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
