"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const OLANCHITO: [number, number] = [15.49, -86.58];

export type LatLng = { lat: number; lng: number };

function ClickHandler({ onPlace }: { onPlace: (ll: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPlace({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (loc: LatLng | null) => void;
}) {
  const [search, setSearch]       = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    // Fix Leaflet default icons broken by webpack/Next.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search + ", Olanchito, Honduras")}&format=json&limit=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      if (data.length > 0) {
        onChange({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setSearch("");
      } else {
        setSearchError("No se encontró esa dirección. Intenta ser más específico o haz clic en el mapa.");
      }
    } catch {
      setSearchError("Error al buscar. Intenta de nuevo.");
    } finally {
      setSearching(false);
    }
  };

  const center: [number, number] = value ? [value.lat, value.lng] : OLANCHITO;

  return (
    <div className="space-y-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSearchError(""); }}
          placeholder="Buscar dirección en Olanchito…"
          className="field flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={searching || !search.trim()}
          className="rounded-xl bg-jungle-600 px-4 py-2 text-xs font-semibold text-white hover:bg-jungle-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {searching ? "…" : "Buscar"}
        </button>
      </form>

      {searchError && (
        <p className="text-xs text-red-600">{searchError}</p>
      )}

      {/* Map */}
      <div className="relative overflow-hidden rounded-xl ring-1 ring-black/10">
        <MapContainer
          key={center.join(",")}
          center={center}
          zoom={value ? 17 : 14}
          style={{ height: 280, width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPlace={onChange} />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>

        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur pointer-events-none" style={{ zIndex: 400 }}>
          Haz clic en el mapa para colocar el pin
        </p>
      </div>

      {/* Coordinates + clear */}
      {value ? (
        <div className="flex items-center justify-between rounded-xl bg-jungle-50 px-3 py-2 ring-1 ring-jungle-200">
          <p className="text-[11px] font-mono text-jungle-700">
            📍 {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </p>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] font-semibold text-red-500 hover:text-red-700"
          >
            Borrar ubicación
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-jungle-400">Sin ubicación asignada.</p>
      )}
    </div>
  );
}
