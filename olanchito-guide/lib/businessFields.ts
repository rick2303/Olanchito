// Limpieza de los datos que mandan dueños y vecinos antes de guardarlos.
import { distanceKm, OLANCHITO_CENTER, type LatLng } from "@/lib/geo";

// Un pin a más de esta distancia del centro casi seguro está mal puesto
const MAX_DISTANCE_KM = 60;

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.replace(/[ \t]+/g, " ").trim();
  return v ? v.slice(0, max) : null;
}

// Hondureño: 8 dígitos, con o sin +504
export function cleanPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/[^\d]/g, "").replace(/^504(?=\d{8}$)/, "");
  return /^\d{8}$/.test(digits) ? digits : null;
}

export function cleanLocation(value: unknown): LatLng | null {
  if (!value || typeof value !== "object") return null;
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (distanceKm({ lat, lng }, OLANCHITO_CENTER) > MAX_DISTANCE_KM) return null;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

// "reparación, venta de llantas" → ["Reparación", "Venta de llantas"]
export function cleanServices(value: unknown): string[] | null {
  const list: unknown[] = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n]/) : [];
  const items = list
    .map((s) => cleanText(s, 60))
    .filter((s): s is string => Boolean(s))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .slice(0, 15);
  return items.length > 0 ? items : null;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

// Qué le falta a una ficha para estar completa (lo usan el admin y la página del dueño)
export type MissingField = "location" | "hours" | "description" | "whatsapp" | "services";

export const MISSING_LABELS: Record<MissingField, string> = {
  location: "Ubicación en el mapa",
  hours: "Horario",
  description: "Descripción",
  whatsapp: "WhatsApp",
  services: "Servicios",
};

export function missingFields(b: {
  location?: unknown;
  hours?: string | null;
  description?: string | null;
  whatsapp?: string | null;
  services?: unknown;
}): MissingField[] {
  const missing: MissingField[] = [];
  const loc = b.location as { lat?: number; lng?: number } | null;
  if (!loc?.lat || !loc?.lng) missing.push("location");
  if (!b.hours?.trim()) missing.push("hours");
  if (!b.description?.trim() || b.description.trim().length < 30) missing.push("description");
  if (!b.whatsapp?.trim()) missing.push("whatsapp");
  if (!Array.isArray(b.services) || b.services.length === 0) missing.push("services");
  return missing;
}

// Marcadores en correction_suggestions para distinguir propuestas y avisos de las correcciones normales
export const NEW_BUSINESS_FIELD = "nuevo_negocio";
export const NEW_BUSINESS_SLUG = "__nuevo__";
export const OWNER_UPDATE_FIELD = "actualizado_por_dueno";

export type NewBusinessProposal = {
  name: string;
  category_id: string | null;
  category_name: string | null;
  whatsapp: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  location: LatLng | null;
  submitter_name: string | null;
  submitter_contact: string | null;
};
