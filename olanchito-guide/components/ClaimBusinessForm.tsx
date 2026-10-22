"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ChartBarIcon,
  PhotoIcon,
  ChatBubbleLeftEllipsisIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { trackEvent } from "@/lib/analytics";

const ROLES = ["Dueño", "Encargado o administrador", "Familiar del dueño", "Empleado"];

const BENEFITS = [
  { Icon: PencilSquareIcon, text: "Actualice horario, dirección, fotos y servicios cuando quiera" },
  { Icon: ChatBubbleLeftEllipsisIcon, text: "Responda las reseñas de sus clientes" },
  { Icon: ChartBarIcon, text: "Reciba cada mes cuántos clientes le contactaron" },
  { Icon: PhotoIcon, text: "Acceso gratis al portal del negocio" },
];

export default function ClaimBusinessForm({ name, slug }: { name: string; slug: string }) {
  const startedAt = useRef(Date.now());
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", role: ROLES[0], message: "", website: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/reclamar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug, startedAt: startedAt.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar.");
      trackEvent("business_claim", { business_slug: slug });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <section className="section-container py-12">
        <div className="panel mx-auto max-w-xl p-8 text-center">
          <CheckCircleIcon className="mx-auto mb-3 h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
            Recibimos su solicitud
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
            Vamos a confirmar con usted por WhatsApp que es el responsable de {name}. Cuando lo aprobemos le llegará al correo
            el acceso a su portal. Normalmente toma menos de 2 días.
          </p>
          <Link href={`/negocios/${slug}`} className="btn-secondary mt-6 inline-flex">Volver a la ficha</Link>
        </div>
      </section>
    );
  }

  const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink)" };
  const labelClass = "mb-1.5 block text-xs font-semibold";

  return (
    <section className="section-container py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="badge-primary mb-3 w-fit">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Gratis
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}>
            ¿Es el responsable de {name}?
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Esta ficha ya está en el directorio, pero nadie la administra. Reclámela y tome el control de cómo le ven sus clientes.
          </p>
          <ul className="mt-6 space-y-3">
            {BENEFITS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm" style={{ color: "var(--ink-2)" }}>
                <span className="icon-box flex-shrink-0 !h-8 !w-8">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed" style={{ color: "var(--ink-3)" }}>
            Para proteger a los negocios revisamos cada solicitud. Es más rápido si usa el mismo WhatsApp que aparece en la ficha.
          </p>
        </div>

        <form onSubmit={submit} className="panel space-y-4 p-5 sm:p-6">
          <input type="text" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="c-name">Su nombre *</label>
            <input id="c-name" required autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} className={inputClass} style={inputStyle} />
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="c-role">Su relación con el negocio</label>
            <select id="c-role" value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass} style={inputStyle}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="c-email">Correo *</label>
            <input id="c-email" type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} style={inputStyle} />
            <p className="mt-1 text-xs" style={{ color: "var(--ink-3)" }}>Ahí le llegará el acceso a su portal.</p>
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="c-wa">WhatsApp *</label>
            <input id="c-wa" type="tel" required autoComplete="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="8 dígitos" className={inputClass} style={inputStyle} />
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--ink-2)" }} htmlFor="c-msg">Comentario (opcional)</label>
            <textarea id="c-msg" rows={3} maxLength={500} value={form.message} onChange={(e) => set("message", e.target.value)} className={inputClass} style={inputStyle} placeholder="Algo que nos ayude a confirmar que es usted" />
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}

          <button type="submit" disabled={sending} className="btn-primary w-full justify-center !py-3">
            {sending ? "Enviando..." : "Reclamar mi negocio"}
          </button>
        </form>
      </div>
    </section>
  );
}
