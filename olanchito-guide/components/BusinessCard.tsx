"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  MapPinIcon,
  ArrowRightIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

type BusinessCardProps = {
  business: {
    name: string;
    slug: string;
    image: string;
    address: string;
    description?: string;
    category?: string;
  };
  className?: string;
};

export default function BusinessCard({ business, className = "" }: BusinessCardProps) {
  const [imgError, setImgError] = useState(false);

  const shortDescription =
    business.description && business.description.length > 110
      ? `${business.description.slice(0, 110)}...`
      : business.description;

  const showImage = Boolean(business.image) && !imgError;

  return (
    <article
      className={["group overflow-hidden transition-all duration-300 hover:-translate-y-1", className].join(" ")}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "14px",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--line-strong)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--line)";
      }}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
        {showImage ? (
          <Image
            src={business.image}
            alt={business.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="flex flex-col items-center gap-1.5">
              <PhotoIcon className="h-7 w-7" style={{ color: "var(--ink-3)" }} />
              <span className="text-xs" style={{ color: "var(--ink-3)" }}>Sin imagen</span>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category tag */}
        {business.category ? (
          <span className="badge text-[11px]">{business.category}</span>
        ) : null}

        {/* Name */}
        <h3
          className="line-clamp-2 text-base font-semibold leading-snug"
          style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.015em" }}
        >
          {business.name}
        </h3>

        {/* Address */}
        <p className="flex items-start gap-1.5 text-xs" style={{ color: "var(--ink-3)" }}>
          <MapPinIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
          <span className="line-clamp-1">{business.address || "Dirección no especificada"}</span>
        </p>

        {/* Description */}
        <p
          className="min-h-[36px] text-xs leading-relaxed line-clamp-2"
          style={{ color: "var(--ink-2)" }}
        >
          {shortDescription || <span style={{ color: "var(--ink-3)", fontStyle: "italic" }}>Sin descripción disponible.</span>}
        </p>

        {/* CTA */}
        <Link
          href={`/negocios/${business.slug}`}
          className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200"
          style={{
            background: "var(--surface-2)",
            color: "var(--primary)",
            border: "1px solid var(--line)",
          }}
        >
          Ver negocio
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
