"use client";

import { useEffect, useState } from "react";
import { getOpenStatus, type OpenStatus } from "@/lib/hours";

// Se calcula en el cliente para que la página cacheada no muestre un estado viejo
export default function OpenNowBadge({ hours, size = "md" }: { hours?: string | null; size?: "sm" | "md" }) {
  const [status, setStatus] = useState<OpenStatus>(null);

  useEffect(() => {
    const update = () => setStatus(getOpenStatus(hours));
    const first = setTimeout(update, 0);
    const id = setInterval(update, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [hours]);

  if (!status) return null;

  const pad = size === "sm" ? "px-2.5 py-0.5" : "px-3 py-1";

  return status === "open" ? (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-green-50 ${pad} text-[11px] font-semibold text-green-700 ring-1 ring-green-200`}>
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      Abierto ahora
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 ${pad} text-[11px] font-semibold text-red-700 ring-1 ring-red-200`}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      Cerrado
    </span>
  );
}
