"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/owner/ConfirmDialog";

function revalidate(slug: string) {
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  }).catch(() => {});
}

/** Formats a raw number string to "XX.00". Returns "" if not a valid number. */
function formatPrice(raw: string): string {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? "" : n.toFixed(2);
}

/** Renders a stored price string with its currency symbol. */
export function displayPrice(price: string | null, currency: string): string | null {
  if (!price) return null;
  return currency === "USD" ? `$${price}` : `L. ${price}`;
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  original_price: string | null;
  sale_price: string | null;
  currency: string;
  badge: string | null;
  expires_at: string | null;
  active: boolean;
  sort_order: number;
}

interface Props {
  businessId: string;
  slug: string;
}

const emptyForm = {
  title: "",
  description: "",
  original_price: "",
  sale_price: "",
  currency: "HNL",
  badge: "",
  expires_at: "",
  active: true,
};

export default function OffersManager({ businessId, slug }: Props) {
  const [items, setItems] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<Offer | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = async () => {
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [businessId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  /** Format a price field on blur */
  const handlePriceBlur = (field: "original_price" | "sale_price") => {
    const formatted = formatPrice(form[field]);
    setForm(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    try {
      const payload = {
        title:          form.title.trim(),
        description:    form.description.trim() || null,
        original_price: formatPrice(form.original_price) || null,
        sale_price:     formatPrice(form.sale_price) || null,
        currency:       form.currency,
        badge:          form.badge.trim() || null,
        expires_at:     form.expires_at || null,
        active:         form.active,
      };

      if (editId) {
        await supabase.from("offers").update(payload).eq("id", editId);
        showToast("Oferta actualizada");
      } else {
        await supabase.from("offers").insert({
          ...payload,
          business_id: businessId,
          sort_order:  items.length,
        });
        showToast("Oferta agregada");
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

  const handleEdit = (item: Offer) => {
    setForm({
      title:          item.title,
      description:    item.description ?? "",
      original_price: item.original_price ?? "",
      sale_price:     item.sale_price ?? "",
      currency:       item.currency ?? "HNL",
      badge:          item.badge ?? "",
      expires_at:     item.expires_at ?? "",
      active:         item.active,
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActive = async (item: Offer) => {
    await supabase.from("offers").update({ active: !item.active }).eq("id", item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: !i.active } : i));
    revalidate(slug);
  };

  const handleDelete = async (item: Offer) => {
    await supabase.from("offers").delete().eq("id", item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    revalidate(slug);
    showToast("Oferta eliminada");
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="rounded-2xl bg-jungle-800 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Form */}
      <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-jungle-200 py-4 text-sm font-semibold text-jungle-600 hover:border-jungle-400 hover:text-jungle-800 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Agregar oferta
          </button>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-jungle-950">
                {editId ? "Editar oferta" : "Nueva oferta"}
              </p>
              <button type="button" onClick={resetForm} className="text-jungle-400 hover:text-jungle-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-jungle-900">Título *</label>
              <input
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Ej: 2x1 en hamburguesas"
                className="field"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-jungle-900">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                placeholder="Detalle de la oferta..."
                className="field resize-none"
              />
            </div>

            {/* Currency toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-jungle-900">Moneda</label>
              <div className="flex gap-2">
                {(["HNL", "USD"] as const).map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, currency: cur }))}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                      form.currency === cur
                        ? "bg-jungle-800 text-white"
                        : "bg-jungle-50 text-jungle-600 hover:bg-jungle-100"
                    }`}
                  >
                    {cur === "HNL" ? "🇭🇳 Lempiras (L.)" : "🇺🇸 Dólares ($)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-jungle-900">Precio original</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-jungle-400 pointer-events-none">
                    {form.currency === "USD" ? "$" : "L."}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.original_price}
                    onChange={e => setForm(prev => ({ ...prev, original_price: e.target.value }))}
                    onBlur={() => handlePriceBlur("original_price")}
                    placeholder="0.00"
                    className="field pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-jungle-900">Precio oferta</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-jungle-400 pointer-events-none">
                    {form.currency === "USD" ? "$" : "L."}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sale_price}
                    onChange={e => setForm(prev => ({ ...prev, sale_price: e.target.value }))}
                    onBlur={() => handlePriceBlur("sale_price")}
                    placeholder="0.00"
                    className="field pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Badge + Expires */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-jungle-900">Badge</label>
                <input
                  value={form.badge}
                  onChange={e => setForm(prev => ({ ...prev, badge: e.target.value }))}
                  placeholder="Ej: 2x1, -25%, Nuevo"
                  className="field"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-jungle-900">Vence el</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="field"
                />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => setForm(prev => ({ ...prev, active: !prev.active }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.active ? "bg-jungle-600" : "bg-jungle-200"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs font-semibold text-jungle-900">Oferta activa</span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || !form.title.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-jungle-800 px-4 py-2 text-xs font-bold text-white hover:bg-jungle-700 disabled:opacity-50 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Agregar oferta"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-jungle-600 hover:bg-jungle-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-jungle-400">Cargando ofertas...</p>
      ) : items.length === 0 && !showForm ? (
        <p className="text-sm text-jungle-400">Aún no has agregado ninguna oferta.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isExpired = item.expires_at && item.expires_at < new Date().toISOString().split("T")[0];
            const cur = item.currency ?? "HNL";
            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-white p-4 ring-1 shadow-sm transition-opacity ${
                  !item.active || isExpired ? "opacity-50 ring-jungle-100" : "ring-black/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-amber-50 ring-1 ring-amber-200">
                    <TagIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-jungle-950">{item.title}</p>
                      {item.badge && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {item.badge}
                        </span>
                      )}
                      {isExpired && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          Vencida
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-jungle-600 line-clamp-2">{item.description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-jungle-500">
                      {item.original_price && (
                        <span className="line-through">{displayPrice(item.original_price, cur)}</span>
                      )}
                      {item.sale_price && (
                        <span className="font-bold text-green-700">{displayPrice(item.sale_price, cur)}</span>
                      )}
                      {item.expires_at && (
                        <span>Vence: {new Date(item.expires_at + "T00:00:00").toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-jungle-50 pt-3">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                      item.active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-jungle-100 text-jungle-500 hover:bg-jungle-200"
                    }`}
                  >
                    {item.active ? "Activa" : "Inactiva"}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-jungle-600 hover:bg-jungle-50 transition-colors"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmItem(item)}
                    className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmItem && (
        <ConfirmDialog
          title={`¿Eliminar la oferta "${confirmItem.title}"?`}
          onConfirm={() => { handleDelete(confirmItem); setConfirmItem(null); }}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </div>
  );
}
