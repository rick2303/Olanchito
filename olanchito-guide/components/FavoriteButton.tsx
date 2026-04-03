"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

const STORAGE_KEY = "olanchito_favorites";

function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function FavoriteButton({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getFavorites().includes(slug));
  }, [slug]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = getFavorites();
    const next = favs.includes(slug)
      ? favs.filter((s) => s !== slug)
      : [...favs, slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next.includes(slug));
  };

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={[
        "inline-flex items-center justify-center rounded-full transition-all duration-200",
        "h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm ring-1 ring-black/10",
        "hover:scale-110 active:scale-95",
        className,
      ].join(" ")}
    >
      {saved ? (
        <HeartSolid className="h-4 w-4 text-red-500" />
      ) : (
        <HeartIcon className="h-4 w-4 text-jungle-500" />
      )}
    </button>
  );
}
