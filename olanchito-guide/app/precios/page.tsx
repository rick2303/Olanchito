"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

interface BusinessOption {
  id: string;
  name: string;
  slug: string;
  subscription_active: boolean;
  subscription_tier: string;
}

export default function PreciosPage() {
  const [email, setEmail] = useState("");
  const [selectedTier, setSelectedTier] = useState<"premium" | "featured">("premium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pickerBusinesses, setPickerBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const submitCheckout = async (businessId?: string) => {
    setError("");
    setLoading(true);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tier: selectedTier, business_id: businessId }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.needsPicker) {
      setPickerBusinesses(data.businesses);
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Error al procesar. Intenta de nuevo.");
      return;
    }

    window.location.href = data.url;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCheckout();
  };

  const handlePickBusiness = async () => {
    if (!selectedBusinessId) return;
    await submitCheckout(selectedBusinessId);
  };

  return (
    <main className="min-h-screen bg-jungle-50">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-jungle-500">Planes</p>
          <h1 className="text-3xl font-bold text-jungle-950 sm:text-4xl" style={{ fontFamily: "var(--font-syne)" }}>
            Más visibilidad para tu negocio
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-jungle-600">
            Desde aparecer en el directorio hasta tener tu propio portal de gestión.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid gap-5 sm:grid-cols-3 mb-14">
          <PlanCard
            title="Gratis"
            price="$0"
            description="Presencia básica en el directorio"
            features={[
              "Nombre, categoría y descripción",
              "Horario de atención",
              "Teléfono y WhatsApp visibles",
              "Redes sociales y sitio web",
              "Ubicación en Google Maps",
            ]}
            missing={[
              "Galería de fotos",
              "Catálogo de productos",
              "Estadísticas de visitas",
              "Responder reseñas",
            ]}
          />
          <PlanCard
            title="Premium"
            price="$6 / mes"
            highlight
            description="Convierte visitas en clientes"
            features={[
              "Todo lo del plan Gratis",
              "Galería de hasta 5 fotos",
              "Catálogo de hasta 10 productos",
              "Link de citas / reservas",
              "Responder reseñas de clientes",
              "Estadísticas de visitas totales",
            ]}
            missing={[
              "Ofertas y promociones",
              "Estadísticas de clics de contacto",
              "Anuncio destacado en tu página",
              "QR descargable para tu local",
            ]}
          />
          <PlanCard
            title="Destacado"
            price="$10 / mes"
            description="Máxima visibilidad y herramientas"
            badge="Más completo"
            features={[
              "Todo lo del plan Premium",
              "Galería de hasta 15 fotos",
              "Catálogo ilimitado de productos",
              "Ofertas y promociones con precios",
              "Anuncio destacado en tu página",
              "Estadísticas de clics WA y teléfono",
              "QR descargable para tu local",
              "Aparece primero en los listados",
              "Insignia de negocio destacado",
            ]}
          />
        </div>

        {/* Owner Portal highlight */}
        <div className="rounded-3xl bg-jungle-900 p-8 text-white ring-1 ring-jungle-800 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-jungle-700/60 px-3 py-1 ring-1 ring-jungle-600">
                <SparklesIcon className="h-3.5 w-3.5 text-jungle-300" />
                <span className="text-xs font-bold text-jungle-200">Owner Portal</span>
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-syne)" }}>
                Gestiona tu negocio tú mismo
              </h2>
              <p className="mt-3 text-sm text-jungle-300">
                Todos los negocios registrados tienen acceso <span className="font-bold text-white">gratis</span> al portal básico. Activa Premium o Destacado para desbloquear el resto de funciones.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  { text: "Edita horarios, descripción y contacto", tier: "premium" },
                  { text: "Galería de fotos (5 Premium / 15 Destacado)", tier: "premium" },
                  { text: "Catálogo de productos (10 Premium / ∞ Destacado)", tier: "premium" },
                  { text: "Link de citas y redes sociales visibles", tier: "premium" },
                  { text: "Responde reseñas de tus clientes", tier: "premium" },
                  { text: "Estadísticas de visitas totales", tier: "premium" },
                  { text: "Ofertas y promociones con precios y vigencia", tier: "featured" },
                  { text: "Anuncio destacado en tu página pública", tier: "featured" },
                  { text: "Estadísticas de clics en WhatsApp y teléfono", tier: "featured" },
                  { text: "QR descargable para imprimir en tu local", tier: "featured" },
                  { text: "Prioridad e insignia de negocio destacado", tier: "featured" },
                ].map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm text-jungle-200">
                    <CheckBadgeIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${f.tier === "featured" ? "text-amber-400" : "text-jungle-400"}`} />
                    <span>
                      {f.text}
                      {f.tier === "featured" && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">Destacado</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Checkout form */}
            <div className="rounded-2xl bg-jungle-800/70 p-6 ring-1 ring-jungle-700 backdrop-blur">
              <p className="mb-1 text-base font-bold text-white">Activa el Owner Portal</p>
              <p className="mb-5 text-xs text-jungle-400">
                Ingresa el correo con el que registraste tu negocio. Si aún no está en el directorio,{" "}
                <Link href="/registrar" className="text-jungle-300 hover:underline">regístralo aquí primero</Link>.
              </p>

              {pickerBusinesses.length > 0 && (
                <div className="mb-5 space-y-3">
                  <p className="text-sm font-bold text-white">¿Para cuál negocio?</p>
                  <p className="text-xs text-jungle-400">Tu correo está asociado a varios negocios. Selecciona el que quieres activar.</p>
                  <div className="space-y-2">
                    {pickerBusinesses.map((b) => {
                      const alreadyActive = b.subscription_active;
                      const isSelected = selectedBusinessId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          disabled={alreadyActive}
                          onClick={() => setSelectedBusinessId(b.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ring-1 ${alreadyActive
                              ? "opacity-50 cursor-not-allowed bg-jungle-900/30 ring-jungle-700 text-jungle-500"
                              : isSelected
                                ? "bg-white text-jungle-950 ring-white font-semibold"
                                : "bg-jungle-900/50 text-jungle-300 ring-jungle-700 hover:bg-jungle-800/60"
                            }`}
                        >
                          <BuildingStorefrontIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{b.name}</span>
                          {alreadyActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-jungle-500">Ya activo</span>
                          )}
                          {isSelected && !alreadyActive && (
                            <CheckIcon className="h-4 w-4 text-jungle-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!selectedBusinessId || loading}
                    onClick={handlePickBusiness}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedTier === "featured"
                        ? "bg-amber-500 text-white hover:bg-amber-400"
                        : "bg-white text-jungle-950 hover:bg-jungle-100"
                      }`}
                  >
                    {loading ? "Redirigiendo a pago..." : (
                      <>
                        Activar {selectedTier === "featured" ? "Destacado" : "Premium"} para este negocio
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPickerBusinesses([]); setSelectedBusinessId(""); }}
                    className="w-full text-center text-xs text-jungle-500 hover:text-jungle-300"
                  >
                    ← Volver
                  </button>
                </div>
              )}

              <form onSubmit={handleCheckout} className={`space-y-3 ${pickerBusinesses.length > 0 ? "hidden" : ""}`}>
                <div className="flex gap-2">
                  {([
                    { id: "premium", label: "Premium", price: "$6/mes" },
                    { id: "featured", label: "Destacado", price: "$10/mes" },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTier(t.id)}
                      className={`flex flex-1 flex-col items-center rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ring-1 ${selectedTier === t.id
                          ? t.id === "featured"
                            ? "bg-amber-500 text-white ring-amber-400"
                            : "bg-white text-jungle-950 ring-white"
                          : "bg-jungle-900/50 text-jungle-400 ring-jungle-700 hover:bg-jungle-800/60"
                        }`}
                    >
                      {t.label}
                      <span className="mt-0.5 text-[10px] font-semibold opacity-80">{t.price}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@correo.com"
                  className="w-full rounded-xl bg-jungle-900/70 px-4 py-3 text-sm text-white placeholder-jungle-500 ring-1 ring-jungle-600 outline-none focus:ring-jungle-400"
                />

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-900/40 px-3 py-2.5 ring-1 ring-red-700">
                    <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${selectedTier === "featured"
                      ? "bg-amber-500 text-white hover:bg-amber-400"
                      : "bg-white text-jungle-950 hover:bg-jungle-100"
                    }`}
                >
                  {loading ? "Redirigiendo a pago..." : (
                    <>
                      Activar {selectedTier === "featured" ? "Destacado" : "Premium"} — {selectedTier === "featured" ? "$10" : "$6"}/mes
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-jungle-500">
                  Pago seguro con Stripe. Cancela cuando quieras.
                </p>
              </form>

              <div className="mt-5 border-t border-jungle-700 pt-4 space-y-3">
                <a
                  href={`https://wa.me/50497952651?text=${encodeURIComponent("Hola, me interesa activar el Owner Portal para mi negocio en Olanchito. ¿Cómo puedo pagar por transferencia bancaria?")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 py-2.5 text-xs font-semibold text-[#25D366] ring-1 ring-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Pagar por transferencia bancaria
                </a>
                <p className="text-xs text-jungle-500">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/owner/login" className="font-semibold text-jungle-300 hover:underline">
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {[
            {
              q: "¿Necesito saber de tecnología?",
              a: "No. El portal es muy fácil de usar. Si puedes usar WhatsApp, puedes usar el portal.",
            },
            {
              q: "¿Cómo recibo acceso después de pagar?",
              a: "Te llega un correo para crear tu contraseña. Es el único correo que recibirás.",
            },
            {
              q: "¿Qué pasa si cancelo?",
              a: "Tu negocio sigue en el directorio con el plan gratuito. Solo pierdes acceso al portal de gestión.",
            },
            {
              q: "¿Mi catálogo se ve en la página de mi negocio?",
              a: "Sí. Tus clientes pueden ver los productos y servicios disponibles directamente en tu página.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
              <p className="text-sm font-bold text-jungle-950">{q}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-jungle-600">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function PlanCard({
  title,
  price,
  description,
  features,
  missing,
  highlight,
  badge,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  missing?: string[];
  highlight?: boolean;
  badge?: string;
}) {
  const isDestacado = title === "Destacado";
  return (
    <div className={`relative rounded-3xl p-6 ring-1 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ${isDestacado ? "bg-amber-50 ring-amber-300" : highlight ? "bg-white ring-jungle-400" : "bg-white ring-black/5"
      }`}>
      {(highlight || badge) && (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold text-white ${isDestacado ? "bg-amber-500" : "bg-jungle-700"
          }`}>
          {badge ?? "Más popular"}
        </span>
      )}
      <p className={`text-xs font-bold uppercase tracking-widest ${isDestacado ? "text-amber-600" : "text-jungle-500"}`}>{title}</p>
      <p className="mt-1 text-2xl font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
        {price}
      </p>
      <p className="mt-1 text-xs text-jungle-600">{description}</p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-jungle-700">
            <CheckIcon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${isDestacado ? "text-amber-500" : "text-jungle-500"}`} />
            {f}
          </li>
        ))}
        {missing?.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-jungle-400">
            <span className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-center leading-none">—</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
