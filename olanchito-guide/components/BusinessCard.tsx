"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MapPinIcon, ArrowRightIcon, SparklesIcon, PhotoIcon } from "@heroicons/react/24/outline";

type BusinessCardProps = {
  business: {
    name: string;
    slug: string;
    image: string;
    address: string;
    description?: string;
  };
  className?: string;
};

export default function BusinessCard({ business, className = "" }: BusinessCardProps) {
  const [imgError, setImgError] = useState(false);

  const shortDescription =
    business.description && business.description.length > 140
      ? business.description.slice(0, 140) + "…"
      : business.description;

  const showImage = Boolean(business.image) && !imgError;

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-3xl bg-white",
        "ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(0,0,0,0.14)]",
        "focus-within:ring-2 focus-within:ring-jungle-400",
        className,
      ].join(" ")}
    >
      {/* Imagen (ratio fijo para que TODAS las cards se vean proporcionales) */}
      <div className="relative w-full overflow-hidden bg-jungle-50">
        <div className="relative aspect-[16/10] w-full">
          {showImage ? (
            <Image
              src={business.image}
              alt={business.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
              onError={() => setImgError(true)}
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-black/5">
                <PhotoIcon className="h-5 w-5 text-jungle-700" />
                <span className="text-xs font-semibold text-jungle-800">Sin imagen</span>
              </div>
            </div>
          )}

          {/* Overlay suave */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />

          {/* Pill */}
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-jungle-900 ring-1 ring-white/70 backdrop-blur">
              <SparklesIcon className="h-4 w-4 text-jungle-700" />
              Recomendado
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col gap-2 p-6">
        <header>
          <h2 className="text-lg font-extrabold leading-tight text-jungle-950 line-clamp-2">
            {business.name}
          </h2>
        </header>

        {/* Address con icono */}
        <div className="flex items-center gap-2 text-sm text-jungle-700">
          <MapPinIcon className="h-4 w-4 text-jungle-600" />
          <p className="line-clamp-1">{business.address}</p>
        </div>

        {shortDescription ? (
          <p className="mt-1 text-sm text-jungle-700/90 line-clamp-3">{shortDescription}</p>
        ) : (
          <p className="mt-1 text-sm text-jungle-700/70 italic">Sin descripción disponible.</p>
        )}

        {/* CTA */}
        <div className="mt-4">
          <Link
            href={`/business/${business.slug}`}
            className={[
              "inline-flex w-full items-center justify-center gap-2",
              "rounded-2xl px-4 py-2.5 text-sm font-extrabold",
              "bg-jungle-600 text-white shadow-sm",
              "transition-all duration-200",
              "hover:bg-jungle-700 hover:shadow-md",
              "active:translate-y-[1px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400 focus-visible:ring-offset-2",
            ].join(" ")}
          >
            Ir al negocio
            <ArrowRightIcon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Borde decorativo inferior */}
      <div className="h-1 w-full bg-gradient-to-r from-jungle-200 via-jungle-400 to-jungle-200 opacity-70" />
    </article>
  );
}
