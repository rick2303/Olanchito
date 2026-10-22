"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function UnsubscribeButton({ slug, token }: { slug: string; token: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const confirm = async () => {
    setState("sending");
    const res = await fetch("/api/reporte/baja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  };

  if (state === "done") {
    return (
      <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-700" role="status">
        <CheckCircleIcon className="h-5 w-5" />
        Listo, no le enviaremos más el resumen.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button type="button" onClick={confirm} disabled={state === "sending"} className="btn-primary">
        {state === "sending" ? "Guardando..." : "Sí, no quiero recibirlo"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-700">No se pudo guardar. Intente de nuevo.</p>
      )}
    </div>
  );
}
