export type LatLng = { lat: number; lng: number };

// Centro de Olanchito (mismo que geo.position en el layout). Si el usuario está lejos, se ordena desde aquí
export const OLANCHITO_CENTER: LatLng = { lat: 15.49, lng: -86.58 };

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// "15.48,-86.57" → { lat, lng }
export function parseLatLng(raw: string | null | undefined): LatLng | null {
  if (!raw) return null;
  const [lat, lng] = raw.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(Math.round(km * 1000 / 50) * 50, 50)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
