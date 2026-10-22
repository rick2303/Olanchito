"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function VerifyClaimForm({ slug, name }: { slug: string; name: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/reclamar/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo verificar.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <CheckCircleIcon className="mx-auto mb-3 h-12 w-12 text-green-600" />
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
          ¡Verificado!
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
          Confirmamos que usted tiene acceso al teléfono de {name}. En breve le llegará al correo el acceso a su portal.
        </p>
        <Link href={`/negocios/${slug}`} className="btn-secondary mt-6 inline-flex">Volver a la ficha</Link>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm outline-none";
  const inputStyle = { background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink)" };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <ShieldCheckIcon className="mb-2 h-8 w-8" style={{ color: "var(--primary-mid)" }} />
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
          Verifique que {name} es suyo
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--ink-2)" }}>
          Enviamos un código de 6 dígitos al teléfono o WhatsApp que aparece en la ficha del negocio. Escríbalo aquí con el
          mismo correo que usó al reclamar.
        </p>
      </div>
      <div>
        <label htmlFor="v-email" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Correo</label>
        <input id="v-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} style={inputStyle} />
      </div>
      <div>
        <label htmlFor="v-code" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--ink)" }}>Código</label>
        <input
          id="v-code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="\d{6}"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
          style={inputStyle}
          placeholder="000000"
        />
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">{error}</p>}
      <button type="submit" disabled={sending || code.length !== 6} className="btn-primary w-full justify-center !py-3">
        {sending ? "Verificando..." : "Verificar"}
      </button>
    </form>
  );
}
