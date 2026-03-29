"use client";

import { useEffect, useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import { supabase } from "@/lib/supabase";
import {
  BuildingStorefrontIcon,
  UserIcon,
  TagIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Category { id: string; name: string; }

export default function JoinPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [form, setForm] = useState({
    business_name: "",
    representative_name: "",
    category: "",
    phone: "",
    whatsapp: "",
    address: "",
    email: "",
    description: "",
    hours: "",
    image: null as File | null,
  });

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name", { ascending: true })
      .then(({ data }) => { if (data) setCategories(data as Category[]); });
  }, []);

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === form.category)?.name ?? "",
    [categories, form.category]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgError(false);
    setForm((prev) => ({ ...prev, image: f }));
  };

  const clearForm = () => {
    setForm({ business_name: "", representative_name: "", category: "", phone: "", whatsapp: "", address: "", email: "", description: "", hours: "", image: null });
    setImgError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setToast(null);
    try {
      const categoryName = selectedCategoryName || "Sin categoría";
      const submissionDate = new Date().toLocaleString("es-HN", { dateStyle: "full", timeStyle: "short" });
      let imagePath: string | null = null;
      if (form.image) {
        const fileExt = form.image.name.split(".").pop();
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        imagePath = `business/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("Olanchito-guide").upload(imagePath, form.image, { contentType: form.image.type, upsert: false });
        if (uploadError) throw uploadError;
      }
      const { error: insertError } = await supabase.from("business_submissions").insert([{
        business_name: form.business_name, category_id: form.category, contact_name: form.representative_name,
        email: form.email, phone: form.phone, description: form.description, hours: form.hours, image: imagePath, status: "new",
      }]);
      if (insertError) throw insertError;
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        { business_name: form.business_name, representative_name: form.representative_name, category: categoryName, phone: form.phone, whatsapp: form.whatsapp, address: form.address, email: form.email, description: form.description, hours: form.hours, date: submissionDate },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );
      setToast({ type: "success", msg: "Solicitud enviada exitosamente. Revisaremos la información pronto." });
      clearForm();
    } catch {
      setToast({ type: "error", msg: "No se pudo enviar. Revise los datos e inténtelo de nuevo." });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const previewUrl = useMemo(() => {
    if (!form.image) return "";
    try { return URL.createObjectURL(form.image); } catch { return ""; }
  }, [form.image]);

  return (
    <main className="page-shell">

      {/* Toast notification */}
      {toast ? (
        <div className="fixed left-1/2 top-20 z-50 w-[92%] max-w-md -translate-x-1/2 animate-fade-up">
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
            style={{
              background: "var(--surface)",
              border: `1px solid ${toast.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {toast.type === "success"
              ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
              : <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
            }
            <p className="flex-1 text-sm font-medium" style={{ color: "var(--ink)" }}>{toast.msg}</p>
            <button onClick={() => setToast(null)} style={{ color: "var(--ink-3)" }}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ─── HEADER ──────────────────────────────────── */}
      <section className="section-container pt-10 pb-8">
        <div className="max-w-xl">
          <div className="badge-primary mb-4 w-fit">
            <BuildingStorefrontIcon className="h-3.5 w-3.5" />
            Registro empresarial
          </div>
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.025em" }}
          >
            Aparezca en el directorio
          </h1>
          <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: "var(--ink-2)" }}>
            Complete el formulario y su negocio será revisado para publicarse en el directorio de Olanchito.
          </p>
        </div>
      </section>

      {/* ─── FORM + SIDEBAR ──────────────────────────── */}
      <section className="section-container pb-16 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Form */}
          <div className="panel p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Row: Business name + representative */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nombre del negocio" icon={<BuildingStorefrontIcon className="h-4 w-4" />} required>
                  <input name="business_name" required value={form.business_name} onChange={handleChange} placeholder="Ej: Ferretería El Progreso" className="field" />
                </FormField>
                <FormField label="Representante" icon={<UserIcon className="h-4 w-4" />} required>
                  <input name="representative_name" required value={form.representative_name} onChange={handleChange} placeholder="Nombre completo" className="field" />
                </FormField>
              </div>

              {/* Category */}
              <FormField
                label="Categoría"
                icon={<TagIcon className="h-4 w-4" />}
                required
                hint={selectedCategoryName ? `Seleccionado: ${selectedCategoryName}` : undefined}
              >
                <select name="category" required value={form.category} onChange={handleChange} className="field">
                  <option value="">Seleccione una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </FormField>

              {/* Description */}
              <FormField label="Descripción" icon={<DocumentTextIcon className="h-4 w-4" />}>
                <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="field resize-none" placeholder="¿Qué ofrece su negocio? Productos, servicios, especialidades..." />
              </FormField>

              {/* Hours */}
              <FormField label="Horario de atención" icon={<ClockIcon className="h-4 w-4" />}>
                <input name="hours" value={form.hours} onChange={handleChange} className="field" placeholder="Ej: Lun-Vie 8:00am – 6:00pm" />
              </FormField>

              {/* Row: Phone + WhatsApp */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Teléfono" icon={<PhoneIcon className="h-4 w-4" />}>
                  <input name="phone" value={form.phone} onChange={handleChange} className="field" placeholder="+504 0000-0000" />
                </FormField>
                <FormField label="WhatsApp" icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}>
                  <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="field" placeholder="+504 0000-0000" />
                </FormField>
              </div>

              {/* Address */}
              <FormField label="Dirección" icon={<MapPinIcon className="h-4 w-4" />}>
                <input name="address" value={form.address} onChange={handleChange} className="field" placeholder="Barrio, calle, referencia..." />
              </FormField>

              {/* Email */}
              <FormField label="Correo electrónico" icon={<EnvelopeIcon className="h-4 w-4" />} required>
                <input type="email" name="email" required value={form.email} onChange={handleChange} className="field" placeholder="correo@ejemplo.com" />
              </FormField>

              {/* Image upload */}
              <div
                className="rounded-2xl p-4"
                style={{
                  border: "1.5px dashed var(--line-strong)",
                  background: "var(--surface-2)",
                }}
              >
                <p
                  className="flex items-center gap-2 text-sm font-semibold mb-3"
                  style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
                >
                  <PhotoIcon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  Imagen del negocio
                  <span className="text-[11px] font-normal" style={{ color: "var(--ink-3)" }}>(opcional)</span>
                </p>

                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <label
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl py-8 text-sm font-medium transition-colors"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line-strong)",
                      color: "var(--ink-2)",
                    }}
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    {form.image ? "Cambiar imagen" : "Subir imagen"}
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
                          src={previewUrl}
                          alt="Vista previa"
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <div
                          className="absolute inset-0 grid place-items-center text-xs"
                          style={{ color: "var(--ink-3)" }}
                        >
                          Vista previa
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={["btn-primary w-full py-3 text-sm", loading ? "opacity-60" : ""].join(" ")}
              >
                {loading ? "Enviando solicitud..." : "Registrar negocio"}
                {!loading && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Process steps */}
            <div className="panel p-5">
              <h3
                className="text-sm font-semibold mb-4"
                style={{ fontFamily: "var(--font-syne)", color: "var(--ink)" }}
              >
                ¿Qué ocurre después?
              </h3>
              <div className="space-y-3">
                <ProcessStep n="1" title="Revisión" desc="Validamos que los datos estén completos y sean correctos." />
                <ProcessStep n="2" title="Confirmación" desc="Le contactamos si necesitamos información adicional." />
                <ProcessStep n="3" title="Publicación" desc="Su negocio aparece en el directorio." />
              </div>
            </div>

            {/* Tip card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--primary)" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-[0.08em] mb-2"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Consejo
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                Una foto clara del local o los productos genera más confianza y hasta un 60% más clics en su perfil.
              </p>
            </div>

            {/* Free badge */}
            <div className="panel-accent p-4">
              <p className="text-xs font-semibold" style={{ color: "var(--primary-mid)" }}>
                100% Gratuito
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-2)" }}>
                El registro en el directorio es completamente gratis para todos los negocios de Olanchito.
              </p>
            </div>
          </aside>
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
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
          {required && <span style={{ color: "var(--accent)" }}>*</span>}
        </label>
        {hint ? (
          <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>{hint}</span>
        ) : null}
      </div>
      {children}
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
        <p className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>{desc}</p>
      </div>
    </div>
  );
}
