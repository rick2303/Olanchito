"use client";

import { cloneElement, isValidElement, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  BuildingStorefrontIcon,
  TagIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckIcon,
  CreditCardIcon,
  BoltIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import HoursInput from "@/components/HoursInput";

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "negocio";
  let slug = base;
  let i = 2;
  while (true) {
    const { data } = await supabase.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i++}`;
  }
}

interface Category { id: string; name: string; }

type InviteState = "sent" | "existing" | "unknown";
type DoneInfo = { name: string; slug: string; email: string; invite: InviteState };

const STEPS = [
  { title: "Su negocio", hint: "Cómo se llama y qué ofrece" },
  { title: "Contacto", hint: "Cómo le escriben y dónde está" },
  { title: "Foto y acceso", hint: "Una foto y su correo" },
];

const EMPTY_FORM = {
  business_name: "",
  category: "",
  phone: "",
  whatsapp: "",
  address: "",
  email: "",
  description: "",
  hours: "",
  image: null as File | null,
};

export default function JoinPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [sameWhatsapp, setSameWhatsapp] = useState(true);
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name", { ascending: true })
      .then(({ data }) => { if (data) setCategories(data as Category[]); });
  }, []);

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === form.category)?.name ?? "",
    [categories, form.category]
  );

  const previewUrl = useMemo(() => {
    if (!form.image) return "";
    try { return URL.createObjectURL(form.image); } catch { return ""; }
  }, [form.image]);

  const whatsappValue = sameWhatsapp ? form.phone : form.whatsapp;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgError(false);
    setError("");
    setForm((prev) => ({ ...prev, image: f }));
  };

  const goTo = (target: number) => {
    setDirection(target > step ? "next" : "back");
    setError("");
    setStep(target);
    if (typeof window !== "undefined") {
      document.getElementById("registro-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const register = async () => {
    if (!form.image) {
      setError("Falta la foto de su negocio. Puede ser la fachada, el rótulo o sus productos.");
      return;
    }

    setLoading(true);
    setError("");
    let imagePath: string | null = null;

    try {
      // 1. Subir la foto
      const fileExt = form.image.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      imagePath = `business/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("Olanchito-guide")
        .upload(imagePath, form.image, { contentType: form.image.type, upsert: false });
      if (uploadError) throw uploadError;

      // 2. Slug único
      const slug = await generateUniqueSlug(form.business_name);

      // 3. Insertar en businesses (verified: false, el admin revisa después)
      const name = form.business_name.trim();
      const email = form.email.toLowerCase().trim();
      const { data: newBiz, error: insertError } = await supabase
        .from("businesses")
        .insert([{
          name,
          slug,
          category_id: form.category || null,
          description: form.description.trim() || null,
          hours:       form.hours.trim() || null,
          phone:       form.phone.trim() || null,
          whatsapp:    whatsappValue.trim() || null,
          address:     form.address.trim() || null,
          owner_email: email,
          image:       imagePath,
          verified:    false,
          featured:    false,
          view_count:  0,
          socials:     {},
        }])
        .select("id")
        .single();

      if (insertError) {
        await supabase.storage.from("Olanchito-guide").remove([imagePath]);
        throw insertError;
      }

      // 4. Invitación al portal gratuito del dueño. Si el correo ya tiene cuenta no se envía nada,
      //    así que esperamos la respuesta (máx. 6 s) para decirle la verdad en la pantalla de éxito.
      let invite: InviteState = "unknown";
      if (newBiz) {
        try {
          const res = await fetch("/api/owner/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ business_id: newBiz.id }),
            signal: AbortSignal.timeout(6000),
          });
          if (res.ok) {
            const body = (await res.json()) as { type?: string };
            invite = body.type === "existing_user" ? "existing" : "sent";
          }
        } catch { /* la ficha ya quedó publicada; el correo se puede reenviar después */ }
      }

      // 5. La ficha se genera al momento; se refresca por si la ruta quedó en caché
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch(() => {});

      // 6. Medición y pantalla de éxito
      const w = window as unknown as { gtag?: (...args: unknown[]) => void };
      w.gtag?.("event", "business_register", { business_slug: slug });

      setDone({ name, slug, email, invite });
      setForm(EMPTY_FORM);
      setStep(0);
      setSameWhatsapp(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No se pudo registrar el negocio. Revise los datos e intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (s: number): string => {
    if (s === 0) {
      if (!form.business_name.trim()) return "Escriba el nombre de su negocio.";
      if (!form.category) return "Elija la categoría que más se parece a su negocio.";
    }
    if (s === 1) {
      if (form.phone.replace(/\D/g, "").length < 8) return "Escriba el teléfono completo (8 dígitos) para que los clientes puedan llamarle.";
    }
    if (s === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Escriba un correo válido. Ahí le llega el acceso a su portal gratuito.";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const problem = validateStep(step);
    if (problem) {
      // Se limpia primero para que la animación del aviso se repita en cada intento
      setError("");
      requestAnimationFrame(() => setError(problem));
      return;
    }
    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }
    void register();
  };

  if (done) {
    return <SuccessScreen done={done} onAnother={() => setDone(null)} />;
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="page-shell">

      {/* ─── ENCABEZADO ──────────────────────────────── */}
      <section className="section-container pt-10 pb-8">
        <div className="max-w-2xl">
          <div className="badge-primary mb-4 w-fit animate-fade-up">
            <BuildingStorefrontIcon className="h-3.5 w-3.5" />
            Para negocios de Olanchito
          </div>
          <h1
            className="text-3xl font-bold sm:text-4xl animate-fade-up anim-delay-1"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
          >
            Ponga su negocio en olanchito.com
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed sm:text-base animate-fade-up anim-delay-2"
            style={{ color: "var(--ink-2)" }}
          >
            Es gratis y toma unos 3 minutos. Su ficha queda publicada al momento, con botón de WhatsApp, horario y dirección.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            <TrustChip className="anim-delay-3" icon={<GiftIcon className="h-4 w-4" />} text="Gratis" />
            <TrustChip className="anim-delay-4" icon={<CreditCardIcon className="h-4 w-4" />} text="Sin tarjeta" />
            <TrustChip className="anim-delay-5" icon={<BoltIcon className="h-4 w-4" />} text="Se publica al momento" />
          </ul>
        </div>
      </section>

      {/* ─── FORMULARIO + LATERAL ────────────────────── */}
      <section className="section-container pb-16 sm:pb-20">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">

          <div id="registro-form" className="panel scroll-mt-24 p-6 sm:p-8 animate-fade-up anim-delay-3">

            {/* Progreso */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs font-semibold" style={{ color: "var(--accent-ink)" }}>
                  Paso {step + 1} de {STEPS.length}
                </p>
                <p className="text-xs" style={{ color: "var(--ink-3)" }}>{STEPS[step].hint}</p>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full"
                style={{ background: "var(--surface-3)" }}
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={STEPS.length}
                aria-valuenow={step + 1}
                aria-label="Progreso del registro"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%`, background: "var(--accent)" }}
                />
              </div>
              <ol className="mt-3 grid grid-cols-3 gap-2">
                {STEPS.map((s, i) => {
                  const reached = i <= step;
                  return (
                    <li key={s.title}>
                      <button
                        type="button"
                        disabled={i >= step}
                        onClick={() => goTo(i)}
                        className="flex w-full items-center gap-2 text-left text-xs font-semibold transition-colors disabled:cursor-default"
                        style={{ color: reached ? "var(--ink)" : "var(--ink-3)" }}
                        aria-current={i === step ? "step" : undefined}
                      >
                        <span
                          className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold transition-all duration-300"
                          style={{
                            background: i < step ? "var(--accent)" : i === step ? "var(--primary)" : "var(--surface-2)",
                            color: reached ? "#fff" : "var(--ink-3)",
                            transform: i === step ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {i < step ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className="hidden sm:inline">{s.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div
                key={step}
                className={`space-y-5 ${direction === "next" ? "animate-step-next" : "animate-step-back"}`}
              >
                <h2
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
                >
                  {STEPS[step].title}
                </h2>

                {step === 0 && (
                  <>
                    <FormField label="Nombre del negocio" icon={<BuildingStorefrontIcon className="h-4 w-4" />} required>
                      <input name="business_name" required value={form.business_name} onChange={handleChange} placeholder="Ej: Ferretería El Progreso" className="field" />
                    </FormField>

                    <FormField label="Categoría" icon={<TagIcon className="h-4 w-4" />} required>
                      <select name="category" required value={form.category} onChange={handleChange} className="field">
                        <option value="">Seleccione una categoría</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Descripción" icon={<DocumentTextIcon className="h-4 w-4" />} hint="Opcional">
                      <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="field resize-none" placeholder="¿Qué ofrece su negocio? Productos, servicios, especialidades..." />
                    </FormField>
                  </>
                )}

                {step === 1 && (
                  <>
                    <FormField label="Teléfono" icon={<PhoneIcon className="h-4 w-4" />} required>
                      <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required autoFocus value={form.phone} onChange={handleChange} className="field" placeholder="+504 0000-0000" />
                    </FormField>

                    <label className="flex cursor-pointer items-center gap-2.5 text-sm" style={{ color: "var(--ink-2)" }}>
                      <input
                        type="checkbox"
                        checked={sameWhatsapp}
                        onChange={(e) => setSameWhatsapp(e.target.checked)}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: "var(--primary)" }}
                      />
                      Ese número también es mi WhatsApp
                    </label>

                    {!sameWhatsapp && (
                      <div className="animate-fade-up">
                        <FormField label="WhatsApp" icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />} hint="Opcional">
                          <input name="whatsapp" type="tel" inputMode="tel" value={form.whatsapp} onChange={handleChange} className="field" placeholder="+504 0000-0000" />
                        </FormField>
                      </div>
                    )}

                    <FormField label="Dirección" icon={<MapPinIcon className="h-4 w-4" />} hint="Opcional">
                      <input name="address" value={form.address} onChange={handleChange} className="field" placeholder="Barrio, calle, referencia..." />
                    </FormField>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--ink)" }}>
                          <span className="grid h-6 w-6 place-items-center rounded-lg" style={{ background: "var(--surface-2)", color: "var(--primary-mid)" }}>
                            <ClockIcon className="h-4 w-4" />
                          </span>
                          Horario de atención
                        </p>
                        <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>Opcional</span>
                      </div>
                      <HoursInput value={form.hours} onChange={(val) => setForm((p) => ({ ...p, hours: val }))} />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div
                      className="rounded-2xl p-4"
                      style={{ border: "1.5px dashed var(--line-strong)", background: "var(--surface-2)" }}
                    >
                      <p
                        className="mb-1 flex items-center gap-2 text-sm font-semibold"
                        style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
                      >
                        <PhotoIcon className="h-4 w-4" style={{ color: "var(--accent-ink)" }} />
                        Foto de su negocio
                        <span style={{ color: "var(--accent-ink)" }}>*</span>
                      </p>
                      <p className="mb-3 text-xs" style={{ color: "var(--ink-3)" }}>
                        La fachada, el rótulo o sus productos. Una foto clara da más confianza.
                      </p>

                      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                        <label
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl py-8 text-sm font-medium transition-all hover:-translate-y-0.5"
                          style={{ background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--ink-2)" }}
                        >
                          <ArrowUpTrayIcon className="h-4 w-4" />
                          {form.image ? "Cambiar foto" : "Subir foto"}
                          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                        </label>

                        <div
                          className="relative overflow-hidden rounded-xl"
                          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
                        >
                          <div className="relative aspect-square w-full">
                            {form.image && previewUrl && !imgError ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={previewUrl}
                                src={previewUrl}
                                alt="Vista previa de la foto"
                                className="absolute inset-0 h-full w-full object-cover animate-pop-in"
                                onError={() => setImgError(true)}
                              />
                            ) : (
                              <div className="absolute inset-0 grid place-items-center text-xs" style={{ color: "var(--ink-3)" }}>
                                Vista previa
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <FormField label="Correo electrónico" icon={<EnvelopeIcon className="h-4 w-4" />} required>
                      <input type="email" name="email" autoComplete="email" required value={form.email} onChange={handleChange} className="field" placeholder="correo@ejemplo.com" />
                    </FormField>
                    <p className="-mt-2 text-xs" style={{ color: "var(--ink-3)" }}>
                      Solo lo usamos para darle acceso a su portal gratuito, donde corrige sus datos cuando quiera. No se muestra en su ficha y no enviamos publicidad.
                    </p>
                  </>
                )}
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-xl px-3.5 py-3 animate-shake-x"
                  style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.3)" }}
                >
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-sm" style={{ color: "var(--ink)" }}>{error}</p>
                </div>
              ) : null}

              {/* Navegación */}
              <div className="mt-6 flex items-center gap-3">
                {step > 0 && (
                  <button type="button" onClick={() => goTo(step - 1)} disabled={loading} className="btn-secondary py-3 text-sm">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Atrás
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className={["btn-primary flex-1 py-3 text-sm", loading ? "opacity-60" : ""].join(" ")}
                >
                  {loading
                    ? "Publicando su negocio..."
                    : step < STEPS.length - 1 ? "Continuar" : "Publicar mi negocio gratis"}
                  {!loading && <ArrowRightIcon className="h-4 w-4" />}
                </button>
              </div>
              {step === STEPS.length - 1 && (
                <p className="mt-3 text-center text-xs" style={{ color: "var(--ink-3)" }}>
                  No se le pide tarjeta ni se le cobra nada.
                </p>
              )}
            </form>
          </div>

          {/* Lateral */}
          <aside className="space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <ListingPreview
                name={form.business_name}
                category={selectedCategoryName}
                address={form.address}
                hours={form.hours}
                phone={form.phone}
                hasWhatsapp={Boolean(whatsappValue.trim())}
                imageUrl={form.image && !imgError ? previewUrl : ""}
              />

              <div className="panel p-5 animate-fade-up anim-delay-4">
                <h2 className="mb-2 text-sm font-semibold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                  ¿Cuál es la traba?
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                  Ninguna. Aparecer en el directorio es gratis: no pedimos tarjeta y no hay prueba que se venza.
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--ink-2)" }}>
                  El sitio se mantiene con un plan opcional, Destacado (L 250 al mes), para quien quiera salir primero en su categoría y mostrar galería de fotos y catálogo. Si no lo quiere, su negocio sigue apareciendo igual.
                </p>
                <Link href="/precios" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "var(--accent-ink)" }}>
                  Ver el plan
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>

              <div className="panel p-5 animate-fade-up anim-delay-5">
                <h2 className="mb-4 text-sm font-semibold" style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}>
                  ¿Qué pasa después?
                </h2>
                <div className="space-y-3">
                  <ProcessStep n="1" title="Se publica al momento" desc="Su ficha aparece en el directorio en cuanto termina el registro." />
                  <ProcessStep n="2" title="Le llega un correo" desc="Con un enlace para crear su contraseña y entrar a su portal gratuito." />
                  <ProcessStep n="3" title="Usted la administra" desc="Desde el portal corrige horario, teléfono, dirección y ubicación en el mapa." />
                  <ProcessStep n="4" title="Revisamos los datos" desc="Si algo no cuadra le escribimos. Los negocios confirmados llevan insignia de verificado." />
                </div>
              </div>

              <p className="px-1 text-xs leading-relaxed" style={{ color: "var(--ink-3)" }}>
                Hecho por un olanchitense para Olanchito. Powered by{" "}
                <a href="https://qali-t.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--ink-2)" }}>
                  QALI-T
                </a>.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function TrustChip({ icon, text, className = "" }: { icon: React.ReactNode; text: string; className?: string }) {
  return (
    <li
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold animate-fade-up ${className}`}
      style={{ background: "var(--accent-soft)", color: "var(--primary)" }}
    >
      {icon}
      {text}
    </li>
  );
}

