"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

export default function ActivatePage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const type  = (params.get("type") ?? "invite") as "invite" | "recovery";

  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // If params are missing, show a generic "check email" message
  const missingParams = !token || !email;

  const handleActivate = async () => {
    setState("loading");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error) {
      setState("error");
      setErrorMsg(
        error.message.includes("expired") || error.message.includes("invalid")
          ? "El enlace expiró o ya fue utilizado. Solicita uno nuevo."
          : error.message
      );
      return;
    }

    setState("success");
    // Small delay so user sees the success state, then go to setup.
    // Pass mode=recovery so the setup page knows to show the password form
    // even for users who already have a password set.
    const dest = type === "recovery" ? "/owner/setup?mode=recovery" : "/owner/setup";
    setTimeout(() => router.push(dest), 1200);
  };

  const title =
    type === "recovery" ? "Restablecer contraseña" : "Activar cuenta";

  const buttonLabel =
    type === "recovery" ? "Restablecer mi contraseña" : "Activar mi cuenta";

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
            <p
              className="text-base font-bold text-jungle-950"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {title}
            </p>
            <p className="text-xs text-jungle-600">Portal del Negocio — Olanchito</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-7 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.07)]">

          {/* Missing params */}
          {missingParams && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                <EnvelopeIcon className="h-6 w-6 text-jungle-600" />
              </span>
              <div>
                <p className="text-sm font-bold text-jungle-950">Enlace inválido</p>
                <p className="mt-1.5 text-xs leading-relaxed text-jungle-600">
                  Este enlace no es válido. Por favor usa el enlace que recibiste en tu correo.
                </p>
              </div>
              <a
                href="/owner/login"
                className="inline-flex items-center gap-2 rounded-xl bg-jungle-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-jungle-700 transition-colors"
              >
                Ir a inicio de sesión
              </a>
            </div>
          )}

          {/* Success */}
          {!missingParams && state === "success" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 ring-1 ring-green-200">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </span>
              <div>
                <p className="text-sm font-bold text-jungle-950">¡Verificado!</p>
                <p className="mt-1.5 text-xs leading-relaxed text-jungle-600">
                  Redirigiendo...
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!missingParams && state === "error" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 ring-1 ring-red-200">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </span>
              <div>
                <p className="text-sm font-bold text-jungle-950">El enlace expiró</p>
                <p className="mt-1.5 text-xs leading-relaxed text-jungle-600">{errorMsg}</p>
              </div>
              <a
                href="/owner/login"
                className="inline-flex items-center gap-2 rounded-xl bg-jungle-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-jungle-700 transition-colors"
              >
                {type === "recovery" ? "Solicitar nuevo enlace" : "Ir a inicio de sesión"}
              </a>
            </div>
          )}

          {/* Idle / loading — main CTA */}
          {!missingParams && (state === "idle" || state === "loading") && (
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
                <LockClosedIcon className="h-6 w-6 text-jungle-600" />
              </span>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-jungle-950">
                  {type === "recovery" ? "¿Listo para cambiar tu contraseña?" : "¿Listo para activar tu cuenta?"}
                </p>
                <p className="text-xs leading-relaxed text-jungle-600">
                  Haz clic en el botón para continuar. El enlace solo se procesa cuando tú lo confirmas.
                </p>
              </div>
              <button
                onClick={handleActivate}
                disabled={state === "loading"}
                className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state === "loading" ? "Verificando..." : buttonLabel}
                {state !== "loading" && <ArrowRightIcon className="h-4 w-4" />}
              </button>
              <p className="text-[11px] text-jungle-400">
                ¿No solicitaste esto?{" "}
                <a href="/owner/login" className="font-semibold hover:underline">
                  Ignorar
                </a>
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
