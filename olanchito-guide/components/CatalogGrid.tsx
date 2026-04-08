"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  currency: string;
  imgUrl: string | null;
}

export default function CatalogGrid({ items }: { items: CatalogItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const withImage = items.filter(i => i.imgUrl);
  const isOpen = lightboxIndex !== null;

  const prev = useCallback(() =>
    setLightboxIndex(i => i !== null ? (i - 1 + withImage.length) % withImage.length : 0),
    [withImage.length]
  );
  const next = useCallback(() =>
    setLightboxIndex(i => i !== null ? (i + 1) % withImage.length : 0),
    [withImage.length]
  );
  const close = () => setLightboxIndex(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")     close();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, prev, next]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const openImage = (item: CatalogItem) => {
    const idx = withImage.findIndex(i => i.id === item.id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  const current = lightboxIndex !== null ? withImage[lightboxIndex] : null;

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-jungle-50 p-3 ring-1 ring-jungle-100">
            {item.imgUrl && (
              <button
                onClick={() => openImage(item)}
                className="group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
                aria-label={`Ver imagen de ${item.name}`}
              >
                <Image src={item.imgUrl} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-jungle-950">{item.name}</p>
              {item.price && (
                <p className="text-xs font-semibold text-jungle-600">
                  {item.currency === "USD" ? `$${item.price}` : `L. ${item.price}`}
                </p>
              )}
              {item.description && (
                <p className="mt-0.5 text-xs text-jungle-600">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {isOpen && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {withImage.length > 1 && (
            <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {lightboxIndex! + 1} / {withImage.length}
            </p>
          )}

          {withImage.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors sm:left-6"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}

          <div
            className="relative mx-16 max-h-[85vh] w-full max-w-3xl sm:mx-20 flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={current.id}
              src={current.imgUrl!}
              alt={current.name}
              width={1200}
              height={900}
              className="mx-auto max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl"
              priority
            />
            <div className="text-center">
              <p className="text-sm font-bold text-white">{current.name}</p>
              {current.price && (
                <p className="text-xs text-white/70 mt-0.5">
                  {current.currency === "USD" ? `$${current.price}` : `L. ${current.price}`}
                </p>
              )}
            </div>
          </div>

          {withImage.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors sm:right-6"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
