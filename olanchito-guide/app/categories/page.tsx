// app/categories/page.tsx
//Server Component (sin "use client")
//UI más moderna + responsive real (mobile-first)
//Header con “hero” + contador + chips
//Cards premium con icono, sombra suave, ring, hover bonito
//Mantiene lógica de “Otros” al final

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FaTools,
  FaUtensils,
  FaPills,
  FaHospital,
  FaPaw,
  FaShoppingCart,
  FaStore,
  FaCar,
  FaBolt,
  FaFaucet,
  FaHardHat,
  FaBook,
  FaPen,
  FaMobile,
  FaWifi,
  FaPrint,
  FaTshirt,
  FaCut,
  FaBed,
  FaTaxi,
  FaTruck,
  FaWallet,
  FaHome,
  FaCalendar,
  FaDumbbell,
  FaMusic,
  FaChurch,
  FaBriefcase,
  FaBuilding,
} from "react-icons/fa";
import type { JSX } from "react";

export const metadata = {
  title: "Categorías | Directorio Olanchito",
  description:
    "Explora todas las categorías de negocios en Olanchito: ferreterías, restaurantes, farmacias y más.",
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
};

function IconBadge({ iconKey }: { iconKey?: string | null }) {
  const iconMap: Record<string, { el: JSX.Element; bg: string; ring: string }> = {
    tools: { el: <FaTools size={22} />, bg: "bg-jungle-50", ring: "ring-jungle-200 text-jungle-700" },
    utensils: { el: <FaUtensils size={22} />, bg: "bg-jungle-50", ring: "ring-jungle-200 text-jungle-700" },
    pills: { el: <FaPills size={22} />, bg: "bg-jungle-50", ring: "ring-jungle-200 text-jungle-700" },
    hospital: { el: <FaHospital size={22} />, bg: "bg-red-50", ring: "ring-red-200 text-red-600" },
    paw: { el: <FaPaw size={22} />, bg: "bg-purple-50", ring: "ring-purple-200 text-purple-600" },
    "shopping-cart": { el: <FaShoppingCart size={22} />, bg: "bg-yellow-50", ring: "ring-yellow-200 text-yellow-700" },
    store: { el: <FaStore size={22} />, bg: "bg-teal-50", ring: "ring-teal-200 text-teal-700" },
    car: { el: <FaCar size={22} />, bg: "bg-red-50", ring: "ring-red-200 text-red-600" },
    bolt: { el: <FaBolt size={22} />, bg: "bg-yellow-50", ring: "ring-yellow-200 text-yellow-700" },
    faucet: { el: <FaFaucet size={22} />, bg: "bg-blue-50", ring: "ring-blue-200 text-blue-700" },
    "hard-hat": { el: <FaHardHat size={22} />, bg: "bg-orange-50", ring: "ring-orange-200 text-orange-700" },
    book: { el: <FaBook size={22} />, bg: "bg-indigo-50", ring: "ring-indigo-200 text-indigo-700" },
    pen: { el: <FaPen size={22} />, bg: "bg-pink-50", ring: "ring-pink-200 text-pink-700" },
    mobile: { el: <FaMobile size={22} />, bg: "bg-purple-50", ring: "ring-purple-200 text-purple-700" },
    wifi: { el: <FaWifi size={22} />, bg: "bg-blue-50", ring: "ring-blue-200 text-blue-700" },
    print: { el: <FaPrint size={22} />, bg: "bg-gray-50", ring: "ring-gray-200 text-gray-700" },
    tshirt: { el: <FaTshirt size={22} />, bg: "bg-pink-50", ring: "ring-pink-200 text-pink-700" },
    scissors: { el: <FaCut size={22} />, bg: "bg-red-50", ring: "ring-red-200 text-red-600" },
    bed: { el: <FaBed size={22} />, bg: "bg-blue-50", ring: "ring-blue-200 text-blue-700" },
    taxi: { el: <FaTaxi size={22} />, bg: "bg-yellow-50", ring: "ring-yellow-200 text-yellow-700" },
    truck: { el: <FaTruck size={22} />, bg: "bg-green-50", ring: "ring-green-200 text-green-700" },
    wallet: { el: <FaWallet size={22} />, bg: "bg-indigo-50", ring: "ring-indigo-200 text-indigo-700" },
    home: { el: <FaHome size={22} />, bg: "bg-green-50", ring: "ring-green-200 text-green-700" },
    calendar: { el: <FaCalendar size={22} />, bg: "bg-orange-50", ring: "ring-orange-200 text-orange-700" },
    dumbbell: { el: <FaDumbbell size={22} />, bg: "bg-red-50", ring: "ring-red-200 text-red-600" },
    music: { el: <FaMusic size={22} />, bg: "bg-purple-50", ring: "ring-purple-200 text-purple-700" },
    church: { el: <FaChurch size={22} />, bg: "bg-gray-50", ring: "ring-gray-200 text-gray-800" },
    briefcase: { el: <FaBriefcase size={22} />, bg: "bg-gray-50", ring: "ring-gray-200 text-gray-900" },
    building: { el: <FaBuilding size={22} />, bg: "bg-gray-50", ring: "ring-gray-200 text-gray-700" },
  };

  const fallback = iconMap.building;
  const picked = (iconKey && iconMap[iconKey]) ? iconMap[iconKey] : fallback;

  return (
    <span
      className={[
        "grid h-12 w-12 place-items-center rounded-2xl ring-1 transition",
        picked.bg,
        picked.ring,
        "group-hover:scale-[1.03]",
      ].join(" ")}
      aria-hidden
    >
      {picked.el}
    </span>
  );
}

