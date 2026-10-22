// Eventos de Google Analytics 4. Los nombres "search" y "share" son eventos recomendados de GA4;
// "contact_click" es el que conviene marcar como evento clave (conversión) en el panel de GA.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | "contact_click"
  | "search"
  | "share"
  | "directions_click"
  | "booking_click"
  | "social_click"
  | "review_submit"
  | "favorite_add"
  | "suggestion_submit"
  | "filter_open_now"
  | "near_me";

export function trackEvent(name: AnalyticsEvent, params: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}
