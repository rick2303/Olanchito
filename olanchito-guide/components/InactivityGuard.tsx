"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ClockIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const INACTIVE_DELAY  = 15 * 60 * 1000; // 15 min sin actividad → mostrar aviso
const WARNING_SECONDS = 60;              // segundos para responder antes de cerrar sesión

export default function InactivityGuard({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [showWarning, setShowWarning]   = useState(false);
  const [countdown, setCountdown]       = useState(WARNING_SECONDS);

  const warningActive      = useRef(false);
  const inactiveTimer      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countdownInterval  = useRef<ReturnType<typeof setInterval> | null>(null);

  const doSignOut = useCallback(async () => {
    warningActive.current = false;
    setShowWarning(false);
    if (inactiveTimer.current)     clearTimeout(inactiveTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    await supabase.auth.signOut();
    router.push(redirectTo);
  }, [router, redirectTo]);

  const startWarning = useCallback(() => {
    warningActive.current = true;
    setShowWarning(true);
    setCountdown(WARNING_SECONDS);

    let secs = WARNING_SECONDS;
    countdownInterval.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(countdownInterval.current!);
        doSignOut();
      }
    }, 1000);
  }, [doSignOut]);

  const startInactiveTimer = useCallback(() => {
    if (inactiveTimer.current) clearTimeout(inactiveTimer.current);
    inactiveTimer.current = setTimeout(startWarning, INACTIVE_DELAY);
  }, [startWarning]);

  const handleActivity = useCallback(() => {
    if (warningActive.current) return; // no resetear si el aviso está activo
    startInactiveTimer();
  }, [startInactiveTimer]);

  const handleStillHere = () => {
    warningActive.current = false;
    setShowWarning(false);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    startInactiveTimer();
  };

  useEffect(() => {
    startInactiveTimer();
    const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart", "click"];
    events.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));
    return () => {
      if (inactiveTimer.current)     clearTimeout(inactiveTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      events.forEach(ev => window.removeEventListener(ev, handleActivity));
    };
  }, [startInactiveTimer, handleActivity]);

  if (!showWarning) return null;

  const pct = (countdown / WARNING_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
        {/* Icono */}
        <div className="mb-4 flex justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
            <ClockIcon className="h-7 w-7 text-amber-600" />
          </div>
        </div>

        {/* Texto */}
        <div className="mb-5 text-center">
          <p className="text-base font-bold text-jungle-950" style={{ fontFamily: "var(--font-syne)" }}>
            ¿Sigues ahí?
          </p>
          <p className="mt-1.5 text-sm text-jungle-600">
            Tu sesión se cerrará automáticamente por inactividad.
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-jungle-500">Cerrando sesión en</span>
            <span className={`font-bold tabular-nums ${countdown <= 10 ? "text-red-600" : "text-jungle-800"}`}>
              {countdown}s
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-jungle-100">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                countdown <= 10 ? "bg-red-500" : "bg-jungle-600"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleStillHere}
            className="btn-primary flex-1 py-2.5"
          >
            Sigo aquí
          </button>
          <button
            onClick={doSignOut}
            className="btn-secondary flex-1 py-2.5 gap-1.5"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
