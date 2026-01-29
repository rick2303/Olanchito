// app/page.tsx (Home)
//Server Component (sin "use client")
//Home del directorio + teaser "Coming soon" de VennQ (al final)
//Fix: icon real en botón "Ver categorías"
//VennQ: vista previa tipo “window mock” con imagen (sin recorte)
//Quita "Registrar mi negocio" del bloque de confianza y del bloque VennQ

import Link from "next/link";
import Image from "next/image";
import { FaUtensils, FaHammer, FaPills, FaTools } from "react-icons/fa";
import {
  Squares2X2Icon,
  SparklesIcon,
  RocketLaunchIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const featured = [
  { title: "Restaurantes", slug: "restaurantes", Icon: FaUtensils, hint: "Comida, cafés y más" },
  { title: "Ferreterías", slug: "ferreterias", Icon: FaHammer, hint: "Materiales y herramientas" },
  { title: "Farmacias", slug: "farmacias", Icon: FaPills, hint: "Salud y bienestar" },
  { title: "Servicios técnicos", slug: "servicios-tecnicos", Icon: FaTools, hint: "Reparación y soporte" },
];

const stats = [
  { k: "Negocios", v: "reales y verificados" },
  { k: "Búsqueda", v: "por categoría y nombre" },
  { k: "Ubicación", v: "para llegar más rápido" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-jungle-50 text-jungle-950">
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

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            {/* texto */}
            <div className="text-center lg:text-left">
              <div className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px]  text-white ring-1 ring-white/15 backdrop-blur lg:mx-0 lg:justify-start">
                <span className="inline-block h-2 w-2 rounded-full bg-jungle-300" />
                Directorio local · Olanchito
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">Comida · Servicios · Compras</span>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Todo Olanchito,
                <span className="block text-white/90">en un solo lugar</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg lg:mx-0">
                Encuentre negocios reales con información útil: dirección, horarios, teléfono, WhatsApp y ubicación.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/businesses"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-extrabold text-jungle-900 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-white/30 transition hover:-translate-y-[1px] hover:shadow-[0_18px_50px_rgba(0,0,0,0.22)] active:translate-y-[1px]"
                >
                  Ver negocios
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </Link>

                <Link
                  href="/categories"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
                >
                  <Squares2X2Icon className="h-5 w-5 text-white/90" />
                  Ver categorías
                </Link>
              </div>

              {/* stats */}
              <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 lg:mx-0">
                {stats.map((s) => (
                  <div
                    key={s.k}
                    className="rounded-3xl bg-white/10 px-4 py-4 text-left ring-1 ring-white/15 backdrop-blur"
                  >
                    <p className="text-xs font-extrabold text-white/80">{s.k}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* visual / mock */}
            <div className="relative">
              <div aria-hidden className="absolute -inset-6 rounded-[2.25rem] bg-white/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2.25rem] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.22)] ring-1 ring-black/5">
                <div className="flex items-center gap-2 border-b border-black/5 bg-jungle-50 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs font-extrabold text-jungle-700">Vista previa</span>
                </div>

                <div className="relative aspect-[16/10] w-full bg-jungle-50">
                  <Image
                    src="/home-hero-preview.png"
                    alt="Vista previa del directorio"
                    fill
                    priority={false}
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-xs font-extrabold text-jungle-700">Búsqueda</p>
                    <p className="mt-1 text-sm font-semibold text-jungle-950">Encuentre por nombre o categoría</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-xs font-extrabold text-jungle-700">Contacto</p>
                    <p className="mt-1 text-sm font-semibold text-jungle-950">Teléfono y WhatsApp</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="relative -mt-6 h-10 bg-gradient-to-b from-transparent to-jungle-50" />
      </section>

      {/* CATEGORÍAS DESTACADAS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-black tracking-tight text-jungle-950 sm:text-3xl">
            Explore por tipo de negocio
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-jungle-700 sm:text-base">
            Entre más rápido al tipo de negocio que necesita.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map(({ title, slug, Icon, hint }) => (
            <Link
              key={slug}
              href={`/businesses?category=${slug}&page=1`}
              className={[
                "group relative overflow-hidden rounded-3xl bg-white p-6",
                "ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
                "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(0,0,0,0.12)]",
              ].join(" ")}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-jungle-100 blur-2xl"
              />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-jungle-50 text-jungle-700 ring-1 ring-jungle-200 transition group-hover:scale-[1.03]">
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-jungle-950">{title}</h3>
                  <p className="mt-1 text-sm font-semibold text-jungle-700">{hint}</p>

                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-jungle-700">
                    Ver negocios
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
      </section>

      {/* BLOQUE DE CONFIANZA / INFO (sin "Registrar mi negocio") */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 sm:pb-10">
        <div className="rounded-[2.25rem] bg-white p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h3 className="text-xl font-black text-jungle-950 sm:text-2xl">Hecho para negocios reales</h3>
              <p className="mt-2 text-sm leading-relaxed text-jungle-700 sm:text-base">
                Información clara, botones de contacto directos y ubicación para llegar más rápido.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/businesses"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-jungle-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-jungle-700 active:translate-y-[1px]"
                >
                  Explorar directorio
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL (queda antes del VennQ como pidió) */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-jungle-600 p-8 text-center text-white shadow-[0_25px_80px_rgba(0,0,0,0.18)] sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-black/10 blur-3xl"
          />

          <h2 className="relative text-2xl font-black sm:text-3xl">¿Tiene un negocio en Olanchito?</h2>
          <p className="relative mx-auto mt-3 max-w-2xl text-sm font-semibold text-white/90 sm:text-base">
            Únase al directorio y aumente su visibilidad local. Enlace directo a WhatsApp, teléfono, ubicación y redes.
          </p>

          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/join"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-extrabold text-jungle-900 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px]"
            >
              Únase ahora
              <span aria-hidden>→</span>
            </Link>

            <Link
              href="/businesses"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-8 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15"
            >
              Ver el directorio
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/*COMING SOON: VennQ ERP (AL FINAL, sin botón de registrar negocio) */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-white to-jungle-50 p-6 ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-jungle-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-jungle-300/30 blur-3xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* texto */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-jungle-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm">
                <SparklesIcon className="h-4 w-4" />
                Coming soon
              </div>

              <h3 className="mt-4 text-xl font-black tracking-tight text-jungle-950 sm:text-2xl">
                VennQ ERP para negocios
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-jungle-700 sm:text-base">
                Muy pronto: un ERP completo para administrar su negocio (clientes, productos, ventas, empleados y reportes),
                con POS moderno por industria.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-jungle-800">
                    <ChartBarIcon className="h-4 w-4 text-jungle-700" />
                    Dashboard
                  </div>
                  <p className="mt-1 text-xs font-semibold text-jungle-700">KPIs + reportes claros</p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-jungle-800">
                    <RocketLaunchIcon className="h-4 w-4 text-jungle-700" />
                    POS por industria
                  </div>
                  <p className="mt-1 text-xs font-semibold text-jungle-700">Restaurante · Súper · Automotriz y más...</p>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-jungle-800">
                    <SparklesIcon className="h-4 w-4 text-jungle-700" />
                    Inventario
                  </div>
                  <p className="mt-1 text-xs font-semibold text-jungle-700">Control y movimientos</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="https://vennq.com"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-jungle-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-jungle-700 active:translate-y-[1px]"
                >
                  Conocer VennQ
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <p className="mt-3 text-xs font-semibold text-jungle-700/80">
                *VennQ es un producto aparte del directorio.
              </p>
            </div>

            {/* preview tipo “window mock” con imagen (sin recorte) */}
            <div className="relative">
              <div aria-hidden className="absolute -inset-6 rounded-[2.25rem] bg-jungle-200/35 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2.25rem] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.14)] ring-1 ring-black/5">
                <div className="flex items-center gap-2 border-b border-black/5 bg-jungle-50 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-xs font-extrabold text-jungle-700">VennQ · Vista previa</span>

                  <span className="ml-auto rounded-full bg-jungle-600/10 px-2 py-1 text-[10px] font-extrabold text-jungle-700 ring-1 ring-jungle-200">
                    ERP
                  </span>
                </div>

                <div className="bg-jungle-50 p-3 sm:p-4">
                  <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
                    <Image
                      src="/vennq-preview.png"
                      alt="Vista previa de VennQ ERP"
                      fill
                      priority={false}
                      sizes="(max-width: 1024px) 100vw, 520px"
                      className="object-contain"
                    />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-xs font-extrabold text-jungle-700">ERP</p>
                    <p className="mt-1 text-sm font-semibold text-jungle-950">Ventas, inventario, clientes</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-black/5">
                    <p className="text-xs font-extrabold text-jungle-700">POS</p>
                    <p className="mt-1 text-sm font-semibold text-jungle-950">Flujos por industria</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
