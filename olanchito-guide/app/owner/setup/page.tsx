"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function OwnerSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRecoveryMode = searchParams.get("mode") === "recovery";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [portalSlug, setPortalSlug] = useState<string | null>(null);

  // "invite"   = waiting for invite token to be processed
  // "ready"    = new user via invite — show password form
  // "existing" = already has account — came here after Stripe payment
  // "notoken"  = no token, no session — show "check your email"
  // "expired"  = link expired / access_denied in hash
  const [mode, setMode] = useState<"invite" | "ready" | "existing" | "notoken" | "expired">("invite");

  useEffect(() => {
    // Check for error hash BEFORE listening to auth events.
    // Supabase does NOT clear error hashes, so window.location.hash is safe here.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    if (
      hashParams.get("error") === "access_denied" ||
      hashParams.get("error_code") === "otp_expired"
    ) {
      setMode("expired");
      setChecking(false);
      return;
    }

    let settled = false;
    // Tracks whether a NEW auth event fired (= invite token was processed).
    // For already-logged-in users, no new event fires — only getSession returns a session.
    let newAuthEvent = false;

    const settle = (newMode: "ready" | "existing" | "notoken") => {
      if (settled) return;
      settled = true;
      setMode(newMode);
      setChecking(false);
    };

    // Invite token processed → new user, show password form
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        newAuthEvent = true;
        settle("ready");
      }
    });

    // Check for existing session.
    // Wait one microtask tick so onAuthStateChange fires first if there's an invite token.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return; // no session — wait for fallback
      await new Promise(r => setTimeout(r, 80));
      if (newAuthEvent) return; // already settled as "ready" by auth event

      // Session exists but no fresh auth event. Possible sub-cases:
      // a) Came from /owner/activate (recovery) — mode=recovery param forces password form
      // b) User has no `has_password` flag → new invite user who skipped this step; force it now
      // c) User has `has_password` flag → came from Stripe payment redirect
      if (isRecoveryMode || !session.user.user_metadata?.has_password) {
        settle("ready");
        return;
      }

      // Has password — look up their business slug for the direct portal link
      const email = session.user.email?.toLowerCase();
      if (email) {
        const { data: biz } = await supabase
          .from("businesses")
          .select("slug")
          .eq("owner_email", email)
          .limit(1)
          .single();
        if (biz?.slug) setPortalSlug(biz.slug);
      }

      settle("existing");
    });

    // 3s fallback: no session, no event → user arrived without a valid token
    const fallback = setTimeout(() => settle("notoken"), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }

    setError("");
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(
        updateError.message.includes("same password")
          ? "La nueva contraseña debe ser diferente a la anterior."
          : "El enlace expiró o no es válido. Solicita uno nuevo desde la página de inicio de sesión."
      );
      setLoading(false);
      return;
    }

    // Mark password as set so the portal and setup page can detect it
    await supabase.auth.updateUser({ data: { has_password: true } });

    setDone(true);
    setTimeout(() => router.push("/owner/login"), 2000);
  };

  const TITLES: Record<string, string> = {
    notoken:  "Revisa tu correo",
    expired:  "Enlace expirado",
    existing: "¡Pago recibido!",
    ready:    "Crea tu contraseña",
    invite:   "Crea tu contraseña",
  };

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-jungle-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-jungle-200 border-t-jungle-600" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-jungle-50 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl border"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F4F7F4 100%)",
              borderColor: "rgba(10,30,20,0.13)",
              boxShadow: "0 4px 14px rgba(10,30,20,0.14)",
            }}
          >
            <Image src="/colibri.webp" alt="Olanchito" width={24} height={24} />
          </span>
          <div>
            <p className="text-base font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
              {TITLES[mode]}
            </p>
            <p className="text-xs text-jungle-600">Portal del Negocio — Olanchito</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.07)]">

          {/* ── Existing user after Stripe payment ── */}
          {mode === "existing" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 ring-1 ring-green-200">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </span>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-jungle-950">Tu plan ya está activo</p>
                <p className="text-xs leading-relaxed text-jungle-600">
                  Hemos recibido tu pago y tu suscripción ha sido activada. Ingresa al portal con las credenciales que ya tienes registradas.
                </p>
              </div>
              <a
                href={portalSlug ? `/owner/${portalSlug}` : "/owner/login"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-jungle-800 py-2.5 text-xs font-bold text-white hover:bg-jungle-700 transition-colors"
              >
                Ir a mi portal
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </a>
              <p className="text-[11px] text-jungle-400">
                ¿Tienes algún problema? Contáctanos por WhatsApp.
              </p>
            </div>
          )}

          {/* ── No token — new user waiting for email ── */}
          {mode === "notoken" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                <EnvelopeIcon className="h-6 w-6 text-jungle-600" />
              </span>
              <div>
                <p className="text-sm font-bold text-jungle-950">Te enviamos un enlace</p>
                <p className="mt-1.5 text-xs leading-relaxed text-jungle-600">
                  Revisa tu correo electrónico. Haz clic en el enlace para crear tu contraseña y acceder a tu portal.
                </p>
              </div>
              <p className="text-[11px] text-jungle-400">
                ¿No llegó? Revisa la carpeta de spam o escríbenos por WhatsApp.
              </p>
              <a
                href={`https://wa.me/50497952651?text=${encodeURIComponent("Hola, acabo de pagar y no me llegó el correo para crear mi contraseña.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-2.5 text-xs font-semibold text-[#25D366] ring-1 ring-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          )}

          {/* ── Expired link ── */}
          {mode === "expired" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 ring-1 ring-red-200">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </span>
              <div>
                <p className="text-sm font-bold text-jungle-950">El enlace expiró</p>
                <p className="mt-1.5 text-xs leading-relaxed text-jungle-600">
                  Los enlaces de acceso son válidos por un tiempo limitado. Solicita uno nuevo iniciando sesión con tu correo electrónico.
                </p>
              </div>
              <a
                href="/owner/login"
                className="inline-flex items-center gap-2 rounded-xl bg-jungle-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-jungle-700 transition-colors"
              >
                Ir a inicio de sesión
              </a>
              <p className="text-[11px] text-jungle-400">
                Si el problema persiste, contáctanos por WhatsApp.
              </p>
            </div>
          )}

          {/* ── New user via invite — show password form ── */}
          {mode === "ready" && (
            <>
              {done ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircleIcon className="h-10 w-10 text-jungle-600" />
                  <p className="text-sm font-semibold text-jungle-900">Contraseña creada correctamente.</p>
                  <p className="text-xs text-jungle-600">Redirigiendo al inicio de sesión...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-jungle-900">
                      <LockClosedIcon className="h-3.5 w-3.5" />
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      className="field"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-jungle-900">Confirmar contraseña</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="Repite tu contraseña"
                      className="field"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-200">
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-red-600" />
                      <p className="text-xs font-medium text-red-800">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Guardando..." : "Guardar y entrar"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
