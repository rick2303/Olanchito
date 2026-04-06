"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid, CheckBadgeIcon } from "@heroicons/react/24/solid";
import LocationPickerWrapper from "@/components/LocationPickerWrapper";
import type { LatLng } from "@/components/LocationPicker";

interface Category { id: string; name: string; }

type SubscriptionTier = "free" | "premium" | "featured";

interface Business {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  hours: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  featured: boolean;
  verified: boolean;
  image: string | null;
  view_count: number;
  socials: Record<string, string | null> | null;
  location: LatLng | null;
  owner_email: string | null;
  subscription_active: boolean;
  subscription_tier: SubscriptionTier;
  subscription_started_at: string | null;
  stripe_subscription_id: string | null;
}

type EditState = Omit<Business, "id" | "view_count" | "socials" | "location" | "subscription_active" | "subscription_tier" | "subscription_started_at" | "stripe_subscription_id"> & {
  newImage: File | null;
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
  website: string;
};

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "Olanchito-guide";

function getPublicUrl(path: string | null) {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

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

export default function AdminBusinessList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [editId, setEditId]         = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<EditState | null>(null);
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [togglingSubId, setTogglingSubId] = useState<string | null>(null);
  const [editLocation, setEditLocation] = useState<LatLng | null>(null);
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<Record<string, "sent" | "exists" | "error">>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: biz }, { data: cats }] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slug, category_id, description, hours, phone, whatsapp, address, featured, verified, image, view_count, socials, location, owner_email, subscription_active, subscription_tier, subscription_started_at, stripe_subscription_id")
        .order("name", { ascending: true }),
      supabase.from("categories").select("id, name").order("name", { ascending: true }),
    ]);
    setBusinesses(biz ?? []);
    setCategories(cats ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Revoke previous preview blob URL when it changes
  useEffect(() => {
    return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const startEdit = (b: Business) => {
    setDeleteId(null);
    setEditId(b.id);
    setEditForm({
      name: b.name,
      slug: b.slug,
      category_id: b.category_id,
      description: b.description,
      hours: b.hours,
      phone: b.phone,
      whatsapp: b.whatsapp,
      address: b.address,
      featured: b.featured,
      verified: b.verified,
      image: b.image,
      owner_email: b.owner_email,
      newImage: null,
      instagram: (b.socials?.instagram as string) ?? "",
      facebook:  (b.socials?.facebook  as string) ?? "",
      tiktok:    (b.socials?.tiktok    as string) ?? "",
      linkedin:  (b.socials?.linkedin  as string) ?? "",
      website:   (b.socials?.website   as string) ?? "",
    });
    setPreviewUrl(getPublicUrl(b.image));
    setEditLocation((b.location as LatLng | null) ?? null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm(null);
    setPreviewUrl(null);
    setEditLocation(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editForm) return;
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setEditForm((prev) => prev ? { ...prev, [name]: type === "checkbox" ? checked : value } : prev);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !editForm) return;
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setEditForm((prev) => prev ? { ...prev, newImage: f } : prev);
  };

  const saveEdit = async () => {
    if (!editForm || !editId) return;
    setSaving(true);
    try {
      // Warn if owner_email is already assigned to a different business
      if (editForm.owner_email) {
        const { data: existing } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_email", editForm.owner_email.toLowerCase().trim())
          .neq("id", editId)
          .limit(1);
        if (existing && existing.length > 0) {
          const ok = window.confirm(
            `⚠️ Este correo ya está asignado a "${existing[0].name}".\n\nSi continúas, ese negocio también podrá acceder al portal con el mismo correo.\n\n¿Deseas continuar?`
          );
          if (!ok) { setSaving(false); return; }
        }
      }
      let imagePath = editForm.image;

      if (editForm.newImage) {
        const ext = editForm.newImage.name.split(".").pop();
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const path = `business/${fileName}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, editForm.newImage, { contentType: editForm.newImage.type, upsert: false });
        if (upErr) throw upErr;
        // Delete old image after successful upload
        if (editForm.image) {
          await supabase.storage.from(BUCKET).remove([editForm.image]);
        }
        imagePath = path;
      }

      const { error } = await supabase.from("businesses").update({
        name:        editForm.name.trim(),
        slug:        editForm.slug.trim(),
        category_id: editForm.category_id,
        description: editForm.description?.trim() || null,
        hours:       editForm.hours?.trim() || null,
        phone:       editForm.phone?.trim() || null,
        whatsapp:    editForm.whatsapp?.trim() || null,
        address:     editForm.address?.trim() || null,
        featured:     editForm.featured,
        verified:     editForm.verified,
        image:        imagePath,
        location:     editLocation ?? null,
        owner_email:  editForm.owner_email?.trim().toLowerCase() || null,
        socials: {
          instagram: editForm.instagram.trim() || null,
          facebook:  editForm.facebook.trim()  || null,
          tiktok:    editForm.tiktok.trim()    || null,
          linkedin:  editForm.linkedin.trim()  || null,
          website:   editForm.website.trim()   || null,
        },
      }).eq("id", editId);

      if (error) throw error;

      setBusinesses((prev) =>
        prev.map((b) =>
          b.id === editId
            ? { ...b, ...editForm, image: imagePath, newImage: undefined }
            : b
        )
      );
      cancelEdit();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSetTier = async (id: string, newTier: SubscriptionTier, currentTier: SubscriptionTier) => {
    if (newTier === currentTier) return;
    setTogglingSubId(id);
    const newActive = newTier !== "free";
    const biz = businesses.find(b => b.id === id);

    // If the business has an active Stripe subscription, warn before overriding manually
    if (biz?.stripe_subscription_id && newTier === "free") {
      const ok = window.confirm(
        "Este negocio tiene una suscripción activa en Stripe.\n\nCambiar el plan manualmente aquí NO cancela el cobro en Stripe. ¿Deseas continuar de todas formas?"
      );
      if (!ok) { setTogglingSubId(null); return; }
    }

    // Update DB directly — the admin has permission and doesn't need the owner's token
    const { error } = await supabase
      .from("businesses")
      .update({
        subscription_tier:       newTier,
        subscription_active:     newActive,
        featured:                newTier === "featured",
        cancel_at_period_end:    false,
        ...(newActive && currentTier === "free"
          ? { subscription_started_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", id);

    if (error) {
      alert(`Error al cambiar el plan: ${error.message}`);
      setTogglingSubId(null);
      return;
    }

    setBusinesses((prev) =>
      prev.map((b) => b.id === id
        ? { ...b, subscription_tier: newTier, subscription_active: newActive, featured: newTier === "featured" }
        : b
      )
    );

    // Send invite only when upgrading from free → paid for the first time
    if (currentTier === "free" && newActive) {
      if (!biz?.owner_email) {
        alert(`Plan ${newTier} activado. Recuerda asignar un email al dueño y guardar para enviarle el acceso.`);
      } else {
        const res = await fetch("/api/owner/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(`Plan activado, pero no se pudo enviar la invitación: ${data.error ?? "error desconocido"}`);
        } else if (data.type === "existing_user") {
          alert(`Plan ${newTier} activado. El dueño ya tiene cuenta — puede iniciar sesión en /owner/login.`);
        } else if (data.sent) {
          alert(`Plan ${newTier} activado. Se envió el correo de invitación al dueño.`);
        }
      }
    } else if (currentTier !== "free" && newActive) {
      alert(`Plan cambiado a ${newTier}.`);
    } else if (!newActive) {
      alert(`Plan desactivado.${biz?.stripe_subscription_id ? " Recuerda cancelar el cobro en el dashboard de Stripe si aplica." : ""}`);
    }

    setTogglingSubId(null);
  };

  const handleSendInvite = async (id: string) => {
    setSendingInviteId(id);
    try {
      const res = await fetch("/api/owner/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setInviteResult((prev) => ({ ...prev, [id]: data.type === "existing_user" ? "exists" : "sent" }));
    } catch {
      setInviteResult((prev) => ({ ...prev, [id]: "error" }));
    } finally {
      setSendingInviteId(null);
      setTimeout(() => setInviteResult((prev) => { const next = { ...prev }; delete next[id]; return next; }), 4000);
    }
  };

  const confirmDelete = async (id: string) => {
    setDeleting(true);
    try {
      const biz = businesses.find((b) => b.id === id);
      const { error } = await supabase.from("businesses").delete().eq("id", id);
      if (error) throw error;
      // Best-effort: remove image from storage
      if (biz?.image) {
        await supabase.storage.from(BUCKET).remove([biz.image]);
      }
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
      setDeleteId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase())
  );

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jungle-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o slug…"
          className="admin-field pl-9"
        />
      </div>

      {/* Count */}
      <p className="text-xs text-jungle-500">
        {filtered.length} negocio{filtered.length !== 1 ? "s" : ""}
        {search ? ` para "${search}"` : ""}
      </p>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
            <p className="text-sm text-jungle-600">No se encontraron negocios.</p>
          </div>
        )}

        {filtered.map((b) => {
          const isEditing = editId === b.id;
          const isDeleting = deleteId === b.id;

          return (
            <div
              key={b.id}
              className="rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* ── Card header (always visible) ── */}
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                {/* Image thumb */}
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-jungle-50">
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getPublicUrl(b.image) ?? ""}
                      alt={b.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-jungle-950">{b.name}</p>
                    {b.featured && (
                      <StarSolid className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" title="Destacado" />
                    )}
                    {b.verified && (
                      <CheckBadgeIcon className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" title="Verificado" />
                    )}
                    {/* Subscription tier badge */}
                    {b.owner_email && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                        b.subscription_tier === "featured"
                          ? "bg-amber-100 text-amber-700 ring-amber-200"
                          : b.subscription_tier === "premium"
                            ? "bg-green-100 text-green-700 ring-green-200"
                            : "bg-jungle-100 text-jungle-400 ring-jungle-200"
                      }`}>
                        {b.subscription_tier === "featured" ? "★ Destacado" : b.subscription_tier === "premium" ? "● Premium" : "○ Gratis"}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-jungle-400">
                    /{b.slug} · {categoryName(b.category_id)} · {b.view_count ?? 0} vistas
                    {b.owner_email && <span className="ml-1 text-jungle-300">· {b.owner_email}</span>}
                  </p>
                  {b.subscription_active && b.subscription_started_at && !b.stripe_subscription_id && (() => {
                    const started = new Date(b.subscription_started_at);
                    const next = new Date(started);
                    const today = new Date();
                    while (next <= today) next.setMonth(next.getMonth() + 1);
                    const daysLeft = Math.ceil((next.getTime() - today.getTime()) / 86400000);
                    return (
                      <p className={`text-[10px] font-semibold ${daysLeft <= 5 ? "text-red-500" : "text-amber-500"}`}>
                        💳 Pago manual · desde {started.toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })} · próximo cobro {next.toLocaleDateString("es-HN", { day: "numeric", month: "short" })} ({daysLeft}d)
                      </p>
                    );
                  })()}
                </div>

                {/* Actions */}
                {!isEditing && !isDeleting && (
                  <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    <div className="flex gap-1.5">
                      {b.owner_email && (
                        <button
                          onClick={() => handleSendInvite(b.id)}
                          disabled={sendingInviteId === b.id}
                          className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50 disabled:opacity-50"
                          title="Enviar acceso al portal"
                        >
                          <EnvelopeIcon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">
                            {sendingInviteId === b.id ? "Enviando…" : "Enviar acceso"}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(b)}
                        className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50"
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        onClick={() => { cancelEdit(); setDeleteId(b.id); }}
                        className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                    {inviteResult[b.id] && (
                      <p className={`text-[10px] font-semibold ${
                        inviteResult[b.id] === "sent"   ? "text-green-600" :
                        inviteResult[b.id] === "exists" ? "text-jungle-500" :
                        "text-red-500"
                      }`}>
                        {inviteResult[b.id] === "sent"   ? "✓ Correo enviado" :
                         inviteResult[b.id] === "exists" ? "Ya tiene cuenta" :
                         "Error al enviar"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Delete confirmation ── */}
              {isDeleting && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      ¿Eliminar &quot;{b.name}&quot; permanentemente?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmDelete(b.id)}
                        disabled={deleting}
                        className="flex-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:flex-none"
                      >
                        {deleting ? "Eliminando…" : "Sí, eliminar"}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        disabled={deleting}
                        className="flex-1 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50 sm:flex-none"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Edit form ── */}
              {isEditing && editForm && (
                <div className="border-t border-jungle-100 bg-jungle-50/30 px-4 py-4 sm:px-5">
                  <div className="space-y-3">

                    {/* Name + Slug */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">Nombre *</label>
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={(e) => {
                            handleEditChange(e);
                          }}
                          className="admin-field text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="flex items-center justify-between text-[11px] font-semibold text-jungle-700">
                          Slug (URL) *
                          <span className="font-normal text-amber-600">⚠ cambiar rompe links</span>
                        </label>
                        <input
                          name="slug"
                          value={editForm.slug}
                          onChange={(e) =>
                            setEditForm((p) => p ? { ...p, slug: slugify(e.target.value) } : p)
                          }
                          className="admin-field font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Category + Featured */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">Categoría</label>
                        <select
                          name="category_id"
                          value={editForm.category_id ?? ""}
                          onChange={handleEditChange}
                          className="admin-field text-xs"
                        >
                          <option value="">Sin categoría</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-jungle-200 bg-jungle-50 px-3 py-2 text-xs font-semibold text-jungle-800 select-none">
                          <input
                            type="checkbox"
                            name="featured"
                            checked={editForm.featured}
                            onChange={handleEditChange}
                            className="h-3.5 w-3.5 rounded accent-jungle-600"
                          />
                          <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                          Destacado
                        </label>
                        <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 select-none">
                          <input
                            type="checkbox"
                            name="verified"
                            checked={editForm.verified}
                            onChange={handleEditChange}
                            className="h-3.5 w-3.5 rounded accent-blue-600"
                          />
                          <CheckBadgeIcon className="h-3.5 w-3.5 text-blue-500" />
                          Verificado
                        </label>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-jungle-700">Descripción</label>
                      <textarea
                        name="description"
                        rows={2}
                        value={editForm.description ?? ""}
                        onChange={handleEditChange}
                        className="admin-field resize-none text-xs"
                      />
                    </div>

                    {/* Hours + Address */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">Horario</label>
                        <input name="hours" value={editForm.hours ?? ""} onChange={handleEditChange} className="admin-field text-xs" placeholder="Lun-Vie 8am – 6pm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">Dirección</label>
                        <input name="address" value={editForm.address ?? ""} onChange={handleEditChange} className="admin-field text-xs" />
                      </div>
                    </div>

                    {/* Phone + WhatsApp */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">Teléfono</label>
                        <input name="phone" value={editForm.phone ?? ""} onChange={handleEditChange} className="admin-field text-xs" placeholder="+504 0000-0000" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">WhatsApp</label>
                        <input name="whatsapp" value={editForm.whatsapp ?? ""} onChange={handleEditChange} className="admin-field text-xs" placeholder="+504 0000-0000" />
                      </div>
                    </div>

                    {/* Owner Portal */}
                    <div className="rounded-xl border border-jungle-200 bg-jungle-50/30 p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-jungle-700">Owner Portal</p>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">
                          Email del dueño
                          <span className="ml-1 font-normal text-jungle-400">— necesario para acceder al portal</span>
                        </label>
                        <input
                          name="owner_email"
                          type="email"
                          value={editForm.owner_email ?? ""}
                          onChange={handleEditChange}
                          className="admin-field text-xs"
                          placeholder="dueno@correo.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">Plan de suscripción</label>
                        <div className="flex gap-1.5">
                          {(["free", "premium", "featured"] as SubscriptionTier[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              disabled={togglingSubId === b.id}
                              onClick={() => handleSetTier(b.id, t, b.subscription_tier)}
                              className={`flex-1 rounded-xl py-1.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                                b.subscription_tier === t
                                  ? t === "featured"
                                    ? "bg-amber-500 text-white"
                                    : t === "premium"
                                      ? "bg-green-600 text-white"
                                      : "bg-jungle-600 text-white"
                                  : "bg-white text-jungle-600 ring-1 ring-jungle-200 hover:bg-jungle-50"
                              }`}
                            >
                              {togglingSubId === b.id ? "..." : t === "free" ? "Gratis" : t === "premium" ? "Premium" : "Destacado"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Redes sociales */}
                    <div className="rounded-xl border border-jungle-200 bg-jungle-50/30 p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-jungle-700">Redes sociales y web</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(["instagram","facebook","tiktok","linkedin"] as const).map((net) => (
                          <div key={net} className="space-y-1">
                            <label className="text-[11px] font-semibold text-jungle-700 capitalize">{net}</label>
                            <input name={net} value={editForm[net]} onChange={handleEditChange} className="admin-field text-xs" placeholder={`https://${net}.com/...`} />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-jungle-700">Sitio web</label>
                        <input name="website" value={editForm.website} onChange={handleEditChange} className="admin-field text-xs" placeholder="https://www.negocio.com" />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="rounded-xl border border-jungle-200 bg-jungle-50/30 p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-jungle-700">Ubicación en el mapa</p>
                      <LocationPickerWrapper value={editLocation} onChange={setEditLocation} />
                    </div>

                    {/* Image */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-jungle-700">Imagen</label>
                      <div className="flex items-center gap-3">
                        {/* Thumb */}
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-jungle-200 bg-jungle-50">
                          {previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-jungle-200 bg-white px-3 py-2 text-xs font-medium text-jungle-600 hover:bg-jungle-50">
                          <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                          {editForm.newImage ? "Cambiar" : "Subir nueva imagen"}
                          <input type="file" accept="image/*" hidden onChange={handleImageChange} />
                        </label>
                        {editForm.newImage && (
                          <span className="text-[11px] text-jungle-500 truncate max-w-[120px]">
                            {editForm.newImage.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-jungle-600 px-4 py-2 text-xs font-semibold text-white hover:bg-jungle-700 disabled:opacity-50 sm:flex-none"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        {saving ? "Guardando…" : "Guardar cambios"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-jungle-700 ring-1 ring-jungle-200 hover:bg-jungle-50 sm:flex-none"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
