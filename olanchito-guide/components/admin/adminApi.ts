import { supabase } from "@/lib/supabase";

// Llama a una API de admin con el token de la sesión actual (el servidor valida que sea admin)
export async function adminPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Error en el servidor");
  return json as T;
}

// wa.me con número hondureño (agrega 504 si falta)
export function waLink(number: string | null | undefined, text: string): string {
  const digits = (number ?? "").replace(/[^\d]/g, "");
  const phone = digits ? (digits.startsWith("504") ? digits : `504${digits}`) : "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

// Abre la ventana antes del await para que el navegador no la bloquee como popup
export async function openAfter(getUrl: () => Promise<string>) {
  const win = window.open("", "_blank");
  try {
    const url = await getUrl();
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (err) {
    win?.close();
    throw err;
  }
}
