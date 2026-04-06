"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "./LocationPicker";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] rounded-xl bg-jungle-50 ring-1 ring-jungle-200 flex items-center justify-center">
      <p className="text-sm text-jungle-500">Cargando mapa…</p>
    </div>
  ),
});

export default function LocationPickerWrapper({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (loc: LatLng | null) => void;
}) {
  return <LocationPicker value={value} onChange={onChange} />;
}
