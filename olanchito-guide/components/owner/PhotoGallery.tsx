"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  ArrowUpTrayIcon,
  TrashIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/owner/ConfirmDialog";

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "Olanchito-guide";

interface Photo {
  id: string;
  image_path: string;
  sort_order: number;
}

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

function getPhotoUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function revalidate(slug: string) {
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  }).catch(() => {});
}

export default function PhotoGallery({ businessId, slug, maxPhotos }: { businessId: string; slug: string; maxPhotos: number }) {
  const [photos, setPhotos]       = useState<Photo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending]     = useState<PendingPhoto[]>([]);
  const [toast, setToast]         = useState<string | null>(null);
  const [confirmPhoto, setConfirmPhoto] = useState<Photo | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from("business_photos")
      .select("id, image_path, sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true });
    setPhotos(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPhotos(); }, [businessId]);

  // Revoke blob URLs when pending is cleared
  const clearPending = () => {
    pending.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPending([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFilesSelected = (files: FileList) => {
    const available = maxPhotos - photos.length;
    if (available <= 0) {
      showToast(`Ya tienes el máximo de ${maxPhotos} fotos.`);
      return;
    }

    const selected = Array.from(files).slice(0, available);
    const previews: PendingPhoto[] = selected.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPending(previews);
  };

  const handleConfirm = async () => {
    if (!pending.length) return;
    setUploading(true);
    const uploaded: Photo[] = [];

    for (const { file } of pending) {
      const ext = file.name.split(".").pop();
      const path = `gallery/${businessId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) { showToast("Error subiendo una foto."); continue; }

      const { data } = await supabase
        .from("business_photos")
        .insert({ business_id: businessId, image_path: path, sort_order: photos.length + uploaded.length })
        .select("id, image_path, sort_order")
        .single();

      if (data) uploaded.push(data);
    }

    setPhotos(prev => [...prev, ...uploaded]);
    setUploading(false);
    clearPending();

    if (uploaded.length > 0) {
      showToast(`${uploaded.length} foto${uploaded.length > 1 ? "s" : ""} agregada${uploaded.length > 1 ? "s" : ""}`);
      revalidate(slug);
    }
  };

  const removePending = (index: number) => {
    URL.revokeObjectURL(pending[index].previewUrl);
    setPending(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (photo: Photo) => {
    await supabase.storage.from(BUCKET).remove([photo.image_path]);
    await supabase.from("business_photos").delete().eq("id", photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    revalidate(slug);
    showToast("Foto eliminada");
  };

  const slotsLeft = maxPhotos - photos.length - pending.length;

  return (
    <div className="space-y-4">
      {confirmPhoto && (
        <ConfirmDialog
          title="¿Eliminar esta foto?"
          description="Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          onConfirm={() => { handleDelete(confirmPhoto); setConfirmPhoto(null); }}
          onCancel={() => setConfirmPhoto(null)}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-jungle-800 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* ── Preview de confirmación ── */}
      {pending.length > 0 && (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-jungle-200 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-jungle-950">
                {pending.length} foto{pending.length > 1 ? "s" : ""} seleccionada{pending.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-jungle-500">Revisa antes de subir. Haz click en una para quitarla.</p>
            </div>
            <button onClick={clearPending} className="rounded-xl p-1.5 text-jungle-400 hover:bg-jungle-50">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Preview grid */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 mb-4">
            {pending.map((p, i) => (
              <button
                key={i}
                onClick={() => removePending(i)}
                className="group relative aspect-square overflow-hidden rounded-xl bg-jungle-50"
              >
                <Image src={p.previewUrl} alt="Preview" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                  <XMarkIcon className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={uploading}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Subiendo...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Confirmar y subir
                </>
              )}
            </button>
            <button
              onClick={clearPending}
              disabled={uploading}
              className="btn-secondary px-4 py-2.5 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Header con contador y botón ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex-shrink-0 text-xs text-jungle-500">{photos.length} / {maxPhotos} fotos</p>
        {photos.length < maxPhotos && pending.length === 0 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex-shrink-0 py-2 text-xs disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            <span>Agregar fotos</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && handleFilesSelected(e.target.files)}
        />
      </div>

      {/* ── Galería existente ── */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-jungle-200 border-t-jungle-600" />
        </div>
      ) : photos.length === 0 && pending.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-jungle-200 bg-jungle-50 p-10 text-center hover:border-jungle-400 hover:bg-jungle-100 transition-colors"
        >
          <PhotoIcon className="h-10 w-10 text-jungle-300" />
          <p className="text-sm font-semibold text-jungle-600">Sube fotos de tu negocio</p>
          <p className="text-xs text-jungle-400">Se muestran en tu página pública · Máx. {maxPhotos} fotos</p>
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-jungle-50">
              <Image src={getPhotoUrl(photo.image_path)} alt="Foto del negocio" fill className="object-cover" />
              <button
                onClick={() => setConfirmPhoto(photo)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-xl bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {slotsLeft > 0 && pending.length === 0 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-jungle-200 bg-jungle-50 text-jungle-400 hover:border-jungle-400 hover:bg-jungle-100 transition-colors"
            >
              <ArrowUpTrayIcon className="h-6 w-6" />
              <span className="text-[10px] font-semibold">Agregar</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
