"use client";

import { useEffect, useRef, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie_notice")) setVisible(true);
    } catch {
      /* sin almacenamiento: no se muestra */
    }
  }, []);

  // En celular el aviso ocupa el borde inferior: se reserva ese espacio al final de la página
  // para que ningún botón quede tapado sin poder subirlo con el dedo.
  useEffect(() => {
    if (!visible || !ref.current) return;
    const el = ref.current;
    const apply = () => {
      const mobile = window.matchMedia("(max-width: 639px)").matches;
      document.body.style.paddingBottom = mobile ? `${el.offsetHeight}px` : "";
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  const handleAccept = () => {
    try {
      localStorage.setItem("cookie_notice", "ok");
    } catch {
      /* nada */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 animate-fade-up rounded-t-2xl sm:bottom-4 sm:left-4 sm:right-auto sm:w-72 sm:rounded-2xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line-strong)",
        boxShadow: "0 -4px 24px rgba(10,30,20,0.12)",
        padding: "10px 14px calc(10px + env(safe-area-inset-bottom)) 14px",
      }}
    >
      <div className="flex items-center gap-3">
        <p className="flex-1 text-xs leading-snug" style={{ color: "var(--ink-2)" }}>
          Este sitio usa cookies de analítica (Google Analytics).
        </p>
        <button type="button" onClick={handleAccept} className="btn-primary flex-shrink-0 !px-3.5 !py-2 !text-xs">
          Entendido
        </button>
      </div>
    </div>
  );
}
