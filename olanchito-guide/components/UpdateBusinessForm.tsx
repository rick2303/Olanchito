"use client";

import { useMemo, useRef, useState } from "react";
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
  CameraIcon,
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
  // Foto: URL para mostrar (real o portada automática) y si ya tiene una foto real
  imageUrl: string;
  hasImage: boolean;
};

const WHY: Record<MissingField, string> = {
  image: "Una foto real de su negocio da más confianza que la portada automática.",
  location: "Sin ubicación no aparece en el mapa ni en “Cerca de mí”.",
  hours: "Con horario aparece en el filtro “Abierto ahora”.",
  description: "Una buena descripción le ayuda a salir en más búsquedas.",
  whatsapp: "Es el botón que más usan los clientes para contactarle.",
  services: "Los servicios también se usan para encontrarle en el buscador.",
};

function MissingBadge() {
  return (
    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
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
        image: values.hasImage ? "foto" : null,
        location: values.location,
        hours: values.hours,
        description: values.description,
        whatsapp: values.whatsapp,
        services: values.services.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    [values],
  );
  const totalFields = Object.keys(MISSING_LABELS).length;
  const progress = Math.round(((totalFields - stillMissing.length) / totalFields) * 100);

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
              className="inline-flex items-center justify-between gap-2 rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
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
            {label("image", "Foto del negocio", CameraIcon)}
            <PhotoUploader
              slug={initial.slug}
              token={token}
              imageUrl={values.imageUrl}
              hasImage={values.hasImage}
              onUploaded={(url) => setValues((v) => ({ ...v, imageUrl: url, hasImage: true }))}
            />
            {hint("image")}
          </div>

          <div className="panel p-5">
            {label("location", "Ubicación en el mapa", MapPinIcon)}
            <p className="mb-3 text-xs" style={{ color: "var(--ink-3)" }}>Toque el mapa donde está su negocio.</p>
            <LocationPickerWrapper value={values.location} onChange={(loc) => set("location", loc)} />
            {hint("location")}
            <input
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              aria-label="Dirección o referencia"
              autoComplete="street-address"
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
                aria-label="WhatsApp"
                type="tel"
                placeholder="WhatsApp (8 dígitos)"
                inputMode="tel"
                className={inputClass}
                style={inputStyle}
              />
              <input
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                aria-label="Teléfono (opcional)"
                type="tel"
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
              aria-label="Descripción"
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
              aria-label="Productos o servicios"
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

// Reduce la foto en el navegador (lado mayor 1600 px, JPEG): las fotos de celular pesan
// varios MB y el servidor acepta hasta 4 MB. Si el navegador no puede leerla (p. ej. HEIC
// fuera de Safari) se manda tal cual.
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

function PhotoUploader({
  slug,
  token,
  imageUrl,
  hasImage,
  onUploaded,
}: {
  slug: string;
  token: string;
  imageUrl: string;
  hasImage: boolean;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setSaved(false);
    if (!file.type.startsWith("image/")) {
      setError("Elija una foto (JPG o PNG).");
      return;
    }
    setUploading(true);
    try {
      const photo = await compressImage(file);
      const body = new FormData();
      body.append("slug", slug);
      body.append("token", token);
      body.append("file", photo);
      const res = await fetch("/api/actualizar/foto", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir la foto.");
      onUploaded(data.url);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl" style={{ background: "var(--surface-2)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Foto actual del negocio" className="h-full w-full object-cover" />
        {!hasImage && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
            Portada automática
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Elegir foto del negocio"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn-secondary mt-3 w-full justify-center"
      >
        <CameraIcon className="h-4 w-4" />
        {uploading ? "Subiendo foto..." : hasImage ? "Cambiar foto" : "Subir foto del negocio"}
      </button>
      <p className="mt-1.5 text-xs" style={{ color: "var(--ink-3)" }}>
        La fachada, el interior o sus productos. Se publica al momento.
      </p>
      {saved && (
        <p role="status" className="mt-2 text-sm font-semibold text-green-700">Foto publicada.</p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>
      )}
    </div>
  );
}
