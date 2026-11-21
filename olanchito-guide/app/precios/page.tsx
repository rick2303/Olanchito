"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

interface BusinessOption {
  id: string;
  name: string;
  slug: string;
  subscription_active: boolean;
  subscription_tier: string;
}

const WHATSAPP = "50497952651";
const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const FREE_FEATURES = [
  "Nombre, categoría y descripción",
  "Teléfono y botón de WhatsApp",
  "Horario y aviso de abierto ahora",
  "Ubicación en el mapa y redes sociales",
  "Portal para corregir tus datos",
  "Cuántos clientes te contactaron",
];

const FEATURED_FEATURES = [
  "Primer lugar en tu categoría y en las búsquedas",
  "Insignia de negocio destacado",
  "Galería de hasta 15 fotos",
  "Catálogo ilimitado de productos",
  "Ofertas, promociones y anuncio en tu ficha",
  "Responder reseñas y link de citas",
  "Contactos por WhatsApp y llamada, semana a semana",
  "QR descargable para tu local",
];

const FAQ = [
  {
    q: "¿Aparecer en el directorio cuesta algo?",
    a: "No. La ficha gratuita no se vence, no pide tarjeta y nadie te va a cobrar después. Destacado es opcional.",
  },
  {
    q: "¿Cómo pago si no tengo tarjeta?",
    a: "Por transferencia o depósito bancario. Nos escribes por WhatsApp, te damos los datos y activamos tu plan el mismo día que recibimos el comprobante.",
  },
  {
    q: "¿Por qué solo 3 destacados por categoría?",
    a: "Porque si todos salen primero, nadie sale primero. Con 3 cupos, quien paga realmente queda arriba cuando buscan su categoría.",
  },
  {
    q: "¿Qué pasa si no renuevo?",
    a: "Tu negocio sigue en el directorio con la ficha gratuita y conservas el portal para corregir tus datos. Solo se libera tu cupo de destacado.",
  },
  {
    q: "¿Necesito saber de tecnología?",
    a: "No. Si puedes usar WhatsApp, puedes usar el portal. Y si prefieres, nos mandas tus fotos y las subimos por ti.",
  },
];