function ListingPreview({
  name, category, address, hours, phone, hasWhatsapp, imageUrl,
}: {
  name: string;
  category: string;
  address: string;
  hours: string;
  phone: string;
  hasWhatsapp: boolean;
  imageUrl: string;
}) {
  return (
    <div className="animate-fade-up anim-delay-3">
      <p className="mb-2 px-1 text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
        Así se verá su ficha
      </p>
      <div className="panel overflow-hidden" aria-hidden="true">
        <div className="relative aspect-[16/9] w-full" style={{ background: "var(--surface-2)" }}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={imageUrl} src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover animate-fade-in" />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <PhotoIcon className="h-8 w-8" style={{ color: "var(--ink-3)", opacity: 0.5 }} />
            </div>
          )}
        </div>
        <div className="space-y-2.5 p-4">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-300"
              style={{
                background: category ? "var(--accent-soft)" : "var(--surface-2)",
                color: category ? "var(--primary)" : "var(--ink-3)",
              }}
            >
              {category || "Categoría"}
            </span>
            {hours ? (
              <span key={hours} className="rounded-full px-2.5 py-1 text-[11px] font-semibold animate-fade-in" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}>
                {hours}
              </span>
            ) : null}
          </div>
          <p
            className="break-words text-lg font-bold leading-tight transition-colors duration-300"
            style={{ fontFamily: "var(--font-syne)", color: name ? "var(--ink)" : "var(--ink-3)" }}
          >
            {name || "Nombre de su negocio"}
          </p>
          {address ? (
            <p className="flex items-start gap-1.5 text-xs animate-fade-in" style={{ color: "var(--ink-2)" }}>
              <MapPinIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span className="break-words">{address}</span>
            </p>
          ) : null}
          <div className="flex gap-2 pt-1">
            <span
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-opacity duration-300"
              style={{ border: "1px solid var(--line-strong)", color: "var(--ink-2)", opacity: phone ? 1 : 0.45 }}
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              Llamar
            </span>
            <span
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white transition-opacity duration-300"
              style={{ background: "var(--primary)", opacity: hasWhatsapp ? 1 : 0.45 }}
            >
              <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
              WhatsApp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({
  done, onAnother,
}: {
  done: DoneInfo;
  onAnother: () => void;
}) {
  const url = `https://olanchito.com/negocios/${done.slug}`;
  const shareText = `Ya puede encontrar ${done.name} en olanchito.com: ${url}`;
  return (
    <main className="page-shell">
      <section className="section-container py-14 sm:py-20">
        <div className="panel mx-auto max-w-lg p-7 text-center sm:p-10">
          <div
            className="mx-auto grid h-20 w-20 place-items-center rounded-full animate-success-badge"
            style={{ background: "var(--accent)" }}
          >
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>

          <h1
            className="mt-6 text-2xl font-bold sm:text-3xl animate-fade-up anim-delay-2"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            {done.name} ya está en olanchito.com
          </h1>
          <p className="mt-3 text-sm leading-relaxed animate-fade-up anim-delay-3" style={{ color: "var(--ink-2)" }}>
            Su ficha quedó publicada.{" "}
            {done.invite === "existing" ? (
              <>
                El correo <span className="font-semibold" style={{ color: "var(--ink)" }}>{done.email}</span> ya tiene cuenta: entre a su portal gratuito con la contraseña de siempre.
              </>
            ) : done.invite === "sent" ? (
              <>
                Enviamos un correo a <span className="font-semibold" style={{ color: "var(--ink)" }}>{done.email}</span> con el enlace para crear su contraseña y entrar a su portal gratuito. Si no lo ve, revise la carpeta de spam.
              </>
            ) : (
              <>
                En unos minutos le llega un correo a <span className="font-semibold" style={{ color: "var(--ink)" }}>{done.email}</span> para entrar a su portal gratuito. Si no lo ve, revise la carpeta de spam.
              </>
            )}
          </p>

          <div className="mt-7 flex flex-col gap-2.5 animate-fade-up anim-delay-4">
            <Link href={`/negocios/${done.slug}`} className="btn-primary w-full py-3 text-sm">
              Ver mi ficha
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full py-3 text-sm"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Compartirla por WhatsApp
            </a>
            {done.invite === "existing" && (
              <Link href="/owner/login" className="btn-secondary w-full py-3 text-sm">
                Entrar a mi portal
              </Link>
            )}
            <button type="button" onClick={onAnother} className="w-full rounded-xl py-2.5 text-sm font-semibold underline-offset-4 hover:underline" style={{ color: "var(--primary)" }}>
              Registrar otro negocio
            </button>
          </div>

          <p className="mt-6 text-xs animate-fade-up anim-delay-5" style={{ color: "var(--ink-3)" }}>
            No se le cobró nada y no se le va a cobrar por aparecer.
          </p>
        </div>
      </section>
    </main>
  );
}

function FormField({
  label, icon, hint, required, children,
}: {
  label: string;
  icon: React.ReactNode;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  // Conecta la etiqueta con su campo para lectores de pantalla y para que tocar la etiqueta enfoque el campo
  const id = useId();
  const field = isValidElement<{ id?: string }>(children) ? cloneElement(children, { id }) : children;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--ink)" }}
        >
          <span
            className="grid h-6 w-6 place-items-center rounded-lg"
            style={{ background: "var(--surface-2)", color: "var(--primary-mid)" }}
          >
            {icon}
          </span>
          {label}
          {required && <span style={{ color: "var(--accent-ink)" }}>*</span>}
        </label>
        {hint ? (
          <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>{hint}</span>
        ) : null}
      </div>
      {field}
    </div>
  );
}

function ProcessStep({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-xs font-bold"
        style={{ background: "var(--accent-soft)", color: "var(--primary-mid)" }}
      >
        {n}
      </span>
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{title}</p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--ink-3)" }}>{desc}</p>
      </div>
    </div>
  );
}
