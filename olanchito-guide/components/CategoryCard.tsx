"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

type IconDef = { el: React.ReactNode; accent: string; bg: string };

type CategoryCardProps = {
  cat: { id: string; name: string; slug: string };
  iconDef: IconDef;
};

export default function CategoryCard({ cat, iconDef }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${cat.slug}`}
      className="group flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-xs)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-md)";
        el.style.borderColor = "var(--line-strong)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-xs)";
        el.style.borderColor = "var(--line)";
        el.style.transform = "translateY(0)";
      }}
    >
      <span
        className="grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: iconDef.bg, color: iconDef.accent }}
      >
        {iconDef.el}
      </span>

      <div className="flex-1">
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-syne)", color: "var(--ink)", letterSpacing: "-0.01em" }}
        >
          {cat.name}
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: "var(--ink-3)" }}>
          Ver negocios disponibles
        </p>
      </div>

      <div
        className="flex items-center gap-1 text-xs font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: iconDef.accent }}
      >
        Explorar
        <ArrowRightIcon className="h-3 w-3" />
      </div>
    </Link>
  );
}
