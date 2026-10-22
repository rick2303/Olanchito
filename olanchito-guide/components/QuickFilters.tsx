"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { trackEvent } from "@/lib/analytics";

// Accesos rápidos del home: lo que la gente más necesita resolver al buscar un negocio local
export default function QuickFilters({ openNowCount }: { openNowCount: number }) {
  const router = useRouter();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const nearMe = () => {
    setError("");
    if (!("geolocation" in navigator)) {
      router.push("/negocios?view=map");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        trackEvent("near_me", { source: "home" });
        router.push(`/negocios?cerca=${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`);
      },
      () => {
        setLocating(false);
        setError("No pudimos obtener su ubicación. Puede ver todos los negocios en el mapa.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/negocios?abierto=1"
          onClick={() => trackEvent("filter_open_now", { source: "home" })}
          className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1.5 text-xs font-semibold text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          {openNowCount > 0 ? `${openNowCount} abiertos ahora` : "Abiertos ahora"}
        </Link>
        <button
          type="button"
          onClick={nearMe}
          disabled={locating}
          className="btn-secondary !rounded-full !px-3.5 !py-1.5 !text-xs"
        >
          <MapPinIcon className="h-3.5 w-3.5" />
          {locating ? "Ubicando..." : "Cerca de mí"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs" role="alert" style={{ color: "rgb(220,38,38)" }}>
          {error}{" "}
          <Link href="/negocios?view=map" className="font-semibold underline">Abrir mapa</Link>
        </p>
      )}
    </div>
  );
}