export default function PreciosPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [pickerBusinesses, setPickerBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  const submitCheckout = async (businessId?: string) => {
    setError("");
    setLoading(true);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tier: "featured", business_id: businessId }),
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

  return (
    <main className="min-h-screen bg-jungle-50">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">

        {/* Encabezado */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-jungle-600 animate-fade-up">Planes</p>
          <h1 className="text-3xl font-bold text-jungle-950 sm:text-4xl animate-fade-up anim-delay-1" style={{ fontFamily: "var(--font-syne)" }}>
            Aparecer es gratis. Salir primero es opcional.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-jungle-700 animate-fade-up anim-delay-2">
            Todos los negocios de Olanchito tienen su ficha sin pagar. El plan Destacado es para quien quiere quedar arriba cuando buscan su categoría.
          </p>
        </div>

        {/* Planes */}
        <div className="grid gap-5 sm:grid-cols-2">

          {/* Gratis */}
          <div className="flex flex-col rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] animate-fade-up anim-delay-2">
            <p className="text-xs font-bold uppercase tracking-widest text-jungle-600">Gratis</p>
            <p className="mt-1 text-3xl font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>L 0</p>
            <p className="mt-1 text-xs text-jungle-600">Para siempre, sin tarjeta</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-jungle-800">
                  <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-jungle-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/registrar"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-jungle-900 py-3 text-sm font-bold text-white transition-colors hover:bg-jungle-800"
            >
              Registrar mi negocio
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Destacado */}
          <div className="relative flex flex-col rounded-3xl bg-amber-50 p-6 ring-2 ring-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.08)] animate-fade-up anim-delay-3">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-700 px-3 py-1 text-[11px] font-bold text-white">
              Máximo 3 por categoría
            </span>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
              <TrophyIcon className="h-4 w-4" />
              Destacado
            </p>
            <p className="mt-1 text-3xl font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
              L 2,500 <span className="text-sm font-semibold text-jungle-700">al año</span>
            </p>
            <p className="mt-1 text-xs text-jungle-700">
              Sale a L 208 al mes. También puedes pagar L 250 mes a mes.
            </p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {FEATURED_FEATURES.map((f, i) => (
                <li key={f} className={`flex items-start gap-2 text-sm ${i === 0 ? "font-bold text-jungle-950" : "text-jungle-800"}`}>
                  <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={waLink("Hola, quiero el plan Destacado para mi negocio en olanchito.com. ¿Cómo hago la transferencia?")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#128C7E] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0f7a6e]"
            >
              Pedir Destacado por WhatsApp
              <ArrowRightIcon className="h-4 w-4" />
            </a>
            <p className="mt-2 text-center text-xs text-jungle-700">
              Pagas por transferencia o depósito. Activamos el mismo día.
            </p>

            <button
              type="button"
              onClick={() => setShowCard((v) => !v)}
              className="mt-3 text-center text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
              aria-expanded={showCard}
            >
              {showCard ? "Ocultar pago con tarjeta" : "Prefiero pagar con tarjeta ($10 al mes)"}
            </button>

            {showCard && (
              <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-amber-200 animate-fade-up">
                {pickerBusinesses.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-jungle-950">¿Para cuál negocio?</p>
                    <div className="space-y-2">
                      {pickerBusinesses.map((b) => {
                        const isSelected = selectedBusinessId === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            disabled={b.subscription_active}
                            onClick={() => setSelectedBusinessId(b.id)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition-colors ${
                              b.subscription_active
                                ? "cursor-not-allowed opacity-50 ring-jungle-200 text-jungle-600"
                                : isSelected
                                  ? "bg-jungle-900 font-semibold text-white ring-jungle-900"
                                  : "text-jungle-800 ring-jungle-200 hover:bg-jungle-50"
                            }`}
                          >
                            <BuildingStorefrontIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1">{b.name}</span>
                            {b.subscription_active && <span className="text-[11px] font-bold uppercase">Ya activo</span>}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      disabled={!selectedBusinessId || loading}
                      onClick={() => submitCheckout(selectedBusinessId)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Redirigiendo al pago..." : "Continuar al pago"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCheckout} className="space-y-2.5">
                    <label htmlFor="correo-pago" className="block text-xs font-semibold text-jungle-800">
                      Correo con el que registraste tu negocio
                    </label>
                    <input
                      id="correo-pago"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="tu@correo.com"
                      className="field"
                    />
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Redirigiendo al pago..." : "Pagar con tarjeta: $10 al mes"}
                    </button>
                    <p className="text-center text-[11px] text-jungle-600">Pago seguro con Stripe. Cancelas cuando quieras.</p>
                  </form>
                )}

                {error && (
                  <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-200">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-xs text-red-800">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Oferta de lanzamiento */}
        <div className="mt-6 rounded-3xl bg-jungle-900 p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7 animate-fade-up anim-delay-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-jungle-300">Lanzamiento</p>
            <p className="mt-1 text-lg font-bold" style={{ fontFamily: "var(--font-syne)" }}>
              Los primeros 10 negocios prueban Destacado 2 meses sin pagar
            </p>
            <p className="mt-1 text-sm text-jungle-200">
              Si al final no te trajo clientes, vuelves a la ficha gratuita y no debes nada.
            </p>
          </div>
          <a
            href={waLink("Hola, quiero probar el plan Destacado 2 meses gratis para mi negocio en olanchito.com.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-jungle-950 transition-colors hover:bg-jungle-100 sm:mt-0"
          >
            Quiero probarlo
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Preguntas */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
              <p className="text-sm font-bold text-jungle-950">{q}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-jungle-700">{a}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-jungle-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/owner/login" className="font-semibold text-jungle-800 hover:underline">
            Entra a tu portal
          </Link>
        </p>
      </section>
    </main>
  );
}
