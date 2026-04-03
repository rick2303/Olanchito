"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  StarIcon as StarOutlineIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type Props = {
  businessSlug: string;
  initialReviews: Review[];
};

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= Math.round(rating) ? (
          <StarIcon key={n} className={`${cls} text-amber-400`} />
        ) : (
          <StarOutlineIcon key={n} className={`${cls} text-jungle-200`} />
        )
      )}
    </div>
  );
}

const ratingLabel: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

export default function ReviewSection({ businessSlug, initialReviews }: Props) {
  const storageKey = `reviewed_${businessSlug}`;

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [form, setForm] = useState({ author_name: "", rating: 0, comment: "" });
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (localStorage.getItem(storageKey)) setAlreadyReviewed(true);
  }, [storageKey]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author_name.trim() || form.rating === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          business_slug: businessSlug,
          author_name: form.author_name.trim(),
          rating: form.rating,
          comment: form.comment.trim(),
        })
        .select()
        .single();
      if (error || !data) throw error;
      setReviews((prev) => [data as Review, ...prev]);
      setForm({ author_name: "", rating: 0, comment: "" });
      localStorage.setItem(storageKey, "1");
      setAlreadyReviewed(true);
      setToast({ type: "success", msg: "¡Reseña publicada exitosamente!" });
    } catch {
      setToast({ type: "error", msg: "No se pudo publicar la reseña. Intente de nuevo." });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-HN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-7">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-jungle-50 ring-1 ring-jungle-200">
            <StarIcon className="h-5 w-5 text-jungle-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-jungle-950">Reseñas</h2>
            {reviews.length > 0 && (
              <p className="text-xs text-jungle-600">
                {avgRating.toFixed(1)} promedio &middot; {reviews.length} reseña
                {reviews.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        {reviews.length > 0 && <Stars rating={avgRating} size="sm" />}
      </div>

      {/* ── Reviews list ── */}
      {reviews.length === 0 ? (
        <div className="mb-6 rounded-2xl bg-jungle-50 px-4 py-6 text-center ring-1 ring-jungle-100">
          <ChatBubbleBottomCenterTextIcon className="mx-auto mb-2 h-8 w-8 text-jungle-300" />
          <p className="text-sm font-semibold text-jungle-800">Sin reseñas aún</p>
          <p className="mt-0.5 text-xs text-jungle-600">
            Sea el primero en dejar una reseña.
          </p>
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl bg-jungle-50 p-4 ring-1 ring-jungle-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-jungle-100 ring-1 ring-jungle-200">
                    <UserIcon className="h-4 w-4 text-jungle-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none text-jungle-950">
                      {r.author_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-jungle-500">
                      {formatDate(r.created_at)}
                    </p>
                  </div>
                </div>
                <Stars rating={r.rating} size="sm" />
              </div>
              {r.comment && (
                <p className="mt-2.5 text-sm leading-relaxed text-jungle-800">
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Submit form / already reviewed ── */}
      <div className="border-t border-jungle-100 pt-5">
        {alreadyReviewed ? (
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-4 ring-1 ring-green-200">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Ya dejaste tu reseña</p>
              <p className="text-xs text-green-700">Solo se permite una reseña por negocio. ¡Gracias por tu opinión!</p>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-semibold text-jungle-950">
              Dejar una reseña
            </p>

            {toast && (
              <div
                className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5 ${
                  toast.type === "success"
                    ? "bg-green-50 ring-1 ring-green-200"
                    : "bg-red-50 ring-1 ring-red-200"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 text-red-600" />
                )}
                <span
                  className={`flex-1 text-xs font-medium ${
                    toast.type === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {toast.msg}
                </span>
                <button
                  onClick={() => setToast(null)}
                  className="opacity-60 hover:opacity-100"
                >
                  <XMarkIcon className="h-3.5 w-3.5 text-current" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-jungle-900">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.author_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, author_name: e.target.value }))
                  }
                  required
                  placeholder="Su nombre"
                  className="field"
                />
              </div>

              {/* Star rating picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-jungle-900">
                  Calificación <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, rating: n }))}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${n} estrella${n !== 1 ? "s" : ""}`}
                    >
                      {n <= (hover || form.rating) ? (
                        <StarIcon className="h-7 w-7 text-amber-400" />
                      ) : (
                        <StarOutlineIcon className="h-7 w-7 text-jungle-200" />
                      )}
                    </button>
                  ))}
                  {(hover || form.rating) > 0 && (
                    <span className="ml-1.5 text-xs text-jungle-600">
                      {ratingLabel[hover || form.rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-jungle-900">
                  Comentario <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, comment: e.target.value }))
                  }
                  required
                  rows={3}
                  placeholder="Cuéntenos sobre su experiencia..."
                  className="field resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.author_name.trim() || form.rating === 0 || !form.comment.trim()}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publicando..." : "Publicar reseña"}
                {!loading && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
