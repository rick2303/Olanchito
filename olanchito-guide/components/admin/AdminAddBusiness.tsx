"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BuildingStorefrontIcon,
  TagIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  LinkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import HoursInput from "@/components/HoursInput";

interface Category {
  id: string;
  name: string;
}

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "Olanchito-guide";
const FALLBACK_IMAGE =
  process.env.NEXT_PUBLIC_FALLBACK_IMG ??
  "https://lvvciuhvhpjgfzediulv.supabase.co/storage/v1/object/public/Olanchito-guide/default-business.png";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  category_id: "",
  description: "",
  hours: "",
  phone: "",
  whatsapp: "",
  address: "",
  featured: false,
  verified: false,
  image: null as File | null,
  instagram: "",
  facebook: "",
  tiktok: "",
  linkedin: "",
  website: "",
};

export default function AdminAddBusiness() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data }) => { if (data) setCategories(data as Category[]); });
  }, []);

  const previewUrl = useMemo(() => {
    if (!form.image) return "";
    try { return URL.createObjectURL(form.image); } catch { return ""; }
  }, [form.image]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: slugManual ? prev.slug : slugify(val),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManual(true);
    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgError(false);
    setForm((prev) => ({ ...prev, image: f }));
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!form.name.trim() || !form.slug.trim() || !form.category_id) {
      showToast("error", "Complete los campos requeridos: nombre, slug y categoría.");
      return;
    }

    setLoading(true);
    try {
      let imagePath: string | null = null;

      if (form.image) {
        const ext = form.image.name.split(".").pop();
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const path = `business/${fileName}`;
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, form.image, { contentType: form.image.type, upsert: false });
        if (uploadErr) throw uploadErr;
        imagePath = path;
      }

      const { error: insertErr } = await supabase.from("businesses").insert([
        {
          name: form.name.trim(),
          slug: form.slug.trim(),
          category_id: form.category_id,
          description: form.description.trim() || null,
          hours: form.hours.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          address: form.address.trim() || null,
          featured: form.featured,
          verified: form.verified,
          image: imagePath,
          view_count: 0,
          socials: {
            instagram: form.instagram.trim() || null,
            facebook:  form.facebook.trim()  || null,
            tiktok:    form.tiktok.trim()    || null,
            linkedin:  form.linkedin.trim()  || null,
            website:   form.website.trim()   || null,
          },
        },
      ]);

      if (insertErr) throw insertErr;

      showToast("success", `"${form.name}" publicado exitosamente.`);
      setForm(EMPTY_FORM);
      setSlugManual(false);
      setImgError(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      // Slug duplicate check
      if (msg.includes("duplicate") || msg.includes("unique")) {
        showToast("error", `El slug "${form.slug}" ya está en uso. Elija otro.`);
      } else {
        showToast("error", `Error al guardar: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 w-[92%] max-w-md -translate-x-1/2 animate-fade-up">
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-xl"
            style={{
              background: "white",
              border: `1px solid ${toast.type === "success" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
            }}
          >
            {toast.type === "success"
              ? <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              : <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            }
            <p className="flex-1 text-sm font-medium text-jungle-900">{toast.msg}</p>
            <button onClick={() => setToast(null)} className="text-jungle-400">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5 sm:p-6">
          <p
            className="mb-5 text-sm font-bold text-jungle-950"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Publicar negocio directamente
          </p>

          <div className="space-y-4">

            {/* Name + Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del negocio" icon={<BuildingStorefrontIcon className="h-4 w-4" />} required>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="Ej: Ferretería El Progreso"
                  className="admin-field"
                />
              </Field>

              <Field
                label="Slug (URL)"
                icon={<LinkIcon className="h-4 w-4" />}
                hint="/negocios/…"
                required
              >
                <input
                  name="slug"
                  required
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="ferreteria-el-progreso"
                  className="admin-field font-mono text-xs"
                />
              </Field>
            </div>

            {/* Category + Featured */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría" icon={<TagIcon className="h-4 w-4" />} required>
                <select
                  name="category_id"
                  required
                  value={form.category_id}
                  onChange={handleChange}
                  className="admin-field"
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-jungle-50 px-4 py-3 ring-1 ring-jungle-100 w-full select-none">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded accent-jungle-600"
                  />
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-jungle-800">
                    <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                    Destacado
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100 w-full select-none">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={form.verified}
                    onChange={handleChange}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                    <CheckBadgeIcon className="h-3.5 w-3.5 text-blue-500" />
                    Verificado
                  </span>
                </label>
              </div>
            </div>

            {/* Description */}
            <Field label="Descripción" icon={<DocumentTextIcon className="h-4 w-4" />}>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className="admin-field resize-none"
                placeholder="Productos, servicios, especialidades..."
              />
            </Field>

            {/* Hours */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-jungle-800">
                <ClockIcon className="h-4 w-4 text-jungle-500" />
                Horario
                <span className="font-normal text-jungle-400">(opcional)</span>
              </label>
              <HoursInput
                value={form.hours}
                onChange={(val) => setForm((p) => ({ ...p, hours: val }))}
              />
            </div>

            {/* Phone + WhatsApp */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" icon={<PhoneIcon className="h-4 w-4" />}>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="admin-field"
                  placeholder="+504 0000-0000"
                />
              </Field>
              <Field label="WhatsApp" icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  className="admin-field"
                  placeholder="+504 0000-0000"
                />
              </Field>
            </div>

            {/* Address */}
            <Field label="Dirección" icon={<MapPinIcon className="h-4 w-4" />}>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="admin-field"
                placeholder="Barrio, calle, referencia..."
              />
            </Field>

            {/* Redes sociales */}
            <div className="rounded-xl border border-jungle-200 bg-jungle-50/30 p-4 space-y-3">
              <p className="text-xs font-semibold text-jungle-800">Redes sociales y web</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Instagram" icon={<LinkIcon className="h-4 w-4" />}>
                  <input name="instagram" value={form.instagram} onChange={handleChange} className="admin-field" placeholder="https://instagram.com/negocio" />
                </Field>
                <Field label="Facebook" icon={<LinkIcon className="h-4 w-4" />}>
                  <input name="facebook" value={form.facebook} onChange={handleChange} className="admin-field" placeholder="https://facebook.com/negocio" />
                </Field>
                <Field label="TikTok" icon={<LinkIcon className="h-4 w-4" />}>
                  <input name="tiktok" value={form.tiktok} onChange={handleChange} className="admin-field" placeholder="https://tiktok.com/@negocio" />
                </Field>
                <Field label="LinkedIn" icon={<LinkIcon className="h-4 w-4" />}>
                  <input name="linkedin" value={form.linkedin} onChange={handleChange} className="admin-field" placeholder="https://linkedin.com/company/negocio" />
                </Field>
              </div>
              <Field label="Sitio web" icon={<LinkIcon className="h-4 w-4" />}>
                <input name="website" value={form.website} onChange={handleChange} className="admin-field" placeholder="https://www.negocio.com" />
              </Field>
            </div>

            {/* Image upload */}
            <div className="rounded-xl border border-dashed border-jungle-200 bg-jungle-50/40 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-jungle-800">
                <PhotoIcon className="h-4 w-4" />
                Imagen del negocio
                <span className="font-normal text-jungle-400">(opcional)</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-jungle-200 bg-white py-6 text-xs font-medium text-jungle-600 transition-colors hover:bg-jungle-50">
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {form.image ? "Cambiar imagen" : "Subir imagen"}
                  <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                </label>
                <div className="relative overflow-hidden rounded-xl border border-jungle-100 bg-white">
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
                      <div className="absolute inset-0 grid place-items-center text-[10px] text-jungle-400">
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
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: "var(--primary)" }}
            >
              {loading ? "Publicando..." : "Publicar negocio"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  icon,
  hint,
  required,
  children,
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
        <label className="flex items-center gap-1.5 text-xs font-semibold text-jungle-800">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-jungle-100 text-jungle-600">
            {icon}
          </span>
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-[11px] font-mono text-jungle-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
