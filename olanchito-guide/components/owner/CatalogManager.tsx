"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/owner/ConfirmDialog";

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "Olanchito-guide";

function getCatalogImageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function formatPrice(price: string | null, currency: string) {
  if (!price) return null;
  return currency === "USD" ? `$${price}` : `L. ${price}`;
}

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  currency: string;
  image_path: string | null;
  is_available: boolean;
  sort_order: number;
}

interface Props {
  businessId: string;
  slug: string;
  maxItems: number | null; // null = unlimited
}

const emptyForm = { name: "", description: "", price: "", currency: "HNL", is_available: true };

function revalidate(slug: string) {
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  }).catch(() => {});
}

export default function CatalogManager({ businessId, slug, maxItems }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<CatalogItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("catalog_items")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [businessId]);

  const handleImageChange = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setEditId(null);
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `catalog/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    return path;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      let imagePath: string | null = null;

      if (imageFile) {
        imagePath = await uploadImage(imageFile);
      }

      if (editId) {
        // Update existing item
        const existingItem = items.find(i => i.id === editId);
        const updateData: Partial<CatalogItem> = {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: form.price.trim() || null,
          currency: form.currency,
          is_available: form.is_available,
        };
        if (imagePath) {
          // Delete old image
          if (existingItem?.image_path) {
            await supabase.storage.from(BUCKET).remove([existingItem.image_path]);
          }
          updateData.image_path = imagePath;
        }
        await supabase.from("catalog_items").update(updateData).eq("id", editId);
        showToast("Item actualizado");
      } else {
        // Insert new item
        await supabase.from("catalog_items").insert({
          business_id: businessId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: form.price.trim() || null,
          currency: form.currency,
          image_path: imagePath,
          is_available: form.is_available,
          sort_order: items.length,
        });
        showToast("Item agregado al catálogo");
      }

      await fetchItems();
      revalidate(slug);
      resetForm();
    } catch {
      showToast("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: CatalogItem) => {
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: item.price ?? "",
      currency: item.currency ?? "HNL",
      is_available: item.is_available,
    });
    setImagePreview(getCatalogImageUrl(item.image_path));
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleAvailable = async (item: CatalogItem) => {
    await supabase
      .from("catalog_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    revalidate(slug);
  };

  const handleDelete = async (item: CatalogItem) => {
    if (item.image_path) {
      await supabase.storage.from(BUCKET).remove([item.image_path]);
    }
    await supabase.from("catalog_items").delete().eq("id", item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    revalidate(slug);
    showToast("Item eliminado");
  };

  return (
    <div className="space-y-5">
      {confirmItem && (
        <ConfirmDialog
          title={`¿Eliminar "${confirmItem.name}"?`}
          description="Se eliminará del catálogo y no se podrá recuperar."
          confirmLabel="Sí, eliminar"
          onConfirm={() => { handleDelete(confirmItem); setConfirmItem(null); }}
          onCancel={() => setConfirmItem(null)}
        />
      )}
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-jungle-800 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm ? (
        <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-jungle-950">
              {editId ? "Editar item" : "Agregar item al catálogo"}
            </h3>
            <button onClick={resetForm} className="rounded-xl p-1.5 text-jungle-500 hover:bg-jungle-50">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Image upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className="relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-jungle-50 ring-1 ring-jungle-200 hover:bg-jungle-100 transition-colors"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-jungle-500">
                  <ArrowUpTrayIcon className="h-7 w-7" />
                  <span className="text-xs font-semibold">Subir imagen (opcional)</span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-jungle-900">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Ej: Baleada sencilla"
                className="field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-jungle-900">
                Descripción (opcional)
                <span className={`ml-2 font-normal ${form.description.length > 255 ? "text-red-500" : "text-jungle-500"}`}>
                  {form.description.length}/255
                </span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value.slice(0, 255) }))}
                rows={2}
                placeholder="Breve descripción del producto o servicio"
                className="field resize-none"
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-jungle-900">Precio (opcional)</label>
              <div className="flex gap-2">
                <div className="flex overflow-hidden rounded-xl ring-1 ring-black/10 flex-shrink-0">
                  {(["HNL", "USD"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, currency: c }))}
                      className={`px-3 py-2.5 text-xs font-bold transition-colors ${
                        form.currency === c
                          ? "bg-jungle-700 text-white"
                          : "bg-white text-jungle-600 hover:bg-jungle-50"
                      }`}
                    >
                      {c === "HNL" ? "L." : "$"}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder={form.currency === "HNL" ? "Ej: 45" : "Ej: 6.99"}
                  className="field flex-1"
                />
              </div>
              {form.price && (
                <p className="text-[10px] text-jungle-400">
                  Se mostrará como: <span className="font-semibold">{form.currency === "HNL" ? `L. ${form.price}` : `$${form.price}`}</span>
                </p>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                className={`relative h-5 w-9 rounded-full transition-colors ${form.is_available ? "bg-jungle-600" : "bg-jungle-200"}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_available ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs font-semibold text-jungle-900">Disponible</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="btn-primary flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editId ? "Actualizar" : "Agregar"}
                  </>
                )}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2.5">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-2">
          {maxItems !== null && (
            <p className="text-xs text-jungle-500 text-right">{items.length} / {maxItems} items</p>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={maxItems !== null && items.length >= maxItems}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5" />
            {maxItems !== null && items.length >= maxItems
              ? `Límite alcanzado (${maxItems} items)`
              : "Agregar item al catálogo"}
          </button>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-jungle-200 border-t-jungle-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 ring-1 ring-black/5 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
            <TagIcon className="h-6 w-6 text-jungle-500" />
          </div>
          <p className="text-sm font-semibold text-jungle-700">Tu catálogo está vacío</p>
          <p className="mt-1 text-xs text-jungle-500">Agrega productos o servicios para mostrarlos a tus clientes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const imgUrl = getCatalogImageUrl(item.image_path);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 shadow-sm"
              >
                {/* Thumbnail */}
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-jungle-50 ring-1 ring-jungle-100">
                  {imgUrl ? (
                    <Image src={imgUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <TagIcon className="h-5 w-5 text-jungle-300" />
                    </div>
                  )}
                </div>

                {/* Info + badge */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-jungle-950">{item.name}</p>
                  {item.price && (
                    <p className="text-xs font-semibold text-jungle-600">{formatPrice(item.price, item.currency)}</p>
                  )}
                  {item.description && (
                    <p className="mt-0.5 truncate text-xs text-jungle-500">{item.description}</p>
                  )}
                  {/* Availability badge — moves here on mobile to free up action row */}
                  <button
                    onClick={() => handleToggleAvailable(item)}
                    className={`mt-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold transition-colors ${
                      item.is_available
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-jungle-100 text-jungle-500 hover:bg-jungle-200"
                    }`}
                  >
                    {item.is_available ? "● Disponible" : "○ No disponible"}
                  </button>
                </div>

                {/* Actions — only icons, always fits */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="rounded-xl p-2 text-jungle-500 hover:bg-jungle-50"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmItem(item)}
                    className="rounded-xl p-2 text-red-400 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
