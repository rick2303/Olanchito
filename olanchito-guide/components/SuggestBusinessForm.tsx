"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  HeartIcon,
  MapPinIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import LocationPickerWrapper from "@/components/LocationPickerWrapper";
import type { LatLng } from "@/components/LocationPicker";
import { trackEvent } from "@/lib/analytics";

type Category = { id: string; name: string };

export default function SuggestBusinessForm({ categories, initialName }: { categories: Category[]; initialName: string }) {
  const startedAt = useRef(Date.now());
  const [form, setForm] = useState({
    name: initialName,
    category_id: "",
    whatsapp: "",
    phone: "",
    address: "",
    description: "",
    submitter_name: "",
    submitter_contact: "",
    website: "",
  });
  const [location, setLocation] = useState<LatLng | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [existingSlug, setExistingSlug] = useState("");
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setExistingSlug("");
    try {
      const res = await fetch("/api/sugerir-negocio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, location, startedAt: startedAt.current }),
      });
      const data = await res.json();
      if (res.status === 409 && data.slug) setExistingSlug(data.slug);
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar.");
      trackEvent("business_suggest", { category: categories.find((c) => c.id === form.category_id)?.name });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  };

  const shareText = "Estoy ayudando a completar el directorio de negocios de Olanchito. Si conoce uno que falta, agréguelo aquí: https://olanchito.com/sugerir-negocio";

  if (done) {
    return (
      <section className="section-container py-12">
        <div className="panel mx-auto max-w-xl p-8 text-center">
          <CheckCircleIcon className="mx-auto mb-3 h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
            ¡Gracias por sumar a Olanchito!
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
            Vamos a confirmar los datos con el negocio y lo publicaremos en los próximos días.
          </p>
          <div className="mt-6 grid gap-2">
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setLocation(null);
                setShowMap(false);
                startedAt.current = Date.now();
                setForm((f) => ({ ...f, name: "", category_id: "", whatsapp: "", phone: "", address: "", description: "" }));
              }}
              className="btn-primary justify-center"
            >
              Sugerir otro negocio
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent("share", { method: "whatsapp", content_type: "suggest_page" })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Invitar a otros vecinos por WhatsApp
            </a>
            <Link href="/negocios" className="btn-secondary justify-center">Volver al directorio</Link>
          </div>
        </div>
      </section>
    );
  }

  const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink)" };
  const labelClass = "mb-1.5 block text-xs font-semibold";

  return (
    <section className="section-container py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="badge-primary mb-3 w-fit">
            <HeartIcon className="h-3.5 w-3.5" />
            Hecho por la comunidad
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}>
            ¿Falta un negocio? Agréguelo
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            La pulpería de la esquina, el taller de confianza, la señora que hace los mejores tamales: si es de Olanchito y la gente lo busca, debería estar aquí.
          </p>
          <ol className="mt-6 space-y-3 text-sm" style={{ color: "var(--ink-2)" }}>
            {[
              "Usted nos dice el nombre y cómo contactarlo.",
              "Confirmamos los datos con el negocio.",
              "Lo publicamos gratis para que todos lo encuentren.",
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs" style={{ color: "var(--ink-3)" }}>
            ¿Es el dueño?{" "}
            <Link href="/registrar" className="font-semibold underline" style={{ color: "var(--primary-mid)" }}>
              Regístrelo usted mismo
            </Link>{" "}
            y reciba acceso a su portal.
          </p>
        </div>

        <form onSubmit={submit} className="panel space-y-4 p-5 sm:p-6">
          {/* Campo trampa para bots: invisible para las personas */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="s-name">Nombre del negocio *</label>
            <input id="s-name" required value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} className={inputClass} style={inputStyle} placeholder="Ej.: Comedor Doña Tere" />
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="s-cat">Tipo de negocio</label>
            <select id="s-cat" value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inputClass} style={inputStyle}>
              <option value="">Elegir categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="s-wa">WhatsApp del negocio *</label>
              <input id="s-wa" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} inputMode="tel" className={inputClass} style={inputStyle} placeholder="8 dígitos" />
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="s-ph">o teléfono</label>
              <input id="s-ph" value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" className={inputClass} style={inputStyle} placeholder="8 dígitos" />
            </div>
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="s-addr">¿Dónde queda?</label>
            <input id="s-addr" value={form.address} onChange={(e) => set("address", e.target.value)} maxLength={200} className={inputClass} style={inputStyle} placeholder="Barrio y una referencia" />
            {showMap ? (
              <div className="mt-3">
                <LocationPickerWrapper value={location} onChange={setLocation} />
              </div>
            ) : (
              <button type="button" onClick={() => setShowMap(true)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--primary-mid)" }}>
                <MapPinIcon className="h-3.5 w-3.5" />
                Marcar en el mapa (opcional)
              </button>
            )}
          </div>

          <div>
            <label className={labelClass} style={{ color: "var(--ink)" }} htmlFor="s-desc">¿Qué venden u ofrecen?</label>
            <textarea id="s-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} maxLength={600} className={inputClass} style={inputStyle} placeholder="Ej.: comida típica, baleadas y licuados" />
          </div>

          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2" style={{ borderColor: "var(--line)" }}>
            <div>
              <label className={labelClass} style={{ color: "var(--ink-2)" }} htmlFor="s-sn">Su nombre (opcional)</label>
              <input id="s-sn" value={form.submitter_name} onChange={(e) => set("submitter_name", e.target.value)} maxLength={80} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: "var(--ink-2)" }} htmlFor="s-sc">Su WhatsApp o correo (opcional)</label>
              <input id="s-sc" value={form.submitter_contact} onChange={(e) => set("submitter_contact", e.target.value)} maxLength={80} className={inputClass} style={inputStyle} placeholder="Por si tenemos dudas" />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
              {error}
              {existingSlug && (
                <Link href={`/negocios/${existingSlug}`} className="mt-1 flex items-center gap-1 underline">
                  Ver la ficha <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}

          <button type="submit" disabled={sending} className="btn-primary w-full justify-center !py-3">
            <BuildingStorefrontIcon className="h-4 w-4" />
            {sending ? "Enviando..." : "Enviar sugerencia"}
          </button>
        </form>
      </div>
    </section>
  );
}