export default async function CategoriesPage() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon");

  if (error) {
    console.error("Error cargando categorías:", error);
    return (
      <main className="min-h-screen bg-jungle-50">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-white p-8 ring-1 ring-black/5">
            <p className="text-sm font-semibold text-jungle-700">Error cargando categorías.</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-jungle-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-jungle-700"
            >
              Volver al inicio →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const list = (categories ?? []) as Category[];

  const sortedCategories = list
    .filter((c) => c.name?.toLowerCase() !== "otros")
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  const otrosCategory = list.find((c) => c.name?.toLowerCase() === "otros");
  if (otrosCategory) sortedCategories.push(otrosCategory);

  const total = sortedCategories.length;

  return (
    <main className="min-h-screen bg-jungle-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-jungle-700 via-jungle-600 to-jungle-50" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-extrabold text-white ring-1 ring-white/15 backdrop-blur">
              <span className="inline-block h-2 w-2 rounded-full bg-jungle-300" />
              {total} categorías disponibles
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Toque una para ver negocios</span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Categorías de negocios
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
              Explore rápidamente por tipo: comida, servicios, compras, salud y más.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/businesses"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-jungle-900 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-white/30 transition hover:-translate-y-[1px] active:translate-y-[1px]"
              >
                Ver todos los negocios
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </Link>

              <Link
                href="/join"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
              >
                Registrar mi negocio
                <span aria-hidden>＋</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative -mt-6 h-10 bg-gradient-to-b from-transparent to-jungle-50" />
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/businesses?category=${cat.slug}&page=1`}
              className={[
                "group relative overflow-hidden rounded-3xl bg-white p-6",
                "ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
                "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(0,0,0,0.12)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jungle-400",
              ].join(" ")}
            >
              {/* glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-jungle-100 blur-2xl opacity-70"
              />

              <div className="relative flex items-start gap-4">
                <IconBadge iconKey={cat.icon} />

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-jungle-950 line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-jungle-700/90">
                    Ver negocios disponibles
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-jungle-700">
                    Explorar
                    <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                      →
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 h-1 w-full rounded-full bg-gradient-to-r from-jungle-200 via-jungle-400 to-jungle-200 opacity-70" />
            </Link>
          ))}
        </div>

        {/* CTA suave abajo */}
        <div className="mt-10 rounded-[2.25rem] bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold text-jungle-700">¿No encuentra su categoría?</p>
              <p className="mt-1 text-sm font-semibold text-jungle-950">
                Registre su negocio y lo acomodamos en la categoría correcta.
              </p>
            </div>
            <Link
              href="/join"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-jungle-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-jungle-700 active:translate-y-[1px]"
            >
              Únase ahora
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
