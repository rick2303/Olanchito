"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import HoursInput from "@/components/HoursInput";
import LocationPickerWrapper from "@/components/LocationPickerWrapper";
import type { LatLng } from "@/components/LocationPicker";
import { MISSING_LABELS, missingFields, type MissingField } from "@/lib/businessFields";

type Values = {
  name: string;
  slug: string;
  description: string;
  hours: string;
  address: string;
  whatsapp: string;
  phone: string;
  location: LatLng | null;
  services: string;
};

const WHY: Record<MissingField, string> = {
  location: "Sin ubicación no aparece en el mapa ni en “Cerca de mí”.",
  hours: "Con horario aparece en el filtro “Abierto ahora”.",
  description: "Una buena descripción le ayuda a salir en más búsquedas.",
  whatsapp: "Es el botón que más usan los clientes para contactarle.",
  services: "Los servicios también se usan para encontrarle en el buscador.",
};

function MissingBadge() {
  return (
    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
      Falta
    </span>
  );
}

export default function UpdateBusinessForm({
  token,
  initial,
  missing,
}: {
  token: string;
  initial: Values;
  missing: MissingField[];
}) {
  const [values, setValues] = useState<Values>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  // Avance en vivo: la ficha se va completando mientras escribe
  const stillMissing = useMemo(
    () =>
      missingFields({
        location: values.location,
        hours: values.hours,
        description: values.description,
        whatsapp: values.whatsapp,
        services: values.services.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    [values],
  );
  const progress = Math.round(((5 - stillMissing.length) / 5) * 100);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/actualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, slug: initial.slug, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    const reviewLink = `https://olanchito.com/negocios/${initial.slug}?utm_source=owner&utm_medium=review_request#resenas`;
    return (
      <section className="section-container py-12">
        <div className="panel mx-auto max-w-xl p-8 text-center">
          <CheckCircleIcon className="mx-auto mb-3 h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
            ¡Listo! Su ficha está actualizada
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
            Los cambios ya se ven en olanchito.com. Ahora ayude a que más clientes le encuentren:
          </p>

          <div className="mt-6 grid gap-2 text-left">
            <Link href={`/negocios/${initial.slug}`} className="btn-secondary justify-between">
              Ver mi ficha
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`¡Hola! Si le gustó la atención en ${initial.name}, ¿nos deja una reseña? ${reviewLink}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              <span className="inline-flex items-center gap-2">
                <StarIcon className="h-4 w-4" />
                Pedir reseñas a mis clientes por WhatsApp
              </span>
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 rounded-2xl p-4 text-left text-sm" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
            <p className="font-semibold" style={{ color: "var(--ink)" }}>¿Quiere fotos, catálogo y ver cuántos clientes le escriben?</p>
            <p className="mt-1 text-xs">Con el portal del negocio administra todo usted mismo, sin esperar a nadie.</p>
            <Link href="/precios" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--primary-mid)" }}>
              Ver planes
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const label = (field: MissingField | null, text: string, Icon: typeof MapPinIcon) => (
    <div className="mb-2 flex items-center">
      <Icon className="mr-2 h-4 w-4" style={{ color: "var(--primary-mid)" }} />
      <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{text}</span>
      {field && stillMissing.includes(field) && <MissingBadge />}
    </div>
  );

  const hint = (field: MissingField) =>
    missing.includes(field) ? <p className="mt-1.5 text-xs" style={{ color: "var(--ink-3)" }}>{WHY[field]}</p> : null;

  const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink)" };

  return (
    <section className="section-container py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <p className="section-label mb-2">Directorio Olanchito</p>
        <h1 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}>
          Complete la ficha de {initial.name}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
          Toma unos 2 minutos y no necesita crear cuenta. Lo que agregue se publica al momento.
        </p>

        {/* Avance */}
        <div className="panel mt-6 p-4">
          <div className="flex items-center justify-between text-xs font-semibold" style={{ color: "var(--ink-2)" }}>
            <span>Ficha completa al {progress}%</span>
            <span>{stillMissing.length === 0 ? "¡Completa!" : `Falta: ${stillMissing.map((f) => MISSING_LABELS[f]).join(", ")}`}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
            <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-5">
          <div className="panel p-5">
            {label("location", "Ubicación en el mapa", MapPinIcon)}
            <p className="mb-3 text-xs" style={{ color: "var(--ink-3)" }}>Toque el mapa donde está su negocio.</p>
            <LocationPickerWrapper value={values.location} onChange={(loc) => set("location", loc)} />
            {hint("location")}
            <input
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Dirección o referencia (ej.: Barrio El Centro, frente al parque)"
              className={`${inputClass} mt-3`}
              style={inputStyle}
              maxLength={200}
            />
          </div>

          <div className="panel p-5">
            {label("hours", "Horario de atención", ClockIcon)}
            <HoursInput value={values.hours} onChange={(v) => set("hours", v)} />
            {hint("hours")}
          </div>

          <div className="panel p-5">
            {label("whatsapp", "WhatsApp y teléfono", ChatBubbleLeftRightIcon)}
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={values.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="WhatsApp (8 dígitos)"
                inputMode="tel"
                className={inputClass}
                style={inputStyle}
              />
              <input
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="Teléfono (opcional)"
                inputMode="tel"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            {hint("whatsapp")}
          </div>

          <div className="panel p-5">
            {label("description", "Descripción", DocumentTextIcon)}
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              maxLength={1200}
              placeholder="¿Qué vende o qué servicio ofrece? ¿Qué le hace diferente?"
              className={inputClass}
              style={inputStyle}
            />
            {hint("description")}
          </div>

          <div className="panel p-5">
            {label("services", "Productos o servicios", WrenchScrewdriverIcon)}
            <input
              value={values.services}
              onChange={(e) => set("services", e.target.value)}
              placeholder="Separados por coma: reparación de celulares, accesorios, recargas"
              className={inputClass}
              style={inputStyle}
            />
            {hint("services")}
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center !py-3">
            {saving ? "Guardando..." : "Guardar y publicar"}
          </button>
        </form>
      </div>
    </section>
  );
}
