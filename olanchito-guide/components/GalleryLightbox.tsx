"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface Props {
  photos: { id: string; url: string }[];
}

export default function GalleryLightbox({ photos }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % photos.length), [photos.length]);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      close();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const openAt = (i: number) => { setIndex(i); setOpen(true); };

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => openAt(i)}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-jungle-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400"
          >
            <Image
              src={photo.url}
              alt={`Foto ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Counter */}
          <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            {index + 1} / {photos.length}
          </p>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors sm:left-6"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative mx-16 max-h-[85vh] w-full max-w-3xl sm:mx-20"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={photos[index].id}
              src={photos[index].url}
              alt={`Foto ${index + 1}`}
              width={1200}
              height={900}
              className="mx-auto max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
              priority
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
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
