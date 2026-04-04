"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_notice")) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_notice", "ok");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-fade-up sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-auto sm:max-w-md sm:-translate-x-1/2"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line-strong)",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 -4px 24px rgba(10,30,20,0.12)",
        padding: "16px 20px calc(16px + env(safe-area-inset-bottom)) 20px",
      }}
    >
      {/* sm+ overrides the mobile border radius */}
      <style>{`@media(min-width:640px){.cookie-inner{border-radius:16px!important;padding-bottom:16px!important}}`}</style>
      <div className="cookie-inner flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-base leading-none" aria-hidden>🍪</span>
          <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Este sitio usa cookies de analítica (Google Analytics) para mejorar tu experiencia.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAccept}
          className="btn-primary w-full !py-2.5 !text-xs sm:w-auto sm:flex-shrink-0 sm:!py-1.5"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
