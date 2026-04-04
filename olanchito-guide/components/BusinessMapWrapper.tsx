"use client";

import dynamic from "next/dynamic";
import type { BusinessMapProps } from "./BusinessMap";

// Dynamic import with ssr:false to avoid Leaflet window errors on server
const BusinessMap = dynamic(() => import("./BusinessMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 480,
        borderRadius: 12,
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p style={{ color: "var(--ink-3)", fontSize: 13 }}>Cargando mapa…</p>
    </div>
  ),
});

export default function BusinessMapWrapper(props: BusinessMapProps) {
  return <BusinessMap {...props} />;
}
