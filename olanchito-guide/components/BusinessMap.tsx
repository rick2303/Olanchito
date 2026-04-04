"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapBusiness = {
  name: string;
  slug: string;
  category?: string;
  address?: string;
  featured?: boolean;
  isNew?: boolean;
  lat: number;
  lng: number;
};

export type BusinessMapProps = {
  businesses: MapBusiness[];
};

// Olanchito, Yoro, Honduras
const OLANCHITO_CENTER: [number, number] = [15.49, -86.58];
const NEAR_ME_RADIUS_KM = 20;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Child component: flies the map to a position when it changes
function FlyTo({ position, zoom }: { position: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, zoom, { duration: 1.2 });
  }, [map, position, zoom]);
  return null;
}

export default function BusinessMap({ businesses }: BusinessMapProps) {
  const [flyTarget, setFlyTarget] = useState<{ pos: [number, number]; zoom: number } | null>(null);
  const [outOfRange, setOutOfRange] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    // Fix default Leaflet marker icons broken by webpack/Next.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setLocError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocLoading(true);
    setOutOfRange(false);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocLoading(false);

        const distToOlanchito = haversineKm(
          latitude,
          longitude,
          OLANCHITO_CENTER[0],
          OLANCHITO_CENTER[1]
        );

        if (distToOlanchito > NEAR_ME_RADIUS_KM) {
          // User is outside range — show message but keep Olanchito map
          setOutOfRange(true);
          setFlyTarget({ pos: OLANCHITO_CENTER, zoom: 14 });
        } else {
          // User is within range — fly to their location
          setOutOfRange(false);
          setFlyTarget({ pos: [latitude, longitude], zoom: 15 });
        }
      },
      (err) => {
        setLocLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError("Permiso de ubicación denegado.");
        } else {
          setLocError("No se pudo obtener tu ubicación.");
        }
      },
      { timeout: 8000 }
    );
  };

  const center: [number, number] =
    businesses.length > 0
      ? [businesses[0].lat, businesses[0].lng]
      : OLANCHITO_CENTER;

  return (
    <div className="space-y-2">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locLoading}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line-strong)",
            color: "var(--ink-2)",
            opacity: locLoading ? 0.6 : 1,
            cursor: locLoading ? "wait" : "pointer",
          }}
        >
          {locLoading ? (
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            </svg>
          )}
          {locLoading ? "Buscando…" : "Cerca de mí"}
        </button>

        {outOfRange && (
          <p
            className="text-xs rounded-xl px-3 py-2 font-medium"
            style={{
              background: "#fef9c3",
              color: "#854d0e",
              border: "1px solid #fde68a",
            }}
          >
            No hay negocios en tu zona. Mostrando Olanchito.
          </p>
        )}
        {locError && (
          <p
            className="text-xs rounded-xl px-3 py-2 font-medium"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
            }}
          >
            {locError}
          </p>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        style={{
          height: 480,
          width: "100%",
          borderRadius: 12,
          zIndex: 0,
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {flyTarget && <FlyTo position={flyTarget.pos} zoom={flyTarget.zoom} />}

        {businesses.map((b) => (
          <Marker key={b.slug} position={[b.lat, b.lng]}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 700, marginBottom: 2, fontSize: 13 }}>
                  {b.name}
                </p>
                {b.category && (
                  <p style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>
                    {b.category}
                  </p>
                )}
                {b.address && (
                  <p style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
                    {b.address}
                  </p>
                )}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {b.featured && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: "#fef9c3",
                        color: "#854d0e",
                        padding: "1px 7px",
                        borderRadius: 99,
                      }}
                    >
                      ⭐ Destacado
                    </span>
                  )}
                  {b.isNew && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "1px 7px",
                        borderRadius: 99,
                      }}
                    >
                      ✨ Nuevo
                    </span>
                  )}
                </div>
                <a
                  href={`/negocios/${b.slug}`}
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#166534",
                    textDecoration: "underline",
                  }}
                >
                  Ver negocio →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
