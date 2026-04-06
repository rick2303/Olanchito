"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  LockClosedIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface BusinessOption { slug: string; name: string; }

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Credenciales incorrectas.");
      setLoading(false);
      return;
    }

    // Ensure the has_password flag is set (covers users who existed before this check was added)
    supabase.auth.updateUser({ data: { has_password: true } }).catch(() => {});

    const { data } = await supabase
      .from("businesses")
      .select("slug, name")
      .eq("owner_email", email.toLowerCase().trim())
      .limit(10);

    if (!data || data.length === 0) {
      setError("No encontramos un negocio asociado a este correo.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (data.length === 1) {
      router.push(`/owner/${data[0].slug}`);
      router.refresh();
      return;
    }

    setBusinesses(data);
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setError("Ingresa tu correo primero."); return; }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/owner/setup`,
    });
    setLoading(false);
    if (resetError) console.error("[reset]", resetError.message);
    setError("");
    setResetSent(true);
    setResetCooldown(60);
    const interval = setInterval(() => {
      setResetCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-jungle-50 px-4 py-12 sm:justify-center">

      {/* Logo + title */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl border"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7F4 100%)",
            borderColor: "rgba(10,30,20,0.13)",
            boxShadow: "0 4px 14px rgba(10,30,20,0.14)",
          }}
        >
          <Image src="/colibri.webp" alt="Olanchito" width={22} height={22} />
        </span>
        <div>
          <p className="text-sm font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
            Portal del Negocio
          </p>
          <p className="text-xs text-jungle-500">Directorio Olanchito</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">

        {/* Business picker */}
        {businesses.length > 1 ? (
          <div className="p-7">
            <p className="mb-1 text-sm font-bold text-jungle-950">Selecciona tu negocio</p>
            <p className="mb-4 text-xs text-jungle-500">Tu correo está asociado a varios negocios.</p>
            <div className="space-y-2">
              {businesses.map((b) => (
                <button
                  key={b.slug}
                  onClick={() => { router.push(`/owner/${b.slug}`); router.refresh(); }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-jungle-50 px-4 py-3 text-left ring-1 ring-jungle-200 hover:bg-jungle-100 transition-colors"
                >
                  <BuildingStorefrontIcon className="h-5 w-5 flex-shrink-0 text-jungle-600" />
                  <span className="flex-1 text-sm font-semibold text-jungle-950">{b.name}</span>
                  <ArrowRightIcon className="h-4 w-4 text-jungle-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Login form */}
            <div className="p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-jungle-900">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className="field"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-jungle-900">
                      <LockClosedIcon className="h-3.5 w-3.5" />
                      Contraseña
                    </label>
                    {/* Forgot password inline */}
                    {!resetSent && (
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={loading}
                        className="text-[11px] text-jungle-500 hover:text-jungle-700 hover:underline disabled:opacity-50"
                      >
                        ¿Olvidaste la contraseña?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="field"
                  />
                </div>

                {/* Reset sent feedback */}
                {resetSent && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-green-50 px-3.5 py-3 ring-1 ring-green-200">
                    <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-green-800">Revisa tu correo</p>
                      <p className="mt-0.5 text-[11px] text-green-700">
                        Enviamos un enlace a <span className="font-semibold">{email}</span>.
                      </p>
                      {resetCooldown > 0 ? (
                        <p className="mt-1 text-[10px] text-green-600">Reenviar en {resetCooldown}s</p>
                      ) : (
                        <button type="button" onClick={handleReset} className="mt-1 text-[10px] font-semibold text-green-700 hover:underline">
                          Reenviar enlace
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-200">
                    <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-xs font-medium text-red-800">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verificando..." : "Iniciar sesión"}
                  {!loading && <ArrowRightIcon className="h-4 w-4" />}
                </button>
              </form>
            </div>

            {/* No account section */}
            <div className="border-t border-jungle-100 px-7 py-4">
              <p className="mb-2.5 text-[11px] font-semibold text-jungle-400 uppercase tracking-widest">¿Nuevo aquí?</p>
              <div className="flex flex-col gap-1.5">
                <Link href="/pricing" className="flex items-center gap-2 text-xs font-semibold text-jungle-700 hover:text-jungle-950 transition-colors">
                  <ArrowRightIcon className="h-3.5 w-3.5 text-jungle-400" />
                  Tengo negocio y quiero activar el portal
                </Link>
                <Link href="/join" className="flex items-center gap-2 text-xs font-semibold text-jungle-700 hover:text-jungle-950 transition-colors">
                  <BuildingStorefrontIcon className="h-3.5 w-3.5 text-jungle-400" />
                  Mi negocio no está en el directorio
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Help */}
      <p className="mt-6 text-center text-[11px] text-jungle-400">
        ¿Necesitas ayuda?{" "}
        <a href="mailto:support@olanchito.com" className="font-semibold text-jungle-600 hover:underline">
          support@olanchito.com
        </a>
      </p>

    </main>
  );
}
